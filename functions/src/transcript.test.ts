import * as TestingUtils from './utils/testing';

describe('transcript', () => {
  beforeAll(TestingUtils.beforeAll);

  it('GET retrieves transcript', async () => {
    const response = await TestingUtils.fetchEndpoint(
        'transcript',
        'GET',
        { category: 'sps-board',
          video_id: 'MT2zjpRbQJA' });
    expect(response.status).toStrictEqual(200);
    const responseJson = await response.json();
    expect(responseJson.ok).toStrictEqual(true);
  });
  it('PUT sets transcript', async () => {
    const transcript = TestingUtils.DATA_WHISPERX_TRANSCRIPT;
    const response = await TestingUtils.fetchEndpoint(
        'transcript',
        'PUT',
        { user_id: TestingUtils.FAKE_USER_ID,
          auth_code: TestingUtils.FAKE_AUTH_CODE,
          category: 'sps-board',
          video_id: 'MT2zjpRbQJA',
          transcripts: {[transcript.language]: transcript},
          metadata: TestingUtils.DATA_METADATA,
        });
    expect(response.status).toStrictEqual(200);
    const responseJson = await response.json();
    expect(responseJson.ok).toStrictEqual(true);
  });
  it('PUT sets transcript without metadata', async () => {
    const transcript = TestingUtils.DATA_WHISPERX_TRANSCRIPT;
    const response = await TestingUtils.fetchEndpoint(
        'transcript',
        'PUT',
        { user_id: TestingUtils.FAKE_USER_ID,
          auth_code: TestingUtils.FAKE_AUTH_CODE,
          category: 'sps-board',
          video_id: 'MT2zjpRbQJA',
          transcripts: {[transcript.language]: transcript},
        });
    expect(response.status).toStrictEqual(200);
    const responseJson = await response.json();
    expect(responseJson.ok).toStrictEqual(true);
  });
});
