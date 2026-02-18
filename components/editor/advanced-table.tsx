"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createReactBlockSpec } from "@blocknote/react";
import {
    BlockNoteSchema,
    defaultBlockSpecs,
    defaultInlineContentSpecs,
    defaultStyleSpecs,
} from "@blocknote/core";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    horizontalListSortingStrategy,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

import {
    AlignLeft, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Calculator, CalendarDays,
    Check, CheckCircle2, GripVertical, Hash, Layers2, Link2, ListFilter,
    Pin, Plus, Smile, SquareCheck, Tags, Trash2, X, icons,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

export type ColumnType =
    | "text" | "number" | "select" | "multiSelect"
    | "date" | "checkbox" | "url" | "status";

export interface SelectOption { label: string; color: string; }

export interface ColumnDefinition {
    id: string; name: string; type: ColumnType;
    icon?: string; options?: SelectOption[]; width?: number;
}

export type CellValue = string | number | boolean | string[] | null | undefined;

export interface TableRow {
    id: string;
    cells: Record<string, CellValue>;
    pinned?: boolean;
}

export interface TableSort {
    columnId: string;
    direction: "asc" | "desc";
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

const COLOR_MAP: Record<string, { bg: string; text: string; dot: string }> = {
    rose: { bg: "bg-rose-500/15", text: "text-rose-400", dot: "bg-rose-400" },
    amber: { bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
    emerald: { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
    sky: { bg: "bg-sky-500/15", text: "text-sky-400", dot: "bg-sky-400" },
    violet: { bg: "bg-violet-500/15", text: "text-violet-400", dot: "bg-violet-400" },
    slate: { bg: "bg-slate-500/15", text: "text-slate-400", dot: "bg-slate-400" },
    teal: { bg: "bg-teal-500/15", text: "text-teal-400", dot: "bg-teal-400" },
    orange: { bg: "bg-orange-500/15", text: "text-orange-400", dot: "bg-orange-400" },
    pink: { bg: "bg-pink-500/15", text: "text-pink-400", dot: "bg-pink-400" },
};

const DEFAULT_STATUS_OPTIONS: SelectOption[] = [
    { label: "To do", color: "rose" },
    { label: "In progress", color: "sky" },
    { label: "Done", color: "emerald" },
    { label: "Blocked", color: "amber" },
];

const COLUMN_TYPE_ICONS: Record<ColumnType, React.ReactNode> = {
    text: <AlignLeft className="h-3.5 w-3.5" />,
    number: <Hash className="h-3.5 w-3.5" />,
    select: <ListFilter className="h-3.5 w-3.5" />,
    multiSelect: <Tags className="h-3.5 w-3.5" />,
    date: <CalendarDays className="h-3.5 w-3.5" />,
    checkbox: <SquareCheck className="h-3.5 w-3.5" />,
    url: <Link2 className="h-3.5 w-3.5" />,
    status: <CheckCircle2 className="h-3.5 w-3.5" />,
};

const COLUMN_TYPE_LABELS: Record<ColumnType, string> = {
    text: "Text", number: "Number", select: "Select",
    multiSelect: "Multi-select", date: "Date",
    checkbox: "Checkbox", url: "URL", status: "Status",
};

// ══════════════════════════════════════════════════════════════════════════════
// MODULE-LEVEL STORE
// ══════════════════════════════════════════════════════════════════════════════

interface BlockStore {
    editor: any;
    block: any;
    sort?: TableSort;
}

const blockStore = new Map<string, BlockStore>();

function SortableColumnHeader({ column, blockId, currentSort, onRename, onIconChange, onDelete, onInsertLeft, onInsertRight, onAddOption, onDeleteOption, onSort, onResize }: {
    column: ColumnDefinition;
    blockId: string;
    currentSort?: TableSort;
    onRename: (name: string) => void;
    onIconChange: (icon: string) => void;
    onDelete: () => void;
    onInsertLeft: () => void;
    onInsertRight: () => void;
    onAddOption: (label: string, color: string) => void;
    onDeleteOption: (label: string) => void;
    onSort: (direction: "asc" | "desc") => void;
    onResize: (width: number) => void;
}) {
    const [isHovered, setIsHovered] = useState(false);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: column.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        width: column.width ?? 160,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="relative border-r border-border shrink-0 group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}>

            <div className="flex items-center">
                {/* Drag handle - muncul saat hover */}
                <div className={cn(
                    "transition-all duration-150",
                    isHovered ? "w-8 opacity-100" : "w-0 opacity-0"
                )}>
                    {isHovered && (
                        <button
                            {...attributes}
                            {...listeners}

                            className="p-1.5 hover:bg-muted rounded cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <ColumnHeaderMenu
                        column={column}
                        blockId={blockId}
                        currentSort={currentSort}
                        onRename={onRename}
                        onIconChange={onIconChange}
                        onDelete={onDelete}
                        onInsertLeft={onInsertLeft}
                        onInsertRight={onInsertRight}
                        onAddOption={onAddOption}
                        onDeleteOption={onDeleteOption}
                        onSort={onSort}
                    />
                </div>
            </div>
            <ColumnResizer columnId={column.id} onResize={onResize} />
        </div>
    );
}



function SortableRow({ row, columns, blockId, hoveredRow, setHoveredRow, renderCell, togglePin, deleteRow }: {
    row: TableRow;
    columns: ColumnDefinition[];
    blockId: string;
    hoveredRow: string | null;
    setHoveredRow: (id: string | null) => void;
    renderCell: (col: ColumnDefinition, row: TableRow) => React.ReactNode;
    togglePin: (id: string) => void;
    deleteRow: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: row.id, disabled: row.pinned });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const isHovered = hoveredRow === row.id;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex border-b border-border last:border-0 hover:bg-muted/30 transition-colors",
                row.pinned && "bg-primary/5"
            )}
            onMouseEnter={() => setHoveredRow(row.id)}
            onMouseLeave={() => setHoveredRow(null)}>

            {columns.map((col, colIdx) => (
                <div key={col.id} className="border-r border-border shrink-0"
                    style={{ width: col.width ?? 160 }}>
                    {colIdx === 0 ? (
                        <div className="flex items-center h-full">
                            {/* Drag handle - slide in dari kiri */}
                            <div className={cn(
                                "transition-all duration-150",
                                isHovered && !row.pinned ? "w-8 opacity-100" : "w-0 opacity-0"
                            )}>
                                {isHovered && !row.pinned && (
                                    <button
                                        {...attributes}
                                        {...listeners}
                                        className="p-1.5 hover:bg-muted/50 rounded cursor-grab active:cursor-grabbing ml-1">
                                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                                    </button>
                                )}
                            </div>

                            {/* Pin button - slide in */}
                            <Button size="icon" variant="ghost"
                                className={cn(
                                    "h-7 w-7 shrink-0 transition-opacity duration-150 hover:text-pink-500",
                                    row.pinned ? "text-pink-500 opacity-100" : "text-muted-foreground/40",
                                    !isHovered && !row.pinned && "opacity-0"
                                )}
                                onClick={() => togglePin(row.id)}>
                                <Pin className={cn("h-3.5 w-3.5", row.pinned && "text-pink-500")} />
                            </Button>

                            <div className="flex-1 min-w-0">
                                {renderCell(col, row)}
                            </div>
                        </div>
                    ) : (
                        renderCell(col, row)
                    )}
                </div>
            ))}

            <div className="shrink-0 flex items-center justify-center border-border"
                style={{ width: 52 }}>
                {isHovered && (
                    <Button size="icon" variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteRow(row.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>
        </div>
    );
}


function safeParse<T>(json: string | undefined | null, fallback: T): T {
    if (!json) return fallback;
    try { return JSON.parse(json) as T; }
    catch { return fallback; }
}

function readFresh(blockId: string): { cols: ColumnDefinition[]; rows: TableRow[]; sort?: TableSort } {
    const store = blockStore.get(blockId);
    if (!store) return { cols: [], rows: [] };
    const props = store.block?.props;
    return {
        cols: safeParse<ColumnDefinition[]>(props?.columns, []),
        rows: safeParse<TableRow[]>(props?.rows, []),
        sort: store.sort,
    };
}

function persistFresh(
    blockId: string,
    newCols: ColumnDefinition[],
    newRows: TableRow[]
): void {
    const store = blockStore.get(blockId);
    if (!store) return;
    store.editor.updateBlock(store.block, {
        props: {
            columns: JSON.stringify(newCols),
            rows: JSON.stringify(newRows),
        },
    });
}

function setSort(blockId: string, sort: TableSort | undefined) {
    const store = blockStore.get(blockId);
    if (!store) return;
    store.sort = sort;
}

// ══════════════════════════════════════════════════════════════════════════════
// SORTING LOGIC
// ══════════════════════════════════════════════════════════════════════════════

function sortRows(rows: TableRow[], columns: ColumnDefinition[], sort?: TableSort): TableRow[] {
    const pinned = rows.filter(r => r.pinned);
    const unpinned = rows.filter(r => !r.pinned);

    if (!sort) return [...pinned.reverse(), ...unpinned];

    const col = columns.find(c => c.id === sort.columnId);
    if (!col) return [...pinned.reverse(), ...unpinned];

    const sorted = [...unpinned].sort((a, b) => {
        const aVal = a.cells[sort.columnId];
        const bVal = b.cells[sort.columnId];
        let comparison = 0;

        switch (col.type) {
            case "number":
                comparison = (aVal as number || 0) - (bVal as number || 0);
                break;
            case "date":
                comparison = new Date(aVal as string || 0).getTime() - new Date(bVal as string || 0).getTime();
                break;
            case "checkbox":
                comparison = (aVal ? 1 : 0) - (bVal ? 1 : 0);
                break;
            default:
                comparison = String(aVal || "").localeCompare(String(bVal || ""));
        }

        return sort.direction === "asc" ? comparison : -comparison;
    });

    return [...pinned.reverse(), ...sorted];
}



// ══════════════════════════════════════════════════════════════════════════════
// COLUMN RESIZER
// ══════════════════════════════════════════════════════════════════════════════

function ColumnResizer({ columnId, onResize }: { columnId: string; onResize: (width: number) => void }) {
    const [isDragging, setIsDragging] = useState(false);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const diff = e.clientX - startXRef.current;
            const newWidth = Math.max(80, startWidthRef.current + diff);
            onResize(newWidth);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, onResize]);

    return (
        <div
            className={cn(
                "absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors",
                isDragging && "bg-primary"
            )}
            onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
                startXRef.current = e.clientX;
                const parent = (e.target as HTMLElement).parentElement;
                startWidthRef.current = parent?.offsetWidth || 160;
            }}
        />
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// ICON PICKER
// ══════════════════════════════════════════════════════════════════════════════

function DynamicIcon({ name, className }: { name?: string; className?: string }) {
    if (!name) return null;
    const Icon = (icons as Record<string, LucideIcon>)[name];
    if (!Icon) return null;
    return <Icon className={className} />;
}

function IconPicker({ value, onChange }: { value?: string; onChange: (icon: string) => void }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const list = useMemo(
        () => Object.entries(icons)
            .filter(([n]) => n.toLowerCase().includes(search.toLowerCase()))
            .slice(0, 35),
        [search]
    );
    return (
        <Popover open={open} onOpenChange={setOpen} modal={false}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm"
                    className="h-6 w-6 shrink-0 p-0 text-muted-foreground hover:text-foreground"
                    onPointerDown={(e) => e.stopPropagation()}>
                    {value ? <DynamicIcon name={value} className="h-3.5 w-3.5" /> : <Smile className="h-3.5 w-3.5" />}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start" side="bottom"
                onOpenAutoFocus={(e) => e.preventDefault()}
                onPointerDown={(e) => e.stopPropagation()}>
                <Command shouldFilter={false}>
                    <CommandInput placeholder="Search icon…" value={search} onValueChange={setSearch} />
                    <CommandList className="max-h-56">
                        {list.length > 0 ? (
                            <CommandGroup>
                                <div className="grid grid-cols-7 gap-0.5 p-1.5">
                                    {list.map(([iconName, Icon]) => {
                                        const Ic = Icon as LucideIcon;
                                        return (
                                            <button key={iconName} title={iconName}
                                                onClick={() => { onChange(iconName); setOpen(false); setSearch(""); }}
                                                className={cn(
                                                    "relative flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors",
                                                    value === iconName && "bg-accent ring-2 ring-primary"
                                                )}>
                                                <Ic className="h-4 w-4" />
                                                {value === iconName && (
                                                    <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary">
                                                        <Check className="h-2 w-2 text-primary-foreground" />
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </CommandGroup>
                        ) : <CommandEmpty>No icon found</CommandEmpty>}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// COLOR BADGE
// ══════════════════════════════════════════════════════════════════════════════

function ColorBadge({ label, color, dot = false, className }: {
    label: string; color: string; dot?: boolean; className?: string;
}) {
    const c = COLOR_MAP[color] ?? COLOR_MAP.slate;
    return (
        <span className={cn("inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium", c.bg, c.text, className)}>
            {dot && <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", c.dot)} />}
            {label}
        </span>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// COLUMN HEADER MENU
// ══════════════════════════════════════════════════════════════════════════════

function ColumnHeaderMenu({
    column, blockId, currentSort,
    onRename, onIconChange, onDelete, onInsertLeft, onInsertRight, onAddOption, onDeleteOption, onSort,
}: {
    column: ColumnDefinition;
    blockId: string;
    currentSort?: TableSort;
    onRename: (name: string) => void;
    onIconChange: (icon: string) => void;
    onDelete: () => void;
    onInsertLeft: () => void;
    onInsertRight: () => void;
    onAddOption: (label: string, color: string) => void;
    onDeleteOption: (label: string) => void;
    onSort: (direction: "asc" | "desc") => void;
}) {
    const [open, setOpen] = useState(false);
    const [nameValue, setNameValue] = useState(column.name);
    const [newOptionLabel, setNewOptionLabel] = useState("");
    const [newOptionColor, setNewOptionColor] = useState("sky");

    useEffect(() => { setNameValue(column.name); }, [column.name]);



    const commitRename = () => {
        const t = nameValue.trim();
        if (t && t !== column.name) onRename(t);
    };

    const colIcon = column.icon
        ? <DynamicIcon name={column.icon} className="h-3.5 w-3.5" />
        : COLUMN_TYPE_ICONS[column.type];

    const isSorted = currentSort?.columnId === column.id;

    return (
        <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
            <DropdownMenuTrigger asChild>
                <button className={cn(
                    "flex h-full w-full items-center gap-1.5 px-3 py-2.5",
                    "text-xs font-medium text-muted-foreground outline-none",
                    "hover:bg-muted/50 transition-colors",
                    open && "bg-muted/50"
                )}>
                    <span className="shrink-0 text-muted-foreground/60">{colIcon}</span>
                    <span className="truncate flex-1 text-left">{column.name}</span>
                    {isSorted && (
                        <span className="shrink-0">
                            {currentSort.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-64 bg-popover border-border shadow-xl"
                align="start" sideOffset={2}
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}>

                {/* Name + icon */}
                <div className="px-2 pt-2 pb-1" onKeyDown={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5">
                        <IconPicker value={column.icon} onChange={onIconChange} />
                        <Input value={nameValue}
                            onChange={(e) => setNameValue(e.target.value)}
                            onBlur={commitRename}
                            onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === "Enter") { commitRename(); setOpen(false); }
                            }}
                            className="h-auto border-0 p-0 text-sm shadow-none focus-visible:ring-0 bg-transparent"
                            placeholder="Property name…" />
                    </div>
                </div>

                <DropdownMenuSeparator />

                {/* Options editor */}
                {(column.type === "select" || column.type === "multiSelect" || column.type === "status") && (
                    <>
                        <DropdownMenuLabel className="px-3 pb-1 pt-2 text-xs text-muted-foreground">Options</DropdownMenuLabel>
                        <div className="space-y-0.5 px-2 pb-2" onKeyDown={(e) => e.stopPropagation()}>
                            {column.options?.map((opt) => (
                                <div key={opt.label} className="group flex items-center justify-between rounded px-1 py-0.5 hover:bg-muted/50">
                                    <ColorBadge label={opt.label} color={opt.color} dot={column.type === "status"} />
                                    <Button size="icon" variant="ghost"
                                        className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                                        onClick={(e) => { e.stopPropagation(); onDeleteOption(opt.label); }}>
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                            <div className="flex items-center gap-1.5 pt-1">
                                <Select value={newOptionColor} onValueChange={setNewOptionColor}>
                                    <SelectTrigger className="h-7 w-[76px] text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(COLOR_MAP).map((c) => (
                                            <SelectItem key={c} value={c} className="text-xs capitalize">
                                                {c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input value={newOptionLabel}
                                    onChange={(e) => setNewOptionLabel(e.target.value)}
                                    onKeyDown={(e) => {
                                        e.stopPropagation();
                                        if (e.key === "Enter" && newOptionLabel.trim()) {
                                            onAddOption(newOptionLabel.trim(), newOptionColor);
                                            setNewOptionLabel("");
                                        }
                                    }}
                                    placeholder="Add option…" className="h-7 text-xs" />
                            </div>
                        </div>
                        <DropdownMenuSeparator />
                    </>
                )}

                <DropdownMenuItem className="gap-2.5 text-sm">
                    <ListFilter className="h-4 w-4 text-muted-foreground" /> Filter
                </DropdownMenuItem>

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2.5 text-sm">
                        <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l4-4 4 4M7 5v14M21 15l-4 4-4-4M17 19V5" />
                        </svg>
                        Sort
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuItem onSelect={() => { onSort("asc"); setOpen(false); }}>
                            <ArrowUp className="h-4 w-4 mr-2" /> Ascending
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => { onSort("desc"); setOpen(false); }}>
                            <ArrowDown className="h-4 w-4 mr-2" /> Descending
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem className="gap-2.5 text-sm">
                    <Layers2 className="h-4 w-4 text-muted-foreground" /> Group
                </DropdownMenuItem>

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2.5 text-sm">
                        <Calculator className="h-4 w-4 text-muted-foreground" /> Calculate
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        {["Count", "Sum", "Average", "Min", "Max"].map((fn) => (
                            <DropdownMenuItem key={fn}>{fn}</DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem className="gap-2.5 text-sm">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" /> Unwrap content
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="gap-2.5 text-sm"
                    onSelect={() => { onInsertLeft(); setOpen(false); }}>
                    <ArrowLeft className="h-4 w-4 text-muted-foreground" /> Insert left
                </DropdownMenuItem>

                <DropdownMenuItem className="gap-2.5 text-sm"
                    onSelect={() => { onInsertRight(); setOpen(false); }}>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" /> Insert right
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="gap-2.5 text-sm text-destructive focus:text-destructive"
                    onSelect={() => { onDelete(); setOpen(false); }}>
                    <Trash2 className="h-4 w-4" /> Delete property
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// CELL RENDERERS (sama seperti sebelumnya, tidak berubah)
// ══════════════════════════════════════════════════════════════════════════════

function StatusCell({ value, options, onChange }: {
    value: string; options: SelectOption[]; onChange: (v: string) => void;
}) {
    const current = options.find((o) => o.label === value);
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="flex h-full w-full items-center px-3 py-2 hover:bg-muted/30 transition-colors">
                    {current
                        ? <ColorBadge label={current.label} color={current.color} dot />
                        : <span className="text-muted-foreground/40 text-xs">—</span>}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-1.5 gap-0" align="start">
                {options.map((opt) => (
                    <button key={opt.label} onClick={() => onChange(opt.label)}
                        className={cn("flex w-full items-center rounded px-2 py-1 hover:bg-muted transition-colors", value === opt.label && "bg-muted")}>
                        <ColorBadge label={opt.label} color={opt.color} dot />
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    );
}

function SelectCell({ value, options, onChange, multi }: {
    value: string | string[]; options: SelectOption[];
    onChange: (v: string | string[]) => void; multi?: boolean;
}) {
    const selected = multi ? ((value as string[]) ?? []) : [(value as string)].filter(Boolean);
    const toggle = (label: string) => {
        if (!multi) { onChange(label); return; }
        const next = selected.includes(label)
            ? selected.filter((s) => s !== label)
            : [...selected, label];
        onChange(next);
    };
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="flex h-full w-full flex-wrap items-center gap-1 px-3 min-h-[38px] hover:bg-muted/30 transition-colors">
                    {selected.length > 0
                        ? selected.map((s) => { const opt = options.find((o) => o.label === s); return opt ? <ColorBadge key={s} label={s} color={opt.color} dot /> : null; })
                        : <span className="text-muted-foreground/40 text-xs">—</span>}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-1.5 gap-0" align="start">
                {options.map((opt) => (
                    <button key={opt.label} onClick={() => toggle(opt.label)}
                        className={cn("flex w-full items-center rounded px-2 py-1 hover:bg-muted transition-colors", selected.includes(opt.label) && "bg-muted")}>
                        <ColorBadge label={opt.label} color={opt.color} dot />
                        {selected.includes(opt.label) && <Check className="ml-auto h-3 w-3 text-foreground" />}
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    );
}

function TextCell({ rowId, colId, initialValue, onCommit, isName, placeholder }: {
    rowId: string; colId: string; initialValue: string;
    onCommit: (rowId: string, colId: string, v: string) => void;
    isName?: boolean; placeholder?: string;
}) {
    const [local, setLocal] = useState(initialValue);
    const inputRef = useRef<HTMLInputElement>(null);
    const focused = useRef(false);
    useEffect(() => { if (!focused.current) setLocal(initialValue); }, [initialValue]);
    return (
        <div className={cn("flex h-full items-center px-3", isName ? "gap-2.5" : "gap-2")}>
            {isName}
            <input ref={inputRef} value={local} placeholder={placeholder}
                onFocus={() => { focused.current = true; }}
                onChange={(e) => setLocal(e.target.value)}
                onBlur={() => { focused.current = false; onCommit(rowId, colId, local); }}
                onKeyDown={(e) => { if (e.key === "Enter") { onCommit(rowId, colId, local); inputRef.current?.blur(); } }}
                className={cn("flex-1 bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground/30", isName && "font-medium")}
            />
        </div>
    );
}

function NumberProgressCell({ rowId, colId, initialValue, onCommit }: {
    rowId: string; colId: string; initialValue: number | null;
    onCommit: (rowId: string, colId: string, v: number | null) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [local, setLocal] = useState(initialValue?.toString() ?? "");
    const commit = () => {
        const n = parseFloat(local);
        onCommit(rowId, colId, isNaN(n) ? null : n);
        setEditing(false);
    };
    const isNeg = typeof initialValue === "number" && initialValue < 0;
    if (editing) return (
        <input autoFocus
            className="h-full w-full bg-transparent px-3 text-sm outline-none text-foreground"
            value={local} onChange={(e) => setLocal(e.target.value)}
            onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") commit(); }} />
    );
    return (
        <button className="flex h-full w-full items-center gap-2 px-3 hover:bg-muted/30 transition-colors"
            onClick={() => { setLocal(initialValue?.toString() ?? ""); setEditing(true); }}>
            <span className={cn("min-w-[36px] text-right text-xs tabular-nums",
                isNeg ? "text-rose-400" : initialValue === 0 ? "text-muted-foreground" : "text-emerald-400")}>
                {initialValue !== null && initialValue !== undefined ? initialValue : ""}
            </span>
            {initialValue !== null && initialValue !== undefined && (
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full transition-all", isNeg ? "bg-rose-500" : "bg-emerald-500")}
                        style={{ width: `${Math.min(100, Math.abs(Number(initialValue)) / 2)}%` }} />
                </div>
            )}
        </button>
    );
}

function DateCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div className="relative flex h-full items-center px-3">
            {value && <span className="pointer-events-none text-sm text-foreground">
                {new Date(value).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>}
            <input type="date" value={value} onChange={(e) => onChange(e.target.value)}
                className={cn("cursor-pointer", value ? "absolute inset-0 opacity-0" : "relative bg-transparent border-0 text-xs text-muted-foreground/40 outline-none")} />
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN BLOCK
// ══════════════════════════════════════════════════════════════════════════════

export const DatabaseTableBlock = createReactBlockSpec(
    {
        type: "databaseTable" as const,
        propSchema: {
            columns: { default: "[]" },
            rows: { default: "[]" },
        },
        content: "none",
    },
    {
        render: ({ block, editor }) => {
            const blockId = block.id;

            blockStore.set(blockId, { editor, block });

            useEffect(() => {
                return () => { blockStore.delete(blockId); };
            }, [blockId]);

            const columns = useMemo<ColumnDefinition[]>(
                () => safeParse(block.props?.columns, []),
                [block.props?.columns]
            );
            const rawRows = useMemo<TableRow[]>(
                () => safeParse(block.props?.rows, []),
                [block.props?.rows]
            );

            const togglePin = useCallback((rowId: string) => {
                const { cols, rows } = readFresh(blockId);
                persistFresh(blockId, cols, rows.map((r) =>
                    r.id === rowId ? { ...r, pinned: !r.pinned } : r
                ));
            }, [blockId]);



            const [currentSort, setCurrentSort] = useState<TableSort | undefined>();
            const [hoveredRow, setHoveredRow] = useState<string | null>(null);
            const [addColumnOpen, setAddColumnOpen] = useState(false);

            const sensors = useSensors(
                useSensor(PointerSensor, {
                    activationConstraint: {
                        distance: 8,
                    },
                }),
                useSensor(KeyboardSensor, {
                    coordinateGetter: sortableKeyboardCoordinates,
                })
            );


            const handleDragEndColumn = useCallback((event: DragEndEvent) => {
                const { active, over } = event;
                if (!over || active.id === over.id) return;

                const { cols, rows } = readFresh(blockId);
                const oldIndex = cols.findIndex((c) => c.id === active.id);
                const newIndex = cols.findIndex((c) => c.id === over.id);

                persistFresh(blockId, arrayMove(cols, oldIndex, newIndex), rows);
            }, [blockId]);

            const handleDragEndRow = useCallback((event: DragEndEvent) => {
                const { active, over } = event;
                if (!over || active.id === over.id) return;

                const { cols, rows } = readFresh(blockId);

                // Pisahkan pinned dan unpinned
                const pinned = rows.filter(r => r.pinned);
                const unpinned = rows.filter(r => !r.pinned);

                const oldIndex = unpinned.findIndex((r) => r.id === active.id);
                const newIndex = unpinned.findIndex((r) => r.id === over.id);

                const reordered = arrayMove(unpinned, oldIndex, newIndex);
                persistFresh(blockId, cols, [...pinned, ...reordered]);
            }, [blockId]);

            // Apply sorting
            const rows = useMemo(() => sortRows(rawRows, columns, currentSort), [rawRows, columns, currentSort]);

            const commitCell = useCallback((rowId: string, colId: string, value: CellValue) => {
                const { cols, rows } = readFresh(blockId);
                persistFresh(blockId, cols, rows.map((r) =>
                    r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: value } } : r
                ));
            }, [blockId]);

            const updateColumn = useCallback((colId: string, patch: Partial<ColumnDefinition>) => {
                const { cols, rows } = readFresh(blockId);
                persistFresh(blockId, cols.map((c) => c.id === colId ? { ...c, ...patch } : c), rows);
            }, [blockId]);

            const deleteColumn = useCallback((colId: string) => {
                const { cols, rows } = readFresh(blockId);
                persistFresh(
                    blockId,
                    cols.filter((c) => c.id !== colId),
                    rows.map((r) => { const { [colId]: _, ...rest } = r.cells; return { ...r, cells: rest }; })
                );
            }, [blockId]);

            const insertColumn = useCallback((refId: string, side: "left" | "right") => {
                const { cols, rows } = readFresh(blockId);
                const idx = cols.findIndex((c) => c.id === refId);
                if (idx === -1) return;
                const newCol: ColumnDefinition = { id: `col_${Date.now()}`, name: "New column", type: "text", width: 160 };
                const pos = side === "left" ? idx : idx + 1;
                persistFresh(blockId, [...cols.slice(0, pos), newCol, ...cols.slice(pos)], rows);
            }, [blockId]);

            const addColumn = useCallback((type: ColumnType) => {
                const { cols, rows } = readFresh(blockId);
                const isSelectLike = type === "select" || type === "multiSelect" || type === "status";
                const newCol: ColumnDefinition = {
                    id: `col_${Date.now()}`, name: COLUMN_TYPE_LABELS[type], type, width: 160,
                    options: isSelectLike
                        ? type === "status" ? DEFAULT_STATUS_OPTIONS
                            : [{ label: "Option 1", color: "sky" }, { label: "Option 2", color: "emerald" }]
                        : undefined,
                };
                persistFresh(blockId, [...cols, newCol], rows);
            }, [blockId]);

            const addOption = useCallback((colId: string, label: string, color: string) => {
                const { cols, rows } = readFresh(blockId);
                persistFresh(blockId,
                    cols.map((c) => c.id === colId ? { ...c, options: [...(c.options ?? []), { label, color }] } : c),
                    rows
                );
            }, [blockId]);

            const deleteOption = useCallback((colId: string, label: string) => {
                const { cols, rows } = readFresh(blockId);
                persistFresh(blockId,
                    cols.map((c) => c.id === colId ? { ...c, options: (c.options ?? []).filter((o) => o.label !== label) } : c),
                    rows
                );
            }, [blockId]);

            const addRow = useCallback(() => {
                const { cols, rows } = readFresh(blockId);
                const newRow: TableRow = { id: `row_${Date.now()}`, cells: {} };
                cols.forEach((col) => {
                    if (col.type === "status" && col.options?.[0])
                        newRow.cells[col.id] = col.options[0].label;
                });
                persistFresh(blockId, cols, [...rows, newRow]);
            }, [blockId]);

            const deleteRow = useCallback((rowId: string) => {
                const { cols, rows } = readFresh(blockId);
                persistFresh(blockId, cols, rows.filter((r) => r.id !== rowId));
            }, [blockId]);

            const handleSort = useCallback((columnId: string, direction: "asc" | "desc") => {
                const newSort: TableSort = { columnId, direction };
                setCurrentSort(newSort);
                setSort(blockId, newSort);
            }, [blockId]);

            const handleResize = useCallback((colId: string, width: number) => {
                updateColumn(colId, { width });
            }, [updateColumn]);

            const renderCell = (col: ColumnDefinition, row: TableRow) => {
                const value = row.cells[col.id];
                const commit = (v: CellValue) => commitCell(row.id, col.id, v);
                switch (col.type) {
                    case "status":
                        return <StatusCell value={(value as string) ?? ""} options={col.options ?? DEFAULT_STATUS_OPTIONS} onChange={commit} />;
                    case "select":
                        return <SelectCell value={(value as string) ?? ""} options={col.options ?? []} onChange={commit} />;
                    case "multiSelect":
                        return <SelectCell value={(value as string[]) ?? []} options={col.options ?? []} onChange={commit} multi />;
                    case "number":
                        return <NumberProgressCell rowId={row.id} colId={col.id} initialValue={value as number | null} onCommit={commitCell} />;
                    case "date":
                        return <DateCell value={(value as string) ?? ""} onChange={commit} />;
                    case "checkbox":
                        return (
                            <div className="flex h-full items-center justify-center px-3">
                                <Checkbox checked={Boolean(value)} onCheckedChange={commit}
                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                            </div>
                        );
                    case "url":
                        return <TextCell rowId={row.id} colId={col.id} initialValue={(value as string) ?? ""} onCommit={commitCell} placeholder="https://…" />;
                    default:
                        return <TextCell rowId={row.id} colId={col.id} initialValue={(value as string) ?? ""} onCommit={commitCell}
                            isName={columns.indexOf(col) === 0 || col.id === "name"} />;
                }
            };

            return (
                <div className="my-3 overflow-x-auto rounded-lg border bg-background shadow-sm"
                    onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
                            e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
                            e.key === 'Enter' || e.key === 'Tab') {
                            e.stopPropagation();
                        }
                    }}>
                    <div className="inline-block min-w-full align-middle text-sm p-1">
                        {/* Header */}
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndColumn}>
                            <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                                <div className="flex border-b border-border bg-muted/30">
                                    {columns.map((col) => (
                                        <SortableColumnHeader
                                            key={col.id}
                                            column={col}
                                            blockId={blockId}
                                            currentSort={currentSort}
                                            onRename={(name) => updateColumn(col.id, { name })}
                                            onIconChange={(icon) => updateColumn(col.id, { icon })}
                                            onDelete={() => deleteColumn(col.id)}
                                            onInsertLeft={() => insertColumn(col.id, "left")}
                                            onInsertRight={() => insertColumn(col.id, "right")}
                                            onAddOption={(label, color) => addOption(col.id, label, color)}
                                            onDeleteOption={(label) => deleteOption(col.id, label)}
                                            onSort={(direction) => handleSort(col.id, direction)}
                                            onResize={(width) => handleResize(col.id, width)}
                                        />
                                    ))}
                                    <div className="shrink-0 flex items-center justify-center p-0" style={{ width: 52 }} >
                                        <DropdownMenu open={addColumnOpen}
                                            onOpenChange={setAddColumnOpen}
                                            modal={false}>

                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    className="flex h-full w-full items-center justify-center p-2.5 text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-colors outline-none">
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </DropdownMenuTrigger>

                                            {/* Cukup stopPropagation di content aja */}
                                            <DropdownMenuContent
                                                align="end"
                                                className="w-44"
                                                onPointerDownOutside={(e) => e.stopPropagation()}
                                                onPointerDown={(e) => e.stopPropagation()}>
                                                <DropdownMenuLabel className="text-xs text-muted-foreground">Add property</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                {Object.keys(COLUMN_TYPE_LABELS).map((type) => (
                                                    <DropdownMenuItem
                                                        key={type}
                                                        onSelect={() => addColumn(type as ColumnType)}
                                                        className="gap-2.5">
                                                        <span className="text-muted-foreground">{COLUMN_TYPE_ICONS[type as ColumnType]}</span>
                                                        {COLUMN_TYPE_LABELS[type as ColumnType]}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </SortableContext>
                        </DndContext>

                        {/* Body */}
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndRow}>
                            <SortableContext items={rows.filter(r => !r.pinned).map(r => r.id)} strategy={verticalListSortingStrategy}>
                                <div className="flex flex-col">
                                    {rows.map((row) => (
                                        <SortableRow
                                            key={row.id}
                                            row={row}
                                            columns={columns}
                                            blockId={blockId}
                                            hoveredRow={hoveredRow}
                                            setHoveredRow={setHoveredRow}
                                            renderCell={renderCell}
                                            togglePin={togglePin}
                                            deleteRow={deleteRow}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>

                        {/* Add row */}
                        <button
                            onClick={addRow}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-muted/30 transition-colors"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            New
                        </button>
                    </div>
                </div>
            );

        },
    }
);

// ══════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ══════════════════════════════════════════════════════════════════════════════

export const customSchema = BlockNoteSchema.create({
    blockSpecs: {
        ...defaultBlockSpecs,
        databaseTable: DatabaseTableBlock(),
    },
    inlineContentSpecs: defaultInlineContentSpecs,
    styleSpecs: defaultStyleSpecs,
});

export type CustomSchema = typeof customSchema;
export type CustomBlock = CustomSchema["Block"];
