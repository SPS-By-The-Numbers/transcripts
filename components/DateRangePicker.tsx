import * as Constants from 'config/constants';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { DatePicker } from "@mui/x-date-pickers";
import { isAfter, isBefore } from "date-fns";

export type DateRange = {
  start: Date | null,
  end: Date | null
};

type DateRangePickerProps = {
  range: DateRange;
  onRangeChange: (newRange: DateRange) => void;
}

export default function DateRangePicker(
    {range, onRangeChange}: DateRangePickerProps) {

  function handleStartChange(start: Date | null): void {
    const newRange = {...range, start};

    // Ensure the start does not exceed the end.
    if (newRange.end !== null && newRange.start !== null&&
        isAfter(newRange.start, newRange.end)) {
      newRange.end = null;
    }

    onRangeChange(newRange);
  }

  function handleEndChange(end: Date | null): void {
    const newRange = {...range, end};

    // Ensure end does not move before the start.
    if (newRange.start !== null && newRange.end !== null &&
        isBefore(newRange.end, newRange.start)) {
      newRange.start = null;
    }

    onRangeChange(newRange);
  }

  return (
    <Box component="search">
      <Stack direction="row" spacing={2}>
      <DatePicker
        label="Start Date"
        value={range.start}
        onChange={handleStartChange} />
      <DatePicker
        label="End Date"
        value={range.end}
        onChange={handleEndChange} />
      </Stack>
    </Box>
  );
}
