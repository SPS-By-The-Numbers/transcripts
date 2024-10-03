import * as TestingUtils from 'utils/testing';

// List of endpoints that should be guarded by user_id/auth_code params.
const AUTH_CODE_ENDPOINTS = [
  [ 'GET', 'video_queue' ],
  [ 'PATCH', 'video_queue' ],
  [ 'DELETE', 'video_queue' ],
  [ 'GET', 'video_queue' ],

  [ 'DELETE', 'vast' ],

  [ 'PUT', 'transcript' ],
];

describe('auth_code endpoints', () => {
  beforeAll(TestingUtils.beforeAll);

  for (const [method, endpoint] of AUTH_CODE_ENDPOINTS) {
    it(`${method} ${endpoint} needs user_id`, async () => {
      const response = await TestingUtils.fetchEndpoint(
          endpoint,
          method,
          {auth_code: TestingUtils.FAKE_AUTH_CODE});
      expect(response.status).toStrictEqual(401);
      const responseJson = await response.json();
      expect(responseJson.ok).toStrictEqual(false);
      expect(responseJson.message).toMatch(/must have required property 'user_id'/);
    });

    it(`${method} ${endpoint} needs auth_code`, async () => {
      const response = await TestingUtils.fetchEndpoint(
          endpoint,
          method,
          { user_id: TestingUtils.FAKE_USER_ID });
      expect(response.status).toStrictEqual(401);
      const responseJson = await response.json();
      expect(responseJson.ok).toStrictEqual(false);
      expect(responseJson.message).toMatch(/must have required property 'auth_code'/);
    });

    it(`${method} ${endpoint} rejects invalid auth_code`, async () => {
      const response = await TestingUtils.fetchEndpoint(
          endpoint,
          method,
          {
            user_id: TestingUtils.FAKE_USER_ID,
            auth_code: (TestingUtils.FAKE_AUTH_CODE + TestingUtils.FAKE_AUTH_CODE)
          });
      expect(response.status).toStrictEqual(401);
      const responseJson = await response.json();
      expect(responseJson.ok).toStrictEqual(false);
      expect(responseJson.message).toMatch(/invalid auth_code/);
    });

     it(`${method} ${endpoint} accepts valid auth_code`, async () => {
      const response = await TestingUtils.fetchEndpoint(
          endpoint,
          method,
          {
            { user_id: TestingUtils.FAKE_USER_ID,
              auth_code: TestingUtils.FAKE_AUTH_CODE,
              category: 'sps-board',
              video_id: 'MT2zjpRbQJA'
            });
        expect(response.status).not.toEqual(401);
        const responseJson = await response.json();
      });

    
  }
});

