import { getAllByRole, getByRole, queryByRole, render, screen, RenderResult } from '@testing-library/react';
import Landing from './page';
import type { ApiResponse } from 'common/response';
import * as Constants from 'config/constants';
import { fetchEndpoint } from 'utilities/client/endpoint';

jest.mock('utilities/client/endpoint');

const dummyVideo = {
  channelId: 'UC07MVxpRKdDJmqwWDGYqotA',
  description: 'Seattle Public Schools',
  publishDate: '2015-11-04T21:05:52-08:00',
  title: 'School Board Meeting Date November 4th, 2015 Pt.2',
  videoId: '-95KMDHf4vQ'
};

const dummyMetadata = {
  'sps-board': [{
    ...dummyVideo,
    videoId: 'video1'
  }, {
    ...dummyVideo,
    videoId: 'video2'
  }, {
    ...dummyVideo,
    videoId: 'video3'
  }],
  'seattle-city-council': [{
    ...dummyVideo,
    videoId: 'video1'
  }, {
    ...dummyVideo,
    videoId: 'video2'
  }]
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

function mockCategoryData(categoryMetadata: { [category: string]: any }) {
  (fetchEndpoint as jest.MockedFunction<typeof fetchEndpoint>).mockImplementation(
    (endpoint: string, method: string, parameters: object | Record<string, string>): Promise<ApiResponse> => {
      const category: string = parameters['category'];

      return Promise.resolve<ApiResponse>({ ok: true, message: 'success', data: [ ...categoryMetadata[category] ] });
    });
}

function mockError(errorMessage: string) {
  (fetchEndpoint as jest.MockedFunction<typeof fetchEndpoint>).mockImplementation(
    (endpoint: string, method: string, parameters: object | Record<string, string>): Promise<ApiResponse> => {
      return Promise.resolve<ApiResponse>({ ok: false, message: errorMessage, data: [] });
    });
}

async function renderLandingPage(): Promise<RenderResult> {
  const Page = await Landing();
  return await renderServerFunctionComponent(Page);
}

function getAllCategoryHeaders(): HTMLElement[] {
  return screen.getAllByRole('heading', { level: 3 });
}

function getRegionForCategory(categoryName: string): HTMLElement {
  return screen.getByRole('region', { name: `${categoryName} - Recent Transcripts` });
}

function getRegionLinks(region: HTMLElement): HTMLElement[] {
  return getAllByRole(region, 'link');
}

function getLinkHeading(link: HTMLElement): HTMLElement {
  return getByRole(link, 'heading');
}

describe('Transcripts index page', () => {
  it('shows both categories', async () => {
    mockCategoryData(dummyMetadata);
    await renderLandingPage();
    const headers = getAllCategoryHeaders();
    expect(headers.length).toBe(2);
  });

  it('shows different article lists for different categories', async () => {
    const firstBoardMeetingTitle = 'First Board Meeting';

    const spsBoardData = [{
      ...dummyVideo,
      title: firstBoardMeetingTitle,
      videoId: 'video1',
    }, {
      ...dummyVideo,
      videoId: 'video2'
    }];

    const firstCouncilMeetingTitle = 'First Council Meeting';

    const cityCouncilData = [{
      ...dummyVideo,
      title: firstCouncilMeetingTitle,
      videoId: 'video3'
    }, {
      ...dummyVideo,
      videoId: 'video4'
    }, {
      ...dummyVideo,
      videoId: 'video5'
    }];

    mockCategoryData({
      ...dummyMetadata,
      'sps-board': spsBoardData,
      'seattle-city-council': cityCouncilData,
    });

    await renderLandingPage();

    const spsBoardRegion: HTMLElement = getRegionForCategory('SPS Board');
    const spsBoardLinks: HTMLElement[] = getRegionLinks(spsBoardRegion);

    expect(spsBoardLinks.length).toBe(2);
    const firstBoardLinkTitle: HTMLElement = getLinkHeading(spsBoardLinks[0]);
    expect(firstBoardLinkTitle.textContent).toBe(firstBoardMeetingTitle);

    const cityCouncilRegion: HTMLElement = getRegionForCategory('Seattle City Council');
    const cityCouncilLinks: HTMLElement[] = getRegionLinks(cityCouncilRegion);

    expect(cityCouncilLinks.length).toBe(3);
    const firstCouncilLinkTitle: HTMLElement = getLinkHeading(cityCouncilLinks[0]);
    expect(firstCouncilLinkTitle.textContent).toBe(firstCouncilMeetingTitle);
  });

  it('shows a message when a category has no data', async () => {
    mockCategoryData({
      ...dummyMetadata,
      'sps-board': []
    });

    await renderLandingPage();

    const spsBoardRegion: HTMLElement = getRegionForCategory('SPS Board');
    const messageElement: HTMLElement = getByRole(spsBoardRegion, 'alert');
    expect(messageElement.textContent).toBe('Sadness. Nothing in this category.');
  });

  it('shows an error message when the API call fails', async () => {
    const errorMessage = 'an error';
    mockError(errorMessage);

    await renderLandingPage();

    const spsBoardRegion: HTMLElement = getRegionForCategory('SPS Board');
    const messageElement: HTMLElement = getByRole(spsBoardRegion, 'alert');
    expect(messageElement.textContent).toBe(`Unable to load recents: ${errorMessage}`);
  });
});