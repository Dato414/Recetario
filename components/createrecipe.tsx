"use client";
import { useState } from "react";
import NewIngredent from "@/components/addIngredent";

import { Button } from "@heroui/react";

type Row = { id: string; name: string; amount: number | ""; unit: "gr" | "ml" | "u" };
type NewIng = { name: string; amount: number; unit: "gr" | "ml" | "u" };

export default function CreateRecipeForm({ onSave }: { onSave: (newIngredients: NewIng[]) => void }) {
  const makeEmptyRow = (): Row => ({ id: crypto.randomUUID(), name: "", amount: "", unit: "gr" });
  const [rows, setRows] = useState<Row[]>([makeEmptyRow()]);
  const [shortLabel, setShortLabel] = useState(false);
  
  const isRowComplete = (r: Row) =>
    r.name.trim().length > 0 && r.amount !== "" && Number.isFinite(Number(r.amount));

  const hasAnyComplete = rows.some(isRowComplete); 


  const addOne = () => {
    setRows(prev => [...prev, makeEmptyRow()]);
  };

  const updateRow = (id: string, field: "name" | "amount" | "unit", value: string) => {
    setRows(prev =>
      prev.map(r =>
        r.id !== id
          ? r
          : {
              ...r,
              [field]: field === "amount" ? (value === "" ? "" : Number(value)) : (value as any),
            }
      )
    );
  };

  const deleteRow = (id: string) => {
    setRows(prev => {
      const next = prev.filter(r => r.id !== id);
      return next.length > 0 ? next : [makeEmptyRow()]; 
    });
  };

  const resetAll = () => setRows([makeEmptyRow()]);
  const saveAll = () => {
    const cleaned: NewIng[] = rows
      .filter(isRowComplete)
      .map(r => ({
        name: r.name.trim(),
        amount: Number(r.amount),
        unit: r.unit,
      }));

    if (cleaned.length === 0) return; 

    onSave(cleaned);
    resetAll();
    setShortLabel(true);
  };

 
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <h1>Nuevos ingredientes</h1>
      </div>
      <div className="space-y-2">
        {rows.map(row => (
          <NewIngredent
            key={row.id}
            id={row.id}
            name={row.name}
            amount={row.amount}
            unit={row.unit}
            onChange={updateRow}
            onDelete={() => deleteRow(row.id)}
            showHeader={false}
          />
        ))}
      </div>

      {/* Acciones */}
      <div className="flex gap-2 justify-center">
        <Button type="button" onPress={addOne}>
          + Ingrediente
        </Button>
        <Button
          type="button"
          color="secondary"
          onPress={saveAll}
          isDisabled={!hasAnyComplete}
        >
          Guardar
        </Button>
      </div>
    </div>
  );
}
