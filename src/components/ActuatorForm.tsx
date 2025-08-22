import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { create, all } from "mathjs";
import type { Actuator } from "../types";

const math = create(all);

type FormState = Partial<Actuator> & Record<string, any>;

export default function ActuatorForm({ isAdmin }: { isAdmin: boolean }) {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({});
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

  // Fetch active formulas from Supabase
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

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin) {
      alert("Access denied. Admins only.");
      navigate("/");
    }
  }, [isAdmin, navigate]);

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

      if (formulas.length === 0) {
        setError("No active formulas available. Please contact an administrator.");
        setLoading(false);
        return;
      }

      // Compute derived fields
      let finalData = { ...context };
      try {
        formulas.forEach(({ field_name, formula }) => {
          try {
            finalData[field_name] = math.evaluate(formula, finalData);
          } catch (error) {
            console.error(`Error evaluating formula for ${field_name}:`, error);
          }
        });
      } catch (error) {
        console.error("Error computing derived fields:", error);
        setError("Failed to compute derived fields. Please check your input.");
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from("actuators").insert([finalData]);
      setLoading(false);

      if (insertError) {
        setError("Failed to insert actuator.");
        console.error("Supabase insert error:", insertError);
        alert(`Insert failed: ${insertError.message}`);
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
        {/* Render form fields dynamically */}
        {Object.keys(form).map((key) => (
          <label key={key} style={{ display: "flex", flexDirection: "column" }}>
            {key}
            <input
              type={numberFields.includes(key) ? "number" : "text"}
              value={form[key] || ""}
              onChange={(e) =>
                setForm({ ...form, [key]: numberFields.includes(key) ? Number(e.target.value) : e.target.value })
              }
              style={inputStyle}
            />
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