import {
  Check,
  ChevronsUpDown,
  Loader2,
  X
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
import {useEffect, useState} from "react";
import {useDebouncedCallback} from "@/hooks/use-debounce.ts";
import type {ClassValue} from "clsx";
import {useIsFirstRender} from "@/hooks/use-is-first-rendered.ts";

type ComboBoxItemType = {
  value: string
  label: string
}

type ComboboxProps<T> = {
  value?: T
  onSelect: (value: T | undefined) => void
  items: T[]
  comboboxItem: (item: T) => ComboBoxItemType
  compare?: (selectedValue: T, itemValue: T) => boolean
  searchPlaceholder?: string
  noResultsText?: string
  selectItemText?: string
  className?: ClassValue
  unselect?: boolean
  unselectText?: string
  onSearchValueChange?: (search: string) => void
  loading?: boolean
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
    comboboxItem,
    compare = (selectedValue, itemValue) => selectedValue === itemValue,
    searchPlaceholder = 'Buscar',
    noResultsText = 'No hay resultados',
    selectItemText = 'Seleccionar',
    className,
    onSearchValueChange,
    loading = false,
    loadingText = 'Cargando...'
  }: Readonly<ComboboxProps<T>>
) {

  const isFirstRender = useIsFirstRender();
  const [open, setOpen] = useState(false)
  const [hasTrigger, setHasTrigger] = useState(false)
  const [textSearch, setTextSearch] = useState('')

  const onOpenChage = (boolean: boolean) => {
    if (!hasTrigger && boolean) {
      setHasTrigger(true);
      onSearchValueChange?.('');
    }
    setOpen(boolean);
  }

  useEffect(() => {
    if (isFirstRender) return
    onSearchValueChange?.(textSearch)
  }, [textSearch])

  return (
    <Popover open={open} onOpenChange={onOpenChage} modal={true}>
      <PopoverTrigger
        asChild
      >
        <Button
          variant='outline'
          type='button'
          aria-expanded={open}
          className={cn('justify-between', className)}
        >
          {value ? comboboxItem(value).label : selectItemText}
          {value ? (
            <span
              onClick={(e) => {
                e.stopPropagation()
                onSelect(undefined)
              }}
              className="p-1 hover:bg-primary hover:text-white rounded-full hover:animate-pulse"
            >
              <X className="h-4 w-4 opacity-50 hover:opacity-100"/>
            </span>
          ) : (
            <ChevronsUpDown className='h-4 w-4'/>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        style={popOverStyles}
        className='p-0'

      >
        <Command>
          <CommandInput
            value={textSearch}
            placeholder={searchPlaceholder}
            onValueChange={setTextSearch}
          />
          <ScrollArea className='max-h-[220px] overflow-auto'>
            {loading ? (
              <CommandEmpty>
                <Loader2 className='mx-auto animate-spin h-8 w-8'/>
                {loadingText}
              </CommandEmpty>
            ) : (
              <>
                <CommandEmpty>{noResultsText}</CommandEmpty>
                <CommandGroup>
                  {items.map(item => {
                    const comboBoxItem = comboboxItem(item)
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


interface ComboboxRemoteProps<T> extends Omit<ComboboxProps<T>, 'items' | 'loading'> {
  fetchItems: (string?: string) => Promise<T[]>
  debounceTime?: number
}

export function ComboboxRemote<T>(
  {
    fetchItems,
    debounceTime = 500,
    onSearchValueChange,
    ...props
  }: Readonly<ComboboxRemoteProps<T>>
) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(false)

  const handleOnSearchChange = useDebouncedCallback(async (search: string) => {
    try {
      setItems(await fetchItems(search))
    } finally {
      setLoading(false)
    }
  }, debounceTime)


  return (
    <Combobox<T>
      {...props}
      items={items}
      loading={loading}
      onSearchValueChange={(search) => {
        setLoading(true);
        handleOnSearchChange(search);
        onSearchValueChange?.(search);
      }}
    />
  )
}

