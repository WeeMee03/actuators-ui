import fs from 'fs';
import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';

// === Supabase Config ===
const supabaseUrl = 'https://kzxdrfefddmdggbosrye.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6eGRyZmVmZGRtZGdnYm9zcnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMzI1NTksImV4cCI6MjA2NjkwODU1OX0.jIlyx-b9Ly3ReD-_1cd9CrjDcvaBlvCEe2-oE9O5EWc';
const supabase = createClient(supabaseUrl, supabaseKey);

// === Upload Function ===
async function uploadCSV(filePath) {
  const rows = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => rows.push(data))
    .on('end', async () => {
      console.log(`📦 Found ${rows.length} rows in CSV.`);

      for (const [index, row] of rows.entries()) {
        try {
          const insertData = {
            manufacturer: row['Manufacturer'],
            model_type: row['Model Type'],
            overall_diameter_mm: parseFloat(row['Overall Diameter (mm)']) || null,
            overall_length_mm: parseFloat(row['Overall Length (mm)']) || null,
            gear_ratio: parseFloat(row['Gear Ratio']) || null,
            rated_torque_nm: parseFloat(row['Rated Torque (Nm)']) || null,
            peak_torque_nm: parseFloat(row['Peak Torque (Nm)']) || null,
            rated_speed_rpm: parseFloat(row['Rated Speed (rpm)']) || null,
            efficiency: parseFloat(row['Efficiency']) || null,
            weight_kg: parseFloat(row['Weight (kg)']) || null,
            built_in_controller: row['Built-in Controller']?.toLowerCase() === 'true',

            // ✅ NEW FIELDS
            dc_voltage_v: parseFloat(row['DC Voltage (V)']) || null,
            peak_torque_density_nm_per_kg: parseFloat(row['Peak Torque Density (Nm/kg)']) || null,
            link: row['Link'] || null,
            created_at: row['Created At'] || null, // optional — skip if DB auto-fills
          };

          const { error } = await supabase.from('actuators').insert([insertData]);

          if (error) {
            console.error(`❌ Error on row ${index + 1}:`, error.message);
          } else {
            console.log(`✅ Inserted row ${index + 1}`);
          }
        } catch (err) {
          console.error(`⚠️ Failed on row ${index + 1}:`, err.message);
        }
      }

      console.log('✅ Upload complete.');
    });
}

// === Run it ===
uploadCSV('tools/actuators.csv');