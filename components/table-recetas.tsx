"use client";
import React from "react";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip,
} from "@heroui/react";
import Link from "next/link";
import { listRecipeRows, removeRecipe } from "@/lib/recipesStore";

type Row = { id: number; name: string; ingredientNames: string[] };
const columns = [
  { name: "RECETAS", uid: "name" },
  { name: "ACCIONES", uid: "actions" },
];

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export default function TableRecetas({ query = "" }: { query?: string }) {
  // Evitamos mismatch: cargar desde LS solo en cliente
  const [items, setItems] = React.useState<Row[]>([]);
  const refresh = React.useCallback(() => setItems(listRecipeRows()), []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDelete = (id: number) => {
    removeRecipe(id);
    refresh();
  };

  const filtered = React.useMemo(() => {
    const q = normalize(query);
    if (!q) return items;
    return items.filter((r) =>
      normalize(r.name).includes(q) ||
      r.ingredientNames.some((n) => normalize(n).includes(q))
    );
  }, [items, query]);

  const renderCell = React.useCallback(
    (row: Row, columnKey: keyof Row | "actions") => {
      switch (columnKey) {
        case "name":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-sm capitalize">{row.name}</p>
              <p className="text-bold text-sm text-default-400">
                {row.ingredientNames.join(" • ")}
              </p>
            </div>
          );
        case "actions":
          return (
            <div className="relative flex items-center gap-2">
              <Tooltip content="Ver detalles">
                <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                  <Link href={`/receta/${row.id}`} aria-label={`Ver ${row.name}`}>
                    <EyeIcon />
                  </Link>
                </span>
              </Tooltip>
              <Tooltip color="danger" content="Eliminar">
                <button
                  className="text-lg text-danger cursor-pointer active:opacity-50"
                  onClick={() => handleDelete(row.id)}
                  aria-label={`Eliminar ${row.name}`}
                >
                  <DeleteIcon />
                </button>
              </Tooltip>
            </div>
          );
        default:
          return row[columnKey];
      }
    },
    []
  );

  return (
    <Table aria-label="Tabla de recetas">
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            align={column.uid === "actions" ? "center" : "start"}
            className={column.uid === "name" ? "min-w-sm" : ""}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>

      <TableBody
        items={filtered}
        emptyContent={
          items.length === 0
            ? "No hay recetas aún"
            : "No hay resultados para tu búsqueda"
        }
      >
        {(item) => (
          <TableRow key={item.id}>
            {(columnKey) => (
              <TableCell>{renderCell(item, columnKey as any)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg aria-hidden="true" fill="none" focusable="false" height="1em" viewBox="0 0 20 20" width="1em" {...props}>
    <path d="M12.9833 10C12.9833 11.65 11.65 12.9833 10 12.9833C8.35 12.9833 7.01666 11.65 7.01666 10C7.01666 8.35 8.35 7.01666 10 7.01666C11.65 7.01666 12.9833 8.35 12.9833 10Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}/>
    <path d="M9.99999 16.8916C12.9417 16.8916 15.6833 15.1583 17.5917 12.1583C18.3417 10.9833 18.3417 9.00831 17.5917 7.83331C15.6833 4.83331 12.9417 3.09998 9.99999 3.09998C7.05833 3.09998 4.31666 4.83331 2.40833 7.83331C1.65833 9.00831 1.65833 10.9833 2.40833 12.1583C4.31666 15.1583 7.05833 16.8916 9.99999 16.8916Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}/>
  </svg>
);

export const DeleteIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg aria-hidden="true" fill="none" focusable="false" height="1em" viewBox="0 0 20 20" width="1em" {...props}>
    <path d="M17.5 4.98332C14.725 4.70832 11.9333 4.56665 9.15 4.56665C7.5 4.56665 5.85 4.64998 4.2 4.81665L2.5 4.98332" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}/>
    <path d="M7.08331 4.14169L7.26665 3.05002C7.39998 2.25835 7.49998 1.66669 8.90831 1.66669H11.0916C12.5 1.66669 12.6083 2.29169 12.7333 3.05835L12.9166 4.14169" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}/>
    <path d="M15.7084 7.61664L15.1667 16.0083C15.075 17.3166 15 18.3333 12.675 18.3333H7.32502C5.00002 18.3333 4.92502 17.3166 4.83335 16.0083L4.29169 7.61664" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}/>
    <path d="M8.60834 13.75H11.3833" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}/>
    <path d="M7.91669 10.4167H12.0834" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}/>
  </svg>
);
