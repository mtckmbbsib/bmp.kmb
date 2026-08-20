import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PlusCircle, List, Save, Trash2, User, Gauge, Truck, CheckSquare, 
  ClipboardList, AlertTriangle, MessageSquare, Wrench, Calendar, Check, X, ShieldAlert, Edit 
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import SearchableSelect from '../components/SearchableSelect';


// ── DUMMY SPIP DATABASE UNTUK POPULASI NO LAMBUNG ──
const DUMMY_UNITS = [
  { noLambung: 'MMU-18', jenisUnit: 'MMU Truck', merk: 'Iveco', tipe: 'Trakker' },
  { noLambung: 'AFT-017', jenisUnit: 'Anfo Truck', merk: 'Hino', tipe: 'FM280JD' },
];

const JENIS_UNIT_OPTIONS = [
  'Anfo Truck',
  'MMU Truck',
  'Forklift',
  'Compressor',
  'Hot Water Boiler (HWB)',
  'Genset',
  'Light Vehicle (LV)',
  'Crane Truck'
];

// ── COMPRESSOR PM MASTER CHECKLIST (OFFICIAL 4-MONTH & 8-MONTH FORMS F-KMB-BMP-BSIB-001-023 & 024) ──
const COMPRESSOR_PM_MASTER_ITEMS = [
  // 1. UMUM
  { id: 'comp_1', section: '1. UMUM', label: 'Lengkapi dan periksa form P2H sebelumnya (Complete and check the previous P2H form)', tiers: ['4M', '8M'] },
  { id: 'comp_2', section: '1. UMUM', label: 'Lengkapi dan periksa form weekly service sebelumnya (Complete and check the previous weekly service form)', tiers: ['4M', '8M'] },
  { id: 'comp_3', section: '1. UMUM', label: 'Lengkapi dan periksa form PM Service 4 month (Complete and check 4 month PM Service form)', tiers: ['8M'] },

  // 2. PM SERVICE
  { id: 'comp_4_1', section: '2. PM SERVICE', label: 'Drain kondensat dari oil receiver ( ketika kondisi dingin ) (Drain condensate from the oil receiver (when cold))', tiers: ['4M', '8M'] },
  { id: 'comp_4_2', section: '2. PM SERVICE', label: 'Bersihkan filter panel (Clean the panel filter)', tiers: ['4M', '8M'] },
  { id: 'comp_4_3', section: '2. PM SERVICE', label: 'Periksa kondisi van belt ( Ganti jika diperlukan ) (Check van belt condition (replace if necessary))', tiers: ['4M', '8M'] },
  { id: 'comp_4_4', section: '2. PM SERVICE', label: 'Ganti oli kompressor (Change compressor oil)', tiers: ['4M', '8M'] },
  { id: 'comp_4_5', section: '2. PM SERVICE', label: 'Ganti filter oli (Change oil filter)', tiers: ['4M', '8M'] },
  { id: 'comp_4_6', section: '2. PM SERVICE', label: 'Ganti filter oli separator (Change oil separator filter)', tiers: ['4M', '8M'] },
  { id: 'comp_4_7', section: '2. PM SERVICE', label: 'Ganti filter udara (Change air filter)', tiers: ['4M', '8M'] },
  { id: 'comp_4_8', section: '2. PM SERVICE', label: 'Bersihkan oil cooler (Clean oil cooler)', tiers: ['8M'] },
  { id: 'comp_4_9', section: '2. PM SERVICE', label: 'Ganti van belt (Change van belt)', tiers: ['8M'] }
];

// ── HOT WATER BOILER (HWB) PM MASTER CHECKLIST (OFFICIAL FORMS F-KMB-BMP-BSIB-001-020 & 021 3M & 6M HWB) ──
const HWB_PM_MASTER_ITEMS = [
  // 1. UMUM
  { id: 'hwb_1', section: '1. UMUM', label: 'Lengkapi dan periksa form P2H sebelumnya (Complete and check the previous P2H form)', tiers: ['3M', '6M'] },
  { id: 'hwb_2', section: '1. UMUM', label: 'Lengkapi dan periksa form weekly sebelumnya (Complete and check the previous weekly form)', tiers: ['3M', '6M'] },
  { id: 'hwb_3_m', section: '1. UMUM', label: 'Lengkapi dan pemeriksa form service monthly (Complete and check monthly service form)', tiers: ['3M'] },
  { id: 'hwb_3_3m', section: '1. UMUM', label: 'Lengkapi dan pemeriksa form service 3 monthly sebelumnya (Complete and check the previous 3-monthly service form)', tiers: ['6M'] },
  { id: 'hwb_4', section: '1. UMUM', label: 'Lengkapi dan pemeriksa lembar arsip untuk kerja yang tertunda (Complete and check the archive for any pending work.)', tiers: ['3M', '6M'] },

  // 2. BOILER (3M ITEMS)
  { id: 'hwb_5_1', section: '2. BOILER', label: 'Bersihkan sisi api boiler (Clean boiler firesides)', tiers: ['3M'] },
  { id: 'hwb_5_2', section: '2. BOILER', label: 'Test pressure water sirkulasi (Test circulating water pressure)', tiers: ['3M'] },

  // 2. BOILER (6M ITEMS)
  { id: 'hwb_6m_5_1', section: '2. BOILER', label: 'Check bersihkan lorong api (Check and clean fire lanes.)', tiers: ['6M'] },
  { id: 'hwb_6m_5_2', section: '2. BOILER', label: 'Check periksa semua packing (Check all packing.)', tiers: ['6M'] },
  { id: 'hwb_6m_5_3', section: '2. BOILER', label: 'Check bersihkan pipa api / Turbolator (Check and clean fire tubes / turbulators.)', tiers: ['6M'] },

  // 3. BURNER (3M ITEMS)
  { id: 'hwb_6_1', section: '3. BURNER', label: 'Cek dan bersihkan Nozle fuel (Check and clean fuel nozzle)', tiers: ['3M'] },
  { id: 'hwb_6_2', section: '3. BURNER', label: 'Bersihkan fuel pump filter (Clean fuel pump filter)', tiers: ['3M'] },
  { id: 'hwb_6_3', section: '3. BURNER', label: 'Bersihkan electroda ignition (Clean ignition electrode)', tiers: ['3M'] },
  { id: 'hwb_6_4', section: '3. BURNER', label: 'Bersihkan sensor api (Clean flame sensor)', tiers: ['3M'] },
  { id: 'hwb_6_5', section: '3. BURNER', label: 'Check bersihkan kaca lubang intip api (Check and clean flame sight glass)', tiers: ['3M'] },

  // 4. CEROBONG ASAP / CHIMNEY/STACK (6M ITEMS)
  { id: 'hwb_6m_6_1', section: '4. CEROBONG ASAP (CHIMNEY/STACK)', label: 'Check bersihkan cerobong asap (Inspect and clean chimney/stack.)', tiers: ['6M'] },
  { id: 'hwb_6m_6_2', section: '4. CEROBONG ASAP (CHIMNEY/STACK)', label: 'Check sling penahan cerobong (Inspect chimney/stack guy wires/supports.)', tiers: ['6M'] },

  // 5. MOTOR SIRKULASI (CIRCULATION MOTOR - 3M ITEMS)
  { id: 'hwb_7_1', section: '5. MOTOR SIRKULASI (CIRCULATION MOTOR)', label: 'Check kondisi motor sirkulasi (Check circulation motor condition)', tiers: ['3M'] },
  { id: 'hwb_7_2', section: '5. MOTOR SIRKULASI (CIRCULATION MOTOR)', label: 'Check Seal pump serkulasi (Check circulation pump seal)', tiers: ['3M'] },
  { id: 'hwb_7_3', section: '5. MOTOR SIRKULASI (CIRCULATION MOTOR)', label: 'Check joint couplle (Check coupling joint)', tiers: ['3M'] },
  { id: 'hwb_7_4', section: '5. MOTOR SIRKULASI (CIRCULATION MOTOR)', label: 'Check bersihkan filter pompa sirkulasi (Check and clean circulation pump filter)', tiers: ['3M'] },

  // 6. PIPING SYSTEM (3M ITEMS)
  { id: 'hwb_8_1', section: '6. PIPING SYSTEM', label: 'Check periksa valve piping (Check piping valves)', tiers: ['3M'] },
  { id: 'hwb_8_2', section: '6. PIPING SYSTEM', label: 'Check pengencangan baut-baut flange (Check flange bolt tightening)', tiers: ['3M'] }
];

// ── GENSET PM MASTER CHECKLIST (OFFICIAL FORMS F-KMB-BMP-BSIB-001-028 & 029 PM SERVICE 250 & 1000 Hrs GENERATOR SET) ──
const GENSET_PM_MASTER_ITEMS = [
  // 1. UMUM & ARSIP
  { id: 'genset_a', section: '1. UMUM', label: 'Lengkapi dan periksa form P2H sebelumnya (Complete and check the previous P2H form)', tiers: ['250', '1000'] },
  { id: 'genset_b', section: '1. UMUM', label: 'Lengkapi dan pemeriksa lembar arsip untuk kerja yang tertunda (Complete and check the archive for any pending work.)', tiers: ['250', '1000'] },
  { id: 'genset_c', section: '1. UMUM', label: 'Lengkapi dan pemeriksa form weekly inspection sebelumnya (Complete and check the previous weekly inspection form)', tiers: ['250', '1000'] },
  { id: 'genset_d', section: '1. UMUM', label: 'Lengkapi dan periksa form pm service sebelumnya (Complete and check the previous PM Service form)', tiers: ['1000'] },

  // 2. ENGINE (1000 HRS SOS SAMPLES)
  { id: 'genset_sos_1', section: '2. ENGINE', label: 'Ambil oil sampling "SOS" (Take "SOS" oil sample)', tiers: ['1000'], note: '(HP427_SOS Engine Analysis)' },
  { id: 'genset_sos_2', section: '2. ENGINE', label: 'Ambil Coolant sampling "SOS" (Take "SOS" coolant sample)', tiers: ['1000'], note: '(HP428_SOS Coolant Analysis)' },

  // 2. ENGINE
  { id: 'genset_eng_1', section: '2. ENGINE', label: 'Ganti oli mesin (Change engine oil)', tiers: ['250', '1000'] },
  { id: 'genset_eng_2', section: '2. ENGINE', label: 'Ganti filter oli (Change oil filter)', tiers: ['250', '1000'] },
  { id: 'genset_eng_4', section: '2. ENGINE', label: 'Ganti filter solar (Replace fuel filter)', tiers: ['250', '1000'] },
  { id: 'genset_eng_5', section: '2. ENGINE', label: 'Cek & bersihkan fuel sistem (Inspect & clean fuel system)', tiers: ['250', '1000'] },
  { id: 'genset_eng_6', section: '2. ENGINE', label: 'Cek dan bersihkan coolant sistem ( air radiator diganti HM 3000 / Per 12 bln ) (Inspect and clean coolant system (replace radiator water at 3000 HM / every 12 months))', tiers: ['250', '1000'] },
  { id: 'genset_eng_7', section: '2. ENGINE', label: 'Cek kondisi V-Belt ( Ganti HM 3000 / Per 12 Bulan ) (Inspect V-belt condition (replace at 3000 HM / every 12 months))', tiers: ['250', '1000'] },
  { id: 'genset_eng_8', section: '2. ENGINE', label: 'Cek exhaust sistem (Inspect exhaust system)', tiers: ['250', '1000'] },
  { id: 'genset_eng_9', section: '2. ENGINE', label: 'Cek & bersihkan filter udara (Ganti setiap 1000 HM) (Inspect & clean air filter (replace every 1000 HM))', tiers: ['250', '1000'] },
  { id: 'genset_eng_10', section: '2. ENGINE', label: 'Cek Bolt Engine Mounting (Inspect engine mounting bolts)', tiers: ['250', '1000'] },

  // 3. GENERATOR
  { id: 'genset_gen_11', section: '3. GENERATOR', label: 'Cek Bolt Generator Mounting (Inspect generator mounting bolts)', tiers: ['250', '1000'] },
  { id: 'genset_gen_12', section: '3. GENERATOR', label: 'Cek Cover & Flexible Bolt Generator (Inspect generator cover & flexible bolts)', tiers: ['250', '1000'] },
  { id: 'genset_gen_13', section: '3. GENERATOR', label: 'Cek kabel generator (Inspect generator cables)', tiers: ['250', '1000'] },
  { id: 'genset_gen_14', section: '3. GENERATOR', label: 'Cek terminal kabel generator (Inspect generator cable terminals)', tiers: ['250', '1000'] },

  // 4. ELECTRIC
  { id: 'genset_elec_15', section: '4. ELECTRIC', label: 'Cek motor starting sistem (Check the motor starting system)', tiers: ['250', '1000'] },
  { id: 'genset_elec_18', section: '4. ELECTRIC', label: 'Cek fungsi dari alternator (Check the alternator function)', tiers: ['250', '1000'] },
  { id: 'genset_elec_19', section: '4. ELECTRIC', label: 'Cek dan bersihkan Exciter (Check and clean the Exciter)', tiers: ['250', '1000'] },
  { id: 'genset_elec_20', section: '4. ELECTRIC', label: 'Cek grounding sistem (Check the grounding system)', tiers: ['250', '1000'] },
  { id: 'genset_elec_21', section: '4. ELECTRIC', label: 'Cek bracket, air dan terminal aki (Check the battery bracket, water, and terminals)', tiers: ['250', '1000'] }
];

// ── FORKLIFT PM MASTER CHECKLIST (OFFICIAL FORM F-KMB-BMP-BSIB-001-013 PERIODIC 250/500/1000 HM) ──
const FORKLIFT_PM_MASTER_ITEMS = [
  // 1. UMUM
  { id: 'fk_1_1', section: '1. UMUM', label: 'Lengkapi dan periksa form P2H sebelumnya (Complete and check the previous P2H form)', tiers: ['250', '500', '1000', '2000'] },
  { id: 'fk_1_2', section: '1. UMUM', label: 'Lengkapi dan periksa form weekly sebelumnya (Complete and check the previous weekly form)', tiers: ['250', '500', '1000', '2000'] },
  { id: 'fk_1_3', section: '1. UMUM', label: 'Lengkapi dan pemeriksa lembar arsip untuk kerja yang tertunda (Complete and check the archive for any pending work.)', tiers: ['250', '500', '1000', '2000'] },
  { id: 'fk_1_4', section: '1. UMUM', label: 'Lengkapi dan pemeriksa form PM Service A, 250 Hrs sebelumnya (Complete and check the PM Service A, 250 Hrs form from before.)', tiers: ['1000', '2000'] },

  // 2. ENGINE, TRANSMISI & DRIVE TRAIN
  { id: 'fk_2_1', section: '2. ENGINE, TRANSMISI & DRIVE TRAIN', label: 'Ganti oli mesin ( HM 250 / 500 / 750 / 1000 ) (Engine Oil Change (250 / 500 / 750 / 1000 HM))', tiers: ['250', '500', '1000', '2000'] },
  { id: 'fk_2_2', section: '2. ENGINE, TRANSMISI & DRIVE TRAIN', label: 'Ganti filter oli ( HM 250 / 500 / 750 / 1000 ) (Oil Filter Replacement (250 / 500 / 750 / 1000 HM))', tiers: ['250', '500', '1000', '2000'] },
  { id: 'fk_2_3', section: '2. ENGINE, TRANSMISI & DRIVE TRAIN', label: 'Ganti filter solar ( HM 250 / 500 / 750 / 1000 ) (Fuel Filter Replacement (250 / 500 / 750 / 1000 HM))', tiers: ['250', '500', '1000', '2000'] },
  { id: 'fk_2_4_hyd', section: '2. ENGINE, TRANSMISI & DRIVE TRAIN', label: 'Ganti filter hydraulic ( HM 1000 / per 6 bulan ) (Hydraulic Filter Replacement (1000 HM / every 6 months))', tiers: ['1000', '2000'] },
  { id: 'fk_2_4_air', section: '2. ENGINE, TRANSMISI & DRIVE TRAIN', label: 'Ganti filter udara ( HM 1000 / per 3 bulan ) (Air Filter Replacement (1000 HM / every 3 months))', tiers: ['1000', '2000'] },
  { id: 'fk_2_5', section: '2. ENGINE, TRANSMISI & DRIVE TRAIN', label: 'Ganti oli transmisi ( HM 1000 / per 6 bulan ) (Transmission Oil Change (1000 HM / every 6 months))', tiers: ['1000', '2000'] },
  { id: 'fk_2_6', section: '2. ENGINE, TRANSMISI & DRIVE TRAIN', label: 'Ganti oli gardan ( HM 1000 / per 6 bulan ) (Differential Oil Change (1000 HM / every 6 months))', tiers: ['1000', '2000'] },
  { id: 'fk_2_7', section: '2. ENGINE, TRANSMISI & DRIVE TRAIN', label: 'Periksa kondisi semua fitting dan hose hydraulik (Inspect all hydraulic fittings and hoses for condition)', tiers: ['250', '500', '1000', '2000'] },
  { id: 'fk_2_8', section: '2. ENGINE, TRANSMISI & DRIVE TRAIN', label: 'Periksa kondisi mast cylinder up / tilt (Inspect mast cylinder (up / tilt) for condition)', tiers: ['250', '500', '1000', '2000'] },
  { id: 'fk_2_9', section: '2. ENGINE, TRANSMISI & DRIVE TRAIN', label: 'Periksa dan kencangkan V-Belt ( ganti per HM 2000 / PER 12 BLN) (Inspect and tension V-Belt (replace every 2000 HM / every 12))', tiers: ['250', '500', '1000', '2000'] },
  { id: 'fk_sos_eng', section: '2. ENGINE, TRANSMISI & DRIVE TRAIN', label: 'Ambil Oil Sample Engine "SOS" (HM 1000) (Take Engine Oil Sample "SOS" (HM 1000))', tiers: ['1000', '2000'] },
  { id: 'fk_sos_cool', section: '2. ENGINE, TRANSMISI & DRIVE TRAIN', label: 'Ambil Coolant Sample "SOS" (HM 1000) (Take Coolant Sample "SOS" (HM 1000))', tiers: ['1000', '2000'] },

  // 3. KELISTRIKAN
  { id: 'fk_3_1', section: '3. KELISTRIKAN', label: 'Periksa kondisi sambungan / socket kelistrikan (Inspect electrical connections/sockets.)', tiers: ['250', '500', '1000', '2000'] },
  { id: 'fk_3_2', section: '3. KELISTRIKAN', label: 'Periksa level air aki tambah jika diperlukan (Check battery water level; top up if necessary.)', tiers: ['250', '500', '1000', '2000'] },
  { id: 'fk_3_3', section: '3. KELISTRIKAN', label: 'Periksa kondisi semua baut aki (Inspect the condition of all battery bolts.)', tiers: ['250', '500', '1000', '2000'] },
  { id: 'fk_3_4', section: '3. KELISTRIKAN', label: 'Bersihkan dan lumasi terminal aki (Clean and lubricate battery terminals.)', tiers: ['250', '500', '1000', '2000'] },
  { id: 'fk_3_5', section: '3. KELISTRIKAN', label: 'Periksa kondisi alternator (Inspect the condition of the alternator.)', tiers: ['250', '500', '1000', '2000'] }
];

// ── MASTER PM CHECKLIST TEMPLATE (ANFO TRUCK OFFICIAL FORM) ──
const ANFO_PM_MASTER_ITEMS = [
  // 1. UMUM
  { id: 'pm_1_1', section: '1. UMUM', label: 'Lengkapi dan periksa form P2H sebelumnya', isHm500Only: false },
  { id: 'pm_1_2', section: '1. UMUM', label: 'Lengkapi dan periksa form weekly sebelumnya', isHm500Only: false },
  { id: 'pm_1_3', section: '1. UMUM', label: 'Lengkapi dan periksa lembar arsip untuk kerja yang tertunda', isHm500Only: false },
  { id: 'pm_1_4', section: '1. UMUM', label: 'Cuci bersih unit bagian luar dan cabin', isHm500Only: false },

  // 2. ENGINE DAN TRANSMISI
  { id: 'pm_2_1', section: '2. ENGINE DAN TRANSMISI', label: 'Periksa kebocoran pada baut-baut & penahan transmisi & mesin', isHm500Only: false },
  { id: 'pm_2_2', section: '2. ENGINE DAN TRANSMISI', label: 'Periksa kerusakan & kebocoran pada selang radiator, cek level radiator', isHm500Only: false },
  { id: 'pm_2_3', section: '2. ENGINE DAN TRANSMISI', label: 'Periksa kondisi rakitan dan terminal listrik', isHm500Only: false },
  { id: 'pm_2_4', section: '2. ENGINE DAN TRANSMISI', label: 'Ganti oli mesin', isHm500Only: false },
  { id: 'pm_2_5', section: '2. ENGINE DAN TRANSMISI', label: 'Ganti oil filter', isHm500Only: false },
  { id: 'pm_2_6', section: '2. ENGINE DAN TRANSMISI', label: 'Ganti fuel filter', isHm500Only: false },
  { id: 'pm_2_7', section: '2. ENGINE DAN TRANSMISI', label: 'Periksa level oli differensial depan & belakang (tambah jika diperlukan)', isHm500Only: false },
  { id: 'pm_2_8', section: '2. ENGINE DAN TRANSMISI', label: 'Periksa level oli transmisi (tambah jika diperlukan)', isHm500Only: false },
  { id: 'pm_2_9', section: '2. ENGINE DAN TRANSMISI', label: 'Periksa bagian pipa kenalpot dan dudukan', isHm500Only: true, note: '( HM 500 atau per 6 bln )' },

  // 3. CABIN
  { id: 'pm_3_1', section: '3. CABIN', label: 'Periksa fungsi instrument panel', isHm500Only: false },
  { id: 'pm_3_2', section: '3. CABIN', label: 'Periksa gauge tekanan angin & fungsi pada rem di instrument', isHm500Only: false },
  { id: 'pm_3_3', section: '3. CABIN', label: 'Periksa pedal kopling berfungsi dengan baik', isHm500Only: false },
  { id: 'pm_3_4', section: '3. CABIN', label: 'Periksa komponen cabin & pintu tertutup dengan baik', isHm500Only: false },

  // 4. CHASIS AND DRIVE TRAIN
  { id: 'pm_4_1', section: '4. CHASIS AND DRIVE TRAIN', label: 'Periksa secara umum terhadap kerusakan, kehilangan mur & baut', isHm500Only: false },
  { id: 'pm_4_2', section: '4. CHASIS AND DRIVE TRAIN', label: 'Periksa kebocoran dan pengaman pada shock absorber', isHm500Only: false },
  { id: 'pm_4_3', section: '4. CHASIS AND DRIVE TRAIN', label: 'Periksa dan lumasi bearing-bearing yang ada', isHm500Only: false },
  { id: 'pm_4_4', section: '4. CHASIS AND DRIVE TRAIN', label: 'Periksa fungsi rem parkir (hand brake)', isHm500Only: false },
  { id: 'pm_4_5', section: '4. CHASIS AND DRIVE TRAIN', label: 'Periksa jalur pipa rem keseluruhan', isHm500Only: true, note: '( HM 500 atau per 6 bln )' },
  { id: 'pm_4_6', section: '4. CHASIS AND DRIVE TRAIN', label: 'Periksa pengaman spring, spring dan mounting', isHm500Only: false },
  { id: 'pm_4_7', section: '4. CHASIS AND DRIVE TRAIN', label: 'Periksa kondisi stabilizer dan joint nya', isHm500Only: false },
  { id: 'pm_4_8', section: '4. CHASIS AND DRIVE TRAIN', label: 'Periksa kondisi torque rod', isHm500Only: true, note: '( HM 500 atau per 6 bln )' },

  // 5. ENGINE KUBOTA
  { id: 'pm_5_1', section: '5. ENGINE KUBOTA', label: 'Periksa baut-baut & penahan mesin / engine mounting', isHm500Only: false },
  { id: 'pm_5_2', section: '5. ENGINE KUBOTA', label: 'Periksa kondisi rakitan dan terminal listrik', isHm500Only: false },
  { id: 'pm_5_3', section: '5. ENGINE KUBOTA', label: 'Ganti oli mesin Kubota', isHm500Only: false },
  { id: 'pm_5_4', section: '5. ENGINE KUBOTA', label: 'Ganti oil filter Kubota', isHm500Only: false },
  { id: 'pm_5_5', section: '5. ENGINE KUBOTA', label: 'Ganti fuel filter Kubota', isHm500Only: false },

  // 6. MIXING UNIT / ANFO
  { id: 'pm_6_1', section: '6. MIXING UNIT / ANFO', label: 'Periksa kondisi fuel pump / fuel proses', isHm500Only: false },
  { id: 'pm_6_2', section: '6. MIXING UNIT / ANFO', label: 'Periksa kondisi pipa fuel proses (tidak ada kebocoran)', isHm500Only: false },
  { id: 'pm_6_3', section: '6. MIXING UNIT / ANFO', label: 'Ganti fuel filter proses', isHm500Only: false },
  { id: 'pm_6_4', section: '6. MIXING UNIT / ANFO', label: 'Periksa kondisi semua kopling penggerak', isHm500Only: false },
  { id: 'pm_6_5', section: '6. MIXING UNIT / ANFO', label: 'Periksa kondisi cylinder boom discharge auger', isHm500Only: false },
  { id: 'pm_6_6', section: '6. MIXING UNIT / ANFO', label: 'Periksa kondisi pin cylinder boom discharge auger', isHm500Only: false },
  { id: 'pm_6_7', section: '6. MIXING UNIT / ANFO', label: 'Periksa kondisi braket cylinder boom discharge auger', isHm500Only: false }
];

// ── ANFO TRUCK PM 1000 FORM ITEMS (From Official Form Image) ──
const ANFO_PM_1000_ITEMS = [
  // 1. UMUM
  { id: 'pm1000_1_1', section: '1. UMUM', label: 'Lengkapi dan periksa form P2H sebelumnya' },
  { id: 'pm1000_1_2', section: '1. UMUM', label: 'Lengkapi dan periksa form weekly sebelumnya' },
  { id: 'pm1000_1_3', section: '1. UMUM', label: 'Lengkapi dan periksa lembar arsip untuk kerja yang tertunda' },
  { id: 'pm1000_1_4', section: '1. UMUM', label: 'Lengkapi dan periksa lembar arsip PM service sebelumnya' },
  { id: 'pm1000_1_5', section: '1. UMUM', label: 'Cuci bersih unit bagian luar dan cabin' },

  // 2. ENGINE
  { id: 'pm1000_2_1', section: '2. ENGINE', label: 'Ganti oli mesin' },
  { id: 'pm1000_2_2', section: '2. ENGINE', label: 'Ganti oil filter' },
  { id: 'pm1000_2_3', section: '2. ENGINE', label: 'Ganti fuel filter' },
  { id: 'pm1000_2_4', section: '2. ENGINE', label: 'Ganti air filter' },
  { id: 'pm1000_2_5', section: '2. ENGINE', label: 'Periksa kondisi mesin dalam keadaan "idle"' },
  { id: 'pm1000_2_6', section: '2. ENGINE', label: 'Periksa altenator masih dapat mengisi atau tidak' },
  { id: 'pm1000_2_7', section: '2. ENGINE', label: 'Bersihkan mesin' },
  { id: 'pm1000_2_8', section: '2. ENGINE', label: 'Ganti V-belt', note: '( HM 3000 / per 12 bulan )' },

  // 3. CHASIS AND DRIVE TRAIN
  { id: 'pm1000_3_1', section: '3. CHASIS AND DRIVE TRAIN', label: 'Ganti oli differensial depan dan belakang' },
  { id: 'pm1000_3_2', section: '3. CHASIS AND DRIVE TRAIN', label: 'Ganti oli transmisi' },
  { id: 'pm1000_3_3', section: '3. CHASIS AND DRIVE TRAIN', label: 'Periksa kondisi steering sistem' },
  { id: 'pm1000_3_4', section: '3. CHASIS AND DRIVE TRAIN', label: 'Ganti minyak coupling', note: '( HM 50.000 )' },

  // 4. ENGINE KUBOTA
  { id: 'pm1000_4_1', section: '4. ENGINE KUBOTA', label: 'Periksa baut-baut & penahan mesin / engine mounting' },
  { id: 'pm1000_4_2', section: '4. ENGINE KUBOTA', label: 'Ganti oli mesin Kubota' },
  { id: 'pm1000_4_3', section: '4. ENGINE KUBOTA', label: 'Ganti oil filter Kubota' },
  { id: 'pm1000_4_4', section: '4. ENGINE KUBOTA', label: 'Ganti fuel filter Kubota' },
  { id: 'pm1000_4_5', section: '4. ENGINE KUBOTA', label: 'Ganti V-belt Kubota', note: '( HM 3000 / per 12 bulan )' },

  // 5. MIXING UNIT / ANFO
  { id: 'pm1000_5_1', section: '5. MIXING UNIT / ANFO', label: 'Periksa kondisi fuel pump / fuel proses' },
  { id: 'pm1000_5_2', section: '5. MIXING UNIT / ANFO', label: 'Ganti fuel filter proses' },
  { id: 'pm1000_5_3', section: '5. MIXING UNIT / ANFO', label: 'Ganti filter hydraulic proses mixing' },
  { id: 'pm1000_5_4', section: '5. MIXING UNIT / ANFO', label: 'Periksa kondisi hose level pada tangki hydraulik (ganti jika diperlukan)' },
  { id: 'pm1000_5_5', section: '5. MIXING UNIT / ANFO', label: 'Periksa kondisi hose level pada tangki air (ganti jika diperlukan)' },
  { id: 'pm1000_5_6', section: '5. MIXING UNIT / ANFO', label: 'Periksa kondisi hose level pada tangki fuel proses (ganti jika diperlukan)' }
];

// ── MASTER PM CHECKLIST TEMPLATE (MMU TRUCK OFFICIAL FORM HM 250 & 500) ──
const MMU_PM_MASTER_ITEMS = [
  // 1. UMUM
  { id: 'mmu_1_1', section: '1. UMUM', label: 'Lengkapi dan periksa form P2H sebelumnya', isHm500Only: false },
  { id: 'mmu_1_2', section: '1. UMUM', label: 'Lengkapi dan periksa form weekly sebelumnya', isHm500Only: false },
  { id: 'mmu_1_3', section: '1. UMUM', label: 'Lengkapi dan periksa lembar arsip untuk kerja yang tertunda', isHm500Only: false },
  { id: 'mmu_1_4', section: '1. UMUM', label: 'Cuci bersih unit bagian luar dan cabin', isHm500Only: false },

  // 2. ENGINE DAN TRANSMISI
  { id: 'mmu_2_1', section: '2. ENGINE DAN TRANSMISI', label: 'Ganti oli mesin', isHm500Only: false },
  { id: 'mmu_2_2', section: '2. ENGINE DAN TRANSMISI', label: 'Ganti oil filter', isHm500Only: false },
  { id: 'mmu_2_3', section: '2. ENGINE DAN TRANSMISI', label: 'Ganti fuel filter', isHm500Only: false },
  { id: 'mmu_2_4', section: '2. ENGINE DAN TRANSMISI', label: 'Ganti fuel filter separator', isHm500Only: false },
  { id: 'mmu_2_5', section: '2. ENGINE DAN TRANSMISI', label: 'Periksa level oli differensial depan & belakang (tambah jika diperlukan)', isHm500Only: false },
  { id: 'mmu_2_6', section: '2. ENGINE DAN TRANSMISI', label: 'Periksa level oli transmisi (tambah jika diperlukan)', isHm500Only: false },
  { id: 'mmu_2_7', section: '2. ENGINE DAN TRANSMISI', label: 'Periksa level oli transfer case (tambah jika diperlukan)', isHm500Only: false },
  { id: 'mmu_2_8', section: '2. ENGINE DAN TRANSMISI', label: 'Periksa kebocoran pada baut-baut & penahan transmisi & mesin', isHm500Only: false },
  { id: 'mmu_2_9', section: '2. ENGINE DAN TRANSMISI', label: 'Periksa kondisi dan kekencangan V-Belt', isHm500Only: false },
  { id: 'mmu_2_10', section: '2. ENGINE DAN TRANSMISI', label: 'Periksa kerusakan & kebocoran pada selang radiator, cek level radiator', isHm500Only: false },
  { id: 'mmu_2_11', section: '2. ENGINE DAN TRANSMISI', label: 'Periksa kerusakan pada rakitan dan terminal listrik', isHm500Only: false },

  // 3. CABIN
  { id: 'mmu_3_1', section: '3. CABIN', label: 'Periksa fungsi instrument panel', isHm500Only: false },
  { id: 'mmu_3_2', section: '3. CABIN', label: 'Periksa gauge tekanan angin & fungsi pada rem di instrument', isHm500Only: false },
  { id: 'mmu_3_3', section: '3. CABIN', label: 'Periksa pedal kopling berfungsi dengan baik', isHm500Only: false },
  { id: 'mmu_3_4', section: '3. CABIN', label: 'Periksa komponen cabin & pintu tertutup dengan baik', isHm500Only: false },
  { id: 'mmu_3_5', section: '3. CABIN', label: 'Periksa kondisi dan fungsi tilt cabin', isHm500Only: false },

  // 4. CHASIS AND DRIVE TRAIN
  { id: 'mmu_4_1', section: '4. CHASIS AND DRIVE TRAIN', label: 'Periksa secara umum terhadap kerusakan, kehilangan mur & baut', isHm500Only: false },
  { id: 'mmu_4_2', section: '4. CHASIS AND DRIVE TRAIN', label: 'Bersihkan breather differensial', isHm500Only: false },
  { id: 'mmu_4_3', section: '4. CHASIS AND DRIVE TRAIN', label: 'Periksa kebocoran dan pengaman pada shock absorber', isHm500Only: false },
  { id: 'mmu_4_4', section: '4. CHASIS AND DRIVE TRAIN', label: 'Periksa dan lumasi bearing-bearing yang ada', isHm500Only: false },
  { id: 'mmu_4_5', section: '4. CHASIS AND DRIVE TRAIN', label: 'Periksa fungsi rem parkir (hand brake)', isHm500Only: false },
  { id: 'mmu_4_6', section: '4. CHASIS AND DRIVE TRAIN', label: 'Periksa pengaman spring, spring dan mounting', isHm500Only: false },
  { id: 'mmu_4_7', section: '4. CHASIS AND DRIVE TRAIN', label: 'Periksa kondisi stabilizer dan joint nya', isHm500Only: false },

  // 5. MIXING UNIT / MMU
  { id: 'mmu_5_1', section: '5. MIXING UNIT / MMU', label: 'Periksa oli cat pump ( Ganti di HM 500 )', isHm500Only: true, note: '( Ganti di HM 500 )' },
  { id: 'mmu_5_2', section: '5. MIXING UNIT / MMU', label: 'Periksa kondisi semua kopling penggerak motor hydraulic', isHm500Only: false }
];

// ── MMU TRUCK - IVECO OFFICIAL 4-TIER FORM (HM 250, 500, 1000, 2000) ──
const MMU_IVECO_OFFICIAL_ITEMS = [
  // 1. INFORMASI UMUM
  { id: 'iveco_1_1', section: '1. INFORMASI UMUM', label: 'Lengkapi dan periksa lembar arsip untuk kerja yang tertunda (Check & periksa lembar arsip backlog)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_1_2', section: '1. INFORMASI UMUM', label: 'Cuci bersih unit bagian luar dan cabin (Thoroughly clean unit exterior and cabin)', tiers: ['A', 'B', 'C', 'D'] },

  // 2. TAKE OIL SAMPLE
  { id: 'iveco_2_1', section: '2. TAKE OIL SAMPLE', label: 'Ambil sampel oli mesin (Take engine oil sample)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_2_2', section: '2. TAKE OIL SAMPLE', label: 'Ambil sampel oli transmisi (Take transmission oil sample)', tiers: ['C', 'D'] },
  { id: 'iveco_2_3', section: '2. TAKE OIL SAMPLE', label: 'Ambil sampel oli roda depan (jika ada) (Take middle axle oil sample if applicable)', tiers: ['C', 'D'] },
  { id: 'iveco_2_4', section: '2. TAKE OIL SAMPLE', label: 'Ambil sampel oli poros tengah (jika ada) (Take middle axle oil sample if applicable)', tiers: ['C', 'D'] },
  { id: 'iveco_2_5', section: '2. TAKE OIL SAMPLE', label: 'Ambil sampel oli poros belakang (jika ada) (Take rear axle oil sample if applicable)', tiers: ['C', 'D'] },
  { id: 'iveco_2_6', section: '2. TAKE OIL SAMPLE', label: 'Ambil sampel oli penggerak akhir depan (jika ada) (Take front final drive oil sample if applicable)', tiers: ['C', 'D'] },
  { id: 'iveco_2_7', section: '2. TAKE OIL SAMPLE', label: 'Ambil sampel oli penggerak akhir depan kanan (Take front RH final drive oil sample if applicable)', tiers: ['C', 'D'] },
  { id: 'iveco_2_8', section: '2. TAKE OIL SAMPLE', label: 'Ambil sampel oli penggerak akhir depan kiri (Take front LH final drive oil sample if applicable)', tiers: ['C', 'D'] },
  { id: 'iveco_2_9', section: '2. TAKE OIL SAMPLE', label: 'Ambil sampel oli penggerak akhir belakang kiri (Take rear LH final drive oil sample)', tiers: ['C', 'D'] },
  { id: 'iveco_2_10', section: '2. TAKE OIL SAMPLE', label: 'Ambil sampel oli penggerak akhir belakang kanan (Take rear RH final drive oil sample)', tiers: ['C', 'D'] },
  { id: 'iveco_2_11', section: '2. TAKE OIL SAMPLE', label: 'Ambil sampel cairan pendingin (radiator) (Take radiator coolant sample)', tiers: ['C', 'D'] },
  { id: 'iveco_2_12', section: '2. TAKE OIL SAMPLE', label: 'Ambil sampel oli hidrolik (Take hydraulic attachment oil sample)', tiers: ['C', 'D'] },

  // 3. COMPONENT REPLACEMENT
  { id: 'iveco_3_1', section: '3. COMPONENT REPLACEMENT', label: 'Ganti oli mesin (Change engine oil)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_3_2', section: '3. COMPONENT REPLACEMENT', label: 'Ganti filter oli mesin (Replace engine oil filter)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_3_3', section: '3. COMPONENT REPLACEMENT', label: 'Ganti pra-filter bahan bakar (separator) (Replace fuel pre-filter primary)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_3_4', section: '3. COMPONENT REPLACEMENT', label: 'Ganti filter bahan bakar (sekunder) (Replace fuel filter secondary)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_3_5', section: '3. COMPONENT REPLACEMENT', label: 'Pelumasan umum chassis (General greasing of chassis)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_3_6', section: '3. COMPONENT REPLACEMENT', label: 'Ganti filter elemen blower udara luar & cabin mesin (Replace engine outer & cabin filter cartridge)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_3_7', section: '3. COMPONENT REPLACEMENT', label: 'Ganti filter udara elemen luar & elemen dalam (Replace engine outer & inner air filter cartridge)', tiers: ['C', 'D'] },
  { id: 'iveco_3_8', section: '3. COMPONENT REPLACEMENT', label: 'Ganti pengering pengering udara (Replace air dryer cartridge)', tiers: ['C', 'D'] },
  { id: 'iveco_3_9', section: '3. COMPONENT REPLACEMENT', label: 'Ganti filter hidrolik kemudi (Replace steering hydraulic filter)', tiers: ['C', 'D'] },
  { id: 'iveco_3_10', section: '3. COMPONENT REPLACEMENT', label: 'Ganti oli transmisi (Change transmission oil)', tiers: ['D'] },
  { id: 'iveco_3_11', section: '3. COMPONENT REPLACEMENT', label: 'Ganti oli gardan (Change transaxle/axle oil)', tiers: ['D'] },
  { id: 'iveco_3_12', section: '3. COMPONENT REPLACEMENT', label: 'Ganti oli reduksi roda gigi reduksi (Change all wheel reduction oil)', tiers: ['D'] },
  { id: 'iveco_3_13', section: '3. COMPONENT REPLACEMENT', label: 'Ganti oli transfer case (Replace transfer case oil)', tiers: ['D'] },
  { id: 'iveco_3_14', section: '3. COMPONENT REPLACEMENT', label: 'Ganti filter aditif penggerak akhir (Replace adBlue filter element cartridge)', tiers: ['D'] },
  { id: 'iveco_3_15', section: '3. COMPONENT REPLACEMENT', label: 'Ganti elemen filter adBlue (modul pompa) (Replace adBlue filter pump module)', tiers: ['D'] },
  { id: 'iveco_3_16', section: '3. COMPONENT REPLACEMENT', label: 'Ganti filter kabin (Replace cabin filter cartridge)', tiers: ['D'] },

  // 4. CLEAN UP
  { id: 'iveco_4_1', section: '4. CLEAN UP', label: 'Kuras air dan bersihkan penyaring awal bahan bakar (Drain and clean up water separator fuel prefilter)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_4_2', section: '4. CLEAN UP', label: 'Kuras tangki udara (Drain air tank)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_4_3', section: '4. CLEAN UP', label: 'Bersihkan elemen saringan udara mesin (Clean engine air filter)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_4_4', section: '4. CLEAN UP', label: 'Bersihkan filter udara kabin (Clean up cabin air filter)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_4_5', section: '4. CLEAN UP', label: 'Bersihkan Radiator, Intercooler, Kondensor AC (Clean radiator, intercooler, AC condenser)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_4_6', section: '4. CLEAN UP', label: 'Bersihkan Katup Induksi, saringan pengikat, dan breather (Clean up induction cap, full screen, and breather)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_4_7', section: '4. CLEAN UP', label: 'Bersihkan Saluran Air buangan saringan udara (Clean up air filter valve drain)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_4_8', section: '4. CLEAN UP', label: 'Bersihkan Tangki pembuangan bahan bakar dan dudukan (Clean up fuel tank and bracket)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_4_9', section: '4. CLEAN UP', label: 'Periksa dan Bersihkan Fuel Y strainer filter BM Mixing (Check and Clean Water Filter BM Mixing)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_4_10', section: '4. CLEAN UP', label: 'Periksa dan Bersihkan Gasser Y strainer filter BM Mixing (Check and Clean Gasser Y Strainer BM Mixing)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_4_11', section: '4. CLEAN UP', label: 'Periksa dan Bersihkan Water Y strainer filter BM Mixing (Check and Clean Water Y Strainer BM Mixing)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_4_12', section: '4. CLEAN UP', label: 'Periksa dan Bersihkan Flowmeter (BM Mixing) (Check and Clean Flowmeter BM Mixing)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_4_13', section: '4. CLEAN UP', label: 'Periksa dan Bersihkan Filter Hydraulic Tank (Check and Clean Hydraulic Tank Filter)', tiers: ['A', 'B', 'C', 'D'] },

  // 5. CHECK & INSPECTION
  { id: 'iveco_5_1', section: '5. CHECK & INSPECTION', label: 'Periksa level cairan pendingin mesin (Check engine coolant level)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_2', section: '5. CHECK & INSPECTION', label: 'Periksa level minyak kemudi (Check steering oil level)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_3', section: '5. CHECK & INSPECTION', label: 'Periksa level cairan sistem hidrolik pendingin kabin (Check air conditioning hydraulic system fluid level)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_4', section: '5. CHECK & INSPECTION', label: 'Periksa wiper pencuci kaca depan (Check windshield washer fluid level)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_5', section: '5. CHECK & INSPECTION', label: 'Periksa wiper kaca depan (Check window wiper)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_6', section: '5. CHECK & INSPECTION', label: 'Berikan pemeriksaan kondisi ban, baut, serta tekanan angin (Check condition and air pressure of tyres, adjust pressure if necessary)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_7', section: '5. CHECK & INSPECTION', label: 'Periksa kebocoran pada selang sistem pendingin mesin (Check for leaks on cooling system hose hoses/connections)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_8', section: '5. CHECK & INSPECTION', label: 'Periksa indikator sabuk (Check belt indicator)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_9', section: '5. CHECK & INSPECTION', label: 'Periksa lampu eksterior (Check exterior lights)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_10', section: '5. CHECK & INSPECTION', label: 'Periksa apakah takaran baterai dalam kondisi baik dan pengisian pengisiannya benar (Check battery liquid level in original container and check battery voltage - Voltage Battery > 24V)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_11', section: '5. CHECK & INSPECTION', label: 'Bersihkan dan lumasi terminal Baterai (Clean terminal & battery bracket)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_12', section: '5. CHECK & INSPECTION', label: 'Bersihkan kabel & area tempat baterai (Clean cable & battery water area)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_13', section: '5. CHECK & INSPECTION', label: 'Periksa kebocoran pada sistem pendingin mesin (Check tightness of engine cooling system)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_14', section: '5. CHECK & INSPECTION', label: 'Periksa sistem kemudi untuk kebocoran (Check steering hydraulic system for leaks)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_15', section: '5. CHECK & INSPECTION', label: 'Periksa kondisi selang rem (Check condition of brake hoses)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_16', section: '5. CHECK & INSPECTION', label: 'Periksa perikatan penyangga mesin (Check fastening of engine supports)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_17', section: '5. CHECK & INSPECTION', label: 'Periksa keretakan dan baut pegas depan & belakang (Check state of rear spring leaves & u-bolts)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_18', section: '5. CHECK & INSPECTION', label: 'Periksa perikatan sasis depan & belakang (Check fastening of steering system levers and rod)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_19', section: '5. CHECK & INSPECTION', label: 'Periksa suara kerja dan suhu mesin, gearbox, gardan (Check the running sound and temperature of engine gearbox, axle)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_20', section: '5. CHECK & INSPECTION', label: 'Periksa apakah setiap elemen memiliki tingkat kekencangan yang sesuai (Check if every component matches key torque specs)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_21', section: '5. CHECK & INSPECTION', label: 'Periksa apakah sistem pompa air, selang, tabung penampung berfungsi baik (Check all cooling system hoses, water pump, expansion tank)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_22', section: '5. CHECK & INSPECTION', label: 'Periksa apakah setiap bagian memiliki gesekan satu sama lain (Check if every part has friction with each other, check for wear, rub points or abnormal contact)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_23', section: '5. CHECK & INSPECTION', label: 'Periksa baut pengikat penyangga sasis depan & belakang (Check fastening of front/rear suspension & chassis)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_24', section: '5. CHECK & INSPECTION', label: 'Periksa perikatan penyangga sasis roda gigi (Check fastening of gear box support)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_25', section: '5. CHECK & INSPECTION', label: 'Periksa bantalan poros roda (Check axle hub bearings)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_26', section: '5. CHECK & INSPECTION', label: 'Periksa pengencangan kotak kemudi dan dukungannya (Check fastening steering box and support)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_27', section: '5. CHECK & INSPECTION', label: 'Periksa katup radiator udara pendingin (Check radiator fan/shroud and fan clutch gap for leaks and vacuum system)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_5_28', section: '5. CHECK & INSPECTION', label: 'Periksa kode kesalahan dengan alat diagnostik (UDT) (Check error code by diagnostic tools - UDT)', tiers: ['A', 'B', 'C', 'D'] },

  // 6. TEST FUNCTION & FINAL CHECK
  { id: 'iveco_6_1', section: '6. TEST FUNCTION & FINAL CHECK', label: 'Miringkan kabin, membuka dan menutup kunci penutup tutup bagasi, serta melepas dan memasang kembali pelindung mesin (Tilt cabin, open/close hood, check safety pin/latch for tilting, check insulation)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_6_2', section: '6. TEST FUNCTION & FINAL CHECK', label: 'Periksa semua fungsi kelistrikan (Check all electrical function)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_6_3', section: '6. TEST FUNCTION & FINAL CHECK', label: 'Periksa dan hapus semua kesalahan dengan UDT (Check and reset all errors by UDT)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_6_4', section: '6. TEST FUNCTION & FINAL CHECK', label: 'Uji jalan kendaraan (Road test of truck)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_6_5', section: '6. TEST FUNCTION & FINAL CHECK', label: 'Pastikan semua level oli (Ensure all oil levels)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_6_6', section: '6. TEST FUNCTION & FINAL CHECK', label: 'Pastikan semua steker penguras terikat (Ensure all drain plugs are tight)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_6_7', section: '6. TEST FUNCTION & FINAL CHECK', label: 'Pastikan semua pembuangan kencang (Ensure all drain plugs are tight)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_6_8', section: '6. TEST FUNCTION & FINAL CHECK', label: 'Pastikan elemen filter terpasang dan kencang (Ensure all filters are ON & tight)', tiers: ['A', 'B', 'C', 'D'] },

  // 7. SAFETY DEVICE INSPECTION
  { id: 'iveco_7_1', section: '7. SAFETY DEVICE INSPECTION', label: 'Kondisi & fungsi sabuk pengaman (Seat belt condition & function)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_7_2', section: '7. SAFETY DEVICE INSPECTION', label: 'Kondisi dan tekanan alat pemadam kebakaran (Fire extinguisher condition & pressure)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_7_3', section: '7. SAFETY DEVICE INSPECTION', label: 'Fungsi klakson (Horn function)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_7_4', section: '7. SAFETY DEVICE INSPECTION', label: 'Fungsi rem servis (Service brake function)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_7_5', section: '7. SAFETY DEVICE INSPECTION', label: 'Fungsi rem parkir (Parking brake function)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_7_6', section: '7. SAFETY DEVICE INSPECTION', label: 'Kondisi dan lampu pilar spion (Rear view mirror condition & function)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_7_7', section: '7. SAFETY DEVICE INSPECTION', label: 'Fungsi alarm mundur (Back up alarm function)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_7_8', section: '7. SAFETY DEVICE INSPECTION', label: 'Fungsi Pelindung operator (Kamera/Sensor) (Operator protector camera system)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_7_9', section: '7. SAFETY DEVICE INSPECTION', label: 'Fungsi Dashcam kamera operator (Dashcam camera operator system)', tiers: ['A', 'B', 'C', 'D'] },

  // 8. ATTACHMENT
  { id: 'iveco_8_1', section: '8. ATTACHMENT', label: 'Periksa kondisi baut sambungan, kencangkan kembali jika perlu (Check condition of connection bolt, retighten if necessary)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_8_2', section: '8. ATTACHMENT', label: 'Periksa sistem hidrolik dan kebocoran oli (Check hydraulic system from oil leaks)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_8_3', section: '8. ATTACHMENT', label: 'Periksa sistem pneumatik dan kebocoran air/gas (Check pneumatic system from air/gas leaks)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_8_4', section: '8. ATTACHMENT', label: 'Periksa level oli hidrolik (Check hydraulic oil level)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_8_5', section: '8. ATTACHMENT', label: 'Lumasi semua titik gemuk (Grease all grease points)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_8_6', section: '8. ATTACHMENT', label: 'Periksa fungsi sakelar berhenti darurat (Check emergency stop button function)', tiers: ['A', 'B', 'C', 'D'] },

  // 9. MIXING UNIT / MMU
  { id: 'iveco_9_1', section: '9. MIXING UNIT / MMU', label: 'Periksa oli cat pump (Ganti di HM 500 [SAE 15W40/SAE 10W]) sesuai standar (Oil Cat pump oil 250 HRS / 500 HRS / 1000 HRS / 2000 HRS)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_9_2', section: '9. MIXING UNIT / MMU', label: 'Periksa kondisi baut pengikat penggerak motor hidrolik dan ganjalnya (Inspect the motor/drive bracket condition)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_9_3', section: '9. MIXING UNIT / MMU', label: 'Periksa fungsi panel kontrol / wiring visual (Control panel operation wiring visual inspection)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_9_4', section: '9. MIXING UNIT / MMU', label: 'Cek visual kondisi pemotong disk (Check auger disc cutter condition)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_9_5', section: '9. MIXING UNIT / MMU', label: 'Periksa sambungan speed sensor (Check pump motor speed sensor connection)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_9_6', section: '9. MIXING UNIT / MMU', label: 'Lumasi bearing pompa dan fan (Grease bearings pump side)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_9_7', section: '9. MIXING UNIT / MMU', label: 'Periksa pump & stator kinerja & kondisi (Check 1000/2000 hrs pump & stator performance & condition)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_9_8', section: '9. MIXING UNIT / MMU', label: 'Periksa & kencangkan kabel grounding motor, pompa, dll (Check and tighten all ground cables of water pump, auger motor, etc)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_9_9', section: '9. MIXING UNIT / MMU', label: 'Periksa fungsi valve operator (Check valve for operator)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_9_10', section: '9. MIXING UNIT / MMU', label: 'Periksa kondisi lem drum (Visual Hopper Top Condition)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_9_11', section: '9. MIXING UNIT / MMU', label: 'Periksa kondisi cat hydraulic attachment dan lakukan pengujian sesuai kondisi (Check the condition of the hydraulic attachment and test according to the condition)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'iveco_9_12', section: '9. MIXING UNIT / MMU', label: 'Periksa kondisi pengukur tekanan (Check the condition of the pressure gauge)', tiers: ['A', 'B', 'C', 'D'] },
];

// ── ANFO TRUCK - HINO OFFICIAL 4-TIER FORM (HM 250, 500, 1000, 2000) ──
const ANFO_HINO_OFFICIAL_ITEMS = [
  // 1. INFORMASI UMUM
  { id: 'hino_1_1', section: '1. INFORMASI UMUM', label: 'Lengkapi dan periksa lembar arsip untuk kerja yang tertunda (Check & periksa lembar arsip backlog)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'hino_1_2', section: '1. INFORMASI UMUM', label: 'Cuci bersih unit bagian luar dan cabin (Thoroughly clean unit exterior and cabin)', tiers: ['A', 'B', 'C', 'D'] },

  // 2. TAKE OIL SAMPLE
  { id: 'hino_2_1', section: '2. TAKE OIL SAMPLE', label: 'Ambil sampel oli mesin (Take engine oil sample)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'hino_2_2', section: '2. TAKE OIL SAMPLE', label: 'Ambil sampel oli transmisi (Take transmission oil sample)', tiers: ['C', 'D'] },
  { id: 'hino_2_3', section: '2. TAKE OIL SAMPLE', label: 'Ambil sampel oli poros depan (jika ada) (Take front axle oil sample if applicable)', tiers: ['C', 'D'] },
  { id: 'hino_2_4', section: '2. TAKE OIL SAMPLE', label: 'Ambil sampel oli poros tengah (jika ada) (Take middle axle oil sample if applicable)', tiers: ['C', 'D'] },
  { id: 'hino_2_5', section: '2. TAKE OIL SAMPLE', label: 'Ambil sampel oli poros belakang (jika ada) (Take rear axle oil sample if applicable)', tiers: ['C', 'D'] },
  { id: 'hino_2_6', section: '2. TAKE OIL SAMPLE', label: 'Ambil sampel oli penggerak akhir depan (jika ada) (Take front final drive oil sample if applicable)', tiers: ['C', 'D'] },

  // 3. AIR INDUCTION SYSTEM & EXHAUST SYSTEM
  { id: 'hino_3_1', section: '3. AIR INDUCTION SYSTEM & EXHAUST SYSTEM', label: 'Periksa & Kencangkan baut klem karet klem udara ke mesin (Check & tighten air intake hose clamps & bracket)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'hino_3_2', section: '3. AIR INDUCTION SYSTEM & EXHAUST SYSTEM', label: 'Periksa secara visual terhadap kebocoran intake dan dudukan turbo (Check visual for intake leak & turbo mounting)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'hino_3_3', section: '3. AIR INDUCTION SYSTEM & EXHAUST SYSTEM', label: 'Periksa secara visual terhadap kebocoran exhaust manifold dan dudukan turbo (Check visual for exhaust manifold leak & turbo mounting)', tiers: ['A', 'B', 'C', 'D'] },

  // 4. FUEL SYSTEM
  { id: 'hino_4_1', section: '4. FUEL SYSTEM', label: 'Ganti filter bahan bakar utama (Replace fuel primary filter)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'hino_4_2', section: '4. FUEL SYSTEM', label: 'Ganti filter bahan bakar sekunder (Replace fuel secondary filter)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'hino_4_3', section: '4. FUEL SYSTEM', label: 'Periksa secara visual saluran bahan bakar & baut klem selang bahan bakar (Check visual for fuel lines leak & hose clamps)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'hino_4_4', section: '4. FUEL SYSTEM', label: 'Bersihkan kotoran/endapan air pada mangkuk pemisah air bahan bakar (Clean water separator bowl)', tiers: ['A', 'B', 'C', 'D'] },

  // 5. COOLING SYSTEM
  { id: 'hino_5_1', section: '5. COOLING SYSTEM', label: 'Periksa level coolant radiator (Check radiator coolant level)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'hino_5_2', section: '5. COOLING SYSTEM', label: 'Periksa kondisi selang radiator & klem penikat (Check radiator hoses condition & clamps)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'hino_5_3', section: '5. COOLING SYSTEM', label: 'Bersihkan Radiator, Intercooler, Kondensor AC (Clean radiator, intercooler, AC condenser)', tiers: ['A', 'B', 'C', 'D'] },

  // 6. PROPELLER SHAFT
  { id: 'hino_6_1', section: '6. PROPELLER SHAFT', label: 'Lumasi universal joint & slip joint propeller shaft (Grease propeller shaft universal joint & slip joint)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'hino_6_2', section: '6. PROPELLER SHAFT', label: 'Periksa kekencangan baut flange propeller shaft (Check propeller shaft flange bolt torque)', tiers: ['A', 'B', 'C', 'D'] },

  // 7. AXLE FRONT, MIDDLE & REAR
  { id: 'hino_7_1', section: '7. AXLE FRONT, MIDDLE & REAR', label: 'Periksa level oli gardan depan, tengah & belakang (Check front, middle & rear axle oil level)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'hino_7_2', section: '7. AXLE FRONT, MIDDLE & REAR', label: 'Ganti oli gardan depan, tengah & belakang (Change front, middle & rear axle oil)', tiers: ['C', 'D'] },
  { id: 'hino_7_3', section: '7. AXLE FRONT, MIDDLE & REAR', label: 'Periksa kebocoran oli pada seal roda & axle housing (Check wheel seal & axle housing for oil leak)', tiers: ['A', 'B', 'C', 'D'] },

  // 8. STEERING SYSTEM
  { id: 'hino_8_1', section: '8. STEERING SYSTEM', label: 'Periksa level oli power steering & tambah jika perlu (Check power steering fluid level)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'hino_8_2', section: '8. STEERING SYSTEM', label: 'Periksa kondisi drag link, tie rod end & ball joint (Check drag link, tie rod end & ball joint condition)', tiers: ['A', 'B', 'C', 'D'] },

  // 9. BRAKE SYSTEM
  { id: 'hino_9_1', section: '9. BRAKE SYSTEM', label: 'Kuras tangki udara rem (Drain brake air tank)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'hino_9_2', section: '9. BRAKE SYSTEM', label: 'Periksa fungsi rem utama & rem parkir (Check service brake & parking brake function)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'hino_9_3', section: '9. BRAKE SYSTEM', label: 'Periksa kebocoran angin pada sistem pengereman (Check brake system air leak)', tiers: ['A', 'B', 'C', 'D'] },

  // 10. SUSPENSION
  { id: 'hino_10_1', section: '10. SUSPENSION', label: 'Periksa kondisi spring leaf & U-bolt depan/belakang (Check front & rear spring leaf & U-bolts)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'hino_10_2', section: '10. SUSPENSION', label: 'Periksa kondisi shock absorber & mounting (Check shock absorber & mounting condition)', tiers: ['A', 'B', 'C', 'D'] },

  // 11. SAFETY DEVICE INSPECTION
  { id: 'hino_11_1', section: '11. SAFETY DEVICE INSPECTION', label: 'Kondisi & fungsi sabuk pengaman (Seat belt condition & function)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'hino_11_2', section: '11. SAFETY DEVICE INSPECTION', label: 'Kondisi dan tekanan APAR (Fire extinguisher condition & pressure)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'hino_11_3', section: '11. SAFETY DEVICE INSPECTION', label: 'Fungsi klakson & alarm mundur (Horn & back up alarm function)', tiers: ['A', 'B', 'C', 'D'] },

  // 12. ATTACHMENT / MIXING UNIT ANFO
  { id: 'hino_12_1', section: '12. ATTACHMENT / MIXING UNIT ANFO', label: 'Periksa baut sambungan mixing unit ANFO (Check ANFO mixing unit mounting bolts)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'hino_12_2', section: '12. ATTACHMENT / MIXING UNIT ANFO', label: 'Periksa sistem hidrolik & kebocoran oli mixing unit (Check hydraulic system oil leak)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'hino_12_3', section: '12. ATTACHMENT / MIXING UNIT ANFO', label: 'Lumasi semua titik greasing mixing unit (Grease all ANFO mixing unit points)', tiers: ['A', 'B', 'C', 'D'] },
  { id: 'hino_12_4', section: '12. ATTACHMENT / MIXING UNIT ANFO', label: 'Periksa fungsi sakelar emergency stop ANFO (Check ANFO emergency stop switch function)', tiers: ['A', 'B', 'C', 'D'] }
];

function getLoggedInUser() {
  try {
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.name || parsed.full_name || parsed.username || 'Mekanik Site';
    }
  } catch (_) {}
  return 'Mekanik Site';
}

const BTN_STYLES = {
  base: {
    height: '30px',
    padding: '0 0.75rem',
    fontSize: '0.8rem',
    fontWeight: '600',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    letterSpacing: '0.02em',
  },
  inactive: { 
    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
    border: '1px solid #4a4e52', 
    color: '#e0e0e0' 
  },
  baik: { 
    backgroundColor: '#1b5e20', 
    border: '1px solid #4caf50', 
    color: '#ffffff',
    boxShadow: '0 2px 6px rgba(76, 175, 80, 0.2)'
  },
  tidak_baik: { 
    backgroundColor: '#b71c1c', 
    border: '1px solid #f44336', 
    color: '#ffffff',
    boxShadow: '0 2px 6px rgba(244, 67, 54, 0.2)'
  },
  na: { 
    backgroundColor: '#37474f', 
    border: '1px solid #78909c', 
    color: '#ffffff' 
  },
};

export default function PmService() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = tab || 'create';

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [reports, setReports] = useState([]);
  const [userOptions, setUserOptions] = useState([]);

  // Form State
  const [pmTier, setPmTier] = useState('PM 250'); // 'PM 250', 'PM 500', 'PM 1000'
  const [selectedJenis, setSelectedJenis] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [hmValue, setHmValue] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [downtimeHours, setDowntimeHours] = useState('');
  const [additionalMekanik, setAdditionalMekanik] = useState('');
  const [checklist, setChecklist] = useState({});
  const [ringkasan, setRingkasan] = useState('');
  const [editingId, setEditingId] = useState(null); // ID laporan yang sedang diedit (jika mode edit)
  // Modal Form Resmi Print Preview State
  const [selectedReportForPrint, setSelectedReportForPrint] = useState(null);

  // State List Pergantian Sparepart
  const [sparePartList, setSparePartList] = useState([
    { partName: '', partNumber: '', qty: 1, unit: 'Pcs', statusPart: 'Baru' }
  ]);

  const handleAddSparePart = () => {
    setSparePartList(prev => [...prev, { partName: '', partNumber: '', qty: 1, unit: 'Pcs', statusPart: 'Baru' }]);
  };

  const handleRemoveSparePart = (index) => {
    setSparePartList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSparePartChange = (index, field, value) => {
    setSparePartList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const loggedUser = getLoggedInUser();

  const [masterParts, setMasterParts] = useState([]);
  const [sparePartsIn, setSparePartsIn] = useState([]);
  const [spipUnits, setSpipUnits] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);

    fetchUsers();
    fetchPmReports();
    fetchMasterParts();
    fetchSparePartsIn();
    fetchSpipUnits();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchSpipUnits = async () => {
    try {
      const { data, error } = await supabase.from('units').select('*').order('no_lambung', { ascending: true });
      if (!error && data && data.length > 0) {
        const mapped = data.map(u => ({
          noLambung: u.no_lambung || u.noLambung,
          jenisUnit: u.jenis_unit || u.jenisUnit,
          merk: u.merk || '',
          tipe: u.tipe || u.model || ''
        }));
        setSpipUnits(mapped);
      }
    } catch (_) {}
  };

  const fetchUsers = async () => {
    try {
      let query = supabase.from('users').select('*').neq('username', 'dummy').order('name', { ascending: true });
      
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const uSite = (parsed.site || parsed.lokasi || '').toLowerCase();
        const uRole = (parsed.jabatan || parsed.role || '').toLowerCase();
        
        const isSuper = uRole.includes('admin') || uSite === 'balikpapan';
        if (!isSuper && parsed.site) {
          query = query.eq('site', parsed.site);
        }
      }

      const { data, error } = await query;
      if (!error && data) {
        setUserOptions(data);
      }
    } catch (_) {}
  };

  const fetchMasterParts = async () => {
    try {
      const { data, error } = await supabase.from('spare_parts_catalog').select('*').order('part_name', { ascending: true });
      if (!error && data) {
        setMasterParts(data);
      }
    } catch (err) {
      console.warn('Fetch master parts error:', err);
    }
  };

  const fetchSparePartsIn = async () => {
    try {
      const { data, error } = await supabase.from('spare_parts_in').select('part_id, receive_date');
      if (!error && data) {
        setSparePartsIn(data);
      }
    } catch (_) {}
  };

  const fetchPmReports = async () => {
    try {
      const { data, error } = await supabase.from('pm_reports').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const mapped = data.map(r => ({
          id: r.id,
          pmTier: r.pm_tier || r.pmTier || 'PM 250',
          jenisUnit: r.jenis_unit || r.jenisUnit,
          noLambung: r.no_lambung || r.noLambung,
          unitDetail: r.unit_detail || r.unitDetail || '',
          hm: r.hm_value || r.hm || '-',
          date: r.report_date || r.date,
          reporter: r.reporter,
          checklist: r.checklist || [],
          spareParts: r.spare_parts || r.spareParts || [],
          ringkasan: r.ringkasan || '',
          totalItems: r.total_items || 0,
          filledItems: r.filled_items || 0,
          tidakBaikItems: r.tidak_baik_items || 0
        }));
        setReports(mapped);
      }
    } catch (err) {
      console.warn('Fetch PM reports fallback:', err);
    }
  };

  const handleSparePartNameSelect = (index, val) => {
    // Cari semua kandidat yang cocok dengan part_name pada jenis unit ini
    const matches = unitMasterParts.filter(p => p.part_name.toLowerCase() === val.toLowerCase());
    setSparePartList(prev => {
      const updated = [...prev];
      // Hanya auto-fill partNumber jika HANYA ADA 1 part_number yang cocok
      const autoPartNum = matches.length === 1 ? (matches[0].part_number || '') : '';
      updated[index] = { 
        ...updated[index], 
        partName: val,
        partNumber: autoPartNum
      };
      return updated;
    });
  };

  const handleDeleteMasterPart = async (id, name) => {
    if (window.confirm(`Hapus sparepart "${name}" dari daftar katalog master?`)) {
      try {
        await supabase.from('spare_parts_catalog').delete().eq('id', id);
      } catch (_) {}
      setMasterParts(prev => prev.filter(p => p.id !== id));
    }
  };

  // Filter Katalog Master Sparepart secara KHUSUS berdasarkan Jenis Unit (Anfo Truck / Hino vs MMU Truck / Iveco)
  const unitMasterParts = useMemo(() => {
    if (!selectedJenis) return [];

    const partsMap = new Map();

    const availableParts = !reportDate ? masterParts : masterParts.filter(m => {
      return sparePartsIn.some(inp => inp.part_id === m.id && inp.receive_date <= reportDate);
    });

    // 1. Ambil dari database spare_parts_catalog (hanya yang jenis_unit-nya cocok atau universal)
    availableParts.forEach(m => {
      const itemJenis = m.jenis_unit || m.jenisUnit;
      const isIvecoSpecific = m.part_name.toLowerCase().includes('racor') || (m.part_number && m.part_number.startsWith('5801'));
      
      let isMatch = false;
      if (!itemJenis || itemJenis === 'General' || itemJenis === 'Semua Unit' || itemJenis === 'All' || itemJenis === selectedJenis) {
        if (selectedJenis === 'Anfo Truck' && isIvecoSpecific) {
          isMatch = false;
        } else {
          isMatch = true;
        }
      }

      if (isMatch) {
        const key = `${(m.part_name || '').toLowerCase()}|${(m.part_number || '').toLowerCase()}`;
        if (!partsMap.has(key)) {
          partsMap.set(key, {
            id: m.id,
            part_name: m.part_name,
            part_number: m.part_number || '',
            jenis_unit: itemJenis || 'Semua Unit',
            merk: m.merk || 'General'
          });
        }
      }
    });


    // 2. Ekstrak dari seluruh riwayat laporan PM Service yang pernah dibuat untuk jenis_unit ini
    reports.forEach(rep => {
      if (rep.jenisUnit === selectedJenis && Array.isArray(rep.spareParts)) {
        rep.spareParts.forEach(sp => {
          if (sp.partName) {
            const key = `${sp.partName.toLowerCase()}|${(sp.partNumber || '').toLowerCase()}`;
            if (!partsMap.has(key)) {
              partsMap.set(key, {
                id: `rep_${key}`,
                part_name: sp.partName,
                part_number: sp.partNumber || '',
                jenis_unit: selectedJenis,
                merk: rep.unitDetail?.includes('Hino') ? 'Hino' : rep.unitDetail?.includes('Iveco') ? 'Iveco' : ''
              });
            }
          }
        });
      }
    });

    return Array.from(partsMap.values()).sort((a,b) => a.part_name.localeCompare(b.part_name));
  }, [selectedJenis, masterParts, sparePartsIn, reportDate, reports]);





  // Filter unit berdasarkan jenis unit (Menggabungkan Live SPIP Database & Local Catalog)
  const availableUnits = useMemo(() => {
    const combined = [...spipUnits, ...DUMMY_UNITS];
    const unique = [];
    const map = new Map();
    for (const u of combined) {
      if (u.jenisUnit === selectedJenis && !map.has(u.noLambung)) {
        map.set(u.noLambung, true);
        unique.push(u);
      }
    }
    return unique;
  }, [selectedJenis, spipUnits]);

  // Select active checklist items based on Jenis Unit & PM Tier
  const activeChecklistItems = useMemo(() => {
    if (!selectedJenis) return [];

    if (selectedJenis === 'Forklift') {
      const currentTierCode = (pmTier === 'PM 2000' || pmTier === 'PM 1000') ? '1000' : pmTier === 'PM 500' ? '500' : '250';
      return FORKLIFT_PM_MASTER_ITEMS.filter(item => item.tiers.includes(currentTierCode));
    } else if (selectedJenis === 'MMU Truck') {
      // MMU Truck - IVECO Official 4-Tier Checklist Matrix (HM 250, 500, 1000, 2000)
      const currentTierCode = pmTier === 'PM 2000' ? 'D' : pmTier === 'PM 1000' ? 'C' : pmTier === 'PM 500' ? 'B' : 'A';
      return MMU_IVECO_OFFICIAL_ITEMS.filter(item => item.tiers.includes(currentTierCode));
    } else if (selectedJenis === 'Anfo Truck') {
      // ANFO Truck - HINO Official 4-Tier Checklist Matrix (HM 250, 500, 1000, 2000)
      const currentTierCode = pmTier === 'PM 2000' ? 'D' : pmTier === 'PM 1000' ? 'C' : pmTier === 'PM 500' ? 'B' : 'A';
      return ANFO_HINO_OFFICIAL_ITEMS.filter(item => item.tiers.includes(currentTierCode));
    } else if (selectedJenis === 'Compressor') {
      const currentTierCode = pmTier === 'PM 8 Month' ? '8M' : '4M';
      return COMPRESSOR_PM_MASTER_ITEMS.filter(item => item.tiers.includes(currentTierCode));
    } else if (selectedJenis === 'Hot Water Boiler (HWB)') {
      const currentTierCode = pmTier === 'PM 6 Month' ? '6M' : '3M';
      return HWB_PM_MASTER_ITEMS.filter(item => item.tiers.includes(currentTierCode));
    } else if (selectedJenis === 'Genset') {
      const currentTierCode = (pmTier === 'PM 1000' || pmTier === 'PM 2000') ? '1000' : '250';
      return GENSET_PM_MASTER_ITEMS.filter(item => item.tiers.includes(currentTierCode));
    }

    // Default Fallback Form
    let masterItems = ANFO_PM_MASTER_ITEMS;
    let pm1000Items = ANFO_PM_1000_ITEMS;

    if (pmTier === 'PM 1000' || pmTier === 'PM 2000') {
      return pm1000Items;
    } else if (pmTier === 'PM 500') {
      return masterItems;
    } else { // PM 250
      return masterItems.filter(item => !item.isHm500Only);
    }
  }, [selectedJenis, pmTier]);

  const filledCount = activeChecklistItems.filter(i => checklist[i.id]?.status).length;
  const tidakBaikCount = activeChecklistItems.filter(i => checklist[i.id]?.status === 'tidak_baik').length;

  const handleJenisChange = (jenis) => {
    setSelectedJenis(jenis);
    setSelectedUnit(null);
    setChecklist({});
    if (jenis === 'Compressor') {
      setPmTier('PM 4 Month');
    } else if (jenis === 'Hot Water Boiler (HWB)') {
      setPmTier('PM 3 Month');
    } else if (jenis === 'Genset') {
      setPmTier('PM 250');
    } else {
      setPmTier('PM 250');
    }
  };

  const handleUnitChange = (noLambung) => {
    setSelectedUnit(availableUnits.find(u => u.noLambung === noLambung) || null);
  };

  const handleStatus = (id, status) => {
    setChecklist(prev => ({
      ...prev,
      [id]: { status, temuan: status === 'tidak_baik' ? (prev[id]?.temuan || '') : '' }
    }));
  };

  const handleTemuan = (id, temuan) => {
    setChecklist(prev => ({
      ...prev,
      [id]: { ...prev[id], temuan }
    }));
  };

  const handleSetAllBaik = () => {
    const nextState = {};
    activeChecklistItems.forEach(item => {
      nextState[item.id] = { status: 'baik', temuan: '' };
    });
    setChecklist(nextState);
  };

  // Dynamic Calculation of Missing Fields for User Notification
  const missingFields = useMemo(() => {
    const list = [];
    if (!selectedJenis || selectedJenis === '') {
      list.push('Jenis Unit / Peralatan belum dipilih');
    }
    if (!pmTier || pmTier === '') {
      list.push('Jenis Service (Tipe PM) belum dipilih');
    }
    if (!selectedUnit || !selectedUnit.noLambung) {
      list.push('No Lambung / Kode Peralatan belum dipilih');
    }
    if (!['Compressor', 'Hot Water Boiler (HWB)', 'Genset'].includes(selectedJenis)) {
      if (!hmValue || String(hmValue).trim() === '' || Number(hmValue) <= 0) {
        list.push('HM Maintenance belum diisi / invalid');
      }
    }
    if (!reportDate || reportDate.trim() === '') {
      list.push('Tanggal Maintenance belum diisi');
    }

    if (selectedJenis && activeChecklistItems.length > 0) {
      const unfilledCount = activeChecklistItems.length - filledCount;
      if (unfilledCount > 0) {
        list.push(`Masih ada ${unfilledCount} dari ${activeChecklistItems.length} item checklist yang belum diisi statusnya (Baik / Tidak Baik / N/A)`);
      }

      const missingTemuanItems = activeChecklistItems.filter(i => checklist[i.id]?.status === 'tidak_baik' && !checklist[i.id]?.temuan?.trim());
      if (missingTemuanItems.length > 0) {
        list.push(`Keterangan temuan wajib diisi untuk ${missingTemuanItems.length} item yang ditandai "Tidak Baik"`);
      }
    }

    return list;
  }, [pmTier, selectedJenis, selectedUnit, hmValue, reportDate, activeChecklistItems, filledCount, checklist]);

  const isValid = () => missingFields.length === 0;

  const [showValidationModal, setShowValidationModal] = useState(false);

  const handleStartEditReport = (report) => {
    setEditingId(report.id);
    setPmTier(report.pmTier || 'PM 250');
    setSelectedJenis(report.jenisUnit || '');
    
    // Cari objek unit
    const matchedUnit = availableUnits.find(u => u.noLambung === report.noLambung) || {
      noLambung: report.noLambung,
      jenisUnit: report.jenisUnit,
      merk: report.unitDetail ? report.unitDetail.split(' ')[0] : '',
      tipe: report.unitDetail ? report.unitDetail.split(' ').slice(1).join(' ') : ''
    };
    setSelectedUnit(matchedUnit);
    
    setHmValue(report.hm !== '-' ? report.hm : '');
    setReportDate(report.date || new Date().toISOString().split('T')[0]);
    
    // Extrak reporter opsional
    const reportersArr = (report.reporter || '').split(', ');
    if (reportersArr.length > 1) {
      setAdditionalMekanik(reportersArr.slice(1).join(', '));
    } else {
      setAdditionalMekanik('');
    }

    // Set map checklist status & temuan
    const checkMap = {};
    if (report.checklist && Array.isArray(report.checklist)) {
      report.checklist.forEach(c => {
        checkMap[c.id] = { status: c.status || 'na', temuan: c.temuan || '' };
      });
    }
    setChecklist(checkMap);

    // Set spareparts
    if (report.spareParts && Array.isArray(report.spareParts) && report.spareParts.length > 0) {
      setSparePartList(report.spareParts);
    } else {
      setSparePartList([{ partName: '', partNumber: '', qty: 1, unit: 'Pcs', statusPart: 'Baru' }]);
    setSparePartList([{ partName: '', partNumber: '', qty: 1, unit: 'Pcs', statusPart: 'Baru' }]);
    }

    setDowntimeHours(report.downtime_hours || '');
    setRingkasan(report.ringkasan || '');
    navigate('/pm-service/create');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSelectedJenis('');
    setSelectedUnit(null);
    setHmValue('');
    setReportDate(new Date().toISOString().split('T')[0]);
    setDowntimeHours('');
    setAdditionalMekanik('');
    setSparePartList([{ partName: '', partNumber: '', qty: 1, unit: 'Pcs', statusPart: 'Baru' }]);
    setChecklist({});
    setRingkasan('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (missingFields.length > 0) {
      setShowValidationModal(true);
      return;
    }

    const snap = activeChecklistItems.map(item => ({
      ...item,
      status: checklist[item.id]?.status || 'na',
      temuan: checklist[item.id]?.temuan || ''
    }));

    const fullReporters = additionalMekanik.trim()
      ? `${loggedUser}, ${additionalMekanik.trim()}`
      : loggedUser;

    const validSpareParts = sparePartList.filter(p => p.partName.trim() !== '');

    const reportDataPayload = {
      pmTier,
      jenisUnit: selectedJenis,
      noLambung: selectedUnit.noLambung,
      unitDetail: `${selectedUnit.merk} ${selectedUnit.tipe}`,
      hm: hmValue || '-',
      date: reportDate,
      reporter: fullReporters,
      downtime_hours: Number(downtimeHours) || 0,
      checklist: snap,
      spareParts: validSpareParts,
      ringkasan,
      totalItems: activeChecklistItems.length,
      filledItems: filledCount,
      tidakBaikItems: tidakBaikCount,
    };

    if (editingId) {
      // ── MODE UPDATE ──
      try {
        await supabase.from('pm_reports').update({
          pm_tier: pmTier,
          jenis_unit: selectedJenis,
          no_lambung: selectedUnit.noLambung,
          unit_detail: `${selectedUnit.merk} ${selectedUnit.tipe}`,
          hm_value: Number(hmValue) || 0,
          report_date: reportDate,
          reporter: fullReporters,
          downtime_hours: Number(downtimeHours) || 0,
          checklist: snap,
          spare_parts: validSpareParts,
          ringkasan,
          total_items: activeChecklistItems.length,
          filled_items: filledCount,
          tidak_baik_items: tidakBaikCount
        }).eq('id', editingId);
      } catch (err) {
        console.warn('Update PM report error:', err);
      }

      setReports(prev => prev.map(r => r.id === editingId ? { ...r, ...reportDataPayload } : r));
      setEditingId(null);
    } else {
      // ── MODE INSERT NEW ──
      const newReport = {
        id: Date.now().toString(),
        ...reportDataPayload
      };

      try {
        await supabase.from('pm_reports').insert([{
          pm_tier: pmTier,
          jenis_unit: selectedJenis,
          no_lambung: selectedUnit.noLambung,
          unit_detail: `${selectedUnit.merk} ${selectedUnit.tipe}`,
          hm_value: Number(hmValue) || 0,
          report_date: reportDate,
          reporter: fullReporters,
          downtime_hours: Number(downtimeHours) || 0,
          checklist: snap,
          spare_parts: validSpareParts,
          ringkasan,
          total_items: activeChecklistItems.length,
          filled_items: filledCount,
          tidak_baik_items: tidakBaikCount
        }]);
      } catch (err) {
        console.warn('Save PM report online error:', err);
      }

      setReports(prev => [newReport, ...prev]);
    }

    // Auto-update HM saat ini dan target Next Service unit di database Supabase
    const newHmVal = Number(hmValue) || 0;
    if (newHmVal > 0 && selectedUnit?.noLambung) {
      let currentTarget = selectedUnit?.next_service && Number(selectedUnit.next_service) > 0 
        ? Number(selectedUnit.next_service) 
        : Math.ceil((newHmVal + 1) / 250) * 250;

      let nextTarget;
      if (newHmVal >= currentTarget) {
        nextTarget = Math.ceil((newHmVal + 1) / 250) * 250;
      } else if (currentTarget - newHmVal <= 150) {
        // Jika service dilakukan lebih awal (early service) dengan toleransi hingga 150 HM
        nextTarget = currentTarget + 250;
      } else {
        nextTarget = Math.ceil((newHmVal + 1) / 250) * 250;
      }
      try {
        await supabase.from('units').update({
          hm_km: newHmVal,
          next_service: nextTarget
        }).eq('no_lambung', selectedUnit.noLambung);
      } catch (err) {
        console.warn('Update unit next_service error:', err);
      }
    }


    // Simpan/Update katalog master sparepart ke Supabase jika ada pasangan (Nama + Part Number) baru
    if (validSpareParts.length > 0) {
      for (const p of validSpareParts) {
        const pName = p.partName.trim();
        const pNum = p.partNumber.trim();
        if (!pName) continue;

        // Cek kombinasi unik: part_name + part_number
        const exists = masterParts.some(m => 
          (m.part_name || '').trim().toLowerCase() === pName.toLowerCase() &&
          (m.part_number || '').trim().toLowerCase() === pNum.toLowerCase()
        );

        if (!exists) {
          try {
            await supabase.from('spare_parts_catalog').insert([{
              jenis_unit: selectedJenis,
              merk: selectedUnit?.merk || '',
              part_name: pName,
              part_number: pNum
            }]);
          } catch (err) {
            console.warn('Error inserting new catalog item:', err);
          }
        }
      }
      fetchMasterParts();
    }



    setSelectedJenis('');
    setSelectedUnit(null);
    setHmValue('');
    setReportDate(new Date().toISOString().split('T')[0]);
    setDowntimeHours('');
    setAdditionalMekanik('');
    setSparePartList([{ partName: '', partNumber: '', qty: 1, unit: 'Pcs', statusPart: 'Baru' }]);
    setChecklist({});
    setRingkasan('');
    window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Laporan telah terkirim!' }));
    navigate('/dashboard');
  };


  // Group items by section
  const sections = useMemo(() => {
    return activeChecklistItems.reduce((acc, item) => {
      const s = item.section || 'Umum';
      if (!acc[s]) acc[s] = [];
      acc[s].push(item);
      return acc;
    }, {});
  }, [activeChecklistItems]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Header Title + Tabs */}
      <div className="no-print" style={{ flexShrink: 0, marginBottom: '1rem', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-end', gap: '1rem' }}>
        <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
          <h1 className="mb-1" style={{ fontSize: '1.4rem', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start', gap: '0.5rem', margin: 0 }}>
            <Wrench size={22} style={{ color: 'var(--color-yellow-primary)' }} />
            Preventive Maintenance (PM Service)
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-silver)', margin: '0.2rem 0 0 0' }}>
            Pembuatan & Riwayat Laporan Maintenance Periodik Unit
          </p>
        </div>
        </div>

        {isMobile && (
          <div style={{
            display: 'flex',
            background: 'rgba(22, 25, 29, 0.95)',
            padding: '0.3rem',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            gap: '0.3rem',
            marginBottom: '0.75rem',
            overflowX: 'auto',
            width: '100%'
          }} className="hide-scrollbar">
            <button 
              onClick={() => navigate('/pm-service/create')} 
              style={{
                flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer',
                background: activeTab === 'create' ? 'var(--color-yellow-primary)' : 'transparent',
                color: activeTab === 'create' ? 'var(--color-bg-main)' : 'var(--color-silver)',
                border: 'none', transition: 'all 0.2s', minWidth: '90px'
              }}
            >
              Laporan PM
            </button>
            <button 
              onClick={() => navigate('/pm-service/history')} 
              style={{
                flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer',
                background: activeTab === 'history' ? 'var(--color-yellow-primary)' : 'transparent',
                color: activeTab === 'history' ? 'var(--color-bg-main)' : 'var(--color-silver)',
                border: 'none', transition: 'all 0.2s', minWidth: '90px'
              }}
            >
              Riwayat
            </button>
          </div>
        )}

        {/* ── TAB BUAT LAPORAN PM ── */}
      {activeTab === 'create' && (
        <div className="card no-print hide-scrollbar" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', width: '100%', padding: isMobile ? '0.75rem 0.75rem 85px 0.75rem' : '1rem 1.25rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            
            {/* ── CARD 1: TOP SUMMARY & PROGRESS BAR ── */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(35, 39, 45, 0.95) 0%, rgba(20, 24, 28, 0.98) 100%)',
              border: '1px solid var(--color-border)',
              borderRadius: '14px',
              padding: '0.85rem 1rem',
              marginBottom: '0.75rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: activeChecklistItems.length > 0 ? '0.5rem' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,193,7,0.15)', border: '1px solid var(--color-yellow-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Wrench size={18} style={{ color: 'var(--color-yellow-primary)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#ffffff', lineHeight: '1.2' }}>
                      {selectedJenis ? `${selectedJenis} ${selectedUnit ? `(${selectedUnit.noLambung})` : ''}` : 'Form PM Service'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-silver)', marginTop: '0.1rem' }}>
                      {activeChecklistItems.length > 0 
                        ? `${filledCount}/${activeChecklistItems.length} item diisi` 
                        : 'Lengkapi identitas inspeksi di bawah'}
                    </div>
                  </div>
                </div>
                {activeChecklistItems.length > 0 && (
                  <div style={{ fontSize: '0.9rem', fontWeight: '800', color: filledCount === activeChecklistItems.length ? '#81c784' : 'var(--color-yellow-primary)' }}>
                    {Math.round((filledCount / activeChecklistItems.length) * 100)}%
                  </div>
                )}
              </div>
              
              {/* Progress Bar */}
              {activeChecklistItems.length > 0 && (
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${(filledCount / activeChecklistItems.length) * 100}%`, 
                    height: '100%', 
                    background: 'linear-gradient(90deg, #ffc107 0%, #4caf50 100%)', 
                    transition: 'width 0.3s ease' 
                  }} />
                </div>
              )}
            </div>

            {/* ── CARD 2: IDENTITAS INSPEKSI / LAPORAN (SINGLE COLUMN STACK) ── */}
            <div style={{
              background: 'rgba(25, 29, 34, 0.95)',
              border: '1px solid var(--color-border)',
              borderRadius: '14px',
              padding: isMobile ? '0.85rem' : '1.15rem',
              marginBottom: '0.75rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
            }}>
              {/* Card Header Title */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <ClipboardList size={17} style={{ color: 'var(--color-yellow-primary)' }} />
                  Identitas Inspeksi PM
                </div>
                <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: 'var(--color-silver)', border: '1px solid var(--color-border)', fontWeight: '600' }}>
                  PM-SERV-2026
                </span>
              </div>

              {/* Form Inputs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem 1.25rem' }}>
                
                {/* 1. Jenis Unit */}
                <div className="input-group mb-0" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--color-silver-light)', marginBottom: '0.25rem', display: 'block' }}>
                    Jenis Unit / Peralatan *
                  </label>
                  <SearchableSelect 
                    className="input-field" 
                    style={{ height: '38px', fontSize: '0.825rem', width: '100%', borderColor: !selectedJenis ? 'var(--color-yellow-primary)' : 'var(--color-border)', fontWeight: 'bold', background: 'var(--color-bg-main)' }}
                    value={selectedJenis}
                    onChange={(e) => handleJenisChange(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Jenis Unit / Peralatan --</option>
                    {JENIS_UNIT_OPTIONS.map(j => {
                      const hasForm = ['Anfo Truck', 'MMU Truck', 'Forklift', 'Compressor', 'Hot Water Boiler (HWB)', 'Genset'].includes(j);
                      return (
                        <option 
                          key={j} 
                          value={j} 
                          style={{ color: hasForm ? '#ffffff' : '#888888' }}
                        >
                          {j}{!hasForm ? ' (Form Belum Tersedia)' : ''}
                        </option>
                      );
                    })}
                  </SearchableSelect>
                </div>

                {/* 2. Jenis Service */}
                <div className="input-group mb-0" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--color-silver-light)', marginBottom: '0.25rem', display: 'block' }}>
                    Jenis Service (Tipe Service) *
                  </label>
                  <SearchableSelect 
                    className="input-field" 
                    style={{ height: '38px', fontSize: '0.825rem', width: '100%', borderColor: 'var(--color-yellow-primary)', fontWeight: 'bold', background: 'var(--color-bg-main)' }}
                    value={pmTier}
                    onChange={(e) => { setPmTier(e.target.value); setChecklist({}); }}
                    disabled={!selectedJenis}
                  >
                    {!selectedJenis ? (
                      <option value="">-- Pilih Jenis Unit Terlebih Dahulu --</option>
                    ) : selectedJenis === 'Compressor' ? (
                      <>
                        <option value="PM 4 Month">PM 4 Month (4-Month PM Service)</option>
                        <option value="PM 8 Month">PM 8 Month (8-Month PM Service)</option>
                      </>
                    ) : selectedJenis === 'Hot Water Boiler (HWB)' ? (
                      <>
                        <option value="PM 3 Month">PM 3 Month (PM Service 3 Monthly HWB)</option>
                        <option value="PM 6 Month">PM 6 Month (PM Service 6 Monthly HWB)</option>
                      </>
                    ) : selectedJenis === 'Genset' ? (
                      <>
                        <option value="PM 250">PM 250 (PM SERVICE A, 250 Hrs)</option>
                        <option value="PM 500">PM 500 (PM SERVICE B, 500 Hrs)</option>
                        <option value="PM 1000">PM 1000 (PM SERVICE C, 1000 Hrs)</option>
                        <option value="PM 2000">PM 2000 (PM SERVICE D, 2000 Hrs)</option>
                      </>
                    ) : (
                      <>
                        <option value="PM 250">PM 250 (CODE A)</option>
                        <option value="PM 500">PM 500 (CODE B)</option>
                        <option value="PM 1000">PM 1000 (CODE C)</option>
                        <option value="PM 2000">PM 2000 (CODE D)</option>
                      </>
                    )}
                  </SearchableSelect>
                </div>

                {/* 3. No Lambung */}
                <div className="input-group mb-0" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--color-silver-light)', marginBottom: '0.25rem', display: 'block' }}>
                    No Lambung / Kode Peralatan *
                  </label>
                  <SearchableSelect 
                    className="input-field" 
                    style={{ height: '38px', fontSize: '0.825rem', width: '100%', borderColor: !selectedUnit ? 'var(--color-yellow-primary)' : 'var(--color-border)', background: 'var(--color-bg-main)' }}
                    value={selectedUnit?.noLambung || ''}
                    onChange={(e) => handleUnitChange(e.target.value)}
                    required
                    disabled={!selectedJenis}
                  >
                    <option value="">-- Pilih No Lambung / Kode --</option>
                    {availableUnits.map(u => (
                      <option key={u.noLambung} value={u.noLambung}>{u.noLambung} — {u.merk}</option>
                    ))}
                  </SearchableSelect>
                </div>

                {/* 4. HM / KM */}
                <div className="input-group mb-0" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--color-silver-light)', marginBottom: '0.25rem', display: 'block' }}>
                    {['Compressor', 'Hot Water Boiler (HWB)', 'Genset'].includes(selectedJenis) ? 'HM / Jam Kerja (Opsional)' : 'HM / KM Maintenance *'}
                  </label>
                  <input 
                    type="number" 
                    className="input-field" 
                    style={{ height: '38px', fontSize: '0.825rem', width: '100%', background: 'var(--color-bg-main)', borderColor: !hmValue && !['Compressor', 'Hot Water Boiler (HWB)', 'Genset'].includes(selectedJenis) ? 'var(--color-yellow-primary)' : 'var(--color-border)' }}
                    placeholder={['Compressor', 'Hot Water Boiler (HWB)', 'Genset'].includes(selectedJenis) ? "HM saat ini (opsional)..." : "Masukkan HM saat ini..."}
                    value={hmValue}
                    onChange={(e) => setHmValue(e.target.value)}
                    required={!['Compressor', 'Hot Water Boiler (HWB)', 'Genset'].includes(selectedJenis)}
                    min={1}
                  />
                </div>

                {/* 5. Tanggal Maintenance */}
                <div className="input-group mb-0" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--color-silver-light)', marginBottom: '0.25rem', display: 'block' }}>
                    Tanggal Maintenance *
                  </label>
                  <input 
                    type="date" 
                    className="input-field" 
                    style={{ height: '38px', fontSize: '0.825rem', width: '100%', colorScheme: 'dark', background: 'var(--color-bg-main)' }}
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    required
                  />
                </div>

                {/* 5B. Lama Waktu Pengerjaan (Jam) */}
                <div className="input-group mb-0" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--color-silver-light)', marginBottom: '0.25rem', display: 'block' }}>
                    Lama Waktu Pengerjaan PM (Jam) *
                  </label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    className="input-field" 
                    style={{ height: '38px', fontSize: '0.825rem', width: '100%', background: 'var(--color-bg-main)', borderColor: !downtimeHours ? 'var(--color-yellow-primary)' : 'var(--color-border)' }}
                    placeholder="Contoh: 2.5 untuk dua setengah jam..."
                    value={downtimeHours}
                    onChange={(e) => setDowntimeHours(e.target.value)}
                    required
                  />
                </div>

                {/* 6. Mekanik / Petugas Pelapor */}
                <div className="input-group mb-0" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--color-silver-light)', marginBottom: '0.25rem', display: 'block' }}>
                    Mekanik / Petugas Pelapor *
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ height: '38px', fontSize: '0.825rem', width: '100%', opacity: 0.85, backgroundColor: 'rgba(0,0,0,0.3)', fontWeight: 'bold' }} 
                      value={`${loggedUser} (Pelapor Utama)`} 
                      readOnly 
                      title="Pelapor utama (Otomatis dari Akun Login)"
                    />
                    <SearchableSelect 
                      className="input-field" 
                      style={{ height: '38px', fontSize: '0.825rem', width: '100%', background: 'var(--color-bg-main)' }} 
                      value={additionalMekanik} 
                      onChange={e => setAdditionalMekanik(e.target.value)}
                    >
                      <option value="">-- Tambah Mekanik Tim (Opsional) --</option>
                      {userOptions
                        .filter(u => {
                          const nameStr = u.name || u.full_name || u.username;
                          return nameStr.toLowerCase() !== loggedUser.toLowerCase();
                        })
                        .map(u => {
                          const displayName = u.name || u.full_name || u.username;
                          return (
                            <option key={u.id} value={displayName}>
                              {displayName} ({u.jabatan || 'User'})
                            </option>
                          );
                        })}
                    </SearchableSelect>
                  </div>
                </div>
              </div>
            </div>

            {/* ─ Checklist Scrollable Area ─ */}
            {selectedJenis ? (
              <div 
                className="hide-scrollbar" 
                style={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  paddingRight: '0.25rem', 
                  width: '100%', 
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                {Object.keys(sections).map(secName => (
                  <div key={secName} style={{ marginBottom: '1.25rem' }}>
                    <div style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', backgroundColor: 'rgba(255,193,7,0.12)', border: '1px solid rgba(255,193,7,0.25)', color: 'var(--color-yellow-primary)', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      {secName}
                    </div>

                    {sections[secName].map(item => {
                      const val = checklist[item.id];
                      const st = val?.status;
                      const rowBg = st === 'baik' ? 'rgba(46,125,50,0.08)' : st === 'tidak_baik' ? 'rgba(183,28,28,0.15)' : st === 'na' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.015)';
                      const rowBorder = st === 'baik' ? 'rgba(76,175,80,0.35)' : st === 'tidak_baik' ? 'rgba(244,67,54,0.5)' : 'var(--color-border)';

                      return (
                        <div 
                          key={item.id} 
                          style={{ 
                            display: 'flex', 
                            flexDirection: isMobile ? 'column' : 'row', 
                            alignItems: isMobile ? 'stretch' : 'center', 
                            gap: isMobile ? '0.5rem' : '0.75rem', 
                            padding: isMobile ? '0.65rem 0.75rem' : '0.35rem 0.6rem', 
                            marginBottom: '0.4rem', 
                            borderRadius: '8px', 
                            border: `1px solid ${rowBorder}`, 
                            backgroundColor: rowBg 
                          }}
                        >
                          {/* TEKS DI ATAS */}
                          <div style={{ flex: 1, fontSize: '0.825rem', color: '#ffffff', lineHeight: '1.35', fontWeight: '500' }}>
                            {item.label}
                            {item.note && (
                              <span style={{ marginLeft: '0.4rem', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', backgroundColor: 'rgba(255,152,0,0.2)', color: '#ffb74d', border: '1px solid rgba(255,152,0,0.4)', fontWeight: 'bold' }}>
                                {item.note}
                              </span>
                            )}
                          </div>

                          {/* OPSI & COMMENT WRAPPER */}
                          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: '0.4rem', flexShrink: 0, width: isMobile ? '100%' : 'auto' }}>
                            
                            {/* OPSI / BUTTONS DI TENAH */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', width: isMobile ? '100%' : 'auto' }}>
                              <button 
                                type="button" 
                                onClick={() => handleStatus(item.id, 'baik')}
                                style={{ ...BTN_STYLES.base, ...(st === 'baik' ? BTN_STYLES.baik : BTN_STYLES.inactive), flex: isMobile ? 1 : 'none', height: '32px' }}
                              >
                                Baik
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleStatus(item.id, 'tidak_baik')}
                                style={{ ...BTN_STYLES.base, ...(st === 'tidak_baik' ? BTN_STYLES.tidak_baik : BTN_STYLES.inactive), flex: isMobile ? 1 : 'none', height: '32px' }}
                              >
                                Tidak Baik
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleStatus(item.id, 'na')}
                                style={{ ...BTN_STYLES.base, ...(st === 'na' ? BTN_STYLES.na : BTN_STYLES.inactive), flex: isMobile ? 1 : 'none', height: '32px' }}
                              >
                                N/A
                              </button>
                            </div>

                            {/* COMMENT / CATATAN TEMUAN DI BAWAH */}
                            <input
                              type="text"
                              className="input-field"
                              style={{ 
                                width: isMobile ? '100%' : '210px', 
                                height: '32px', 
                                padding: '0 0.6rem', 
                                fontSize: '0.8rem',
                                borderColor: st === 'tidak_baik' ? 'rgba(244,67,54,0.7)' : 'var(--color-border)',
                                backgroundColor: st === 'tidak_baik' ? 'var(--color-bg-main)' : 'rgba(0,0,0,0.2)',
                                color: st === 'tidak_baik' ? '#ffffff' : '#555555', 
                                opacity: st === 'tidak_baik' ? 1 : 0.5,
                                cursor: st === 'tidak_baik' ? 'text' : 'not-allowed'
                              }}
                              placeholder={st === 'tidak_baik' ? "Keterangan temuan (Wajib)... *" : "Catatan / komentar..."}
                              value={val?.temuan || ''}
                              onChange={e => handleTemuan(item.id, e.target.value)}
                              disabled={st !== 'tidak_baik'}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Section Input Dynamic List Pergantian Sparepart */}
                <div style={{ marginTop: '1.25rem', marginBottom: '1.25rem', padding: '0.9rem', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--color-border)' }}>
                  {/* Section Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <Wrench size={16} style={{ color: 'var(--color-yellow-primary)' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-yellow-primary)' }}>
                      Daftar Pergantian Sparepart / Komponen Unit
                    </span>
                  </div>

                  {/* Datalist Auto-Suggest Nama Sparepart & Part Number Dinamis (Filtered by Jenis Unit) */}
                  <datalist id="sparepart-name-list">
                    {Array.from(new Set(unitMasterParts.map(m => m.part_name))).map(name => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>

                  {/* Part Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {sparePartList.map((part, index) => {
                      const relevantNumbers = unitMasterParts.filter(m => 
                        m.part_number && 
                        (!part.partName || m.part_name.toLowerCase().includes(part.partName.toLowerCase()))
                      );

                      return (
                        <div 
                          key={index} 
                          style={{ 
                            background: isMobile ? 'rgba(30, 34, 40, 0.9)' : 'transparent', 
                            border: isMobile ? '1px solid rgba(255,255,255,0.09)' : 'none', 
                            borderRadius: isMobile ? '8px' : '0', 
                            padding: isMobile ? '0.75rem' : '0 0 0.25rem 0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            borderBottom: !isMobile && index !== sparePartList.length - 1 ? '1px dashed rgba(255,255,255,0.1)' : 'none'
                          }}
                        >
                          {/* Card Header for Mobile */}
                          {isMobile && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-yellow-primary)', background: 'rgba(255,193,7,0.12)', padding: '0.1rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(255,193,7,0.25)' }}>
                                Sparepart #{index + 1}
                              </span>
                              {sparePartList.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSparePart(index)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff8a80', padding: '0.15rem 0.3rem', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', borderRadius: '4px' }}
                                  title="Hapus Item"
                                >
                                  <Trash2 size={13} /> Hapus
                                </button>
                              )}
                            </div>
                          )}

                          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1.5fr 0.8fr 1fr 1fr auto', gap: '0.65rem', alignItems: 'end' }}>
                            {/* Nama Sparepart */}
                            <div>
                              {(isMobile || index === 0) && <label style={{ fontSize: '0.72rem', color: 'var(--color-silver)', marginBottom: '0.2rem', display: 'block' }}>Nama Sparepart</label>}
                              <input 
                                type="text" 
                                list="sparepart-name-list"
                                className="input-field" 
                                style={{ height: '34px', fontSize: '0.82rem', width: '100%' }}
                                placeholder="Nama sparepart..." 
                                value={part.partName} 
                                onChange={e => handleSparePartNameSelect(index, e.target.value)} 
                              />
                            </div>

                            {/* Part Number */}
                            <div>
                              {(isMobile || index === 0) && <label style={{ fontSize: '0.72rem', color: 'var(--color-silver)', marginBottom: '0.2rem', display: 'block' }}>Part Number</label>}
                              <input 
                                type="text" 
                                list={`sparepart-number-list-${index}`}
                                className="input-field" 
                                style={{ height: '34px', fontSize: '0.82rem', width: '100%' }}
                                placeholder="Part Number..." 
                                value={part.partNumber} 
                                onChange={e => handleSparePartChange(index, 'partNumber', e.target.value)} 
                              />
                              <datalist id={`sparepart-number-list-${index}`}>
                                {relevantNumbers.map((m, i) => (
                                  <option key={m.id || `${m.part_number}_${i}`} value={m.part_number}>
                                    {m.part_name} - {m.part_number}
                                  </option>
                                ))}
                              </datalist>
                            </div>

                            {/* Qty */}
                            <div>
                              {(isMobile || index === 0) && <label style={{ fontSize: '0.72rem', color: 'var(--color-silver)', marginBottom: '0.2rem', display: 'block' }}>Jumlah</label>}
                              <input 
                                type="number" 
                                className="input-field" 
                                style={{ height: '34px', fontSize: '0.82rem', width: '100%' }}
                                placeholder="Qty" 
                                min={1} 
                                value={part.qty} 
                                onChange={e => handleSparePartChange(index, 'qty', e.target.value)} 
                              />
                            </div>

                            {/* Satuan */}
                            <div>
                              {(isMobile || index === 0) && <label style={{ fontSize: '0.72rem', color: 'var(--color-silver)', marginBottom: '0.2rem', display: 'block' }}>Satuan</label>}
                              <SearchableSelect 
                                className="input-field" 
                                style={{ height: '34px', fontSize: '0.82rem', width: '100%' }}
                                value={part.unit} 
                                onChange={e => handleSparePartChange(index, 'unit', e.target.value)}
                              >
                                <option value="Pcs">Pcs</option>
                                <option value="Set">Set</option>
                                <option value="Liter">Liter</option>
                                <option value="Meter">Meter</option>
                                <option value="Unit">Unit</option>
                              </SearchableSelect>
                            </div>

                            {/* Kondisi */}
                            <div>
                              {(isMobile || index === 0) && <label style={{ fontSize: '0.72rem', color: 'var(--color-silver)', marginBottom: '0.2rem', display: 'block' }}>Kondisi</label>}
                              <SearchableSelect 
                                className="input-field" 
                                style={{ height: '34px', fontSize: '0.82rem', width: '100%' }}
                                value={part.statusPart} 
                                onChange={e => handleSparePartChange(index, 'statusPart', e.target.value)}
                              >
                                <option value="Baru">Baru</option>
                                <option value="Rekondisi">Rekondisi</option>
                                <option value="Bekas Layak">Bekas Layak</option>
                              </SearchableSelect>
                            </div>

                            {/* Delete button for Desktop */}
                            {!isMobile && (
                              <div style={{ height: '34px', display: 'flex', alignItems: 'center' }}>
                                {sparePartList.length > 1 ? (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSparePart(index)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff8a80', padding: '0 0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Hapus"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                ) : <div style={{ width: '24px' }}></div>}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Add Button — below all part cards */}
                    <button 
                      type="button" 
                      onClick={handleAddSparePart}
                      style={{ 
                        width: '100%', 
                        padding: '0.6rem',
                        background: 'transparent',
                        border: '1px dashed rgba(255,193,7,0.45)',
                        borderRadius: '8px',
                        color: 'var(--color-yellow-primary)',
                        fontSize: '0.82rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,193,7,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <PlusCircle size={15} /> + Tambah Item Sparepart
                    </button>
                  </div>

                  {/* Kelola / Hapus Katalog Master Sparepart Terdaftar */}
                  {unitMasterParts.length > 0 && (
                    <details style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--color-border)', fontSize: '0.78rem' }}>
                      <summary style={{ cursor: 'pointer', color: 'var(--color-silver)', userSelect: 'none', fontWeight: '500' }}>
                        📋 Kelola / Hapus Katalog Sparepart Terdaftar untuk {selectedJenis || 'Unit Ini'} ({unitMasterParts.length} item tersimpan)
                      </summary>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                        {unitMasterParts.map((m, idx) => (
                          <span 
                            key={m.id || `${m.part_name}_${m.part_number}_${idx}`} 
                            style={{ 
                              display: 'inline-flex', alignItems: 'center', gap: '0.35rem', 
                              padding: '0.2rem 0.5rem', borderRadius: '4px', 
                              backgroundColor: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.25)', 
                              color: 'var(--color-silver-light)' 
                            }}
                          >
                            <strong>{m.part_name}</strong> {m.part_number && <span style={{ opacity: 0.7 }}>({m.part_number})</span>}
                            {m.id && !String(m.id).startsWith('rep_') && (
                              <Trash2 
                                size={12} 
                                style={{ cursor: 'pointer', color: '#ff8a80', marginLeft: '0.2rem' }} 
                                onClick={() => handleDeleteMasterPart(m.id, m.part_name)} 
                                title="Hapus dari Katalog" 
                              />
                            )}
                          </span>
                        ))}
                      </div>
                    </details>
                  )}

                </div>

                {/* Catatan / Ringkasan Tambahan Mekanik */}
                <div style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                    <MessageSquare size={14} style={{ color: 'var(--color-yellow-primary)' }} />
                    Ringkasan Perbaikan / Catatan Tambahan Mekanik
                  </label>
                  <textarea 
                    className="input-field" 
                    rows="2" 
                    style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
                    placeholder="Catatan tambahan mengenai kondisi sparepart yang diganti atau rekomendasi service..."
                    value={ringkasan}
                    onChange={e => setRingkasan(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              /* Prompt Pilih Jenis Unit */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-silver-dark)', padding: '2rem', textAlign: 'center' }}>
                <Truck size={48} style={{ marginBottom: '1rem', opacity: 0.4, color: 'var(--color-yellow-primary)' }} />
                <h3 style={{ fontSize: '1.1rem', color: 'var(--color-silver-light)', marginBottom: '0.5rem' }}>Silakan Pilih Jenis Unit / Peralatan Terlebih Dahulu</h3>
                <p style={{ fontSize: '0.85rem', maxWidth: '480px', color: 'var(--color-silver)' }}>
                  Pilih Jenis Unit di atas untuk menentukan jenis service (berdasarkan HM atau Periode Bulan) dan membuka formulir pemeriksaan.
                </p>
              </div>
            )}

            {/* Footer Submit Button — FIXED */}
            <div style={{ flexShrink: 0, paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', marginTop: '0.5rem' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', height: '38px', fontSize: '0.875rem' }}
              >
                <Save size={16} /> Simpan Laporan Maintenance ({pmTier} — {selectedUnit ? selectedUnit.noLambung : selectedJenis || 'Unit'})
              </button>
            </div>
          </form>

          {/* Pop-up Modal Validasi Isian Belum Lengkap */}
          {showValidationModal && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
            }}>
              <div className="card" style={{
                maxWidth: '480px', width: '100%', padding: '1.5rem',
                backgroundColor: '#1e222d', border: '1px solid #f44336', borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#ff5252', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                  <AlertTriangle size={24} />
                  Formulir Belum Lengkap ({missingFields.length} Poin)
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-silver-light)', marginBottom: '0.75rem' }}>
                  Mohon lengkapi bagian-bagian berikut sebelum menyimpan laporan:
                </p>
                <ul style={{ margin: '0 0 1.25rem 0', paddingLeft: '1.25rem', fontSize: '0.825rem', color: '#ffcdd2', lineHeight: '1.5' }}>
                  {missingFields.map((msg, idx) => (
                    <li key={idx} style={{ marginBottom: '0.2rem' }}>{msg}</li>
                  ))}
                </ul>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  style={{ width: '100%', height: '36px', fontSize: '0.85rem' }}
                  onClick={() => setShowValidationModal(false)}
                >
                  Lengkapi Form Sekarang
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB RIWAYAT PM SERVICE ── */}
      {activeTab === 'history' && (
        <div className="card no-print" style={{ flex: 1, overflow: 'auto', width: '100%', padding: '1.25rem' }}>
          <h2 className="mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <List size={18} style={{ color: 'var(--color-yellow-primary)' }} />
            Riwayat Pelaporan Preventive Maintenance (PM Service)
          </h2>
          {reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-silver-dark)' }}>
              <ClipboardList size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
              <p style={{ fontSize: '0.9rem' }}>Belum ada laporan PM Service yang tersimpan.</p>
              <button className="btn btn-primary" style={{ marginTop: '1rem', fontSize: '0.85rem' }} onClick={() => setActiveTab('create')}>Buat Laporan PM Sekarang</button>
            </div>
          ) : isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '85px' }}>
              {reports.map(r => (
                <div 
                  key={r.id} 
                  style={{
                    background: 'rgba(25, 29, 34, 0.95)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    padding: '0.85rem',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  {/* Top Header Row: No Lambung + Tier Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.45rem' }}>
                    <div>
                      <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--color-yellow-primary)' }}>
                        {r.noLambung}
                      </span>
                      <span style={{ fontSize: '0.725rem', color: 'var(--color-silver)', marginLeft: '0.5rem' }}>
                        {r.jenisUnit}
                      </span>
                    </div>
                    <span style={{ padding: '0.15rem 0.55rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: 'rgba(255,193,7,0.18)', color: 'var(--color-yellow-primary)', border: '1px solid rgba(255,193,7,0.4)' }}>
                      {r.pmTier}
                    </span>
                  </div>

                  {/* Info Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.775rem' }}>
                    <div>
                      <span style={{ color: 'var(--color-silver)' }}>HM/KM: </span>
                      <strong style={{ color: '#ffffff' }}>{r.hm ? `${r.hm} HM` : '-'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-silver)' }}>Tanggal: </span>
                      <strong style={{ color: '#ffffff' }}>{r.date}</strong>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: 'var(--color-silver)' }}>Pelapor: </span>
                      <span style={{ color: '#ffffff' }}>{r.reporter}</span>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: 'var(--color-silver)' }}>Downtime / Pengerjaan: </span>
                      <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{r.downtime_hours || 0} Jam</span>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: 'var(--color-silver)' }}>Hasil: </span>
                      <span style={{ color: r.tidakBaikItems > 0 ? '#ff8a80' : '#81c784', fontWeight: '600' }}>
                        {r.tidakBaikItems > 0 ? `⚠️ ${r.tidakBaikItems} temuan kerusakan` : '✓ Seluruh item Baik / Normal'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div style={{ display: 'flex', gap: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }} 
                      onClick={() => handleStartEditReport(r)}
                    >
                      <Edit size={13} /> Edit
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', borderColor: 'var(--color-yellow-primary)', color: 'var(--color-yellow-primary)' }} 
                      onClick={() => setSelectedReportForPrint(r)}
                    >
                      <ClipboardList size={13} /> Form Resmi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '0.6rem 0.85rem', color: 'var(--color-silver)', fontSize: '0.825rem' }}>Tanggal</th>
                  <th style={{ padding: '0.6rem 0.85rem', color: 'var(--color-silver)', fontSize: '0.825rem' }}>Tier PM</th>
                  <th style={{ padding: '0.6rem 0.85rem', color: 'var(--color-silver)', fontSize: '0.825rem' }}>Unit</th>
                  <th style={{ padding: '0.6rem 0.85rem', color: 'var(--color-silver)', fontSize: '0.825rem' }}>HM/KM</th>
                  <th style={{ padding: '0.6rem 0.85rem', color: 'var(--color-silver)', fontSize: '0.825rem' }}>Mekanik</th>
                  <th style={{ padding: '0.6rem 0.85rem', color: 'var(--color-silver)', fontSize: '0.825rem' }}>Downtime (Jam)</th>
                  <th style={{ padding: '0.6rem 0.85rem', color: 'var(--color-silver)', fontSize: '0.825rem' }}>Hasil Pemeriksaan</th>
                  <th style={{ padding: '0.6rem 0.85rem', color: 'var(--color-silver)', fontSize: '0.825rem', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}>{r.date}</td>
                    <td style={{ padding: '0.6rem 0.85rem' }}>
                      <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: r.pmTier === 'HM 500' ? 'rgba(255,152,0,0.2)' : 'rgba(255,193,7,0.2)', color: r.pmTier === 'HM 500' ? '#ffb74d' : 'var(--color-yellow-primary)', border: '1px solid rgba(255,193,7,0.3)' }}>
                        {r.pmTier}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem' }}>
                      <div style={{ fontWeight: '600', color: 'var(--color-yellow-primary)', fontSize: '0.875rem' }}>{r.noLambung}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-silver)' }}>{r.jenisUnit} ({r.unitDetail})</div>
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}>{r.hm ? `${r.hm} HM` : '-'}</td>
                    <td style={{ padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}>{r.reporter}</td>
                    <td style={{ padding: '0.6rem 0.85rem', fontSize: '0.85rem', fontWeight: 'bold' }}>{r.downtime_hours || 0}</td>
                    <td style={{ padding: '0.6rem 0.85rem' }}>
                      <span style={{ fontSize: '0.8rem', color: r.tidakBaikItems > 0 ? '#ff8a80' : '#81c784' }}>
                        {r.tidakBaikItems > 0 ? `⚠️ Ada ${r.tidakBaikItems} temuan` : '✓ Seluruh item Baik'}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                        <button 
                          type="button"
                          className="btn btn-secondary" 
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderColor: 'var(--color-yellow-primary)', color: 'var(--color-yellow-primary)' }}
                          onClick={() => handleStartEditReport(r)}
                          title="Edit Laporan Ini"
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button 
                          type="button"
                          className="btn btn-secondary" 
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          onClick={() => setSelectedReportForPrint(r)}
                          title="Cetak Preview Form Resmi"
                        >
                          <ClipboardList size={14} style={{ color: 'var(--color-yellow-primary)' }} /> Form Resmi
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── MODAL FORMULIR RESMI PM SERVICE PRINT PREVIEW ── */}
      {selectedReportForPrint && (
        <div className="print-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          
          {/* Action Bar Header (Tidak ikut tercetak saat disave PDF/Print) */}
          <div className="no-print" style={{ width: '100%', maxWidth: '900px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '1rem' }}>
              Preview Formulir Resmi PM Service: {selectedReportForPrint.noLambung} ({selectedReportForPrint.pmTier})
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                onClick={() => window.print()}
              >
                🖨️ Cetak / Save PDF
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                onClick={() => setSelectedReportForPrint(null)}
              >
                Tutup
              </button>
            </div>
          </div>

          {/* Form Content Container — Styled like Paper Document */}
          <div 
            className="print-container hide-scrollbar"
            style={{ 
              width: '100%', maxWidth: '900px', height: '85vh', backgroundColor: '#ffffff', color: '#000000', 
              borderRadius: '6px', padding: '1.5rem', overflowY: 'auto', fontSize: '10px', fontFamily: 'Arial, sans-serif'
            }}
          >
            {/* Dynamic Official Items Selection (ANFO HINO vs MMU IVECO vs COMPRESSOR vs HWB vs GENSET vs FORKLIFT) */}
            {(() => {
              const isCompressor = selectedReportForPrint.jenisUnit === 'Compressor';
              const isHwb = selectedReportForPrint.jenisUnit === 'Hot Water Boiler (HWB)';
              const isGenset = selectedReportForPrint.jenisUnit === 'Genset';
              const isForklift = selectedReportForPrint.jenisUnit === 'Forklift';
              const isAnfoHino = selectedReportForPrint.jenisUnit === 'Anfo Truck';
              const is8MonthCompressor = isCompressor && selectedReportForPrint.pmTier === 'PM 8 Month';
              const is6MonthHwb = isHwb && selectedReportForPrint.pmTier === 'PM 6 Month';
              const is1000Genset = isGenset && (selectedReportForPrint.pmTier === 'PM 1000' || selectedReportForPrint.pmTier === 'PM 2000');

              const targetItems = isCompressor 
                ? COMPRESSOR_PM_MASTER_ITEMS.filter(item => item.tiers.includes(is8MonthCompressor ? '8M' : '4M'))
                : isHwb
                  ? HWB_PM_MASTER_ITEMS.filter(item => item.tiers.includes(is6MonthHwb ? '6M' : '3M'))
                  : isGenset
                    ? GENSET_PM_MASTER_ITEMS.filter(item => item.tiers.includes(is1000Genset ? '1000' : '250'))
                    : isForklift
                      ? FORKLIFT_PM_MASTER_ITEMS.filter(item => item.tiers.includes((selectedReportForPrint.pmTier === 'PM 1000' || selectedReportForPrint.pmTier === 'PM 2000') ? '1000' : selectedReportForPrint.pmTier === 'PM 500' ? '500' : '250'))
                      : isAnfoHino 
                        ? ANFO_HINO_OFFICIAL_ITEMS 
                        : MMU_IVECO_OFFICIAL_ITEMS;

              const docTitle = isCompressor 
                ? (is8MonthCompressor ? '8-MONTH PM SERVICE – COMPRESSOR' : '4-MONTH PM SERVICE – COMPRESSOR')
                : isHwb
                  ? (is6MonthHwb ? 'PM SERVICE 6 MONTHLY HWB' : 'PM SERVICE 3 MONTHLY HWB')
                  : isGenset
                    ? (is1000Genset ? 'PM SERVICE C, 1000 Hrs Generator Set' : 'PM SERVICE A, 250 Hrs Generator Set')
                    : isForklift
                      ? 'FORKLIFT PM SERVICE PERIODIC 250/500/1000 Hours Meter'
                      : isAnfoHino 
                        ? 'PM SERVICE "ANFO TRUCK - HINO"' 
                        : 'PM SERVICE "MMU TRUCK - IVECO"';

              const docNo = isCompressor 
                ? (is8MonthCompressor ? 'F-KMB-BMP-BSIB-001-024' : 'F-KMB-BMP-BSIB-001-023')
                : isHwb
                  ? (is6MonthHwb ? 'F-KMB-BMP-BSIB-001-021' : 'F-KMB-BMP-BSIB-001-020')
                  : isGenset
                    ? (is1000Genset ? 'F-KMB-BMP-BSIB-001-029' : 'F-KMB-BMP-BSIB-001-028')
                    : isForklift
                      ? 'F-KMB-BMP-BSIB-001-013'
                      : 'F-KMB-BMP-BSIB-001-008';

              const revisionNo = (isCompressor || isHwb || isForklift) ? '02' : '01';
              const effectiveDate = (isCompressor || isHwb || isGenset || isForklift) ? '30/03/2026' : '09/07/2026';

              const chunkSize = 38;
              const pagesCount = Math.ceil(targetItems.length / chunkSize);
              const pages = [];

              for (let p = 0; p < pagesCount; p++) {
                const chunk = targetItems.slice(p * chunkSize, (p + 1) * chunkSize);
                const isLastPage = p === pagesCount - 1;

                pages.push(
                  <div 
                    key={p} 
                    className={p > 0 ? "page-break-before" : ""}
                    style={{ marginBottom: '1.5rem', pageBreakAfter: isLastPage ? 'auto' : 'always' }}
                  >
                    {/* Header Document Table (Match Exact Image Layout - Kop di Setiap Halaman) */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000000', marginBottom: '0.4rem', fontSize: '10px' }}>
                      <tbody>
                        <tr>
                          <td rowSpan={2} style={{ border: '1px solid #000000', width: '150px', padding: '4px', textAlign: 'center', verticalAlign: 'middle' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#002060', letterSpacing: '-0.5px' }}>mnk | bme</div>
                          </td>
                          <td style={{ border: '1px solid #000000', textAlign: 'center', padding: '3px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '12px', fontStyle: 'italic' }}>FORMULIR</div>
                            <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#0070c0', fontStyle: 'italic' }}>FORM</div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #000000', textAlign: 'center', fontWeight: 'bold', fontSize: '12px', padding: '3px' }}>
                            {docTitle}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2} style={{ border: '1px solid #000000', padding: '3px 6px', backgroundColor: '#ffffff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                              <span>No. Dokumen / <i>Document No.</i> : {docNo}</span>
                              <span>Revisi / <i>Revision</i> : {revisionNo}</span>
                              <span>Tanggal Efektif / <i>Effective Date</i> : {effectiveDate}</span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Metadata Info Unit (2 Column Table Layout - Hanya di Halaman 1) */}
                    {p === 0 && (
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', marginBottom: '0.5rem', fontSize: '9px' }}>
                        <tbody>
                          <tr>
                            <td style={{ padding: '3px 6px', borderRight: '1px solid #000000', width: '50%' }}>
                              <div><strong>UNIT NUMBER</strong> : {selectedReportForPrint.noLambung}</div>
                              <div><strong>UNIT MODEL</strong> : {selectedReportForPrint.unitDetail || selectedReportForPrint.jenisUnit}</div>
                              <div><strong>HM / KM</strong> : {selectedReportForPrint.hm} HM</div>
                            </td>
                            <td style={{ padding: '3px 6px', width: '50%' }}>
                              <div><strong>SITE</strong> : Workshop Site Main</div>
                              <div><strong>DATE</strong> : {selectedReportForPrint.date}</div>
                              <div><strong>OPERATOR</strong> : -</div>
                              <div><strong>TECHNICIAN</strong> : {selectedReportForPrint.reporter}</div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}

                    {/* Kode Interval Header Box & Note (Hanya di Halaman 1) */}
                    {p === 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.4rem' }}>
                        <div>
                          <table style={{ borderCollapse: 'collapse', border: '1px solid #000000', fontSize: '8px', textAlign: 'center' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#ffffff' }}>
                                <th style={{ border: '1px solid #000000', padding: '2px 4px' }}>INFORMATION</th>
                                <th style={{ border: '1px solid #000000', padding: '2px 4px' }}>EVERY 250<br/>HRS</th>
                                <th style={{ border: '1px solid #000000', padding: '2px 4px' }}>EVERY 500<br/>HRS</th>
                                <th style={{ border: '1px solid #000000', padding: '2px 4px' }}>EVERY 1000 HRS</th>
                                <th style={{ border: '1px solid #000000', padding: '2px 4px' }}>EVERY 2000 HRS</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td style={{ border: '1px solid #000000', padding: '2px 4px', fontWeight: 'bold' }}>CODE</td>
                                <td style={{ border: '1px solid #000000', padding: '2px 4px', fontWeight: 'bold' }}>A</td>
                                <td style={{ border: '1px solid #000000', padding: '2px 4px', fontWeight: 'bold' }}>B</td>
                                <td style={{ border: '1px solid #000000', padding: '2px 4px', fontWeight: 'bold' }}>C</td>
                                <td style={{ border: '1px solid #000000', padding: '2px 4px', fontWeight: 'bold' }}>D</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div style={{ fontSize: '8px', fontWeight: 'bold' }}>
                          Result of inspection &nbsp; <b>✓: Good Condition</b> &nbsp; <b>X: Bad Condition</b> &nbsp; <b>⊗: Need Correction</b>
                          <div style={{ textAlign: 'right', color: '#0070c0', fontStyle: 'italic', fontWeight: 'normal' }}>Halaman {p + 1} dari {pagesCount}</div>
                        </div>
                      </div>
                    )}

                    {/* Main Checklist Items Matrix Page Chunk */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', fontSize: '9px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#e0e0e0', borderBottom: '1px solid #000000' }}>
                          <th style={{ border: '1px solid #000000', padding: '3px', width: '28px' }}>NO</th>
                          <th style={{ border: '1px solid #000000', padding: '3px', textAlign: 'left' }}>ITEM CHECKLIST PEMERIKSAAN</th>
                          <th style={{ border: '1px solid #000000', padding: '3px', width: '18px' }}>A</th>
                          <th style={{ border: '1px solid #000000', padding: '3px', width: '18px' }}>B</th>
                          <th style={{ border: '1px solid #000000', padding: '3px', width: '18px' }}>C</th>
                          <th style={{ border: '1px solid #000000', padding: '3px', width: '18px' }}>D</th>
                          <th style={{ border: '1px solid #000000', padding: '3px', width: '65px' }}>RESULT</th>
                          <th style={{ border: '1px solid #000000', padding: '3px', width: '170px' }}>COMMENT / CATATAN</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chunk.map((item, idx) => {
                          const globalIdx = p * chunkSize + idx + 1;
                          const reportTierCode = selectedReportForPrint.pmTier === 'PM 2000' ? 'D' : selectedReportForPrint.pmTier === 'PM 1000' ? 'C' : selectedReportForPrint.pmTier === 'PM 500' ? 'B' : 'A';
                          const isApplicable = item.tiers.includes(reportTierCode);

                          let checkObj = null;
                          if (selectedReportForPrint.checklist && Array.isArray(selectedReportForPrint.checklist)) {
                            checkObj = selectedReportForPrint.checklist.find(c => c.id === item.id);
                          }
                          
                          const res = checkObj ? checkObj.status : (isApplicable ? 'baik' : 'na');
                          const comment = checkObj ? checkObj.temuan : '';

                          return (
                            <tr key={item.id} style={{ borderBottom: '1px solid #cccccc', opacity: isApplicable ? 1 : 0.4, backgroundColor: isApplicable ? 'transparent' : '#f5f5f5' }}>
                              <td style={{ border: '1px solid #000000', padding: '2px 3px', textAlign: 'center' }}>{globalIdx}</td>
                              <td style={{ border: '1px solid #000000', padding: '2px 4px' }}>{item.label}</td>
                              <td style={{ border: '1px solid #000000', padding: '2px', textAlign: 'center' }}>{item.tiers.includes('A') ? '•' : ''}</td>
                              <td style={{ border: '1px solid #000000', padding: '2px', textAlign: 'center' }}>{item.tiers.includes('B') ? '•' : ''}</td>
                              <td style={{ border: '1px solid #000000', padding: '2px', textAlign: 'center' }}>{item.tiers.includes('C') ? '•' : ''}</td>
                              <td style={{ border: '1px solid #000000', padding: '2px', textAlign: 'center' }}>{item.tiers.includes('D') ? '•' : ''}</td>
                              <td style={{ border: '1px solid #000000', padding: '2px', textAlign: 'center', fontWeight: 'bold', color: res === 'tidak_baik' ? '#b71c1c' : res === 'baik' ? '#1b5e20' : '#757575' }}>
                                {!isApplicable ? 'N/A' : res === 'tidak_baik' ? '✗ BAD' : '✓ GOOD'}
                              </td>
                              <td style={{ border: '1px solid #000000', padding: '2px 4px', fontSize: '8px' }}>{comment || (!isApplicable ? '-' : '')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Bottom Signatures Box (Hanya Muncul di Halaman Terakhir) */}
                    {isLastPage && (
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', marginTop: '1rem', textAlign: 'center', fontSize: '9px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f0f0f0' }}>
                            <td style={{ border: '1px solid #000000', padding: '4px', width: '50%' }}><strong>Dibuat oleh (Technician / Mekanik):</strong></td>
                            <td style={{ border: '1px solid #000000', padding: '4px', width: '50%' }}><strong>Diperiksa oleh (Leading Hand / Supervisor):</strong></td>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ border: '1px solid #000000', height: '50px', verticalAlign: 'bottom', paddingBottom: '4px' }}>
                              ({selectedReportForPrint.reporter})
                            </td>
                            <td style={{ border: '1px solid #000000', height: '50px', verticalAlign: 'bottom', paddingBottom: '4px' }}>
                              ( Leading Hand Maintenance )
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              }

              return pages;
            })()}

          </div>
        </div>
      )}

    </div>
  );
}
