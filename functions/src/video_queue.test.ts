import * as TestingUtils from './utils/testing';
import { getCategoryPrivateDb } from './utils/firebase';
import { getAllCategories } from './utils/path';

describe('video_queue', () => {
  beforeAll(TestingUtils.beforeAll);

  it.skip('Access with auth_code', async () => {
    const NEW_VIDS = ['a','b','c'];
    const category = getAllCategories()[0];
    getCategoryPrivateDb(category, 'new_vids').set(NEW_VIDS);
    const response = await TestingUtils.fetchEndpoint(
        'video_queue',
        'GET',
        { user_id: TestingUtils.FAKE_USER_ID,
          auth_code: TestingUtils.FAKE_AUTH_CODE });
    expect(response.status).toStrictEqual(200);
    const responseJson = await response.json();
    expect(responseJson.ok).toStrictEqual(true);
    expect(responseJson.data[category]).toEqual(NEW_VIDS);
  });

});
