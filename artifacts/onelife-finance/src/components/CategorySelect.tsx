import React, { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import {
  useListCategories,
  useCreateCategory,
  getListCategoriesQueryKey,
  TransactionType,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { invalidateFinanceCategoryData } from "@/lib/finance-query-invalidation";

const DEFAULT_COLOR = "#6366f1";

export type CategorySelectValue = number | null | "all";

export interface CategorySelectProps {
  /** Filter categories by type. Use "all" to show every category. */
  type?: TransactionType | "all";
  value: CategorySelectValue;
  onChange: (value: CategorySelectValue) => void;
  /** Allow creating a new category from the search input */
  allowCreate?: boolean;
  /** Show "Uncategorized" option (sets value to null) */
  allowUncategorized?: boolean;
  /** Show "All Categories" option (sets value to "all") — for list filters */
  allowAll?: boolean;
  /** Hide categories with these IDs (e.g. already budgeted) */
  excludeIds?: number[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function CategorySelect({
  type = "expense",
  value,
  onChange,
  allowCreate = false,
  allowUncategorized = false,
  allowAll = false,
  excludeIds = [],
  disabled = false,
  placeholder = "Select category...",
  className,
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const listParams = type === "all" ? undefined : { type };
  const { data: categories, isLoading } = useListCategories(listParams);

  const createMutation = useCreateCategory({
    mutation: {
      onSuccess: (newCategory) => {
        toast({ title: `Category "${newCategory.name}" created` });
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey(listParams) });
        invalidateFinanceCategoryData(queryClient);
        onChange(newCategory.id);
        setOpen(false);
        setSearch("");
      },
      onError: () => {
        toast({ title: "Failed to create category", variant: "destructive" });
      },
    },
  });

  const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds]);

  const filteredCategories = useMemo(() => {
    return (categories ?? []).filter((c) => !excludeSet.has(c.id));
  }, [categories, excludeSet]);

  const selectedCategory = useMemo(() => {
    if (value === "all" || value === null) return null;
    return categories?.find((c) => c.id === value) ?? null;
  }, [categories, value]);

  const trimmedSearch = search.trim();
  const canCreate =
    allowCreate &&
    type !== "all" &&
    trimmedSearch.length >= 2 &&
    !createMutation.isPending &&
    !filteredCategories.some(
      (c) => c.name.toLowerCase() === trimmedSearch.toLowerCase()
    );

  const handleCreate = () => {
    if (!canCreate) return;
    createMutation.mutate({
      data: { name: trimmedSearch, type, color: DEFAULT_COLOR },
    });
  };

  const displayLabel = () => {
    if (value === "all") return "All Categories";
    if (value === null) return "Uncategorized";
    if (selectedCategory) {
      return (
        <span className="flex items-center gap-2 truncate">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: selectedCategory.color }}
          />
          {selectedCategory.name}
        </span>
      );
    }
    return placeholder;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !selectedCategory && value !== "all" && value !== null && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{displayLabel()}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={true}>
          <CommandInput
            placeholder="Search categories..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading categories...
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {canCreate ? (
                    <button
                      type="button"
                      className="flex w-full items-center justify-center gap-2 px-2 py-3 text-sm text-primary hover:underline"
                      onClick={handleCreate}
                    >
                      {createMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Create &quot;{trimmedSearch}&quot;
                    </button>
                  ) : (
                    "No categories found."
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {allowAll && (
                    <CommandItem
                      value="all categories"
                      onSelect={() => {
                        onChange("all");
                        setOpen(false);
                        setSearch("");
                      }}
                    >
                      <Check
                        className={cn("mr-2 h-4 w-4", value === "all" ? "opacity-100" : "opacity-0")}
                      />
                      All Categories
                    </CommandItem>
                  )}
                  {allowUncategorized && (
                    <CommandItem
                      value="uncategorized"
                      onSelect={() => {
                        onChange(null);
                        setOpen(false);
                        setSearch("");
                      }}
                    >
                      <Check
                        className={cn("mr-2 h-4 w-4", value === null ? "opacity-100" : "opacity-0")}
                      />
                      Uncategorized
                    </CommandItem>
                  )}
                  {filteredCategories.map((category) => (
                    <CommandItem
                      key={category.id}
                      value={category.name}
                      onSelect={() => {
                        onChange(category.id);
                        setOpen(false);
                        setSearch("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === category.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span
                        className="mr-2 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </CommandItem>
                  ))}
                  {canCreate && filteredCategories.length > 0 && (
                    <CommandItem
                      value={`create ${trimmedSearch}`}
                      onSelect={handleCreate}
                      className="text-primary"
                    >
                      {createMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Create &quot;{trimmedSearch}&quot;
                    </CommandItem>
                  )}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
