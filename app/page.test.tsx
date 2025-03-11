import Landing from './page';
import { render, screen, RenderResult } from '@testing-library/react';
import * as Constants from 'config/constants';
import { fetchEndpoint } from 'utilities/client/endpoint';

jest.mock('utilities/client/endpoint');

const dummyMetadata = [{
  channelId: 'UC07MVxpRKdDJmqwWDGYqotA',
  description: 'Seattle Public Schools',
  publishDate: '2015-11-04T21:05:52-08:00',
  title: 'School Board Meeting Date November 4th, 2015 Pt.2',
  videoId: '-95KMDHf4vQ'
}, {
  channelId: 'UC07MVxpRKdDJmqwWDGYqotA',
  description: 'Seattle Public Schools',
  publishDate: '2024-10-09T22:02:50-07:00',
  title: 'Seattle Schools Board Meeting Oct. 9, 2024',
  videoId: '-MyMd2xOYdw'
}, {
  channelId: 'UC07MVxpRKdDJmqwWDGYqotA',
  description: 'Seattle Public Schools',
  publishDate: '2017-01-20T15:21:53-08:00',
  title: 'School Board Meeting 1 18 2017 Part 2',
  videoId: '-PMPKQzkJYg'
}];

// const dummyCategories = Constants.ALL_CATEGORIES.map(category => ({
//   [category]: {...dummyMetadata}
// }));

const dummyResponse = {
  ok: true,
  message: 'success',
  data: [...dummyMetadata]
};

async function renderServerFunctionComponent(
  component: Awaited<React.ReactNode> | Array<Awaited<React.ReactNode>>
): Promise<RenderResult> {
  let reactNode: React.ReactNode;

  if (Array.isArray(component)) {
    reactNode = await Promise.all(component);
  }
  else {
    reactNode = component
  }

  return render(reactNode);
}

describe('Transcripts index page', () => {
  beforeEach(() => {
    (fetchEndpoint as jest.MockedFunction<typeof fetchEndpoint>).mockResolvedValue({...dummyResponse});
  });

  it('renders', async () => {
    const Page = await Landing();
    await renderServerFunctionComponent(Page);
    expect(screen.queryAllByRole('heading').length).toBeGreaterThan(0);
  });
});