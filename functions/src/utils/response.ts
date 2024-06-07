export function makeResponseJson(ok, message, data = {}) {
  return {ok, message, data};
}
