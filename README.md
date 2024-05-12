# Transcripts for SPS By the Numbers
This repository provides a pipeline for diarizing and transcribing youtube
videos, and then publishing the results on the web in a way that enables
stable-URL citation.

Having such a repository will allow searching all historical tools using
a combination of existing search engines or more modern tools like ChatGPT
which can instructed to ingest the transcripts and perform all the textual
analysis that LLMs are particuarly good at.

Furthermore, having a repository of transcripts can allow for on-demand
translation. Having the translation and original transcript linked to the
video is important over just raw text because it allows one to access
context such as tone of voice or facial expressions for sections of
particular interest.

## Web Serving stack
This site is built using [Next.js](https://nextjs.org/) and hosted on
[Google Firebase](https://console.firebase.google.com). It is
very low resource consumption beyond storage as most of the content
is static. The choice of Firebase was due to free tier features. As
it is a very basic nearly static site, the code could be adopted to
nearly any tech stack.

## Transcription pipeline.
Transcription is done with the [WhisperX](https://github.com/m-bain/whisperX)
project which uses a combination of [OpenAI Whisper large-v2](https://github.com/openai/whisper) model
as well as [huggingface's pyannote speaker-diarization-3.0](https://huggingface.co/pyannote/speaker-diarization-3.0)
models.

Contraty to initial expectation, this does NOT require a powerful GPU. What it does
require is a lot of GPU memory (> 10GB) for Whisper's Large-V2. Then it requires
a lot of CPU cores (16+ recommended) and lots of ram (32Gb or more) to parallelize
the diarization cluster and prevent swapping.

If you do not use the GPU, have too few CPU cores, or swap, your runtimes of
transcription+diarization will go from a few minutes per meeting to many many hours.

The pipeline was run on machines from vast.ai. It costs very little per meeting.
Doing the entire archive of Seattle School Board and Seattle City Council
(around 2000 videos, most a couple of hours long) took about $70 which included
many failed runs while fixing scripts. The machines used often had $0.2/hr rental
times.

## Getting started for development

TODO: Document firebase setup

```bash
npm install
npm run dev &
npx tsc --watch
```

Production site is [https://transcripts.sps-by-the-numbers.com/](https://transcripts.sps-by-the-numbers.com/)

## Deployment

Github should do the deploy automatically via the workflow but if you want to do it manually.

```bash
npx firebase deploy
```

## Datamodel

### Database and storage structure.
Firebase Realtime Database is used as the primary database for the frontend
and batch processing.

Google Cloud Storage holding the data files such as transcriptions.

## Transcripts datamodel.
### Path structure
This describes the structure of the data stored for the transcripts. All
paths start with `/transcripts` to namespace from other apps.

Underneath each of these, there is a `public` and `private` split. Then
there is a `channel` which corresponds to a Youtube Channel being tracked.

So `/transcripts/public/foo` in both the Realtime DB and in Cloud Storage
would contain all public data for a channel named `foo`.  This will have
no access restrictions from the public and should contain nearly all the
data on the site.

`/transcripts/private/foo` has private data for keeping the youtube channel
`foo` synced.  It will have audit logs, backend task queues, and that is
probably it.

### Public data for channel
| Key | Description |
|* &lt;enabled&gt; | Set to 1 if the category should be published on the website. |
| metadata | Entries with metadata about the video from youtube. Minimally `channel_id`, `publish_date`, `title`. They entry key is the `video_id` from Youtube. |
| index | all the `video_id`s grouped by YYYY-MM-DD. |
| v | Stores extra information about each video. Currently just has `speakerInfo` which provides the name for each diarized speaker. They key is the speaker number. |
| existing | 2 list of holding previously used names and tags. Used to populate the auto-suggest for labeling speakers. |

### Private data for channel
| Key | Description |
| --- | --- |
| audit | List of all updates made by the public including identity information of poster. Key is the timestamp of the change. |
| queue | Workqueue of tasks for backend processing. |

### Storage
### Public data for channel
| Key | Description |
| --- | --- |
| json | Transcript in json. File format is `${video_id}.${lang}.json` where `lang` is an ISO639 code. |`
