'use client'

import * as Constants from 'config/constants';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import NextLink from 'next/link';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import SearchIcon from '@mui/icons-material/Search';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { MeiliSearch } from 'meilisearch';
import { getVideoPath } from 'common/paths';
import { parseISO } from 'date-fns';
import { styled } from '@mui/material/styles';
import { toHhmmss } from 'utilities/client/css';
import { useEffect, useState } from 'react';

import type { CategoryId } from 'common/params.ts';
import type { MeiliSearchErrorResponse } from 'meilisearch';
import type { ReactNode } from 'react';

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

type ErrorMessage = {
  message: string;
  severity: 'error' | 'info' | 'success' | 'warning' | undefined;
};

const noError = { message: 'what', severity: undefined };

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

const searchClient = new MeiliSearch({
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

async function doSearch(category : string,
                        query : string,
                        sortType : string,
                        groupType: string) {
  const indexName = `${category}-${Constants.CATEGORY_CHANNEL_MAP[category].language}`;
  const index = searchClient.index(indexName);

  const sort = isValidSort(sortType) ? [ sortType ] : undefined;
  const queryOptions = {
      attributesToSearchOn: ['text'],
      attributesToRetrieve: ['videoId', 'start', 'publishDate', 'title'],
      attributesToCrop: [ 'text' ],
      showMatchesPosition: true,
      sort,
      cropLength: 256,
      hitsPerPage: 1000, // Force exact for now.
      limit: 1000,
    };
  if (groupType === 'speaker') {
    queryOptions['distinct'] = 'id';  // Make meilisearch return all documents individually.

    // But sort them according to video and time.
    const groupSort = ['videoId:asc', 'start:asc'];
    if (queryOptions.sort) {
      queryOptions.sort.push(...groupSort);
    } else {
      queryOptions.sort = groupSort;
    }
  }

  return await index.search(query, queryOptions);
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

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? 'rgb(209 213 219)' : 'rgb(209 213 219)',
  ...theme.typography.body2,
  padding: theme.spacing(2),
  color: theme.palette.text.primary,
}));

function ResultList({ category, results }: ResultParams) {
  if (!results) {
    return (
      <Paper sx={{padding: "1rem"}}>
        <Typography component="h5" variant="h5">Do a search!</Typography>
        <Typography>
          (The first search may be really slow...like 2-3 mins...cause the engine needs to warm up)
        </Typography>
      </Paper>);
  }

  const hits = results.hits ?? [];
  if (hits.length === 0) {
    return (<section>No Results</section>);
  }

  const resultElements = hits.map((h,i) => {
    return (
      <Item key={i}>
        <Typography sx={{ fontSize: 14 }} color="text.primary" variant="h2">
          <Link className="text-lg font-medium" href={`${getVideoPath(category, h.videoId)}#${toHhmmss(h.start)}`}>
            {h.title}
          </Link>
        </Typography>
        <Typography sx={{ fontSize: 14 }} color="text.primary" gutterBottom>
          <b>Published:</b> {formatDate(h.publishDate)}, <b>VideoId:</b> {h.videoId}, <b>Time:</b> {toHhmmss(h.start)}
        </Typography>

        <Typography sx={{ fontSize: 14 }} color="text.secondary">
          <Snippet text={h._formatted.text} matchesPosition={h._matchesPosition} />
        </Typography>
      </Item>
    );
  });

  return (
      <Stack spacing={2}>
        <Item>
         <b>Query:</b> {results.query}<br/>
         <b>Results:</b> {results.estimatedTotalHits || results.totalHits}<br/>
         <b>Processing Time:</b> {results.processingTimeMs}ms<br/>
        </Item>
        { resultElements }
      </Stack>);
}

function extractCategory(param) {
  if (param === undefined) {
    return Constants.DEFAULT_CATEGORY;
  }

  if (Array.isArray(param)) {
    return param[0];
  }

  return param;
}

export default function TranscriptSearch({category} : {category: CategoryId}) {

  const [results, setResults] = useState<SearchResults | undefined>();

  const [query, setQuery] = useState<string>("");
  const [sortType, setSortType] = useState<string>("relevance");
  const [groupType, setGroupType] = useState<string>("speaker");
  const [errorMessage, setErrorMessage] = useState<ErrorMessage>(noError);
  const [requestNum, setRequestNum] = useState<number>(0);

  const handleSearch = (event: SelectChangeEvent) => {
    setRequestNum(requestNum + 1);
  };

  const handleGroupTypeChange = (event: SelectChangeEvent) => {
    setGroupType(event.target.value as string);
  };

  const handleSortTypeChange = (event: SelectChangeEvent) => {
    setSortType(event.target.value as string);
  };

  const handleQueryChange = (event: SelectChangeEvent) => {
    setQuery(event.target.value as string);
  };

  useEffect(() => {
    if (requestNum > 0) {
      async function thunk() {
        try {
          setResults(await doSearch(category, query, sortType, groupType));
          setErrorMessage(noError);
        } catch(err : MeiliSearchErrorResponse) {
          setErrorMessage({severity: 'error', message: err.message});
        }
      }

      thunk();
    }
  }, [requestNum]);

  return (
    <Stack
        spacing={2}
        sx={{
          padding: "1ex",
        }}>

      <Typography component="h1" variant="h4">
        Full text search for all of {category}
      </Typography>

      <Alert
          sx={{ display: errorMessage.severity ? 'flex' : 'none' }}
          severity={errorMessage.severity}
          onClose={()=>setErrorMessage(noError)}>
        {errorMessage['message']}
      </Alert>

      <Stack component="search" direction="column" spacing={1.5}>
        <Stack direction="row" spacing={1}>
          <FormControl
              sx={{
                minWidth: "30ch",
                flexGrow: 1,
              }}>
            <TextField
              size="small"
              placeholder="Enter Search Query Here"
              value={query}
              onChange={handleQueryChange} />
          </FormControl>

          <Button variant="contained" onClick={handleSearch} sx={{flexGrow:0}}>
            <SearchIcon fontSize="small"/>
          </Button>
        </Stack>

        <Stack component="search" direction="row" spacing={1}>
          <FormControl size="small" sx={{minWidth: "19ch"}}>
            <InputLabel id="grouping-select-label">Result Grouping</InputLabel>
            <Select
              id="grouping-select"
              labelId="grouping-select-label"
              onChange={handleGroupTypeChange}
              label="Result Grouping"
              value={groupType}>
              <MenuItem value="speaker">By Speaker Turn</MenuItem>
              <MenuItem value="video">By Video</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{minWidth: "22ch"}}>
            <InputLabel id="sort-select-label">Result Sort</InputLabel>
            <Select
              id="sort-select"
              labelId="sort-select-label"
              label="Result Sort"
              value={sortType}
              onChange={handleSortTypeChange}
            >
              <MenuItem value="relevance">Relevance</MenuItem>
              <MenuItem value="publishDate:asc">Publish Date (asc)</MenuItem>
              <MenuItem value="publishDate:desc">Publish Date (desc)</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      <Divider />

      <ResultList category={category} results={results} />
    </Stack>
  );
}
