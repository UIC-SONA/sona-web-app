import {
  Check,
  ChevronsUpDown,
  Loader2
} from 'lucide-react'

import {cn} from '@/lib/utils'
import {Button} from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {ScrollArea} from './scroll-area'
import {useState} from "react";
import {useDebouncedCallback} from "@/hooks/use-debounce.ts";
import type {ClassValue} from "clsx";

type ComboBoxItemType = {
  value: string
  label: string
}

type ComboboxProps<T> = {
  value?: T
  onSelect: (value: T | undefined) => void
  items: T[]
  toComboboxItem: (item: T) => ComboBoxItemType
  compare?: (selectedValue: T, itemValue: T) => boolean
  searchPlaceholder?: string
  noResultsText?: string
  selectItemText?: string
  className?: ClassValue
  unselect?: boolean
  unselectText?: string
  onSearch?: (search: string) => void
  debounceTime?: number
  onSearchInputChange?: (search: string) => void
  isLoading?: boolean
  loadingText?: string
}

const popOverStyles = {
  width: 'var(--radix-popover-trigger-width)'
}

export function Combobox<T>(
  {
    value,
    onSelect,
    items,
    toComboboxItem,
    compare = (selectedValue, itemValue) => selectedValue === itemValue,
    searchPlaceholder = 'Buscar',
    noResultsText = 'No hay resultados',
    selectItemText = 'Seleccionar',
    className,
    unselect = false,
    unselectText = 'Desmarcar',
    onSearch,
    debounceTime = 300,
    onSearchInputChange,
    isLoading = false,
    loadingText = 'Cargando...'
  }: Readonly<ComboboxProps<T>>
) {
  const [open, setOpen] = useState(false)

  const handleOnSearchChange = useDebouncedCallback((search: string) => {
    if (onSearch) {
      onSearch(search)
    }
  }, debounceTime)

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          type='button'
          aria-expanded={open}
          className={cn('justify-between', className)}
        >
          {value ? toComboboxItem(value).label : selectItemText}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50'/>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        style={popOverStyles}
        className='p-0'
      >
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            onValueChange={(value) => {
              handleOnSearchChange(value)
              if (onSearchInputChange) {
                onSearchInputChange(value)
              }
            }}
          />
          <ScrollArea className='max-h-[220px] overflow-auto'>
            {isLoading ? (
              <CommandEmpty>
                <Loader2 className='mx-auto animate-spin h-8 w-8'/>
                {loadingText}
              </CommandEmpty>
            ) : (
              <>
                <CommandEmpty>{noResultsText}</CommandEmpty>
                <CommandGroup>
                  {unselect && (
                    <CommandItem
                      key='unselect'
                      value=''
                      onSelect={() => {
                        onSelect(undefined)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          !value ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {unselectText}
                    </CommandItem>
                  )}
                  {items.map(item => {
                    const comboBoxItem = toComboboxItem(item)
                    return (
                      <CommandItem
                        key={comboBoxItem.value}
                        value={comboBoxItem.label}
                        onSelect={() => {
                          onSelect(item)
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            value && compare(value, item) ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {comboBoxItem.label}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </>
            )}
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
