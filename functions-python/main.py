import datetime
import json
import secrets

from firebase_admin import initialize_app, db
from firebase_functions import pubsub_fn, logger
from google.cloud import secretmanager
from vast_python import VastAI

app = initialize_app()

DISK_GB = 25
INSTANCE_LABEL = 'auto_transcribe'
MINS_PER_VID = 10
VIDS_PER_MACHINE = 20
INSTANCE_STALE_S = 60 * 60 * 2  # 2hrs is a long time for these jobs.


def _access_secret_version(project_id, secret_id, version_id="latest"):
    secret_client = secretmanager.SecretManagerServiceClient()

    # Build the resource name of the secret version
    name = f"projects/{project_id}/secrets/{secret_id}/versions/{version_id}"

    # Access the secret version
    response = secret_client.access_secret_version(request={"name": name})

    # Decode the secret payload
    payload = response.payload.data.decode("UTF-8")

    return payload


@pubsub_fn.on_message_published(topic="start_transcribe", region="us-west1")
def start_transcribe(
        event: pubsub_fn.CloudEvent[pubsub_fn.MessagePublishedData]) -> None:
    """Start the vast.ai instance which queries the new videos"""

    # See if there are videos
    num_new_videos = 0
    for category in ["sps-board", "seattle-city-council"]:
        print(f"Examining video queue for in {category}")
        new_vids_queue = db.reference(
            f"/transcripts/private/{category}/new_vids").get(False, True)

        if new_vids_queue:
            print(f"Found {len(new_vids_queue)} videos for {category}")
            num_new_videos = num_new_videos + len(new_vids_queue)

    # If there are any entries, ensure a vast.ai instance is running.
    if num_new_videos > 0:
        # TODO: heartbeat terminate stale instances.
        lysine_timeout = num_new_videos * MINS_PER_VID

        # Search for all offers.
        vast = VastAI(
            _access_secret_version('sps-by-the-numbers', 'vast_api_key'),
            raw=True)

        yt_refresh_token = _access_secret_version('sps-by-the-numbers',
                                                  'youtube_oauth')

        hf_token = _access_secret_version('sps-by-the-numbers',
                                          'huggingface')

        target_num_instances = max(1, int(num_new_videos / VIDS_PER_MACHINE))

        # Do not create new instance if one is running.
        all_instances = json.loads(vast.show_instances())
        running_transcribers = [
            x for x in all_instances if x.get('label') == INSTANCE_LABEL]
        if len(running_transcribers) >= target_num_instances:
            print("Instances already running "
                  f"{repr([x['id'] for x in running_transcribers])}.")
            return

        for _ in range(target_num_instances - len(running_transcribers)):
            # Find an offer. large-v3-turbe needs about 6GB VRAM so look for
            # 8Gb.
            #
            # Also, the slowest portion is diarization which is fully CPU and
            # parallelizable. More cores is much faster.
            # https://github.com/openai/whisper
            offers_json = vast.search_offers(
                storage=DISK_GB,
                order="dph_total",
                query=('cpu_cores_effective>=10 cpu_ram>=32 gpu_total_ram>=10 '
                       'reliability>=0.95 dph<2'))
            cheapest = json.loads(offers_json)[0]
            print(f"cheapest ask id {cheapest['ask_contract_id']} cost "
                  f"{json.dumps(cheapest)}")

            # Create a password for the instance to use with our REST API.
            instance_password = secrets.token_urlsafe(16)
            start_time = datetime.datetime.now(
                datetime.UTC).strftime("%Y%m%dT%H%M%S.%fZ")

            # Create the instance
            create_result = json.loads(vast.create_instance(
                ID=cheapest["ask_contract_id"],
                image="awongdev/transcribe:latest",
                label=INSTANCE_LABEL,
                # Kill the server after 30 mins if it's still running.
                onstart_cmd=("env | grep _ >> /etc/environment; "
                             "nohup /workspace/app/onstart_hook.sh "
                             f"{int(cheapest['cpu_cores_effective'])} "
                             f"{hf_token} "
                             f"{yt_refresh_token} "
                             f"{lysine_timeout} 10 &"),
                disk=DISK_GB,
                args="",
                cancel_unavail=True,
                ssh=True,
                env=("-e DATA_DIRECTORY=/workspace/ -e JUPYTER_DIR=/ -e "
                     f"API_PASSWORD={instance_password} "
                     "-e API_BASE_URL=rdcihhc4la-uw.a.run.app")))

            if create_result['success']:
                print(f"Created instance {create_result['new_contract']}")
                db.reference(f"/transcripts/private/_admin/vast/"
                             f"{create_result['new_contract']}").set({
                                 'password': instance_password,
                                 'start': start_time,
                             })
            else:
                print(f"frailed {json.dumps(create_result)}")


@pubsub_fn.on_message_published(topic="stop_transcribe_instance",
                                region="us-west1")
def stop_transcribe_instance(
        event: pubsub_fn.CloudEvent[pubsub_fn.MessagePublishedData]) -> None:
    """Stops a vast.ai instance.

    Event either contains an instance_ids entry with vast.ai IDs to stop. If
    one of the ids is 0, this will also stop all instances that are stale. An
    instance is by default considered stale if it has run more than 2 hours
    but this can be overrided with the stale_s parameter in the message.
    """
    params = event.data.message.json
    logger.info("params", params)
    instances_to_remove = {i for i in params["instance_ids"]}

    vast = VastAI(
        _access_secret_version('sps-by-the-numbers', 'vast_api_key'),
        raw=True)

    current_instances = {
        x["id"]: {
            "duration": x["duration"],
            "actual_status": x["actual_status"],
            "label": x["label"],
        }
        for x in json.loads(vast.show_instances())}
    logger.info("current", current_instances)

    to_destroy = []
    for instance_id, info in current_instances.items():
        if instance_id in instances_to_remove:
            to_destroy.append(instance_id)

        if (params.get('remove_stale', False) and
                info['label'] == INSTANCE_LABEL and
                info['duration'] > INSTANCE_STALE_S):
            to_destroy.append(instance_id)

    if len(to_destroy) == 0:
        logger.info("Nothing to destory")
        return

    logger.info("destroying", to_destroy)
    logger.info(vast.destroy_instances(ids=to_destroy))
