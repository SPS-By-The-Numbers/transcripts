import Select from 'react-select';
import DateRangePicker, { DateRange } from "./DateRangePicker";

export type TranscriptFilterSelection = {
  dateRange: DateRange,
  category: string
}

export type TranscriptFilterProps = {
  selection: TranscriptFilterSelection;
  onFilterChange: (filters: TranscriptFilterSelection) => void
}

export default function TranscriptFilter({selection, onFilterChange}: TranscriptFilterProps) {
  function handleCategoryChange({ value, label}) {
    onFilterChange({...selection, category: value});
  }

  function handleDateRangeChange(range: DateRange): void {
    onFilterChange({...selection, dateRange: range});
  }

  const options = [
    { value: 'sps-board', label: 'SPS Board' },
    { value: 'seattle-city-council', label: 'Seattle City Council' }
  ];

  const selectedOption = options.find(option => option.value === selection.category);

  return <section>
    <Select
      options={options}
      value={selectedOption}
      onChange={handleCategoryChange}
      />
    <DateRangePicker
      range={selection.dateRange}
      onDateRangeChange={handleDateRangeChange} />
   </section>
}