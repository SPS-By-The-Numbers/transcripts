# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is a monorepo containing four interlocking subprojects that share data conventions defined in `common/` and `config/constants.ts`:

- **Next.js frontend** (root: `app/`, `components/`, `common/`, `utilities/client/`, `config/`, `styles/`) — statically rendered transcript site deployed to Firebase Hosting.
- **Node Firebase Functions** (`functions/`) — TypeScript HTTP endpoints (`metadata`, `sentences`, `speakerinfo`, `transcript`, `video_queue`, `vast`) backing the frontend and the transcription workers.
- **Python Firebase Functions** (`functions-python/`) — pubsub-triggered orchestration that spins up vast.ai GPU instances to run transcription.
- **Standalone tools** (`tools/`, top-level `transcribe_worker.py`) — workers that download YouTube audio, run WhisperX, and POST results back to the Node functions; `tools/search/` runs/indexes a MeiliSearch instance.

`common/` is imported by both the frontend and `functions/`; it must run in browser and Node contexts and stay dependency-light. `config/constants.ts` is the single source of truth for categories (`CATEGORY_CHANNEL_MAP`), endpoint URLs, storage paths, and the production/emulator switch (`isProduction`).

## Data model essentials

All data is namespaced under `APP_SCOPE = "transcripts"` in both the Realtime Database and Cloud Storage, then split into `public/<channel>/...` (served to the frontend) and `private/<channel>/...` (audit logs, `new_vids` work queue, admin auth codes). Use the helpers in `common/paths.ts` (`makePublicPath`, `makePrivatePath`, `getVideoPath`, etc.) — never hand-build these paths. Transcript JSON blobs live in Cloud Storage as `${video_id}.${iso639_lang}.json`; the format is documented in the root README.

## Common commands

### Frontend (run from repo root)

```bash
npm run dev          # next dev (run alongside firebase emulators for local backend)
npm run build        # next build
npm run lint         # eslint .
npm test             # jest — excludes functions/, functions-python/, tools/
npx tsc --watch      # typecheck-in-watch — useful while running `next dev`
```

The dev banner "Dev Mode. Emulators used." must appear when running locally; if it doesn't, the frontend is hitting production endpoints.

### Node Firebase Functions (`cd functions`)

```bash
npm run build        # tsc + esbuild → lib/index.js (REQUIRED before emulators)
npm run dev          # build:watch + emulators:start --only functions
npm run serve        # build then full emulator (functions, storage, database)
npm test             # builds, then runs jest under emulators with SPSBTN_FIREBASE_TESTING=1
npm run deploy       # firebase deploy --only functions
npm run run:migration -- src/migrations/<file>.ts   # run a one-off migration
```

The build is two-stage on purpose: `tsc` produces typed output and `esbuild` bundles it as ESM with `--external:./node_modules/*`. See `functions/README.md` before changing the build — the combination of ESM + TypeScript + Firebase Functions + the parent `node_modules/` requires the explicit `paths` rewiring in `functions/tsconfig.json`. Symptoms of getting it wrong include cryptic "cannot dynamically import" errors at deploy time and duplicate-package type incompatibilities pulled in via `common/`.

Tests must run under the Firebase emulators (`firebase emulators:exec`) with `SPSBTN_FIREBASE_TESTING=1` so `src/index.ts` selects `initializeFirebaseTesting` over `initializeFirebase`. To run a single test: `cd functions && npm run build && cross-env SPSBTN_FIREBASE_TESTING=1 firebase emulators:exec --only functions,storage,database 'npx jest path/to/file.test.ts'`.

### Python Firebase Functions

```bash
cd functions-python
python3 -m venv venv && . venv/bin/activate
python3 -m pip install -r requirements.txt
```

The CI workflow currently does NOT deploy these (commented out in `.github/workflows/build-all.yml` due to firebase-tools venv lookup issues); deploy by hand if changing them.

### Full local emulator stack

```bash
cd functions && npm install && npm run build && cd ..
firebase emulators:start
```

Ports: functions 5001, database 9000, pubsub 8085, storage 9199.

## Transcription pipeline (how the pieces talk)

1. `findNewVideos` (Node function in `video_queue.ts`) scrapes YouTube via `youtube.ts` and writes new IDs into `/transcripts/private/<category>/new_vids`.
2. The Python `start_transcribe` pubsub handler (`functions-python/main.py`) checks the queue and provisions vast.ai instances, passing `CONTAINER_ID`/`API_PASSWORD` env vars.
3. The vast.ai container runs `tools/process_new_vids/transcribe_worker.py` (or the top-level `transcribe_worker.py`), which leases work via `PATCH /video-queue`, runs `whisperx`, `PUT`s the JSON to `/transcript`, and `DELETE`s the queue entry.
4. Workers authenticate with auth codes stored under `/transcripts/private/_admin/vast/<user_id>/password` (see `getAuthCode`/`setAuthCode` in `functions/src/utils/firebase.ts`).

When changing endpoint shapes, update both the Node handler and the corresponding worker code — there is no shared schema between them.

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) deploys hosting on merge to `main` or `production`; merging to `production` is what triggers the (currently disabled) functions deploy path. Manual deploy: `npx firebase deploy` (hosting) or `npm --prefix functions run deploy` (Node functions).
