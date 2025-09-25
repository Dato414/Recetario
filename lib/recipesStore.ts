// lib/recipesStore.ts
import {
  getRecipeById as seedGet,
  listRecipes as seedList,
  listRecipeRows as seedRows,
  type Recipe,
} from "@/lib/recipes";

const LS_KEY = "recipes_overlay_v1";

type Overlay = {
  deletedIds: number[];
  addedIngredients: Record<number, { name: string; amount: number; unit: "gr" | "ml" | "u" }[]>;
  addedRecipes: Recipe[];
};

function canLS() {
  return typeof window !== "undefined";
}

function read(): Overlay {
  if (!canLS()) return { deletedIds: [], addedIngredients: {}, addedRecipes: [] };
  try {
    const raw = localStorage.getItem(LS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed) return { deletedIds: [], addedIngredients: {}, addedRecipes: [] };
    return {
      deletedIds: parsed.deletedIds ?? [],
      addedIngredients: parsed.addedIngredients ?? {},
      addedRecipes: parsed.addedRecipes ?? [],
    };
  } catch {
    return { deletedIds: [], addedIngredients: {}, addedRecipes: [] };
  }
}

function write(o: Overlay) {
  if (canLS()) localStorage.setItem(LS_KEY, JSON.stringify(o));
}

/* ---------- Lecturas con overlay ---------- */
export function listRecipes() {
  const overlay = read();
  // base sin eliminados
  const base = seedList().filter((r) => !overlay.deletedIds.includes(r.id));
  // agregadas por usuario (incluye las que “sombrean” al seed)
  const added = overlay.addedRecipes.map((r) => ({ id: r.id, name: r.name }));
  return [...base, ...added];
}

export function listRecipeRows() {
  const overlay = read();

  // filas base (sin eliminados) + nombres de ingredientes agregados al seed
  const baseRows = seedRows()
    .filter((r) => !overlay.deletedIds.includes(r.id))
    .map((r) => {
      const extra = overlay.addedIngredients[r.id] ?? [];
      return {
        ...r,
        ingredientNames: [...r.ingredientNames, ...extra.map((e) => e.name)],
      };
    });

  // filas de recetas nuevas (o editadas que “sombrean” al seed)
  const addedRows = overlay.addedRecipes.map((r) => ({
    id: r.id,
    name: r.name,
    ingredientNames: r.ingredients.map((i) => i.name),
  }));

  return [...baseRows, ...addedRows];
}

export function getRecipeById(id: number): Recipe | undefined {
  const overlay = read();

  // 1) si existe versión en addedRecipes (nueva o que sombrea al seed), devolver esa
  const added = overlay.addedRecipes.find((r) => r.id === id);
  if (added) return added;

  // 2) si fue “eliminada” del seed, no devolver nada
  if (overlay.deletedIds.includes(id)) return undefined;

  // 3) seed + overlay de ingredientes sueltos
  const base = seedGet(id);
  if (!base) return undefined;

  const extra = overlay.addedIngredients[id] ?? [];
  return { ...base, ingredients: [...base.ingredients, ...extra] };
}

/* ---------- Mutaciones ---------- */
export function removeRecipe(id: number) {
  const o = read();
  const wasAdded = o.addedRecipes.some((r) => r.id === id);

  // si era agregada por usuario, la saco de added
  o.addedRecipes = o.addedRecipes.filter((r) => r.id !== id);

  // si era del seed, marco “eliminada”
  if (!wasAdded && !o.deletedIds.includes(id)) {
    o.deletedIds = [...o.deletedIds, id];
  }

  // también conviene limpiar ingredientes agregados sueltos
  if (o.addedIngredients[id]) {
    const { [id]: _omit, ...rest } = o.addedIngredients;
    o.addedIngredients = rest;
  }

  write(o);
}

export function appendIngredientsToRecipe(
  id: number,
  newIngs: { name: string; amount: number; unit: "gr" | "ml" | "u" }[]
) {
  const o = read();

  // si es receta agregada (incluye las que “sombrean”), mutamos sus ingredientes
  const added = o.addedRecipes.find((r) => r.id === id);
  if (added) {
    added.ingredients = [...added.ingredients, ...newIngs];
    write(o);
    return;
  }

  // si es del seed, registramos ingredientes sueltos
  o.addedIngredients[id] = [...(o.addedIngredients[id] ?? []), ...newIngs];
  write(o);
}

export function addRecipe(recipe: Recipe) {
  const o = read();
  const idTaken =
    seedList().some((r) => r.id === recipe.id) ||
    o.addedRecipes.some((r) => r.id === recipe.id);

  // si colisiona, genero otro id
  const rec: Recipe = idTaken ? { ...recipe, id: Date.now() } : recipe;

  // upsert inmutable: si existe lo reemplazo, si no, lo agrego
  o.addedRecipes = [...o.addedRecipes.filter((r) => r.id !== rec.id), rec];
  write(o);
}

/**
 * Upsert que “somete” (shadow) una receta del seed con una versión editada
 * manteniendo el MISMO id. Si ya era agregada por el usuario, la reemplaza.
 */
export function upsertRecipeShadowingSeed(recipe: Recipe) {
  const o = read();

  const existsInSeed = seedList().some((r) => r.id === recipe.id);
  const existsInAdded = o.addedRecipes.some((r) => r.id === recipe.id);

  if (existsInSeed) {
    // oculto la versión del seed y guardo la editada con el mismo id
    if (!o.deletedIds.includes(recipe.id)) {
      o.deletedIds = [...o.deletedIds, recipe.id];
    }
    o.addedRecipes = [...o.addedRecipes.filter((r) => r.id !== recipe.id), recipe];

    // si había overlay de ingredientes sueltos para ese id, ya no hace falta
    if (o.addedIngredients[recipe.id]) {
      const { [recipe.id]: _omit, ...rest } = o.addedIngredients;
      o.addedIngredients = rest;
    }
  } else if (existsInAdded) {
    // ya era “user-made”: upsert normal
    o.addedRecipes = [...o.addedRecipes.filter((r) => r.id !== recipe.id), recipe];
  } else {
    // no existía: crear nueva
    o.addedRecipes = [...o.addedRecipes, recipe];
  }

  write(o);
}

/**
 * Upsert general: si existe en seed → shadow, si existe en added → replace,
 * si no existe en ningún lado → add.
 */
export function upsertRecipe(recipe: Recipe) {
  const inSeed = seedList().some((r) => r.id === recipe.id);
  const o = read();
  const inAdded = o.addedRecipes.some((r) => r.id === recipe.id);

  if (inSeed) return upsertRecipeShadowingSeed(recipe);
  if (inAdded) {
    o.addedRecipes = [...o.addedRecipes.filter((r) => r.id !== recipe.id), recipe];
    write(o);
    return;
  }
  addRecipe(recipe);
}

export function clearOverlay() {
  write({ deletedIds: [], addedIngredients: {}, addedRecipes: [] });
}
