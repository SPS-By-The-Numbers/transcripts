import Landing from './page';
import { render, screen, RenderResult } from '@testing-library/react';
import { fetchEndpoint } from 'utilities/client/endpoint';

jest.mock('utilities/client/endpoint');

const dummyMetadata =   {
  "-95KMDHf4vQ": {
    "_updated": "2024-09-12T08:56:14.419Z",
    "channel_id": "UC07MVxpRKdDJmqwWDGYqotA",
    "description": "Seattle Public Schools",
    "publish_date": "2015-11-04T21:05:52-08:00",
    "title": "School Board Meeting Date November 4th, 2015 Pt.2",
    "video_id": "-95KMDHf4vQ"
  },
  "-MyMd2xOYdw": {
    "_updated": "2024-10-15T08:03:00.594Z",
    "channel_id": "UC07MVxpRKdDJmqwWDGYqotA",
    "description": "Seattle Public Schools",
    "publish_date": "2024-10-09T22:02:50-07:00",
    "title": "Seattle Schools Board Meeting Oct. 9, 2024",
    "video_id": "-MyMd2xOYdw"
  },
  "-PMPKQzkJYg": {
    "_updated": "2024-09-12T08:56:14.043Z",
    "channel_id": "UC07MVxpRKdDJmqwWDGYqotA",
    "description": "Seattle Public Schools",
    "publish_date": "2017-01-20T15:21:53-08:00",
    "title": "School Board Meeting 1 18 2017 Part 2",
    "video_id": "-PMPKQzkJYg"
  },
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
    (fetchEndpoint as jest.MockedFunction<typeof fetchEndpoint>).mockResolvedValue({...dummyMetadata});
  });

  it('renders', async () => {
    const Page = await Landing();
    await renderServerFunctionComponent(Page);
    expect(screen.queryAllByRole('banner').length).toBeGreaterThan(0);
  });
});