// app/create/page.tsx
"use client";
import { useState } from "react";
import { Button, Input } from "@heroui/react";
import NewIngredent from "@/components/addIngredent";
import { IoMdAdd } from "react-icons/io";
import { addRecipe } from "@/lib/recipesStore";
import NavbarGeneral from "@/components/navbar";

type Row = { id: string; name: string; amount: number | ""; unit: "gr" | "ml" | "u" };

// ✅ helper local (evitamos depender de export externo)
const isRowCompleteLocal = (r: Row) =>
  r.name.trim().length > 0 && r.amount !== "" && !Number.isNaN(Number(r.amount));

export default function Create() {
  const makeEmptyRow = (): Row => ({ id: crypto.randomUUID(), name: "", amount: "", unit: "gr" });

  const [title, setTitle] = useState("");
  const [servings, setServings] = useState<number | "">("");
  const [rows, setRows] = useState<Row[]>([makeEmptyRow()]);

  // ⬇️ 1) VALIDA DENTRO DEL HANDLER (no agregues si la última no está completa)
  const addRow = () => {
    const last = rows[rows.length - 1];
    if (!isRowCompleteLocal(last)) return; // ← guard fuerte
    setRows((prev) => [...prev, makeEmptyRow()]);
  };

  const updateRow = (id: string, field: "name" | "amount" | "unit", value: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              [field]: field === "amount" ? (value === "" ? "" : Number(value)) : (value as any),
            }
          : r
      )
    );
  };

  const deleteRow = (id: string) => {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== id);
      return next.length === 0 ? [makeEmptyRow()] : next; // siempre dejar 1 fila
    });
  };

  const resetForm = () => {
    setTitle("");
    setServings("");
    setRows([makeEmptyRow()]);
  };

  const handleSave = () => {
    const ingredients = rows
      .filter(isRowCompleteLocal) // solo los completos
      .map((r) => ({
        name: r.name.trim(),
        amount: Number(r.amount),
        unit: r.unit,
      }));

    if (!ingredients.length) return; // nada válido para guardar

    addRecipe({
      id: Date.now(),
      name: title.trim() || "Receta sin título",
      servings: Number(servings) || 1,
      ingredients,
    });

    resetForm(); // dejar todo listo para cargar otra receta
    // opcional: router.push("/") o toast
  };

  // ⬇️ 2) refuerzo visual: botón sólo enabled si la última está completa
  const canAddAnother = isRowCompleteLocal(rows[rows.length - 1]);

  return (
    <div className="w-3/5 mx-auto">
      <NavbarGeneral title="Crear receta" onSave={handleSave} />

      <div className="flex flex-col gap-6 mt-6">
        <div className="flex items-end gap-4">
          <Input
            label="Nombre de la preparación"
            type="text"
            className="flex-1"
            variant="bordered"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Raciones"
            type="number"
            variant="bordered"
            className="w-32"
            value={servings === "" ? "" : String(servings)}
            onChange={(e) => setServings(e.target.value === "" ? "" : Number(e.target.value))}
            min={1}
          />
        </div>

        <div className="flex flex-col gap-4">
          {rows.map((row) => (
           <NewIngredent
              key={row.id}
              id={row.id}
              name={row.name}
              amount={row.amount}
              unit={row.unit}
              onChange={updateRow}
              onDelete={deleteRow}
              showHeader={false}
            />
          ))}
        </div>

        <Button
          color="primary"
          className="mx-auto w-1/2"
          onPress={addRow}
          isDisabled={!canAddAnother} // refuerzo UI
        >
          <IoMdAdd size={20} /> Agregar ingrediente
        </Button>
      </div>
    </div>
  );
}
