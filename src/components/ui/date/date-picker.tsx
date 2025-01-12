"use client";

import {cn} from "@/lib/utils";
import {getLocalTimeZone, today} from "@internationalized/date";
import {CalendarIcon, ChevronLeft, ChevronRight} from "lucide-react";
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DatePicker as DatePikerComponent,
  DateSegment,
  Group,
  Heading,
} from "react-aria-components";
import {
  ComponentProps,
  useEffect,
  useState
} from "react";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover.tsx";
import {DateValue} from "react-aria";

interface DatePickerProps<T extends DateValue> extends ComponentProps<typeof DatePikerComponent<T>> {
  placeHolder?: string;
}

export default function DatePicker<T extends DateValue>({placeHolder, onChange, value, ...props}: Readonly<DatePickerProps<T>>) {
  const [hasValue, setHasValue] = useState(false);
  const now = today(getLocalTimeZone());

  useEffect(() => {
    if (value === undefined) return;
    setHasValue(value !== null);
  }, [value]);

  return (
    <Popover modal>
      <DatePikerComponent<T>
        className="space-y-2"
        aria-label="Date picker"
        onChange={(value) => {
          setHasValue(value !== null);
          onChange?.(value);
        }}
        {...props}
      >
        <div className="flex">
          <Group className="inline-flex h-9 w-full items-center overflow-hidden whitespace-nowrap rounded-lg border border-input bg-background px-3 py-2 pe-9 text-sm shadow-sm shadow-black/5 transition-shadow data-[focus-within]:border-ring data-[disabled]:opacity-50 data-[focus-within]:outline-none data-[focus-within]:ring-[3px] data-[focus-within]:ring-ring/20">

            {(hasValue || !placeHolder) ? (
              <DateInput>
                {(segment) => {
                  return (
                    <DateSegment
                      segment={segment}
                      className="inline rounded p-0.5 text-foreground caret-transparent outline outline-0 data-[disabled]:cursor-not-allowed data-[focused]:bg-accent data-[invalid]:data-[focused]:bg-destructive data-[type=literal]:px-0 data-[focused]:data-[placeholder]:text-foreground data-[focused]:text-foreground data-[invalid]:data-[focused]:data-[placeholder]:text-destructive-foreground data-[invalid]:data-[focused]:text-destructive-foreground data-[invalid]:data-[placeholder]:text-destructive data-[invalid]:text-destructive data-[placeholder]:text-muted-foreground/70 data-[type=literal]:text-muted-foreground/70 data-[disabled]:opacity-50"
                    />
                  );
                }}
              </DateInput>
            ) : (
              <span className="text-muted-foreground/70">{placeHolder}</span>
            )}

          </Group>
          <PopoverTrigger asChild>
            <Button className="z-10 -me-px -ms-9 flex w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus-visible:outline-none data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-ring/70">
              <CalendarIcon size={16} strokeWidth={2}/>
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent
          className="p-1 z-50 rounded-lg border border-border bg-background text-popover-foreground shadow-lg shadow-black/5 outline-none data-[entering]:animate-in data-[exiting]:animate-out data-[entering]:fade-in-0 data-[exiting]:fade-out-0 data-[entering]:zoom-in-95 data-[exiting]:zoom-out-95 data-[placement=bottom]:slide-in-from-top-2 data-[placement=left]:slide-in-from-right-2 data-[placement=right]:slide-in-from-left-2 data-[placement=top]:slide-in-from-bottom-2"
          asChild
        >
          <Calendar className="w-fit">
            <header className="flex w-full items-center gap-1 pb-1">
              <Button
                slot="previous"
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:bg-accent hover:text-foreground data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-ring/70"
              >
                <ChevronLeft size={16} strokeWidth={2}/>
              </Button>
              <Heading className="grow text-center text-sm font-medium"/>
              <Button
                slot="next"
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:bg-accent hover:text-foreground data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-ring/70"
              >
                <ChevronRight size={16} strokeWidth={2}/>
              </Button>
            </header>
            <CalendarGrid>
              <CalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell className="size-9 rounded-lg p-0 text-xs font-medium text-muted-foreground/80">
                    {day}
                  </CalendarHeaderCell>
                )}
              </CalendarGridHeader>
              <CalendarGridBody className="[&_td]:px-0">
                {(date) => (
                  <CalendarCell
                    date={date}
                    className={cn(
                      "relative flex size-9 items-center justify-center whitespace-nowrap rounded-lg border border-transparent p-0 text-sm font-normal text-foreground outline-offset-2 transition-colors data-[disabled]:pointer-events-none data-[unavailable]:pointer-events-none data-[focus-visible]:z-10 data-[hovered]:bg-accent data-[selected]:bg-primary data-[hovered]:text-foreground data-[selected]:text-primary-foreground data-[unavailable]:line-through data-[disabled]:opacity-30 data-[unavailable]:opacity-30 data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-ring/70 data-[invalid]:data-[selected]:[&:not([data-hover])]:bg-destructive data-[invalid]:data-[selected]:[&:not([data-hover])]:text-destructive-foreground",
                      date.compare(now) === 0 &&
                      "after:pointer-events-none after:absolute after:bottom-1 after:start-1/2 after:z-10 after:size-[3px] after:-translate-x-1/2 after:rounded-full after:bg-primary data-[selected]:after:bg-background",
                    )}
                  />
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>
        </PopoverContent>
      </DatePikerComponent>
    </Popover>
  );
}
