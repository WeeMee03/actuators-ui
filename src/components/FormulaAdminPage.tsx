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

  async function saveFormula(id: string) {
    setFormulas((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, saveStatus: "saving" } : f
      )
    );

    const formulaToSave = formulas.find((f) => f.id === id);
    if (!formulaToSave) return;

    const { error } = await supabase
      .from("formulas")
      .update({ formula: formulaToSave.editedFormula })
      .eq("id", id);

    setFormulas((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              saveStatus: error ? "error" : "saved",
              formula: error ? f.formula : f.editedFormula,
            }
          : f
      )
    );

    if (error) console.error("Failed to save:", error);

    // Reset status after 2s
    setTimeout(() => {
      setFormulas((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, saveStatus: "idle" } : f
        )
      );
    }, 2000);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Formula Editor (Admin)</h1>
      {loading ? (
        <p>Loading formulas...</p>
      ) : (
        <table className="w-full border border-gray-300 text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">Field</th>
              <th className="p-2">Formula</th>
              <th className="p-2">Units</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {formulas.map((f) => {
              const hasChanges = f.editedFormula !== f.formula;
              return (
                <tr key={f.id}>
                  <td className="border-t p-2 font-mono text-xs">
                    {f.field_name}
                  </td>
                  <td className="border-t p-2">
                    <input
                      className="w-full p-1 border rounded font-mono text-xs"
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
                  <td className="border-t p-2">{f.units || "-"}</td>
                  <td className="border-t p-2 flex gap-2 items-center">
                    <button
                      className={`px-3 py-1 text-white text-xs rounded ${
                        hasChanges
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                      onClick={() => hasChanges && saveFormula(f.id)}
                      disabled={!hasChanges || f.saveStatus === "saving"}
                    >
                      {f.saveStatus === "saving"
                        ? "Saving..."
                        : f.saveStatus === "saved"
                        ? "Saved!"
                        : "Save"}
                    </button>
                    {f.saveStatus === "error" && (
                      <span className="text-red-600 text-xs">Failed</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}