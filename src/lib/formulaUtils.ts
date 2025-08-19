// Utility function to compute a formula based on a given context
export function computeFormula(context: Record<string, any>, formula: string): number | null {
  try {
    const keys = Object.keys(context);
    const values = Object.values(context);
    const fn = new Function(...keys, `return ${formula};`);
    const result = fn(...values);

    if (typeof result === "number" && isFinite(result)) {
      return Number(result.toFixed(2));
    }

    return null;
  } catch (error) {
    console.error("Error computing formula:", formula, error);
    return null;
  }
}
