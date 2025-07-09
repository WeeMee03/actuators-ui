export interface Actuator {
  id: string;
  manufacturer: string;
  model_type: string;
  rated_torque_nm: number | null;
  peak_torque_nm: number | null;
  rated_speed_rpm: number | null;
  overall_diameter_mm?: number | null;
  overall_length_mm?: number | null;
  gear_box?: string | null;
  gear_ratio?: number | null;
  efficiency?: number | null;
  weight_kg?: number | null;
  dc_voltage_v?: number | null;
  peak_torque_density_after_gear_nm_per_kg?: number | null;
  built_in_controller?: boolean | null;
  link?: string | null;
  created_at?: string;
  overall_volume_mm3?: number;
  rated_torque_before_gear_nm?: number;
  peak_torque_before_gear_nm?: number;
  peak_over_rated_torque_ratio?: number;
  rated_speed_before_gear_rpm?: number;
  rated_torque_density_before_gear_nm_per_kg?: number;
  rated_power_kw?: number;
  peak_power_kw?: number;
  rated_power_density_kw_per_kg?: number;
  peak_power_density_kw_per_kg?: number;
}
