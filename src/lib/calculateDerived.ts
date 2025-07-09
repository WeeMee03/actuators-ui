import type { Actuator } from '../types';

export function calculateDerivedFields(input: Partial<Actuator>): Partial<Actuator> {
  const {
    peak_torque_nm,
    rated_torque_nm,
    gear_ratio,
    rated_speed_rpm,
    weight_kg,
    overall_diameter_mm,
    overall_length_mm,
  } = input;

  const derived: Partial<Actuator> = {};

  const safe = (v: number | null | undefined) => typeof v === 'number' && !isNaN(v);

  const round = (val: number, dp: number) => parseFloat(val.toFixed(dp));

  // peak torque density after gear = peak torque / weight (1 decimal)
  if (safe(peak_torque_nm) && safe(weight_kg)) {
    derived.peak_torque_density_after_gear_nm_per_kg =
      weight_kg === 0 ? undefined : round(peak_torque_nm! / weight_kg!, 1);
  }

  // overall volume = pi * (diameter/2)^2 * length (rounded 0 decimals)
  if (safe(overall_diameter_mm) && safe(overall_length_mm)) {
    const r = overall_diameter_mm! / 2;
    derived.overall_volume_mm3 = round(Math.PI * r * r * overall_length_mm!, 0);
  }

  // peak torque before gear = peak torque / gear ratio (1 decimal)
  if (safe(peak_torque_nm) && safe(gear_ratio)) {
    derived.peak_torque_before_gear_nm =
      gear_ratio === 0 ? undefined : round(peak_torque_nm! / gear_ratio!, 1);
  }

  // rated torque before gear = rated torque / gear ratio (1 decimal)
  if (safe(rated_torque_nm) && safe(gear_ratio)) {
    derived.rated_torque_before_gear_nm =
      gear_ratio === 0 ? undefined : round(rated_torque_nm! / gear_ratio!, 1);
  }

  // peak_over_rated_torque_ratio = peak torque before gear / rated torque before gear (1 decimal)
  if (
    safe(derived.peak_torque_before_gear_nm) &&
    safe(derived.rated_torque_before_gear_nm)
  ) {
    derived.peak_over_rated_torque_ratio =
      derived.rated_torque_before_gear_nm === 0
        ? undefined
        : round(
            derived.peak_torque_before_gear_nm! / derived.rated_torque_before_gear_nm!,
            1
          );
  }

  // rated speed before gear = rated speed * gear ratio (1 decimal)
  if (safe(rated_speed_rpm) && safe(gear_ratio)) {
    derived.rated_speed_before_gear_rpm = round(rated_speed_rpm! * gear_ratio!, 1);
  }

  // rated torque density before gear = rated torque before gear / weight (1 decimal)
  if (safe(derived.rated_torque_before_gear_nm) && safe(weight_kg)) {
    derived.rated_torque_density_before_gear_nm_per_kg =
      weight_kg === 0
        ? undefined
        : round(derived.rated_torque_before_gear_nm! / weight_kg!, 1);
  }

  // rated power = 2π * rated speed before gear / 60 * rated torque before gear / 1000 (2 decimals)
  if (safe(derived.rated_speed_before_gear_rpm) && safe(derived.rated_torque_before_gear_nm)) {
    const rated_power =
      (2 * Math.PI * derived.rated_speed_before_gear_rpm! * derived.rated_torque_before_gear_nm!) /
      60 /
      1000;
    derived.rated_power_kw = round(rated_power, 2);
  }

  // peak power = 2π * rated speed before gear / 60 * peak torque before gear / 1000 (2 decimals)
  if (safe(derived.rated_speed_before_gear_rpm) && safe(derived.peak_torque_before_gear_nm)) {
    const peak_power =
      (2 * Math.PI * derived.rated_speed_before_gear_rpm! * derived.peak_torque_before_gear_nm!) /
      60 /
      1000;
    derived.peak_power_kw = round(peak_power, 2);
  }

  // rated power density = rated power / weight (2 decimals)
  if (safe(derived.rated_power_kw) && safe(weight_kg)) {
    derived.rated_power_density_kw_per_kg =
      weight_kg === 0 ? undefined : round(derived.rated_power_kw! / weight_kg!, 2);
  }

  // peak power density = peak power / weight (2 decimals)
  if (safe(derived.peak_power_kw) && safe(weight_kg)) {
    derived.peak_power_density_kw_per_kg =
      weight_kg === 0 ? undefined : round(derived.peak_power_kw! / weight_kg!, 2);
  }

  return derived;
}