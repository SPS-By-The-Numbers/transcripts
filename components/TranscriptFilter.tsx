import { MenuItem, Select } from '@mui/material';
import { DatePicker } from "@mui/x-date-pickers";
import { isAfter, isBefore } from "date-fns";

export type DateRange = {
  start: Date | null,
  end: Date | null
};

export type TranscriptFilterSelection = {
  dateRange: DateRange,
  category: string
}

export type TranscriptFilterProps = {
  selection: TranscriptFilterSelection;
  onFilterChange: (filters: TranscriptFilterSelection) => void
}

export default function TranscriptFilter({selection, onFilterChange}: TranscriptFilterProps) {
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

  function handleDateRangeChange(range: DateRange): void {
    onFilterChange({...selection, dateRange: range});
  }

  const options = [
    { value: 'sps-board', label: 'SPS Board' },
    { value: 'seattle-city-council', label: 'Seattle City Council' }
  ].map(({ value, label }) => <MenuItem key={value} value={value}>{label}</MenuItem>);

  // const selectedOption = options.find(option => option.value === selection.category);

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