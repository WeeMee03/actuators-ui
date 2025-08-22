import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { create, all } from "mathjs";

const math = create(all);

type Formula = {
  id: string;
  field_name: string;
  formula: string;
  is_active: boolean;
};

type FormulaWithEdit = Formula & {
  editedFormula: string;
  saveStatus: "idle" | "saving" | "saved" | "error";
};

export default function FormulaAdminPage() {
  const [formulas, setFormulas] = useState<FormulaWithEdit[]>([]);
  const [newField, setNewField] = useState({ field_name: "", formula: "" });

  useEffect(() => {
    fetchFormulas();
  }, []);

  async function fetchFormulas() {
    const { data, error } = await supabase.from("formulas").select("*").order("field_name");
    if (error) return console.error(error);
    setFormulas((data || []).map((f) => ({ ...f, editedFormula: f.formula, saveStatus: "idle" })));
  }

  async function fetchActuators() {
    const { data, error } = await supabase.from("actuators").select("*");
    if (error) return [];
    return data || [];
  }

  /** Compute formulas with math constants/functions available */
  function computeAllFormulas(context: Record<string, any>, formulas: { field_name: string; formula: string }[]) {
    const updated = { ...context };
    for (const { field_name, formula } of formulas) {
      try {
        // Merge mathjs constants/functions into context
        updated[field_name] = math.evaluate(formula, { ...updated, ...math });
      } catch (e) {
        console.error(`Error evaluating ${field_name}:`, e);
      }
    }
    return updated;
  }

  async function recomputeAllActuators() {
    const { data: activeFormulas } = await supabase.from("formulas").select("*").eq("is_active", true);
    if (!activeFormulas) return;

    const actuators = await fetchActuators();
    for (const a of actuators) {
      const updated = computeAllFormulas(a, activeFormulas);
      await supabase.from("actuators").update(updated).eq("id", a.id);
    }
  }

  async function saveFormula(id: string) {
    const formulaToSave = formulas.find((f) => f.id === id);
    if (!formulaToSave) return;

    setFormulas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, saveStatus: "saving" } : f))
    );

    const { error } = await supabase.from("formulas").update({ formula: formulaToSave.editedFormula }).eq("id", id);

    if (error) {
      console.error(error);
      setFormulas((prev) => prev.map((f) => (f.id === id ? { ...f, saveStatus: "error" } : f)));
    } else {
      setFormulas((prev) =>
        prev.map((f) => (f.id === id ? { ...f, formula: f.editedFormula, saveStatus: "saved" } : f))
      );
      await recomputeAllActuators();
    }
  }

  async function addFormula() {
    if (!newField.field_name || !newField.formula) return;

    const { error } = await supabase.from("formulas").insert([
      { field_name: newField.field_name, formula: newField.formula, is_active: true },
    ]);

    if (error) return console.error(error);

    // Add new field with default 0 to all actuators
    const actuators = await fetchActuators();
    for (const a of actuators) {
      await supabase.from("actuators").update({ [newField.field_name]: 0 }).eq("id", a.id);
    }

    setNewField({ field_name: "", formula: "" });
    await fetchFormulas();
    await recomputeAllActuators();
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-semibold mb-8">Formula Editor</h1>

      {/* Add New Formula */}
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <h2 className="font-semibold mb-2">Add New Formula</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Field Name"
            value={newField.field_name}
            onChange={(e) => setNewField({ ...newField, field_name: e.target.value })}
            className="border p-2 rounded flex-1"
          />
          <input
            type="text"
            placeholder="Formula"
            value={newField.formula}
            onChange={(e) => setNewField({ ...newField, formula: e.target.value })}
            className="border p-2 rounded flex-1"
          />
          <button onClick={addFormula} className="bg-blue-600 text-white px-4 rounded">Add</button>
        </div>
      </div>

      {/* Edit Formulas */}
      <table className="w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Field</th>
            <th className="p-2 border">Formula</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {formulas.map((f) => (
            <tr key={f.id}>
              <td className="border p-2">{f.field_name}</td>
              <td className="border p-2">
                <input
                  value={f.editedFormula}
                  onChange={(e) =>
                    setFormulas((prev) =>
                      prev.map((row) => (row.id === f.id ? { ...row, editedFormula: e.target.value } : row))
                    )
                  }
                  className="w-full border p-1 rounded"
                />
              </td>
              <td className="border p-2">
                <button
                  onClick={() => saveFormula(f.id)}
                  className={`px-3 py-1 rounded text-white ${f.saveStatus === "saved" ? "bg-green-600" : "bg-blue-600"}`}
                >
                  {f.saveStatus === "saving" ? "Saving..." : f.saveStatus === "saved" ? "Saved" : "Save"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
