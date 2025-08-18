import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Formula = {
  id: string;
  field_name: string;
  formula: string;
  units: string | null;
  is_active: boolean;
};

type FormulaWithEdit = Formula & {
  editedFormula: string;
  saveStatus: "idle" | "saving" | "saved" | "error";
};

export default function FormulaAdminPage() {
  const [formulas, setFormulas] = useState<FormulaWithEdit[]>([]);
  const [loading, setLoading] = useState(true);

  const [newField, setNewField] = useState({
    field_name: "",
    formula: "",
    units: "",
  });
  const [addStatus, setAddStatus] = useState<
    "idle" | "adding" | "success" | "error"
  >("idle");

  useEffect(() => {
    fetchFormulas();
  }, []);

  async function fetchFormulas() {
    setLoading(true);
    const { data, error } = await supabase
      .from("formulas")
      .select("*")
      .order("field_name");

    if (error) {
      console.error("Error fetching formulas:", error);
      setFormulas([]);
    } else {
      setFormulas(
        (data || []).map((f) => ({
          ...f,
          editedFormula: f.formula,
          saveStatus: "idle",
        }))
      );
    }
    setLoading(false);
  }

  async function fetchActuators() {
    const { data, error } = await supabase.from("actuators").select("*");
    if (error) {
      console.error("Error fetching actuators:", error);
      return [];
    }
    return data || [];
  }

  async function handleAddFormula() {
    const { field_name, formula, units } = newField;
    if (!field_name || !formula) return;

    setAddStatus("adding");

    const { error: insertError } = await supabase.from("formulas").insert([
      {
        field_name,
        formula,
        units: units || null,
        is_active: true,
      },
    ]);

    if (insertError) {
      console.error("Failed to add formula:", insertError);
      setAddStatus("error");
      return;
    }

    setNewField({ field_name: "", formula: "", units: "" });
    setAddStatus("success");
    await fetchFormulas();
    setTimeout(() => setAddStatus("idle"), 2000);
  }

  // Helper: compute formula result safely
  function computeValue(actuator: any, formula: string) {
    try {
      const keys = Object.keys(actuator);
      const values = Object.values(actuator);
      const fn = new Function(...keys, `return ${formula};`);
      const result = fn(...values);
      if (typeof result === "number" && !isFinite(result)) {
        return null;
      }
      return result;
    } catch {
      return null;
    }
  }

  // Save formula AND update actuator fields accordingly
  async function saveFormula(id: string) {
    setFormulas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, saveStatus: "saving" } : f))
    );

    const formulaToSave = formulas.find((f) => f.id === id);
    if (!formulaToSave) return;

    // Update formula text in formulas table
    const { error: formulaError } = await supabase
      .from("formulas")
      .update({ formula: formulaToSave.editedFormula })
      .eq("id", id);

    if (formulaError) {
      console.error("Failed to save formula:", formulaError);
      setFormulas((prev) =>
        prev.map((f) => (f.id === id ? { ...f, saveStatus: "error" } : f))
      );
      return;
    }

    // Fetch all actuators to update their computed field
    const actuatorsData = await fetchActuators();

    // Update each actuator with the computed value for this formula
    for (const actuator of actuatorsData) {
      const value = computeValue(actuator, formulaToSave.editedFormula);
      const updateData: any = {};
      updateData[formulaToSave.field_name] = value;

      const { error } = await supabase
        .from("actuators")
        .update(updateData)
        .eq("id", actuator.id);

      if (error) {
        console.error(`Failed to update actuator ${actuator.id}:`, error);
        // optionally handle error
      }
    }

    // Update local state
    setFormulas((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              formula: formulaToSave.editedFormula,
              saveStatus: "saved",
            }
          : f
      )
    );

    setTimeout(() => {
      setFormulas((prev) =>
        prev.map((f) => (f.id === id ? { ...f, saveStatus: "idle" } : f))
      );
    }, 2000);
  }

  async function handleDeleteFormula(id: string) {
    if (!window.confirm("Are you sure you want to delete this formula?")) return;
    const { error } = await supabase.from("formulas").delete().eq("id", id);
    if (error) {
      alert("Failed to delete formula.");
      console.error(error);
    } else {
      setFormulas((prev) => prev.filter((f) => f.id !== id));
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-semibold mb-8">Formula Editor (Admin)</h1>
      {loading ? (
        <p className="text-lg">Loading formulas...</p>
      ) : (
        <>
          {/* Add New Formula Form */}
          <div className="mb-12 p-6 border rounded-lg bg-gray-50 shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              ➕ Add New Formula
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddFormula();
              }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. torque_per_kg"
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                  value={newField.field_name}
                  onChange={(e) =>
                    setNewField({ ...newField, field_name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Formula
                </label>
                <input
                  type="text"
                  placeholder="e.g. peak_torque_nm / weight_kg"
                  className="w-full p-2 border rounded-md font-mono text-sm focus:outline-none focus:ring focus:border-blue-300"
                  value={newField.formula}
                  onChange={(e) =>
                    setNewField({ ...newField, formula: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Units (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nm/kg"
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                  value={newField.units}
                  onChange={(e) =>
                    setNewField({ ...newField, units: e.target.value })
                  }
                />
              </div>

              <div className="sm:col-span-3 flex items-center gap-4 mt-2">
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-md text-white transition ${
                    addStatus === "adding"
                      ? "bg-blue-400 cursor-wait"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                  disabled={addStatus === "adding"}
                >
                  {addStatus === "adding"
                    ? "Adding..."
                    : addStatus === "success"
                    ? "Added!"
                    : "Add Formula"}
                </button>

                {addStatus === "error" && (
                  <span className="text-red-600 text-sm">
                    Failed to add formula
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Formula Table */}
          <table className="w-full border border-gray-300 text-base">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3 font-medium">Field</th>
                <th className="p-3 font-medium">Formula</th>
                <th className="p-3 font-medium">Units</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {formulas.map((f) => {
                const hasChanges = f.editedFormula !== f.formula;
                return (
                  <tr key={f.id} className="align-top">
                    <td className="border-t p-3 font-mono text-sm">{f.field_name}</td>
                    <td className="border-t p-3">
                      <textarea
                        className="w-full p-2 border rounded font-mono text-sm resize-y min-h-[60px] bg-white"
                        value={f.editedFormula}
                        onChange={(e) =>
                          setFormulas((prev) =>
                            prev.map((row) =>
                              row.id === f.id
                                ? { ...row, editedFormula: e.target.value }
                                : row
                            )
                          )
                        }
                      />
                    </td>
                    <td className="border-t p-3">{f.units || "-"}</td>
                    <td className="border-t p-3 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <button
                        className={`px-4 py-2 text-white text-sm rounded transition ${
                          hasChanges
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-gray-400 cursor-not-allowed"
                        }`}
                        onClick={() => hasChanges && saveFormula(f.id)}
                        disabled={!hasChanges}
                      >
                        {f.saveStatus === "saving"
                          ? "Saving..."
                          : f.saveStatus === "saved"
                          ? "Saved!"
                          : "Save"}
                      </button>
                      <button
                        className="px-4 py-2 text-white text-sm rounded bg-red-600 hover:bg-red-700 transition"
                        onClick={() => handleDeleteFormula(f.id)}
                        type="button"
                      >
                        Delete
                      </button>
                      {f.saveStatus === "error" && (
                        <span className="text-red-600 text-sm">Failed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
