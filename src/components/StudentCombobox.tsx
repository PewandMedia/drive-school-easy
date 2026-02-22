import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatStudentName } from "@/lib/formatStudentName";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type StudentOption = {
  id: string;
  vorname: string;
  nachname: string;
  geburtsdatum: string | null;
};

interface StudentComboboxProps {
  students: StudentOption[];
  value: string;
  onValueChange: (id: string) => void;
  placeholder?: string;
  allowAll?: boolean;
}

const StudentCombobox = ({
  students,
  value,
  onValueChange,
  placeholder = "Schüler auswählen…",
  allowAll = false,
}: StudentComboboxProps) => {
  const [open, setOpen] = useState(false);

  const selectedLabel =
    value === "all" && allowAll
      ? "Alle Schüler"
      : students.find((s) => s.id === value)
        ? formatStudentName(
            students.find((s) => s.id === value)!.nachname,
            students.find((s) => s.id === value)!.vorname,
            students.find((s) => s.id === value)!.geburtsdatum
          )
        : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {selectedLabel ?? placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0 pointer-events-auto bg-popover z-50"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandInput placeholder="Suche tippen…" />
          <CommandList>
            <CommandEmpty>Kein Schüler gefunden</CommandEmpty>
            <CommandGroup>
              {allowAll && (
                <CommandItem
                  value="__all__"
                  onSelect={() => {
                    onValueChange("all");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === "all" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  Alle Schüler
                </CommandItem>
              )}
              {students.map((s) => {
                const label = formatStudentName(s.nachname, s.vorname, s.geburtsdatum);
                return (
                  <CommandItem
                    key={s.id}
                    value={label}
                    onSelect={() => {
                      onValueChange(s.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === s.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default StudentCombobox;
