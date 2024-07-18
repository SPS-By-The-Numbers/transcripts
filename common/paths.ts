import * as Constants from "config/constants";

export function makePublicPath(...parts) {
  return [Constants.APP_SCOPE, "public", ...parts].join("/");
}

export function makePrivatePath(...parts) {
  return [Constants.APP_SCOPE, "private", ...parts].join("/");
}

export function getCategoryPath(category: string): string {
    return `/${category}`;
}

export function getDatePath(category: string, date: string): string {
    return `${getCategoryPath(category)}/${date}`;
}

export function getVideoPath(category: string, videoId: string): string {
    return `${getCategoryPath(category)}/v/${videoId}`;
}
