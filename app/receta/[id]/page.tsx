"use client";

import { useEffect, useMemo, useState } from "react";
import NavbarGeneral from "@/components/navbar";
import {
  getRecipeById,
  appendIngredientsToRecipe,
  upsertRecipeShadowingSeed, // 👈 nuevo: persiste edición completa
  type Recipe,
} from "@/lib/recipesStore";
import { Button, Input } from "@heroui/react";
import { Switch } from "@heroui/switch";
import { useParams } from "next/navigation";
import CreateRecipeForm from "@/components/createrecipe";
import { FcCancel } from "react-icons/fc";
import ConfirmDeleteModal from "@/components/confirm-delete-modal";

type Ingredient = { name: string; amount: number; unit: "gr" | "ml" | "u" }; // 👈 alinear tipo

export default function ShowReceta() {
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);

  // --- TODOS LOS HOOKS VAN ARRIBA ---
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [data, setData] = useState<Recipe[] | null>(null);
  const [savedName, setSavedName] = useState<string>("Receta");
  const [isEditing, setIsEditing] = useState(false);
  const [targetServingsById, setTargetServingsById] = useState<Record<number, number>>({});

  // ❗ Estado del modal
  const [confirm, setConfirm] = useState<{
    open: boolean;
    recipeId: number | null;
    index: number | null;
    name?: string;
  }>({ open: false, recipeId: null, index: null, name: "" });

  // Cargar receta
  useEffect(() => {
    const r = getRecipeById(numericId) || null;
    setRecipe(r);
    setData(r ? [r] : null);
    setSavedName(r?.name ?? "Receta");
  }, [numericId]);

  const getTarget = (r: Recipe) => targetServingsById[r.id] ?? (r.servings || 1);
  const roundByUnit = (amount: number, unit: Ingredient["unit"]) =>
    unit === "u" ? Math.ceil(amount) : Math.round(amount);

  const scaledRecipes = useMemo(() => {
    if (!data) return [];
    return data.map((r) => {
      const base = r.servings || 1;
      const target = Math.max(1, getTarget(r));
      const factor = target / base;
      return {
        ...r,
        servings: target,
        ingredients: r.ingredients.map((ing) => ({
          ...ing,
          amount: roundByUnit(ing.amount * factor, ing.unit as Ingredient["unit"]),
        })),
      };
    });
  }, [data, targetServingsById]);

  const removeIngredient = (recipeId: number, index: number) => {
    setData((prev) =>
      !prev
        ? prev
        : prev.map((r) =>
            r.id !== recipeId
              ? r
              : { ...r, ingredients: r.ingredients.filter((_, i) => i !== index) }
          )
    );
  };

  const updateIng =
    (recipeId: number, index: number, field: keyof Ingredient) =>
    (val: string) => {
      setData((prev) =>
        !prev
          ? prev
          : prev.map((r) =>
              r.id !== recipeId
                ? r
                : {
                    ...r,
                    ingredients: r.ingredients.map((ing, i) =>
                      i === index
                        ? {
                            ...ing,
                            [field]:
                              field === "amount" ? Number(val || 0) : (val as any),
                          }
                        : ing
                    ),
                  }
            )
      );
    };

  const updateRecipeField =
    (recipeId: number, field: keyof Recipe) =>
    (val: string) => {
      setData((prev) =>
        !prev
          ? prev
          : prev.map((r) =>
              r.id !== recipeId
                ? r
                : {
                    ...r,
                    [field]:
                      field === "servings"
                        ? Math.max(1, Number(val || 1))
                        : (val as any),
                  }
            )
      );
    };

  // 🔧 FIX: antes usabas recipeId (no existe). Debe ser numericId
  useEffect(() => {
    setRecipe(getRecipeById(numericId) || null);
  }, [numericId]);

  // Guardar ingredientes NUEVOS desde el form hijo (agrega y refresca)
  const handleAppendIngredients = (
    newIngredients: { name: string; amount: number; unit: "gr" | "ml" | "u" }[]
  ) => {
    appendIngredientsToRecipe(numericId, newIngredients);
    const updated = getRecipeById(numericId) || null;
    setRecipe(updated);
    setData(updated ? [updated] : null);
  };

  // Guardar EDICIONES COMPLETAS de la receta (nombre, porciones, edits/borrados)
  const handleSaveAll = () => {
    const current = data?.[0];
    if (!current) return;
    const normalized: Recipe = {
      ...current,
      servings: Math.max(1, Number(current.servings || 1)),
      ingredients: current.ingredients.map((ing) => ({
        ...ing,
        unit: (ing.unit as Ingredient["unit"]) || "gr",
      })),
    };
    upsertRecipeShadowingSeed(normalized);
    const updated = getRecipeById(numericId) || null;
    setRecipe(updated);
    setData(updated ? [updated] : null);
    setSavedName(updated?.name ?? "Receta");
  };

  // helpers del modal
  const askRemoveIngredient = (recipeId: number, index: number, name: string) =>
    setConfirm({ open: true, recipeId, index, name });

  const closeConfirm = () =>
    setConfirm({ open: false, recipeId: null, index: null, name: "" });

  const confirmRemoveIngredient = () => {
    if (confirm.recipeId != null && confirm.index != null) {
      removeIngredient(confirm.recipeId, confirm.index);
      const current = data?.[0];
      if (current) {
        const persisted: Recipe = {
          ...current,
          ingredients: current.ingredients.filter((_, i) => i !== confirm.index!),
        };
        upsertRecipeShadowingSeed(persisted);
        const updated = getRecipeById(numericId) || null;
        setRecipe(updated);
        setData(updated ? [updated] : null);
      }
    }
    closeConfirm();
  };

  // --- EARLY RETURNS DESPUÉS DE DECLARAR TODOS LOS HOOKS ---
  if (recipe === null && data === null) {
    return (
      <div className="mx-auto w-3/5 p-6">
        <NavbarGeneral title="Receta" />
        <p className="mt-6">Cargando…</p>
      </div>
    );
  }
  if (!recipe || !data) {
    return (
      <div className="mx-auto w-3/5 p-6">
        <NavbarGeneral title="Receta" />
        <p className="mt-6">Receta no encontrada.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl flex flex-col justify-center items-center">
      <div className="w-3/4">
        <NavbarGeneral recipeName={savedName} onSave={handleSaveAll} />
      </div>

      <div className="w-full flex flex-col items-end justify-between mt-4">
        <h2 className="text-xl font-semibold">Editar</h2>
        <Switch isSelected={isEditing} onValueChange={setIsEditing} aria-label="Modo edición">
          {isEditing ? "ON" : "OFF"}
        </Switch>
      </div>

      <div className="flex flex-col gap-12 w-full mt-8">
        {data.map((receta) => {
          const scaled = scaledRecipes.find((r) => r.id === receta.id)!;

          return (
            <div key={receta.id} className="w-full">
              <div className="flex items-end justify-between gap-4 mb-4">
                <div className="flex-1 items-center">
                  {isEditing ? (
                    <Input
                      variant="bordered"
                      label="NOMBRE DE LA PREPARACIÓN"
                      value={receta.name}
                      onChange={(e) =>
                        updateRecipeField(receta.id, "name")(e.target.value)
                      }
                    />
                  ) : (
                    <>
                      <div className="text-xs opacity-80 mb-1">NOMBRE DE LA PREPARACIÓN</div>
                      <div className="text-lg font-medium">{receta.name}</div>
                    </>
                  )}
                </div>

                <div className="w-3/12">
                  {!isEditing ? (
                    <div className="flex items-center gap-4 justify-center">
                      <div className="flex flex-col">
                        <div className="text-xs opacity-80 mb-1">PORCIONES</div>
                        <div className="text-lg font-medium text-center">{receta.servings ?? 1}</div>
                      </div>
                      <Input
                        variant="bordered"
                        label="CALCULAR"
                        type="number"
                        min={1}
                        value={String(getTarget(receta))}
                        onChange={(e) =>
                          setTargetServingsById((prev) => ({
                            ...prev,
                            [receta.id]: Math.max(1, Number(e.target.value || 1)),
                          }))
                        }
                      />
                    </div>
                    
                  ) : (
                    <div className="flex items-center gap-4 justify-center">
                        <Input
                        variant="bordered"
                        label="PORCIONES"
                        type="number"
                        min={1}
                        value={String(receta.servings ?? 1)}
                        onChange={(e) => updateRecipeField(receta.id, "servings")(e.target.value)}
                      />
                      <div className="flex flex-col">
                        <div className="flex justify-center opacity-70">CALCULAR</div>
                        <div className="flex justify-center">{receta.servings}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>w

              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-6 pr-1 border-r border-default-300/20 dark:border-default-600/40">
                  <div className="grid grid-cols-12 gap-3 text-sm mb-2">
                    <div className={`${isEditing ? "col-span-5" : "col-span-6"} font-semibold opacity-80`}>
                      INGREDIENTE
                    </div>
                    <div className="col-span-3 font-semibold opacity-80">PESO</div>
                    <div className="col-span-3 font-semibold opacity-80">UNIDAD</div>
                    {isEditing && <div className="col-span-1" />}
                  </div>
                  {receta.ingredients.map((ing, i) => (
                    <div key={i} className="grid grid-cols-12 gap-3 mb-3 items-center">
                      {isEditing ? (
                        <>
                          <Input
                            className="col-span-5"
                            variant="bordered"
                            label={`Ingrediente ${i + 1}`}
                            value={ing.name}
                            onChange={(e) => updateIng(receta.id, i, "name")(e.target.value)}
                          />
                          <Input
                            className="col-span-3"
                            variant="bordered"
                            label="Peso"
                            type="number"
                            value={String(ing.amount)}
                            onChange={(e) => updateIng(receta.id, i, "amount")(e.target.value)}
                          />
                          <Input
                            className="col-span-3"
                            variant="bordered"
                            label="Unidad"
                            placeholder="gr / ml / u"
                            value={ing.unit}
                            onChange={(e) => updateIng(receta.id, i, "unit")(e.target.value)}
                          />
                          <div className="col-span-1 flex items-center justify-end">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              aria-label="Eliminar ingrediente"
                              onPress={() => askRemoveIngredient(receta.id, i, String(ing.name))}
                            >
                              <FcCancel size={26} />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="col-span-6">{ing.name}</div>
                          <div className="col-span-3 grid justify-items-start">{ing.amount}</div>
                          <div className="col-span-3 grid justify-items-center">{ing.unit}</div>
                        </>
                      )}
                    </div>
                  ))}

                  {isEditing && (
                    <div className="flex flex-col max-w-md">
                      <CreateRecipeForm
                        onSave={(rows) => {
                          appendIngredientsToRecipe(receta.id, rows);
                          const updated = getRecipeById(receta.id)!;
                          setRecipe(updated);
                          setData([updated]);
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="col-span-6">
                  <div className="grid grid-cols-12 gap-3 text-sm mb-2">
                    <div className="col-span-6 font-semibold opacity-80">INGREDIENTE</div>
                    <div className="col-span-3 font-semibold opacity-80">PESO</div>
                    <div className="col-span-3 font-semibold opacity-80">UNIDAD</div>
                  </div>
                  <div className="grid grid-cols-12 gap-3 mb-2 text-sm">
                    <div className="col-span-6 opacity-70">PORCIONES</div>
                    <div className="col-span-3">{getTarget(receta)}</div>
                    <div className="col-span-3" />
                  </div>
                  {scaled.ingredients.map((ing, i) => (
                    <div key={i} className="grid grid-cols-12 gap-3 mb-3 items-center">
                      <div className="col-span-6">{ing.name}</div>
                      <div className="col-span-3">{ing.amount}</div>
                      <div className="col-span-3">{ing.unit}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        <ConfirmDeleteModal
          open={confirm.open}
          title="Eliminar ingrediente"
          message="¿Seguro que querés eliminar este ingrediente?"
          name={confirm.name}
          onCancel={closeConfirm}
          onConfirm={confirmRemoveIngredient}
        />
      </div>
    </div>
  );
}
