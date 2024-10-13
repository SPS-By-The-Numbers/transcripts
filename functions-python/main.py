import datetime
import json
import secrets

from firebase_admin import initialize_app, db
from firebase_functions import pubsub_fn
from google.cloud import secretmanager
from vast_python import VastAI


app = initialize_app()

DISK_GB = 25
INSTANCE_LABEL = 'auto_transcribe'
MINS_PER_VID = 10
VIDS_PER_MACHINE = 20


def access_secret_version(project_id, secret_id, version_id="latest"):
    client = secretmanager.SecretManagerServiceClient()

    # Build the resource name of the secret version
    name = f"projects/{project_id}/secrets/{secret_id}/versions/{version_id}"

    # Access the secret version
    response = client.access_secret_version(request={"name": name})

    # Decode the secret payload
    payload = response.payload.data.decode("UTF-8")

    return payload

# Example usage
# project_id = "your-project-id"
# secret_id = "your-secret-name"
# secret_value = access_secret_version(project_id, secret_id)


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
        # TODO: Retry loop.
        vast = VastAI(
            access_secret_version('sps-by-the-numbers', 'vast_api_key'),
            raw=True)

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
            # Find an offer
            offers_json = vast.search_offers(
                storage=DISK_GB,
                order="dph_total",
                query=('cpu_cores_effective>=10 cpu_ram>=32 gpu_total_ram>=8 '
                       'reliability>=0.95 dph<2 total_flops>=10'))
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
                image="awongdev/transcribe:0.5",
                label=INSTANCE_LABEL,
                # Kill the server after 30 mins if it's still running.
                onstart_cmd=("env | grep _ >> /etc/environment; "
                             "nohup /workspace/app/onstart_hook.sh "
                             f"{int(cheapest['cpu_cores_effective'])} "
                             "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 "
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
