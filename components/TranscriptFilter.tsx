import DateRangePicker, { DateRange } from "./DateRangePicker"

export type TranscriptFilterSelection = {
  dateRange: DateRange,
  category: string
}

export type TranscriptFilterProps = {
  selection: TranscriptFilterSelection;
  onFilterChange: (filters: TranscriptFilterSelection) => void
}

export default function TranscriptFilter({selection, onFilterChange}: TranscriptFilterProps) {
  function handleDateRangeChange(range: DateRange): void {
    onFilterChange({...selection, dateRange: range});
  }

  return <DateRangePicker
   range={selection.dateRange}
   onDateRangeChange={handleDateRangeChange} />
}