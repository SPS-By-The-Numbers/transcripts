import type { ApiResponse } from 'common/response';

export function makeResponseJson(ok, message, data = {}) : ApiResponse {
  return {ok, message, data};
}
