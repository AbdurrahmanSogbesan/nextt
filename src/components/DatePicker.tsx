"use client";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { Control, FieldValues, Path } from "react-hook-form";
import { ComponentProps } from "react";

type DatePickerProps<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  calendarProps?: ComponentProps<typeof Calendar>;
  control: Control<T>;
  className?: string;
};

export function DatePicker<T extends FieldValues>({
  name,
  label,
  control,
  calendarProps,
  className,
}: DatePickerProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon />
                  {field.value ? (
                    format(field.value, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                initialFocus
                {...calendarProps}
              />
            </PopoverContent>
          </Popover>
        </FormItem>
      )}
    />
  );
}
