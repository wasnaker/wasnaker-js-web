import { useState } from "react";
import type { Meta } from "@storybook/nextjs";
import {
  DataTable,
  SplitView,
  TabsWorkspace,
  createDataTableQuery,
  type ColumnDef,
  type DataTableLabels,
} from "@wasnaker/core-web";

type RegionRow = { id: string; name: string; code: string; regencies: number };
const regions: RegionRow[] = [
  { id: "11", name: "Aceh", code: "ID-AC", regencies: 23 },
  { id: "12", name: "Sumatera Utara", code: "ID-SU", regencies: 33 },
  { id: "13", name: "Sumatera Barat", code: "ID-SB", regencies: 19 },
  { id: "14", name: "Riau", code: "ID-RI", regencies: 12 },
  { id: "15", name: "Jambi", code: "ID-JA", regencies: 11 },
  { id: "16", name: "Sumatera Selatan", code: "ID-SS", regencies: 17 },
];
const columns: ColumnDef<RegionRow>[] = [
  { accessorKey: "name", header: "Province", minSize: 180 },
  { accessorKey: "code", header: "ISO code", minSize: 100 },
  { accessorKey: "regencies", header: "Regencies", minSize: 90 },
];
const labels: DataTableLabels = {
  name: "Provinces",
  search: "Search provinces",
  columns: "Columns",
  loading: "Loading provinces",
  empty: "No provinces",
  error: "Provinces could not be loaded",
  retry: "Retry",
  actions: "Actions",
  openRow: "Open province",
  firstPage: "First page",
  previousPage: "Previous page",
  nextPage: "Next page",
  lastPage: "Last page",
  pageSize: "Rows",
  page: (page, pages, total) => `${page} / ${pages} (${total})`,
};
const meta: Meta = {
  title: "Core/Module Workspace",
  parameters: { layout: "fullscreen" },
};
export default meta;

export function ClientTable() {
  const [query, setQuery] = useState(() => createDataTableQuery(3));
  return (
    <DataTable
      mode="client"
      data={regions}
      columns={columns}
      getRowId={(row) => row.id}
      query={query}
      onQueryChange={setQuery}
      labels={labels}
      pageSizes={[3, 6]}
    />
  );
}

export function ServerTable() {
  const [query, setQuery] = useState(() => createDataTableQuery(3));
  return (
    <DataTable
      mode="server"
      data={regions.slice(0, 3)}
      rowCount={30}
      columns={columns}
      getRowId={(row) => row.id}
      query={query}
      onQueryChange={setQuery}
      labels={labels}
      pageSizes={[3, 6]}
    />
  );
}

export function Loading() {
  const [query, setQuery] = useState(() => createDataTableQuery());
  return (
    <DataTable
      mode="client"
      data={[]}
      columns={columns}
      getRowId={(row) => row.id}
      query={query}
      onQueryChange={setQuery}
      labels={labels}
      loading
    />
  );
}

export function Empty() {
  const [query, setQuery] = useState(() => createDataTableQuery());
  return (
    <DataTable
      mode="client"
      data={[]}
      columns={columns}
      getRowId={(row) => row.id}
      query={query}
      onQueryChange={setQuery}
      labels={labels}
    />
  );
}

export function Retry() {
  const [query, setQuery] = useState(() => createDataTableQuery());
  const [error, setError] = useState(true);
  return (
    <DataTable
      mode="client"
      data={error ? [] : regions}
      columns={columns}
      getRowId={(row) => row.id}
      query={query}
      onQueryChange={setQuery}
      labels={labels}
      error={error}
      onRetry={() => setError(false)}
    />
  );
}

export function ListDetail() {
  const [query, setQuery] = useState(() => createDataTableQuery(3));
  const [selected, setSelected] = useState<RegionRow | null>(null);
  const [tab, setTab] = useState("overview");
  const [actionCount, setActionCount] = useState(0);
  return (
    <main className="module-preview mx-auto w-full max-w-6xl p-4">
      <h1 className="module-preview__title mb-5 text-2xl font-semibold">
        Regions
      </h1>
      <SplitView
        list={
          <DataTable
            mode="client"
            data={regions}
            columns={columns}
            getRowId={(row) => row.id}
            getRowLabel={(row) => row.name}
            query={query}
            onQueryChange={setQuery}
            labels={labels}
            pageSizes={[3, 6]}
            selectedId={selected?.id}
            onRowActivate={setSelected}
            renderRowActions={(row) => (
              <button
                type="button"
                onClick={() => setActionCount((count) => count + 1)}
                aria-label={`Count ${row.name}`}
                className="inline-flex size-8 items-center justify-center rounded-md border text-sm tabular-nums"
              >
                {actionCount}
              </button>
            )}
          />
        }
        detailOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        detailTitle={selected?.name}
        labels={{
          list: "Province list",
          detail: "Province detail",
          close: "Back to provinces",
        }}
        detail={
          <TabsWorkspace
            orientation="horizontal"
            tabs={[
              { key: "overview", label: "Overview" },
              { key: "regencies", label: "Regencies" },
            ]}
            value={tab}
            onValueChange={setTab}
            navigationLabel="Province sections"
            renderPanel={(current) =>
              current.key === "overview" ? (
                <dl className="grid grid-cols-2 gap-3 pt-4 text-sm">
                  <dt>ISO code</dt>
                  <dd>{selected?.code}</dd>
                  <dt>Regencies</dt>
                  <dd>{selected?.regencies}</dd>
                </dl>
              ) : (
                <p className="py-4 text-sm text-muted-foreground">
                  No regencies
                </p>
              )
            }
          />
        }
      />
    </main>
  );
}
