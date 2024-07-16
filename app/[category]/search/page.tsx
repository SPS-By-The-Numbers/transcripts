'use client'

import * as Constants from 'config/constants';
import Link from 'next/link';
import { MeiliSearch } from 'meilisearch';
import { getVideoPath } from 'common/paths';
import { parseISO } from 'date-fns';
import { toHhmmss } from 'utilities/client/css';
import { useState } from 'react';

import type { ReactNode } from 'react';

type SearchParams = {
    category: string,
};

type Position = {
  length: number;
  start: number;
};

type MatchesPosition = {
  text: Array<Position>;
};

type ResultAttributes = {
  videoId: string;
  start: number;
  publishDate: string;
  title: string;
  _formatted: {
    id: string;
    text: string;
    videoId: string;
    start: string;
    end: string;
    publishDate: string;
    title: string;
    transcribDate: string;
  };
  _matchesPosition: MatchesPosition;
};

type SearchResults = {
  hits: Array<ResultAttributes>,
  query: string;
  processingTimeMs: number;
  limit: number;
  offset: number;
  estimatedTotalHits?: number;
  totalHits?: number;
};

type ResultParams = {
    category: string,
    results?: SearchResults,
};

const client = new MeiliSearch({
  host: Constants.MEILI_ENDPOINT,
  apiKey: Constants.MEILI_KEY,
});

function formatDate(dateStr : string) {
  const date = parseISO(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidSort(sortType: string) {
  return (
      sortType === 'publishDate:asc'
      || sortType === 'publishDate:desc');
}

function doSearch(category : string, query : string, sortType : string, setResults) {
  const indexName = `${category}-${Constants.CATEGORY_CHANNEL_MAP[category].language}`;
  const index = client.index(indexName);

  const sort = isValidSort(sortType) ? [ sortType ] : undefined;

  index.search(query, {
      attributesToSearchOn: ['text'],
      attributesToRetrieve: ['videoId', 'start', 'publishDate', 'title'],
      attributesToCrop: [ 'text' ],
      showMatchesPosition: true,
      sort,
      cropLength: 256,
      hitsPerPage: 1000, // Force exact for now.
      limit: 1000,
    })
    .then((result : any) => {
      console.log(result);
      setResults(result);
    });
}

function Snippet({ text, matchesPosition }: { text: string, matchesPosition: MatchesPosition } ) {
  const textSegments : Array<ReactNode> = [];
  let lastStart = 0;
  for (const [i, match] of Object.entries(matchesPosition.text)) {
    // Unmatched part.
    if (lastStart !== match.start) {
      textSegments.push(<span key={`${i}-no`}>{text.slice(lastStart, match.start)}</span>);
    }
    textSegments.push(<span className="bg-yellow-300 font-semibold" key={`${i}-em`}>{text.slice(match.start, match.start + match.length)}</span>);
    lastStart = match.start + match.length;
  }
  if (lastStart !== text.length -1) {
    textSegments.push(<span key='last'>{text.slice(lastStart)}</span>);
  }

  return (
   <div>
     { textSegments }
   </div>
  );
}

function ResultList({ category, results }: ResultParams) {
  if (!results) {
    return (
      <section>
        <p className="text-lg">Do a search!</p>
        <p className="text-sm">(The first search may be really slow...like 2-3 mins...cause the engine needs to warm up)</p>
      </section>);
  }

  const hits = results.hits;
  if (hits.length === 0) {
    return (<section>No Results</section>);
  }

  const resultElements = hits.map((h,i) => {
    return (
      <article key={i} className="mx-3 mb-2 bg-gray-300 p-2 rounded-lg">
        <Link href={`${getVideoPath(category, h.videoId)}#${toHhmmss(h.start)}`}>
        {h.title}
        </Link>
        <br />
        <b>Published:</b> [{formatDate(h.publishDate)}]
        <br />
        <Snippet text={h._formatted.text} matchesPosition={h._matchesPosition} />
      </article>
    );
  });

  return (
      <section>
        <div className="p-2 m-3 bg-gray-400 text-xs rounded-lg">
         <b>Query:</b> {results.query}<br/>
         <b>Results:</b> {results.estimatedTotalHits || results.totalHits}<br/>
         <b>Processing Time:</b> {results.processingTimeMs}ms<br/>
        </div>
        { resultElements }
      </section>);
}

export default function Search({ params }: { params: SearchParams }) {
  const [query, setQuery] = useState<string>("");
  const [sortType, setSortType] = useState<string>("relevance");
  const [results, setResults] = useState<SearchResults | undefined>();

  return (
      <div className="p-2">
        <form
            className="flex items-center justify-center"
            onSubmit={(e) => {
              e.preventDefault();
              doSearch(params.category, query, sortType, setResults);
            }}>
          <label> Result Sort: 
          <select onChange={(e) => setSortType(e.target.value)} className="m-2 border-black border-2" value={sortType}>
            <option value="relevance">Relevance</option>
            <option value="publishDate:asc">Publish Date (asc)</option>
            <option value="publishDate:desc">Publish Date (desc)</option>
          </select>
          </label>
          <input
              className="rounded border-black border-2 mx-1 px-2 py-2 w-4/12 max-w-screen-sm"
              type="text"
              placeholder="query here"
              value={query}
              onChange={e => setQuery(e.target.value)} />
          <button
              type="submit"
              className="border-2 px-6 py-2 mx-1 bg-sky-500 rounded">
            Search
          </button>
        </form>
        <hr className="my-2"/>
        <div>
          <br />
          <ResultList category={params.category} results={results} />
        </div>
      </div>);
}
