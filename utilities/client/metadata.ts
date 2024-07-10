// Fetches the metadata from cloud functions.
import { fetchEndpoint } from 'utilities/client/endpoint';

export async function getMetadata(category: string, videoId: string): Promise<any> {
  const response = await fetchEndpoint('metadata', 'GET', {category, videoId});
  if (!response.ok) {
    throw response;
  }
  return response.data;
}
