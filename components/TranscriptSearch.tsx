'use client'

import * as Constants from 'config/constants';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import SearchIcon from '@mui/icons-material/Search';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SearchResult from 'components/SearchResult';

import { MeiliSearch } from 'meilisearch';
import { getVideoPath } from 'common/paths';
import { parseISO } from 'date-fns';
import { styled } from '@mui/material/styles';
import { toHhmmss } from 'utilities/client/css';
import { useEffect, useState } from 'react';

import type { CategoryId } from 'common/params.ts';
import type { MeiliSearchErrorResponse } from 'meilisearch';
import type { ReactNode, ChangeEvent } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { SearchResponse, MatchesPosition } from 'meilisearch';

type Position = {
  start: number;
  length: number;
  indices?: number[];
};

type ErrorMessage = {
  message: string;
  severity: 'error' | 'info' | 'success' | 'warning' | undefined;
};

const noError = { message: 'what', severity: undefined };

type ResultParams = {
    category: string,
    results?: SearchResponse,
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

function Snippet({ text, position }: { text: string, position: Array<Position> | undefined } ) {
  const textSegments = new Array<ReactNode>();
  let lastStart = 0;

  if (position) {
    for (let i = 0; i < (position).length; i = i+1) {
      const match = position[i];
      if (match === undefined) {
        continue;
      }

      // Unmatched part.
      if (lastStart !== match.start) {
        textSegments.push(
          <Typography 
            key={`${i}-nomatch`}
            component="span"
          >
            {text.slice(lastStart, match.start)}
          </Typography>);
      }
      textSegments.push(
        <Typography
          key={`${i}-match`}
          component="span"
          color="secondary"
          sx={{fontWeight:"bold"}}
        >
          {text.slice(match.start, match.start + match.length)}
        </Typography>);
      lastStart = match.start + match.length;
    }
  }

  if (lastStart !== text.length -1) {
    textSegments.push(
      <Typography
        key='last-nomatch'
        component="span"
      >
        {text.slice(lastStart)}
      </Typography>);
  }

  return (
   <Box>
     { textSegments }
   </Box>
  );
}

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
      <SearchResult
          key={i}
          category={category}
          videoId={h.videoId}
          title={h.title}
          publishDate={h.publishDate}
        >
        <Snippet
          text={h._formatted?.text ?? ""}
          position={h._matchesPosition?.['text']} />
      </SearchResult>
    );
  });

  return (
      <Stack spacing={2}>
        <Paper>
          <ul>
            <li><b>Query:</b> {results.query}</li>
            <li><b>Results:</b> {results.estimatedTotalHits || results.totalHits}</li>
            <li><b>Processing Time:</b> {results.processingTimeMs}ms</li>
          </ul>
        </Paper>
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

type SearchControlsProps = {
  category: CategoryId;
  setResults: (r: SearchResponse | undefined) => void;
  setErrorMessage: (m: ErrorMessage) => void;
}

function SearchControls({category, setResults, setErrorMessage} : SearchControlsProps) {
  const [query, setQuery] = useState<string>("");
  const [sortType, setSortType] = useState<string>("relevance");
  const [groupType, setGroupType] = useState<string>("speaker");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSearch = async () => {
    try {
      setLoading(true);
      setResults(await doSearch(category, query, sortType, groupType));
      setLoading(false);
      setErrorMessage(noError);
    } catch (err) {
      setErrorMessage({severity: 'error', message: err.message});
    }
  };

  const handleGroupTypeChange = (event: SelectChangeEvent) => {
    setGroupType(event.target.value as string);
  };

  const handleSortTypeChange = (event: SelectChangeEvent) => {
    setSortType(event.target.value as string);
  };

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value as string);
  };

  return (
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

        <Button
          variant="contained"
          onClick={handleSearch}
          sx={{flexGrow:0}}>
          <SearchIcon fontSize="small" />
        </Button>
        <Backdrop open={loading}>
          <CircularProgress color="inherit" />
        </Backdrop>
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
  );
}

export default function TranscriptSearch({category} : {category: CategoryId}) {

  const [results, setResults] = useState<SearchResponse | undefined>();
  const [errorMessage, setErrorMessage] = useState<ErrorMessage>(noError);

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

      <SearchControls category={category} setResults={setResults} setErrorMessage={setErrorMessage} />

      <Divider />

      <ResultList category={category} results={results} />
    </Stack>
  );
}
