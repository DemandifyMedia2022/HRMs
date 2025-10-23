'use client';

import * as React from 'react';
import { ChevronDownIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type DatePickerProps = {
  id?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  value?: Date | undefined;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  triggerClassName?: string;
};

export function DatePicker({
  id = 'date',
  label = '',
  placeholder = 'Select date',
  className,
  value,
  onChange,
  disabled = false,
  triggerClassName,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(value);

  React.useEffect(() => {
    setDate(value);
  }, [value]);

  const handleSelect = (d?: Date) => {
    setDate(d);
    onChange?.(d);
    setOpen(false);
  };

  return (
    <div className={'flex flex-col gap-3 ' + (className ?? '')}>
      {label ? (
        <Label htmlFor={id} className="px-1">
          {label}
        </Label>
      ) : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={id}
            disabled={disabled}
            className={(triggerClassName ?? 'w-48 justify-between font-normal')}
          >
            {date ? date.toLocaleDateString() : placeholder}
            <ChevronDownIcon className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar mode="single" selected={date} captionLayout="dropdown" onSelect={handleSelect} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Back-compat export matching the user's snippet name if they prefer
export function Calendar22() {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="date" className="px-1">
        Date of birth
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" id="date" className="w-48 justify-between font-normal">
            {date ? date.toLocaleDateString() : 'Select date'}
            <ChevronDownIcon className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            captionLayout="dropdown"
            onSelect={d => {
              setDate(d);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
