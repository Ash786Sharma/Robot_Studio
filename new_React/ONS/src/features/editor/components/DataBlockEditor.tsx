import { useMemo, useState } from "react"
import * as LucideIcons from "lucide-react"
import { flexRender } from "@tanstack/react-table"
import { useLegacyTable, type LegacyColumnDef } from "@tanstack/react-table/legacy"
import { Input } from "@/components/ui/input"
import { IdeBarItem } from "@/features/ide-shell/components/IdeBarItem"

interface DataBlockField {
  id: number
  name: string
  dataType: string
  address: string
  defaultValue: string
  retain: boolean
}

const initialFields: DataBlockField[] = [
  { id: 1, name: "Enable", dataType: "Bool", address: "DBX0.0", defaultValue: "FALSE", retain: true },
  { id: 2, name: "TargetPosition", dataType: "Real", address: "DBD2", defaultValue: "0.0", retain: true },
  { id: 3, name: "Speed", dataType: "Int", address: "DBW6", defaultValue: "120", retain: false },
  { id: 4, name: "Mode", dataType: "USInt", address: "DBB8", defaultValue: "1", retain: false },
]

const dataTypeSuggestions = [
  "Bool",
  "Byte",
  "Word",
  "DWord",
  "SInt",
  "USInt",
  "Int",
  "UInt",
  "DInt",
  "UDInt",
  "Real",
  "LReal",
  "Time",
  "Date",
  "String",
  "Struct",
  "Array",
]

interface DataBlockEditorProps {
  fileName?: string
  showChanges?: boolean
  onShowChangesChange?: (show: boolean) => void
}

export const DataBlockEditor = ({ fileName, showChanges, onShowChangesChange }: DataBlockEditorProps) => {
  const [fields, setFields] = useState(initialFields)
  const [snapshot, setSnapshot] = useState<DataBlockField[] | null>(null)
  const [localShowChanges, setLocalShowChanges] = useState(false)
  const [watchMode, setWatchMode] = useState(false)
  const isShowingChanges = showChanges ?? localShowChanges

  const setChangesVisible = (nextShowChanges: boolean) => {
    onShowChangesChange?.(nextShowChanges)
    if (!onShowChangesChange) setLocalShowChanges(nextShowChanges)
  }

  const updateField = (id: number, key: keyof DataBlockField, value: string | boolean) => {
    setFields((currentFields) => currentFields.map((field) => field.id === id ? { ...field, [key]: value } : field))
  }

  const isChanged = (field: DataBlockField) => {
    const snapshotField = snapshot?.find((snapshotItem) => snapshotItem.id === field.id)
    return Boolean(snapshotField && JSON.stringify(snapshotField) !== JSON.stringify(field))
  }

  const columns = useMemo<LegacyColumnDef<DataBlockField>[]>(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <Input value={row.original.name} onChange={(event) => updateField(row.original.id, "name", event.target.value)} className="h-6 border-transparent bg-transparent px-1 text-[11px] focus-visible:border-[var(--primary)]" />,
    },
    {
      accessorKey: "dataType",
      header: "Data type",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <select
            value={dataTypeSuggestions.includes(row.original.dataType) ? row.original.dataType : "Custom"}
            aria-label={`Data type for ${row.original.name}`}
            onChange={(event) => updateField(row.original.id, "dataType", event.target.value)}
            className="h-6 rounded border border-transparent bg-transparent px-1 text-[11px] text-[var(--primary)] outline-none hover:border-[var(--border)] focus:border-[var(--primary)]"
          >
            {dataTypeSuggestions.map((dataType) => <option key={dataType} value={dataType}>{dataType}</option>)}
            <option value="Custom">Custom...</option>
          </select>
          {!dataTypeSuggestions.includes(row.original.dataType) && (
            <Input
              value={row.original.dataType}
              onChange={(event) => updateField(row.original.id, "dataType", event.target.value)}
              aria-label={`Custom data type for ${row.original.name}`}
              className="h-6 w-24 border-[var(--border)] bg-transparent px-1 text-[11px]"
            />
          )}
        </div>
      ),
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => <span className="font-mono text-[var(--ide-text-inactive)]">{row.original.address}</span>,
    },
    {
      accessorKey: "defaultValue",
      header: "Start value",
      cell: ({ row }) => <Input value={row.original.defaultValue} onChange={(event) => updateField(row.original.id, "defaultValue", event.target.value)} className="h-6 border-transparent bg-transparent px-1 font-mono text-[11px] focus-visible:border-[var(--primary)]" />,
    },
    {
      accessorKey: "retain",
      header: "Retain",
      cell: ({ row }) => <input type="checkbox" checked={row.original.retain} onChange={(event) => updateField(row.original.id, "retain", event.target.checked)} aria-label={`Retain ${row.original.name}`} className="accent-[var(--primary)]" />,
    },
  ], [])

  const table = useLegacyTable({
    data: fields,
    columns,
  })

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--ide-surface-bg)] text-[var(--foreground)]">
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--ide-panel-bg)] px-3 py-2">
        <div>
          <p className="text-xs font-semibold">Data Block</p>
          <p className="text-[10px] text-[var(--ide-text-inactive)]">{fileName ?? "DB"} · Optimized block access</p>
        </div>
        <div className="flex items-center gap-1 text-[var(--ide-text-inactive)]">
          <IdeBarItem tooltip="Watch data block" icon={<LucideIcons.Eye className="h-3.5 w-3.5" />} side="bottom" isActive={watchMode} className="h-6 w-6 px-0" onClick={() => setWatchMode((value) => !value)} />
          <IdeBarItem tooltip="Take snapshot" icon={<LucideIcons.Camera className="h-3.5 w-3.5" />} side="bottom" className="h-6 w-6 px-0" onClick={() => { setSnapshot(fields.map((field) => ({ ...field }))); setChangesVisible(false) }} />
          <IdeBarItem tooltip="Restore snapshot" icon={<LucideIcons.History className="h-3.5 w-3.5" />} side="bottom" disabled={!snapshot} className="h-6 w-6 px-0" onClick={() => snapshot && setFields(snapshot.map((field) => ({ ...field })))} />
          <IdeBarItem tooltip="Add field" icon={<LucideIcons.Plus className="h-3.5 w-3.5" />} side="bottom" className="h-6 w-6 px-0" onClick={() => setFields((currentFields) => [...currentFields, { id: Date.now(), name: "NewField", dataType: "Bool", address: `DBX${currentFields.length}.0`, defaultValue: "FALSE", retain: false }])} />
          <IdeBarItem tooltip="Compile data block" icon={<LucideIcons.Check className="h-3.5 w-3.5" />} side="bottom" className="h-6 w-6 px-0" />
        </div>
      </div>
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2 text-[10px] text-[var(--ide-text-inactive)]">
        <span className="rounded bg-[var(--ide-item-active)] px-2 py-1 text-[var(--foreground)]">Static</span>
        <span>Start value</span>
        <span>Retain</span>
        <span className="ml-auto">{fields.length} variables</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-[11px]">
          <thead className="sticky top-0 z-10 bg-[var(--ide-panel-bg)] text-[10px] uppercase tracking-wide text-[var(--ide-text-inactive)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => <th key={header.id} className="border-b border-[var(--border)] px-3 py-2 font-medium">{flexRender(header.column.columnDef.header, header.getContext())}</th>)}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => <tr key={row.id} className={`group hover:bg-[var(--ide-item-hover)] ${isShowingChanges && isChanged(row.original) ? "bg-amber-500/10" : ""}`}>{row.getVisibleCells().map((cell) => <td key={cell.id} className="border-b border-[var(--border)]/60 px-3 py-1.5">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}