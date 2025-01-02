import {
  ComponentPropsWithoutRef,
  Dispatch,
  SetStateAction,
  useEffect, useRef,
  useState
} from "react";
import {Check, ChevronDown} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {cn} from "@/lib/utils";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Button} from "@/components/ui/button";

type ItemsType<T> = T[] | (() => Promise<T[]>) | Promise<T[]>;

interface SearchSelectProps<T> extends Omit<ComponentPropsWithoutRef<typeof Command>, "onChange" | "value"> {
  placeholder?: string;
  initialSearch?: string;
  value?: T | null;
  defaultSelected?: T | null;
  onChange: (option: T | null) => void;
  items: ItemsType<T>;
  toOption: (item: T) => { value: string; label: string };
  compare?: (item: T, selected: T) => boolean;
  noResultsText?: string;
  isPopover?: boolean; // Para definir si se debe usar en un Popover
  triggerClassName?: string; // Clase para el botón si es un Popover
  contentClassName?: string; // Clase para el contenido si es un Popover
  buttonText?: string; // Texto para el botón del Popover
}

export function CommandSearch<T>(
  {
    placeholder = "Buscar...",
    initialSearch,
    value,
    defaultSelected = null,
    onChange,
    items,
    toOption,
    compare = (a, b) => a === b,
    noResultsText = "No se encontraron resultados.",
    isPopover = false, // Por defecto no es un Popover
    triggerClassName,
    contentClassName,
    buttonText = "Seleccionar...",
    ...props
  }: Readonly<SearchSelectProps<T>>
) {
  const [loading, setLoading] = useState(false);
  const [internalItems, setInternalItems] = useState<T[]>([]);
  const [searchValue, setSearchValue] = useState(initialSearch ?? "");
  const [uncontrolledSelected, setUncontrolledSelected] = useState<T | null>(defaultSelected);
  const [popOverOpen, setPopOverOpen] = useState(false);

  const isControlled = value !== undefined;
  const selected = isControlled ? value : uncontrolledSelected;

  const itemsRef = useRef(items);

  useEffect(() => {
    resolveItems(itemsRef.current, setLoading, setInternalItems);
  }, [itemsRef]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const handleSelect = (item: T | null) => {
    if (!isControlled) {
      setUncontrolledSelected(item);
    }
    if (isPopover) {
      setPopOverOpen(false);
    }
    onChange(item);
  };

  const renderList = (
    <CommandList>
      <CommandEmpty>{noResultsText}</CommandEmpty>
      <CommandGroup>
        <CommandItem onSelect={() => handleSelect(null)}>
          <Check className={cn("mr-2 h-4 w-4", !selected ? "opacity-100" : "opacity-0")}/>
          Ninguno
        </CommandItem>
        {loading && <CommandItem>Loading...</CommandItem>}
        {!loading && internalItems.length > 0 &&
          internalItems.map((item) => {
            const {value, label} = toOption(item);
            const isSelected = selected && compare(item, selected);

            return (
              <CommandItem key={value} onSelect={() => handleSelect(item)}>
                <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")}/>
                {label}
              </CommandItem>
            );
          })}
      </CommandGroup>
    </CommandList>
  );

  const command = (
    <Command {...props}>
      <CommandInput
        placeholder={placeholder}
        className="h-9"
        value={searchValue}
        onInput={(e) => setSearchValue(e.currentTarget.value)}
      />
      {renderList}
    </Command>
  );

  return isPopover ? (
    <Popover open={popOverOpen} onOpenChange={setPopOverOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-controls="popover-select-listbox"
          aria-expanded={true}
          className={cn("w-full justify-between", triggerClassName)}
        >
          {selected ? toOption(selected).label : buttonText}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("p-0", contentClassName)}>
        {command}
      </PopoverContent>
    </Popover>
  ) : (
    command
  );
}

function resolveItems<T>(items: ItemsType<T>, setLoading: Dispatch<SetStateAction<boolean>>, setItems: Dispatch<SetStateAction<T[]>>): void {
  if (typeof items === "function" || items instanceof Promise) {
    setLoading(true);
    const promise = typeof items === "function" ? items() : items;
    promise.then(setItems).finally(() => setLoading(false));
    return;
  }
  setItems(items);
}
