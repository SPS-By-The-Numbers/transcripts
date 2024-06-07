const PATH_APP_SCOPE = "transcripts";

// Makes the path string for public data. The prefix is the same in storage as it is in the database.

export function makePublicPath(...parts) {
  return [PATH_APP_SCOPE, "public", ...parts].join("/");
}

export function makePrivatePath(...parts) {
  return [PATH_APP_SCOPE, "private", ...parts].join("/");
}

export function getAllCategories() {
  return ["sps-board", "seattle-city-council"];
}

export function sanitizeCategory(category) {
  if (!category || category.length > 20) {
    return undefined;
  }

  return category;
}

export function makeWhisperXTranscriptsPath(category: string, id: string, language:string): string {
  return makePublicPath(category, "archive/whisperx", `${id}.${language}.json.xz`);
}

