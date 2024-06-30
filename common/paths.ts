import * as Constants from "config/constants";

export function makePublicPath(...parts) {
  return [Constants.APP_SCOPE, "public", ...parts].join("/");
}

export function makePrivatePath(...parts) {
  return [Constants.APP_SCOPE, "private", ...parts].join("/");
}


