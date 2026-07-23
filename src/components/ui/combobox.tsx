"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { usePortalContainer } from "@/components/ui/portal-container-context"

export function Combobox({
  id,
  name,
  options,
  defaultValue,
  value: controlledValue,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No match found.",
  required,
  className,
}: {
  id?: string
  name: string
  options: { id: string; name: string }[]
  defaultValue?: string
  /** Pass value + onValueChange to control selection from a parent (e.g. to
   * exclude picks made in sibling comboboxes). Omit both for normal
   * self-contained use. */
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  required?: boolean
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue ?? "")
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : uncontrolledValue
  const portalContainer = usePortalContainer()

  function setValue(next: string) {
    if (!isControlled) setUncontrolledValue(next)
    onValueChange?.(next)
  }

  const selected = options.find((option) => option.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <input type="hidden" name={name} value={value} required={required} />
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-64 justify-between font-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          {selected ? selected.name : placeholder}
          <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 gap-0 p-0"
        container={portalContainer}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.name}
                  onSelect={() => {
                    setValue(option.id === value ? "" : option.id)
                    setOpen(false)
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "size-4",
                      value === option.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
