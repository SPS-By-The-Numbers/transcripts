const PATH_APP_SCOPE = 'transcripts';

function makeResponseJson(ok, message, data = {}) {
  return { ok, message, data };
}

// Makes the path string for public data. The prefix is the same in storage as it is in the database.
function makePublicPath(...parts) {
  return [ PATH_APP_SCOPE, 'public', ...parts].join('/');
}

function makePrivatePath(...parts) {
  return [ PATH_APP_SCOPE, 'private', ...parts].join('/');
}

function getAllCategories() {
  return [ 'sps-board', 'seattle-city-council'];
}

function sanitizeCategory(category) {
  if (!category || category.length > 20) {
    return undefined;
  }

  return category;
}

export { makeResponseJson, makePublicPath, makePrivatePath, getAllCategories, sanitizeCategory };
