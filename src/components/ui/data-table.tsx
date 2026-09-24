"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import Button from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import Tabs, { type TabOption } from "@/components/ui/tabs";
import { collapseVariants, rowItem, transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type Column<Row> = {
  /** Unique per table; also the sort key. */
  key: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  /** Return a value here to make the column sortable. */
  sortValue?: (row: Row) => string | number;
  align?: "left" | "center" | "right";
  hideBelow?: "sm" | "md" | "lg" | "xl";
  className?: string;
  headerClassName?: string;
};

type SortState = { key: string; direction: "asc" | "desc" } | null;

type DataTableProps<Row> = {
  rows: Row[];
  columns: Column<Row>[];
  rowKey: (row: Row) => string;
  searchText?: (row: Row) => string;
  searchPlaceholder?: string;
  /** Filter chips above the table. */
  tabs?: TabOption[];
  tabValue?: string;
  onTabChange?: (value: string) => void;
  /** Extra controls revealed by the Filter button. */
  filterPanel?: ReactNode;
  filtersOpenByDefault?: boolean;
  toolbar?: ReactNode;
  /** Told whenever the search text changes, e.g. to build an export link. */
  onSearchChange?: (search: string) => void;
  initialSort?: SortState;
  /** Initial rows per page. */
  pageSize?: number;
  /** What the rows are, for empty states: "No items yet". */
  noun?: string;
  empty?: ReactNode;
  emptyFiltered?: ReactNode;
  className?: string;
};

const hideClasses = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
} as const;

const alignClasses = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

/** Shared list table. Search, sort and paging run on the client, since lists are small. */
export default function DataTable<Row>({
  rows,
  columns,
  rowKey,
  searchText,
  searchPlaceholder = "Search...",
  tabs,
  tabValue,
  onTabChange,
  filterPanel,
  filtersOpenByDefault = false,
  toolbar,
  onSearchChange,
  initialSort = null,
  pageSize = 10,
  noun = "rows",
  empty,
  emptyFiltered,
  className,
}: DataTableProps<Row>) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>(initialSort);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const [showFilters, setShowFilters] = useState(filtersOpenByDefault);

  const query = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!query || !searchText) {
      return rows;
    }

    return rows.filter((row) => searchText(row).toLowerCase().includes(query));
  }, [rows, query, searchText]);

  const sorted = useMemo(() => {
    if (!sort) {
      return filtered;
    }

    const column = columns.find((item) => item.key === sort.key);
    const sortValue = column?.sortValue;

    if (!sortValue) {
      return filtered;
    }

    const factor = sort.direction === "asc" ? 1 : -1;

    return [...filtered].sort((a, b) => {
      const left = sortValue(a);
      const right = sortValue(b);

      if (typeof left === "number" && typeof right === "number") {
        return (left - right) * factor;
      }

      return (
        String(left).localeCompare(String(right), undefined, {
          numeric: true,
          sensitivity: "base",
        }) * factor
      );
    });
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * rowsPerPage;
  const visible = sorted.slice(start, start + rowsPerPage);

  // Back to page 1 when the view changes. Done during render to avoid a stale frame.
  const viewKey = `${query}|${tabValue ?? ""}|${rowsPerPage}`;
  const [lastViewKey, setLastViewKey] = useState(viewKey);

  if (viewKey !== lastViewKey) {
    setLastViewKey(viewKey);
    setPage(1);
  }

  function toggleSort(column: Column<Row>) {
    if (!column.sortValue) {
      return;
    }

    setSort((current) => {
      if (current?.key !== column.key) {
        return { key: column.key, direction: "asc" };
      }

      if (current.direction === "asc") {
        return { key: column.key, direction: "desc" };
      }

      return null;
    });
  }

  const isFiltered = Boolean(query) || Boolean(tabValue && tabValue !== "all");
  const hasToolbar = Boolean(searchText || tabs || toolbar || filterPanel);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-surface shadow-card",
        className,
      )}
    >
      {hasToolbar && (
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          {tabs && tabValue && onTabChange ? (
            <Tabs
              options={tabs}
              value={tabValue}
              onChange={onTabChange}
              layoutId={`table-tabs-${noun}`}
            />
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {searchText && (
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />

                <Input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    onSearchChange?.(event.target.value);
                  }}
                  placeholder={searchPlaceholder}
                  className="h-9 pl-9"
                  aria-label={searchPlaceholder}
                />
              </div>
            )}

            {filterPanel && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<SlidersHorizontal className="h-4 w-4" />}
                onClick={() => setShowFilters((value) => !value)}
              >
                Filter
              </Button>
            )}

            {toolbar}
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {filterPanel && showFilters && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={collapseVariants}
            className="overflow-hidden border-b border-border bg-surface-subtle"
          >
            <div className="px-4 py-3">{filterPanel}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {sorted.length === 0 ? (
        (isFiltered ? emptyFiltered : empty) ?? (
          <EmptyState
            icon={Search}
            title={isFiltered ? "Nothing matches" : `No ${noun} yet`}
            description={
              isFiltered
                ? "Try a different search or clear the filters."
                : undefined
            }
          />
        )
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-subtle">
                  {columns.map((column) => {
                    const isSorted = sort?.key === column.key;
                    const direction = sort?.direction;

                    return (
                      <th
                        key={column.key}
                        scope="col"
                        aria-sort={
                          isSorted
                            ? direction === "asc"
                              ? "ascending"
                              : "descending"
                            : undefined
                        }
                        className={cn(
                          "px-4 py-3 text-xs font-semibold tracking-wide text-secondary uppercase",
                          alignClasses[column.align ?? "left"],
                          column.hideBelow && hideClasses[column.hideBelow],
                          column.headerClassName,
                        )}
                      >
                        {column.sortValue ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(column)}
                            className={cn(
                              "inline-flex cursor-pointer items-center gap-1.5 transition-colors hover:text-primary",
                              isSorted && "text-accent",
                              column.align === "right" && "flex-row-reverse",
                            )}
                          >
                            {column.header}

                            {isSorted ? (
                              direction === "asc" ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )
                            ) : (
                              <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                            )}
                          </button>
                        ) : (
                          column.header
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                <AnimatePresence initial={false} mode="popLayout">
                  {visible.map((row, index) => (
                    <motion.tr
                      key={rowKey(row)}
                      layout
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={rowItem}
                      transition={{
                        ...transitions.base,
                        delay: Math.min(index * 0.025, 0.2),
                      }}
                      className="border-b border-border transition-colors last:border-0 hover:bg-surface-subtle"
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={cn(
                            "px-4 py-3 align-middle text-secondary",
                            alignClasses[column.align ?? "left"],
                            column.hideBelow && hideClasses[column.hideBelow],
                            column.className,
                          )}
                        >
                          {column.cell(row)}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
            <label className="flex items-center gap-3 text-sm text-muted">
              Rows per page
              {/* A plain select: the shared Select is sized for forms. */}
              <span className="relative">
                <select
                  value={rowsPerPage}
                  onChange={(event) => setRowsPerPage(Number(event.target.value))}
                  aria-label="Rows per page"
                  className="h-8 cursor-pointer appearance-none rounded-lg border border-border bg-surface py-0 pr-7 pl-2.5 text-sm font-medium text-primary shadow-card transition-colors hover:border-border-strong focus:border-accent focus:ring-4 focus:ring-accent/10 focus:outline-none"
                >
                  {[...new Set([...ROWS_PER_PAGE, pageSize])]
                    .sort((a, b) => a - b)
                    .map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                </select>

                <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              </span>
            </label>

            <Pagination
              page={currentPage}
              pageCount={pageCount}
              onChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}

const ROWS_PER_PAGE = [10, 25, 50, 100];

/**
 * The page list: first, last, and the pages next to the current one, with
 * "..." for the gaps. For example "1 2 ... 6", or "1 ... 4 5 6 ... 10".
 */
function pageList(page: number, pageCount: number) {
  const pages: (number | "gap")[] = [];

  for (let index = 1; index <= pageCount; index++) {
    const isEdge = index === 1 || index === pageCount;
    const isNear = Math.abs(index - page) <= 1;

    if (isEdge || isNear) {
      pages.push(index);
    } else if (pages[pages.length - 1] !== "gap") {
      pages.push("gap");
    }
  }

  return pages;
}

const stepButton =
  "inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium text-secondary transition-colors hover:border-border-strong hover:bg-surface-subtle hover:text-primary disabled:pointer-events-none disabled:opacity-40";

function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  // One indicator per table, so two tables on a page never animate together.
  const indicatorId = useId();

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className={stepButton}
      >
        <ChevronLeft className="h-4 w-4" />
        Prev
      </button>

      <div className="flex items-center gap-1">
        {pageList(page, pageCount).map((value, index) =>
          value === "gap" ? (
            <span
              key={`gap-${index}`}
              className="flex h-8 w-6 items-end justify-center pb-1.5 text-sm text-muted"
              aria-hidden
            >
              ...
            </span>
          ) : (
            <button
              key={value}
              type="button"
              aria-label={`Page ${value}`}
              aria-current={value === page ? "page" : undefined}
              onClick={() => onChange(value)}
              className={cn(
                "relative inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors",
                value === page
                  ? "text-accent-contrast"
                  : "text-secondary hover:bg-surface-subtle hover:text-primary",
              )}
            >
              {value === page && (
                <motion.span
                  layoutId={`pagination-${indicatorId}`}
                  transition={transitions.indicator}
                  className="absolute inset-0 rounded-lg bg-accent shadow-card"
                />
              )}

              <span className="relative">{value}</span>
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        disabled={page === pageCount}
        onClick={() => onChange(page + 1)}
        className={stepButton}
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
