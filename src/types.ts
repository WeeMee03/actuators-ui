export interface Actuator {
  id: string;
  manufacturer: string;
  model_type: string;
  overall_diameter_mm: number | null;
  overall_length_mm: number | null;
  gear_ratio: number | null;
  rated_torque_nm: number | null;
  peak_torque_nm: number | null;
  rated_speed_rpm: number | null;
  efficiency: number | null;
  weight_kg: number | null;
  built_in_controller: boolean | null;
  created_at: string;
}
