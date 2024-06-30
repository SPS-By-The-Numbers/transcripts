import * as TestingUtils from './utils/testing';

describe('transcript', () => {
  it('GET retrieves transcript', async () => {
    const response = await TestingUtils.fetchEndpoint(
        'transcript',
        'GET',
        { category: 'sps-board',
          vid: 'MT2zjpRbQJA' });
    expect(response.status).toStrictEqual(200);
    const responseJson = await response.json();
    expect(responseJson.ok).toStrictEqual(true);
  });
});
