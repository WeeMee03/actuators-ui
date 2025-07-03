export interface Actuator {
  id: string;
  manufacturer: string;
  model_type: string;
  rated_torque_nm: number | null;
  peak_torque_nm: number | null;
  rated_speed_rpm: number | null;
  overall_diameter_mm?: number | null;
  overall_length_mm?: number | null;
  gear_ratio?: number | null;
  efficiency?: number | null;
  weight_kg?: number | null;
  dc_voltage_v?: number | null;
  peak_torque_density_nm_per_kg?: number | null;
  built_in_controller?: boolean | null;
  link?: string | null;
  created_at?: string;
}
