"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Search, Percent, X, Check } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { Input } from "~/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
    } from "~/components/ui/table"
import { useState, useMemo } from "react";
import { api } from "~/trpc/react";

// Table columns for cutoffs API
import type { RouterOutputs } from "~/trpc/react";
type Cutoff = RouterOutputs["cutoff"]["getCutoffsByQuery"]["results"][number];

const cutoffColumns: ColumnDef<Cutoff>[] = [
  {
    accessorKey: "collegeName",
    header: () => <span className="max-w-[300px] inline-block">College Name</span>,
    cell: ({ row }) => (
      <span className="max-w-[300px] truncate inline-block align-middle" title={row.original.collegeName}>
        {row.original.collegeName}
      </span>
    ),
  },
  { accessorKey: "courseName", header: "Course Name" },
  { accessorKey: "category", header: "Category" },
  { accessorKey: "requiredPercent", header: "Required %" },
  { accessorKey: "yourPercent", header: "Your %" },
  {
    accessorKey: "eligible",
    header: "Eligible",
    cell: ({ row }) => (
      <span className={row.original.eligible ? "font-bold" : "text-muted-foreground"}>
        {row.original.eligible ? "Yes" : "No"}
      </span>
    ),
  },
  { accessorKey: "capRound", header: "CAP Round" },
  { accessorKey: "stage", header: "Stage" },
];

export function DataTableDemo() {
  // Filter state
  const [query, setQuery] = useState("");
  // Change course state to array
  const [courses, setCourses] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [percent, setPercent] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch data from API
  const { data, isLoading } = api.cutoff.getCutoffsByQuery.useQuery({
    query: query || undefined,
    courses: courses.length > 0 ? courses : undefined,
    category: category || undefined,
    percent: percent ? Number(percent) : undefined,
    page,
    pageSize,
  });

  // PDF download mutation
  const pdfMutation = api.generatePdf.generateCutoffPdf.useMutation();

  const handleDownloadPdf = async () => {
    if (!data?.results?.length) return;
  
    try {
      const base64Pdf = await pdfMutation.mutateAsync({ results: data.results });
      const byteCharacters = atob(base64Pdf); // decode base64
      const byteNumbers = new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i));
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
  
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cutoff-results.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate PDF');
    }
  };
  
  // Fetch all courses for dropdown
  const { data: allCourses } = api.cutoff.getAllCourses.useQuery();
  // Extract unique courses and categories from results for dropdowns
  const courseOptions = useMemo(() => allCourses || [], [allCourses]);
  const categoryOptions = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    data.results.forEach((r) => set.add(r.category));
    return Array.from(set);
  }, [data]);

  // Table setup
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const table = useReactTable({
    data: data?.results ?? [],
    columns: cutoffColumns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnVisibility, rowSelection },
    manualPagination: true,
    pageCount: data?.pagination.totalPages ?? 1,
  });

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-base">Filters</span>
        <Button onClick={handleDownloadPdf} disabled={pdfMutation.status === 'pending' || !data?.results?.length}>
          {pdfMutation.status === 'pending' ? "Generating PDF..." : "Download PDF"}
        </Button>
      </div>
      <div className="flex flex-wrap md:flex-nowrap gap-2 items-end py-4 w-full">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search college name/code/location..."
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            className="pl-8 pr-2 h-10"
          />
        </div>
        <div className="flex-1 min-w-[150px] max-w-xs">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full h-10 justify-between">
                {courses.length > 0 ? courses.join(", ") : "Select Course(s)"}
                <ChevronDown className="ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full min-w-[180px]">
              <DropdownMenuCheckboxItem
                checked={courses.length === 0}
                onCheckedChange={() => { setCourses([]); setPage(1); }}
              >
                {courses.length === 0 && <Check className="mr-2 w-4 h-4" />}All Courses
              </DropdownMenuCheckboxItem>
              {courseOptions.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c}
                  checked={courses.includes(c)}
                  onCheckedChange={(checked) => {
                    setCourses((prev) => {
                      if (checked) return [...prev, c];
                      return prev.filter((item) => item !== c);
                    });
                    setPage(1);
                  }}
                >
                  {courses.includes(c) && <Check className="mr-2 w-4 h-4" />}{c}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="relative flex-1 min-w-[100px] max-w-[180px]">
          <Percent className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Enter Percentage"
            type="number"
            value={percent}
            onChange={e => { setPercent(e.target.value); setPage(1); }}
            className="pl-8 pr-2 h-10"
          />
        </div>
        <div className="flex-1 min-w-[150px] max-w-xs">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full h-10 justify-between">
                {category ? category : "Select Category"}
                <ChevronDown className="ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full min-w-[180px]">
              <DropdownMenuItem onClick={() => { setCategory(""); setPage(1); }}>
                {category === "" && <Check className="mr-2 w-4 h-4" />}All Categories
              </DropdownMenuItem>
              {categoryOptions.map((cat) => (
                <DropdownMenuItem key={cat} onClick={() => { setCategory(cat); setPage(1); }}>
                  {category === cat && <Check className="mr-2 w-4 h-4" />}{cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button
          variant="ghost"
          className="h-10 px-3 text-muted-foreground border border-input"
          onClick={() => { setQuery(""); setCourses([]); setCategory(""); setPercent(""); setPage(1); }}
        >
          <X className="w-4 h-4 mr-1" /> Clear Filters
        </Button>
      </div>
      <div className="rounded-xl border min-h-[450px] shadow-sm overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      [
                        "font-semibold text-sm bg-muted/60 border-b sticky top-0 z-10",
                        header.column.id === "requiredPercent" || header.column.id === "yourPercent" || header.column.id === "capRound" || header.column.id === "stage" ? "text-right" : "text-left",
                        "px-4 py-2"
                      ].join(" ")
                    }
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={cutoffColumns.length} className="h-24 text-center">Loading...</TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, idx) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={[
                    idx % 2 === 0 ? "bg-background" : "bg-muted/40",
                    "hover:bg-primary/10 transition-colors group"
                  ].join(" ")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={[
                        cell.column.id === "requiredPercent" || cell.column.id === "yourPercent" || cell.column.id === "capRound" || cell.column.id === "stage" ? "text-right" : "text-left",
                        "px-4 py-2 align-middle"
                      ].join(" ")}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={cutoffColumns.length} className="h-36 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <svg width="48" height="48" fill="none" viewBox="0 0 24 24" className="mx-auto mb-2 opacity-60"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 9h10M7 13h5m-8 6V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/></svg>
                  <span>No results found.</span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between py-4">
        <div className="text-muted-foreground text-sm">
          Page {data?.pagination.page ?? 1} of {data?.pagination.totalPages ?? 1}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => (data?.pagination.hasNextPage ? p + 1 : p))}
            disabled={!data?.pagination.hasNextPage || isLoading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
