import * as TestingUtils from './utils/testing';

describe('metadata', () => {
  it('GET retrieves metadata', async () => {
    const response = await TestingUtils.fetchEndpoint(
        'metadata',
        'GET',
        { category: 'sps-board',
          video_id: 'MT2zjpRbQJA' });
    expect(response.status).toStrictEqual(200);
    const responseJson = await response.json();
    expect(responseJson.ok).toStrictEqual(true);
  });

  it('POST sets metadata', async () => {
    const response = await TestingUtils.fetchEndpoint(
        'metadata',
        'POST',
        { user_id: TestingUtils.FAKE_USER_ID,
          auth_code: TestingUtils.FAKE_AUTH_CODE,
          category: 'sps-board',
          metadata: TestingUtils.DATA_METADATA,
        });
    expect(response.status).toStrictEqual(200);
    const responseJson = await response.json();
    expect(responseJson.ok).toStrictEqual(true);
  });
});

