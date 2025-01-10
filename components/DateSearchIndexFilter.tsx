import * as Constants from 'config/constants';

import Stack from '@mui/material/Stack';
import { DatePicker } from "@mui/x-date-pickers";
import { isAfter, isBefore } from "date-fns";

export type DateRange = {
  start: Date | null,
  end: Date | null
};

export type DateSearchIndexFilterSelection = {
  dateRange: DateRange,
  category: string
}

export type DateSearchIndexFilterProps = {
  selection: DateSearchIndexFilterSelection;
  onFilterChange: (filters: DateSearchIndexFilterSelection) => void
}

export default function DateSearchIndexFilter({selection, onFilterChange}: DateSearchIndexFilterProps) {
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

  return(
    <search>
      <Stack direction="row" spacing={2}>
      <DatePicker
        label="Start Date"
        value={selection.dateRange.start}
        onChange={handleStartChange} />
      <DatePicker
        label="End Date"
        value={selection.dateRange.end}
        onChange={handleEndChange} />
      </Stack>
    </search>
  );
}
