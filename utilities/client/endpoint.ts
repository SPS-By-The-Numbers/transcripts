// Simple utilities for talking to REST APIs.

import * as Constants from 'config/constants';

export async function fetchEndpoint(endpoint : string, method: string, parameters : Record<string,string> | object) {
  const urlRoot = `${Constants.ENDPOINTS[endpoint]}`;
  if (method === 'GET') {
    const fullUrl = urlRoot + '?' + new URLSearchParams(<Record<string, string>>parameters).toString();
    return await (await fetch(fullUrl)).json();
  }

  return await (await fetch(urlRoot, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parameters),
  })).json();
}
