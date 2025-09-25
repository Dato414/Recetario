export type Ingredient = { name: string; amount: number; unit: string };
export type Recipe = { id: number; name: string; servings: number; ingredients: Ingredient[] };

const _recipes: Recipe[] = [
  {
    id: 1,
    name: "Pastel de papas",
    servings: 1,
    ingredients: [
      { name: "Papa", amount: 200, unit: "gr" },
      { name: "Carne picada", amount: 50, unit: "gr" },
      { name: "Cebolla", amount: 50, unit: "gr" },
      { name: "Queso", amount: 40, unit: "gr" },
      { name: "Huevos", amount: 1, unit: "u" },
    ],
  },
  {
    id: 2,
    name: "Pastel carne",
    servings: 1,
    ingredients: [
      { name: "Carne picada", amount: 300, unit: "gr" },
      { name: "Cebolla", amount: 50, unit: "gr" },
      { name: "Queso", amount: 40, unit: "gr" },
      { name: "Huevos", amount: 1, unit: "u" },
    ],
  },
];

export function getRecipeById(id: number) {
  return _recipes.find(r => r.id === id);
}
export function listRecipes() {
  return _recipes.map(({ id, name }) => ({ id, name }));
}

export function listRecipeRows() {
  return _recipes.map((r) => ({
    id: r.id,
    name: r.name,
    ingredientNames: r.ingredients.map((i) => i.name),
  }));
}
