// Fetches the metadata from cloud functions.
import { fetchEndpoint } from 'utilities/client/endpoint';

import type { CategoryId, VideoId, VideoMetadata } from 'common/params';

export async function getMetadata(category: CategoryId, videoId: VideoId): Promise<VideoMetadata> {
  const response = await fetchEndpoint('metadata', 'GET', {category, videoId});
  if (!response.ok) {
    throw response;
  }
  return response.data;
}

export async function getAllMetadata(category: CategoryId): Promise<Array<VideoMetadata>> {
  const response = await fetchEndpoint('metadata', 'GET', {category});
  if (!response.ok) {
    throw response;
  }
  return response.data;
}
