import { DayPicker, DayPickerProps } from "react-day-picker";
import { vi } from 'date-fns/locale';

export function Calendar(props: DayPickerProps) {
  return (
    <DayPicker
      locale={vi}
      showOutsideDays={true}
      fixedWeeks={true}
      hideNavigation={true}
      {...props}
      classNames={{
        today: `border-amber-500`,
        selected: `bg-amber-500 border-amber-500 text-white hover:bg-amber-600`,
        root: `shadow-lg p-5 bg-white`,
        chevron: `fill-amber-500`,
        day: `h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md flex items-center justify-center`,
        day_outside: "text-gray-200 opacity-25 text-xs",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        caption_label: "text-sm font-medium",
        table: "w-full border-collapse space-y-1",
        cell: "text-center p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        row: "flex w-full mt-2",
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        tbody: "grid grid-cols-7 gap-1",
        head: "grid grid-cols-7 gap-1",
        week: "grid grid-cols-7 gap-1",
        caption: "flex justify-center pt-1 relative items-center mb-2",
        nav: "space-x-1 flex items-center",
        weekdays: "grid grid-cols-7 gap-1",
        weekday: "text-muted-foreground h-9 w-9 font-normal text-[0.8rem] flex items-center justify-center"
      }}
    />
  );
}
