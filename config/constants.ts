export const isProduction = process.env.NODE_ENV === 'production';

function makeEndpointUri(endpoint: string) {
  return `https://${endpoint}-rdcihhc4la-uw.a.run.app`;
}

function makeTestEndpointUri(endpoint: string) {
  return `http://127.0.0.1:5001/sps-by-the-numbers/us-west1/${endpoint}`;
}

// Prefix used in storage or database paths.
export const APP_SCOPE = "transcripts";

// Subdirectory for diarized transcript json files. These reference the
// sentence is in the sentence tables.
export const DIARIZED_SUBDIR = "diarized";

// Subdirectory for sentence tables.
export const SENTENCE_TABLE_SUBDIR = "sentences";

// Subdirectory for archive of raw WhisperX files.
export const WHISPERX_ARCHIVE_SUBDIR = "archive/whisperx";

// Map of ALL_CATEGORIES to channels.
export const CATEGORY_CHANNEL_MAP = {
  'sps-board': {
    id: "UC07MVxpRKdDJmqwWDGYqotA",
    type: 'channel',
  },
  'seattle-city-council': {
    id: "PLhfhh0Ed-ZC2d0zuuzyCf1gaPaKfH4k4f",
    type: 'playlist',
  }
};

// List of all categories.
export const ALL_CATEGORIES = Object.keys(CATEGORY_CHANNEL_MAP);

// Storage bucket for whisperx archives. Can be cheaper/slower storage class.
export const STORAGE_BUCKET = "sps-by-the-numbers.appspot.com";

// Firebase configuration for web clients. This data is public.
export const FIREBASE_CLIENT_CONFIG = {
  apiKey: "AIzaSyD30a3gVbP-7PgTvTqCjW4xx-GlLMBQ5Ns",
  authDomain: "sps-by-the-numbers.firebaseapp.com",
  databaseURL: "https://sps-by-the-numbers-default-rtdb.firebaseio.com",
  projectId: "sps-by-the-numbers",
  storageBucket: "sps-by-the-numbers.appspot.com",
  messagingSenderId: "319988578351",
  appId: "1:319988578351:web:1caaadd0171003126deeda",
  measurementId: "G-WKM5FTSSLL"
};

// Generate URLs for use in fetch() calls based on envrionment type.
const ENDPOINT_NAMES = [
  'sentences',
  'speakerinfo',
  'transcript',
  'vast',
  'video_queue',
];

// List of production endpoint names.
export const PRODUCTION_ENDPOINTS = Object.fromEntries(ENDPOINT_NAMES.map(n => [n, makeEndpointUri(n)]));

// List of testing endpoint names. Should point at the firebase emulator on localhost.
export const TEST_ENDPOINTS = Object.fromEntries(ENDPOINT_NAMES.map(n => [n, makeTestEndpointUri(n)]));

// Constant for the endpoints that changes between the production and test endpoints based on
// the environment. Most code should use this.
export const ENDPOINTS = isProduction ? PRODUCTION_ENDPOINTS : TEST_ENDPOINTS;

// Languages listed here are put on the top of the select element list for choosing translations.
export const TOP_LANGUAGES = [
  'spa',
  'zho-HANS',
  'zho-HANT',
  'vie',
  'amh',
];
