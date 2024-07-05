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

const ENDPOINT_NAMES = [
  'sentences',
  'speakerinfo',
  'transcript',
  'vast',
  'video_queue',
];

export const PRODUCTION_ENDPOINTS = Object.fromEntries(ENDPOINT_NAMES.map(n => [n, makeEndpointUri(n)]));
export const TEST_ENDPOINTS = Object.fromEntries(ENDPOINT_NAMES.map(n => [n, makeTestEndpointUri(n)]));
export const ENDPOINTS = isProduction ? PRODUCTION_ENDPOINTS : TEST_ENDPOINTS;
