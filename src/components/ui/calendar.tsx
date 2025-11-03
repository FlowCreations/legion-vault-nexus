import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-[#111] rounded-xl border border-gray-800 shadow-2xl", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-2 pb-4 relative items-center border-b border-gray-800 mb-4",
        caption_label: "text-base font-bold tracking-wide text-white",
        caption_dropdowns: "flex gap-2",
        dropdown_month: "relative inline-flex items-center px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-gray-700 text-white text-sm font-medium hover:bg-[#222] hover:border-primary transition-all cursor-pointer appearance-none pr-8 z-50",
        dropdown_year: "relative inline-flex items-center px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-gray-700 text-white text-sm font-medium hover:bg-[#222] hover:border-primary transition-all cursor-pointer appearance-none pr-8 z-50",
        dropdown_icon: "absolute right-2 top-1/2 -translate-y-1/2 text-primary pointer-events-none",
        vhidden: "sr-only",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-transparent p-0 border-gray-700 text-gray-400 hover:text-primary hover:border-primary transition-all duration-200",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1 mt-2",
        head_row: "flex",
        head_cell: "text-gray-500 rounded-md w-10 font-semibold text-xs uppercase tracking-wider",
        row: "flex w-full mt-2",
        cell: cn(
          "relative h-10 w-10 text-center text-sm p-0",
          "focus-within:relative focus-within:z-20",
          "[&:has([aria-selected].day-range-end)]:rounded-r-lg",
          "[&:has([aria-selected].day-outside)]:bg-primary/10",
          "[&:has([aria-selected])]:bg-primary/5",
          "first:[&:has([aria-selected])]:rounded-l-lg",
          "last:[&:has([aria-selected])]:rounded-r-lg"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-medium text-white hover:bg-transparent hover:text-primary hover:ring-1 hover:ring-primary rounded-lg transition-all duration-200"
        ),
        day_range_end: "day-range-end",
        day_selected: "bg-primary text-black font-bold hover:bg-primary hover:text-black focus:bg-primary focus:text-black rounded-lg shadow-lg shadow-primary/30",
        day_today: "bg-gray-800 text-white font-semibold rounded-lg border border-gray-700",
        day_outside: "day-outside text-gray-600 opacity-50 aria-selected:bg-primary/10 aria-selected:text-gray-500",
        day_disabled: "text-gray-700 opacity-30 cursor-not-allowed",
        day_range_middle: "aria-selected:bg-primary/10 aria-selected:text-white rounded-none",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
