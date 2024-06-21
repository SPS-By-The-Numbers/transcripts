// Prefix used in storage or database paths.
export const APP_SCOPE = "transcripts";

// Subdirectory for diarized transcript json files. These reference the
// sentence is in the sentence tables.
export const DIARIZED_SUBDIR = "diarized";

// Subdirectory for sentence tables.
export const SENTENCE_TABLE_SUBDIR = "sentences";

// Subdirectory for archive of raw WhisperX files.
export const WHISPERX_ARCHIVE_SUBDIR = "archive/whisperx";

// Storage bucket for whisperx archives. Can be cheaper/slower storage class.
export const STORAGE_BUCKET = "sps-by-the-numbers.appspot.com";

// The path to keyfile that has write permissions to google cloud storage.
export const PRIVILEGED_STORAGE_KEY_FILE = "";

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

