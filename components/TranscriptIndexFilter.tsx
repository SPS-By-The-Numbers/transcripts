import * as Constants from 'config/constants';

import { MenuItem, Select } from '@mui/material';
import { DatePicker } from "@mui/x-date-pickers";
import { isAfter, isBefore } from "date-fns";

export type DateRange = {
  start: Date | null,
  end: Date | null
};

export type TranscriptIndexFilterSelection = {
  dateRange: DateRange,
  category: string
}

export type TranscriptIndexFilterProps = {
  selection: TranscriptIndexFilterSelection;
  onFilterChange: (filters: TranscriptIndexFilterSelection) => void
}

export default function TranscriptIndexFilter({selection, onFilterChange}: TranscriptIndexFilterProps) {
  function handleCategoryChange(event) {
    onFilterChange({...selection, category: event.target.value});
  }

  function handleStartChange(start: Date | null): void {
    const range: DateRange = selection.dateRange;
    let newRange: DateRange;

    if (start === null) {
      newRange = { ...range, start: null };
    }

    else if (range.end !== null && isAfter(start, range.end)) {
      newRange = { start, end: null };
    }
    else {
      newRange = { ...range, start };
    }

    handleDateRangeChange(newRange);
  }

  function handleEndChange(end: Date | null): void {
    const range: DateRange = selection.dateRange;
    let newRange: DateRange;

    if (end === null) {
      newRange = { ...range, end: null };
    }
    else if (range.start !== null && isBefore(end, range.start)) {
      newRange = { start: null, end };
    }
    else {
      newRange = { ...range, end };
    }

    handleDateRangeChange(newRange);
  }

  function handleDateRangeChange(dateRange: DateRange): void {
    onFilterChange({...selection, dateRange});
  }

  const options = Object.entries(Constants.CATEGORY_CHANNEL_MAP).map(
    ([category, info]) => (<MenuItem key={category} value={category}>{info.name}</MenuItem>));

  return <search className="flex flex-row space-x-5">
    <Select
      value={selection.category}
      onChange={handleCategoryChange}>
      {options}
    </Select>
    <DatePicker label="Start Date" value={selection.dateRange.start} onChange={handleStartChange} />
    <DatePicker label="End Date" value={selection.dateRange.end} onChange={handleEndChange} />
   </search>
}
