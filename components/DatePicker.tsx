import { ChangeEvent } from "react";
import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers";
import { formatDateForPath } from "utilities/path-utils";

export type DatePickerProps = {
  date: Date | null,
  label: string,
  onDateChange: (date: Date | null) => void
};

export default function DatePicker({ date, label, onDateChange }: DatePickerProps) {
  // const dateString: string = date !== null ? formatDateForPath(date) : '';

  // function handleDateChange(e: ChangeEvent<HTMLInputElement>): void {
  //   onDateChange(e.target.valueAsDate);
  // }

  return <MuiDatePicker
    label={label}
    value={date}
    onChange={onDateChange}/>
  // return <div className="flex flex-col space-y-1">
  //   <label htmlFor="date">{label}</label>
  //   <input
  //     name="date" type="date"
  //     className="rounded-md border-2 border-gray-300"
  //     value={dateString} onChange={handleDateChange} />
  // </div>
}