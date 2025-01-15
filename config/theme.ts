import { Roboto } from 'next/font/google';

export const isProduction = process.env.NODE_ENV === 'production';

export const SITE_ROOT_URL = 'https://transcripts.sps-by-the-numbers.com';
export const HOME_URL = 'https://sps-by-the-numbers.com';

// Originally this was a static HTML site with files spit into a prefix tree directory
// structure to avoid having too many files in one directory. This isn't necessary
// anymore. Setting LEGACY_PREFIX_REDIRECT to true redirect URLS where there is a
// 2 -character prefix to the current URL pattern w/o the prefix. Example:
//  https://foo.com/category/v/AB/ABCD123 becomes https://foo.com/category/v/ABCD123
export const LEGACY_PREFIX_REDIRECT = true;

// Google analytics ID.
export const GA_MEASUREMENT_ID = 'GTM-WLJHZHL';

// GCP region cloud functions and other things run in.
export const GCP_REGION = 'us-west1';

function makeEndpointUri(endpoint: string) {
  return `https://${endpoint}-rdcihhc4la-uw.a.run.app`;
}

function makeTestEndpointUri(endpoint: string) {
  return `http://127.0.0.1:5001/sps-by-the-numbers/${GCP_REGION}/${endpoint}`;
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
    name: 'SPS Board',
    type: 'channel',
    language: 'eng',
  },
  'seattle-city-council': {
    id: "PLhfhh0Ed-ZC2d0zuuzyCf1gaPaKfH4k4f",
    name: 'Seattle City Council',
    type: 'playlist',
    language: 'eng',
  }
};

// List of all categories.
export const ALL_CATEGORIES = Object.keys(CATEGORY_CHANNEL_MAP);

// Default category to use in UI.
export const DEFAULT_CATEGORY = 'sps-board';

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

// Used by appcheck.
export const RECAPTCHA_KEY = '6LfukwApAAAAAOysCMfJontBc36O2vly91NWpip8';

// API key for read-only meilisearch.
export const MEILI_KEY = 'fcb72b464bc4d53e1e6b69a315607874daf5e9880b5f41c1bda96a4172dc3518'; 
export const MEILI_ENDPOINT = isProduction ? makeEndpointUri('meilisearch') : 'http://127.0.0.1:7700';

// Generate URLs for use in fetch() calls based on envrionment type.
const ENDPOINT_NAMES = [
  'metadata',
  'sentences',
  'speakerinfo',
  'vast',
  'video_queue',
  'transcript',
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
  'eng',
  'spa',
  'som',
  'zho-HANS',
  'zho-HANT',
  'vie',
  'amh',
];


// MUI Theme.
const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const muiThemeConfig = {
  typography: {
    fontFamily: roboto.style.fontFamily,
  },
  colorSchemes: {
    light: {
      palette: {
        background: {
          default: "#dcdcdc",
        },
        primary: {
          main: '#005079',
        },
        secondary: {
          main: '#BF6800',
        },
      },
    },
    dark: {
      palette: {
        background: {
          default: "#333333",
        },
        primary: {
          main: '#0a43ad',
        },
        secondary: {
          main: '#BF6800',
        },
      },
    }
  }
};

