// Simple utilities for talking to REST APIs.

import * as Constants from 'config/constants';

import type { ApiResponse } from 'common/response';

export function getEndpointUrl(endpoint : string, parameters? : Record<string,string> | object) {
  const urlRoot = `${Constants.ENDPOINTS[endpoint]}`;
  if (parameters !== undefined) {
    return urlRoot + '?' + new URLSearchParams(<Record<string, string>>parameters).toString();
  }

  return urlRoot;
}

export async function fetchEndpoint(endpoint : string, method: string, parameters : Record<string,string> | object) : Promise<ApiResponse> {
  if (method === 'GET') {
    const fullUrl = getEndpointUrl(endpoint, <Record<string, string>>parameters);
    return await (await fetch(fullUrl, { next: { revalidate: 300 } } )).json();
  }

  return await (await fetch(getEndpointUrl(endpoint), {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parameters),
  })).json();
}
