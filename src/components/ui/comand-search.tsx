import {useEffect, useState} from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Check, Loader2} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command.tsx";
import {cn} from "@/lib/utils.ts";

interface SearchSelectProps<T> {
  placeholder?: string;
  initialSearch?: string;
  defaultSelected?: T | null;
  onSelect: (option: T | null) => void; // Aceptar valores nulos
  searchFetch: (search: string) => Promise<T[]>;
  toOption: (item: T) => { value: string; label: string };
  compare?: (item: T, selected: T) => boolean;
  noResultsText?: string;
  className?: string;
}

export default function SearchSelect<T>(
  {
    placeholder = "Buscar...",
    initialSearch,
    defaultSelected = null,
    onSelect,
    searchFetch,
    toOption,
    compare = (a, b) => a === b,
    noResultsText = "No se encontraron resultados.",
    className,
  }: Readonly<SearchSelectProps<T>>
) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState<string>(initialSearch ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<T[]>([]);
  const [selected, setSelected] = useState<T | null>(defaultSelected);

  const dispatchSearch = async (search: string) => {
    setIsLoading(true);
    try {
      const items = await searchFetch(search);
      setItems(items);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      dispatchSearch(search).catch((error) => console.error(error));
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleSelect = (item: T | null) => {
    setSelected(item);
    setOpen(false);
    onSelect(item);
  };

  console.log(items);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            search && "text-muted-foreground",
            className
          )}
        >
          {selected ? toOption(selected).label : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder={placeholder}
            onValueChange={handleSearchChange}
            className="h-9"
            value={search}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>
              </div>
            ) : (
              <>
                {items.length === 0 ? (
                  <CommandEmpty>{noResultsText}</CommandEmpty>
                ) : (
                  <CommandGroup {...(search && {title: `Resultados para "${search}"`})}>
                    <CommandItem
                      key="no-selection"
                      value="no-selection"
                      onSelect={() => handleSelect(null)} // Deseleccionar
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          !selected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      Sin seleccionar
                    </CommandItem>
                    {items.map((item) => {
                      const {value, label} = toOption(item);
                      const isSelected = selected && compare(item, selected);

                      return (
                        <CommandItem
                          key={value}
                          value={value}
                          onSelect={() => handleSelect(item)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              isSelected ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {label}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
