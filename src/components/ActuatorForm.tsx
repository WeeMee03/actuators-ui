import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { computeFormula } from "../lib/formulaUtils";
import type { Actuator } from "../types";

export default function ActuatorForm({ isAdmin }: { isAdmin: boolean }) {
  const navigate = useNavigate();
  const [form, setForm] = useState<Partial<Actuator>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formulas, setFormulas] = useState<{ field_name: string; formula: string }[]>([]);

  const numberFields = [
    "overall_diameter_mm",
    "overall_length_mm",
    "gear_ratio",
    "rated_torque_nm",
    "peak_torque_nm",
    "rated_speed_rpm",
    "efficiency",
    "weight_kg",
    "dc_voltage_v",
  ];

  // 🧩 Fetch active formulas from Supabase
  useEffect(() => {
    const fetchFormulas = async () => {
      const { data, error } = await supabase
        .from("formulas")
        .select("field_name, formula")
        .eq("is_active", true);

      if (data) setFormulas(data);
      if (error) console.error("Failed to fetch formulas:", error.message);
    };
    fetchFormulas();
  }, []);

  // 🚫 Redirect non-admins
  useEffect(() => {
    if (!isAdmin) {
      alert("Access denied. Admins only.");
      navigate("/");
    }
  }, [isAdmin, navigate]);

  const fields: { label: string; key: keyof Actuator }[] = [
    { label: "Manufacturer", key: "manufacturer" },
    { label: "Model Type", key: "model_type" },
    { label: "Overall Diameter (mm)", key: "overall_diameter_mm" },
    { label: "Overall Length (mm)", key: "overall_length_mm" },
    { label: "Gear Box", key: "gear_box" },
    { label: "Gear Ratio", key: "gear_ratio" },
    { label: "Rated Torque (Nm)", key: "rated_torque_nm" },
    { label: "Peak Torque (Nm)", key: "peak_torque_nm" },
    { label: "Rated Speed (rpm)", key: "rated_speed_rpm" },
    { label: "Efficiency", key: "efficiency" },
    { label: "Weight (kg)", key: "weight_kg" },
    { label: "Built-in Controller", key: "built_in_controller" },
    { label: "DC Voltage (V)", key: "dc_voltage_v" },
    { label: "Link", key: "link" },
  ];

  // 🔢 Compute derived value using the same method as FormulaAdminPage
  const computeValue = (actuator: any, formula: string) => {
    return computeFormula(actuator, formula);
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      // Prepare context for formulas
      const context: Record<string, any> = {};
      Object.entries(form).forEach(([k, v]) => {
        context[k] = numberFields.includes(k) ? Number(v) || 0 : v;
      });

      console.log("Context before computation:", context);

      // Compute derived fields
      const derivedValues: Record<string, any> = {};
      for (const { field_name, formula } of formulas) {
        const value = computeValue(context, formula);
        derivedValues[field_name] = value;
        context[field_name] = value; // for formulas depending on other derived fields
      }

      console.log("Derived values:", derivedValues);

      const finalData = { ...form, ...derivedValues };

      // Clean finalData: convert empty strings to null
      const cleanedData = Object.fromEntries(
        Object.entries(finalData).map(([k, v]) => {
          if (numberFields.includes(k)) {
            return [k, v === "" || v === null || v === undefined ? null : Number(v)];
          } else if (typeof v === "string" && v.trim() === "") {
            return [k, null];
          }
          return [k, v];
        })
      );

      console.log("Final data to insert:", cleanedData);

      const { error } = await supabase.from("actuators").insert([cleanedData]);
      setLoading(false);

      if (error) {
        setError("Failed to insert actuator.");
        console.error("Supabase insert error:", error);
        alert(`Insert failed: ${error.message}`);
      } else {
        navigate("/");
      }
    },
    [form, formulas]
  );

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", color: "white", padding: "2rem" }}>
      <h2>Add New Actuator</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        {fields.map(({ label, key }) => (
          <label key={key} style={{ display: "flex", flexDirection: "column" }}>
            {label}
            {key === "built_in_controller" ? (
              <select
                value={form[key] === true ? "true" : form[key] === false ? "false" : ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [key]: e.target.value === "true" ? true : e.target.value === "false" ? false : null,
                  })
                }
                style={inputStyle}
              >
                <option value="">Select</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            ) : key === "gear_box" ? (
              <select
                value={form[key] ?? ""}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                style={inputStyle}
              >
                <option value="">Select Gear Box</option>
                <option value="harmonic">Harmonic</option>
                <option value="planetary">Planetary</option>
              </select>
            ) : (
              <input
                type={numberFields.includes(key) ? "number" : "text"}
                value={form[key] ?? ""}
                onChange={(e) => {
                  const val = numberFields.includes(key) ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value;
                  setForm({ ...form, [key]: val });
                }}
                style={inputStyle}
              />
            )}
          </label>
        ))}

        {error && <p style={{ color: "tomato" }}>{error}</p>}

        <div>
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Submitting..." : "Submit"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{ ...buttonStyle, backgroundColor: "#6b7280", marginLeft: 8 }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 8,
  borderRadius: 4,
  border: "1px solid #ccc",
  backgroundColor: "#292929",
  color: "white",
};

const buttonStyle: React.CSSProperties = {
  padding: "0.5rem 1rem",
  backgroundColor: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: "bold",
};