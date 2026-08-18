import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, ClipboardList, List, PlusCircle, CheckCircle2, AlertTriangle, 
  Truck, User, Calendar, Save, Trash2, Clock, ShieldAlert, FileText, Check, X, Hash
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import SearchableSelect from '../components/SearchableSelect';


// ── UNIFIED OPERATOR READINESS SECTION (Light Vehicle Standard) ──
const STANDARD_OPERATOR_SECTION = {
  title: 'SECTION A: KESIAPAN OPERATOR — STOP BEKERJA JIKA TERDAPAT JAWABAN "TIDAK"',
  color: '#ff8a80',
  bgColor: 'rgba(239,83,80,0.12)',
  borderColor: 'rgba(239,83,80,0.3)',
  isOperatorSection: true,
  items: [
    { id: 'std_op1', label: 'Simper Valid' },
    { id: 'std_op2', label: 'Waktu tidur 6 jam (minimal) dalam 24 jam terakhir' },
    { id: 'std_op3', label: 'Pikiran saya fokus pada pekerjaan di shift ini' },
    { id: 'std_op4', label: 'Tidak dalam pengaruh obat' },
    { id: 'std_op5', label: 'Tidak ada permasalahan dengan atasan, keluarga, dan orang lain' }
  ]
};

// ── MMU TRUCK P2H SECTIONS ──
const MMU_P2H_SECTIONS = [
  STANDARD_OPERATOR_SECTION,
  {
    title: 'B. PEMERIKSAAN KELILING UNIT (UNIT PERIMETER INSPECTION)',
    color: '#ffb74d',
    bgColor: 'rgba(255,152,0,0.12)',
    borderColor: 'rgba(255,152,0,0.3)',
    items: [
      { id: 'mmu_a1', label: 'Ban & baut roda' },
      { id: 'mmu_a2', label: 'Kondisi spring dan pengikat spring' },
      { id: 'mmu_a3', label: 'Kondisi Battery & Box' },
      { id: 'mmu_a4', label: 'Kondisi Tangki Bahan Bakar' },
      { id: 'mmu_a5', label: 'Kondisi Penutup Tangki Bahan Bakar' },
      { id: 'mmu_a6', label: 'Buang air pada tabung angin unit' },
      { id: 'mmu_a7', label: 'Periksa jalur angin dari kebocoran' },
      { id: 'mmu_a8', label: 'Kebocoran transmisi' },
      { id: 'mmu_a9', label: 'Kebocoran Differential & Transfer case' },
      { id: 'mmu_a10', label: 'Tutup mesin, Penahan lumpur & Body kabin' },
      { id: 'mmu_a11', label: 'Indikator air cleaner' },
      { id: 'mmu_a12', label: 'Safety cone (2 pcs)' },
      { id: 'mmu_a13', label: 'Ganjal ban (2 pcs)' },
      { id: 'mmu_a14', label: 'APAR 6 Kg (2 pcs)' },
      { id: 'mmu_a15', label: 'Kelainan suara operasi' },
      { id: 'mmu_a16', label: 'Kondisi semua lampu depan / belakang' },
      { id: 'mmu_a17', label: 'Fungsi semua lampu depan / belakang' },
      { id: 'mmu_a18', label: 'Kebersihan Unit' },
      { id: 'mmu_a19', label: 'Kondisi rantai grounding' },
      { id: 'mmu_a20', label: 'Kondisi bendera unit' },
      { id: 'mmu_a21', label: 'Fungsi dan kondisi alarm mundur' }
    ]
  },
  {
    title: 'C. PEMERIKSAAN RUANG MESIN (ENGINE COMPARTMENT INSPECTION)',
    color: '#ffd54f',
    bgColor: 'rgba(255,213,79,0.12)',
    borderColor: 'rgba(255,213,79,0.3)',
    items: [
      { id: 'mmu_b1', label: 'Kondisi Oli mesin dan level' },
      { id: 'mmu_b2', label: 'Kondisi Air radiator dan level' },
      { id: 'mmu_b3', label: 'Level minyak steering' },
      { id: 'mmu_b4', label: 'Level minyak kopling' },
      { id: 'mmu_b5', label: 'Kondisi hydraulic tilt cabin' },
      { id: 'mmu_b6', label: 'Kebocoran oli pada engine' },
      { id: 'mmu_b7', label: 'Kondisi V-Belt' },
      { id: 'mmu_b8', label: 'Kondisi Exhaust muffler' }
    ]
  },
  {
    title: 'D. PEMERIKSAAN FABRICATION / MIXING UNIT (FABRICATION / MIXING UNIT INSPECTION)',
    color: '#64b5f6',
    bgColor: 'rgba(33,150,243,0.12)',
    borderColor: 'rgba(33,150,243,0.3)',
    items: [
      { id: 'mmu_c1', label: 'Bin MMU' },
      { id: 'mmu_c2', label: 'Semua Baut pengikat bin ke chassis' },
      { id: 'mmu_c3', label: 'Tangga bin & hand rail' },
      { id: 'mmu_c4', label: 'Kondisi / fungsi central panel & box' },
      { id: 'mmu_c5', label: 'Fungsi Emergency stop' },
      { id: 'mmu_c6', label: 'Main pump hydraulic' },
      { id: 'mmu_c7', label: 'Kondisi PTO sistem' },
      { id: 'mmu_c8', label: 'Cooler hidraulik' },
      { id: 'mmu_c9', label: 'Semua Motor Hydraulic' },
      { id: 'mmu_c10', label: 'Pompa gasser' },
      { id: 'mmu_c11', label: 'Level Gasser' },
      { id: 'mmu_c12', label: 'Pompa Air' },
      { id: 'mmu_c13', label: 'Level Air' },
      { id: 'mmu_c14', label: 'Pompa Product' },
      { id: 'mmu_c15', label: 'Hose reel & Hose Product' },
      { id: 'mmu_c16', label: 'Kondisi Hopper & Auger Unit' },
      { id: 'mmu_c17', label: 'Pompa Emulsion' },
      { id: 'mmu_c18', label: 'Kondisi Hydraulic Cylinder Auger' },
      { id: 'mmu_c19', label: 'Kondisi Hydraulic Hose Reel' },
      { id: 'mmu_c20', label: 'Fungsi Flow Meter (gasser / Air)' },
      { id: 'mmu_c21', label: 'Fungsi semua Pressure Gauge' },
      { id: 'mmu_c22', label: 'Fungsi Tuas Penggerak Control Valve' },
      { id: 'mmu_c23', label: 'Kondisi Semua Hose Hydraulic' },
      { id: 'mmu_c24', label: 'Periksa kondisi fire suppression (tabung & gauge)' },
      { id: 'mmu_c25', label: 'Periksa kondisi switch fire suppression' },
      { id: 'mmu_c26', label: 'Tank Hydraulic Oil' }
    ]
  },
  {
    title: 'E. PEMERIKSAAN DI DALAM KABIN (CABIN INSPECTION)',
    color: '#81c784',
    bgColor: 'rgba(76,175,80,0.12)',
    borderColor: 'rgba(76,175,80,0.3)',
    items: [
      { id: 'mmu_d1', label: 'Fungsi rem tangan / parkir' },
      { id: 'mmu_d2', label: 'Fungsi rem kaki' },
      { id: 'mmu_d3', label: 'Fungsi kopling' },
      { id: 'mmu_d4', label: 'Fungsi seatbelt' },
      { id: 'mmu_d5', label: 'Fungsi steering / kemudi' },
      { id: 'mmu_d6', label: 'Monitor panel' },
      { id: 'mmu_d7', label: 'Kondisi Air conditioner' },
      { id: 'mmu_d8', label: 'Fungsi Semua lampu kerja & Rotary' },
      { id: 'mmu_d9', label: 'Fungsi mirror / spion' },
      { id: 'mmu_d10', label: 'Wiper / Air wiper' },
      { id: 'mmu_d11', label: 'Klakson' },
      { id: 'mmu_d12', label: 'Radio komunikasi' },
      { id: 'mmu_d13', label: 'Kelengkapan P3K' },
      { id: 'mmu_d14', label: 'Safety harness' },
      { id: 'mmu_d15', label: 'APAR' },
      { id: 'mmu_d16', label: 'Periksa kondisi switch fire suppression kabin' },
      { id: 'mmu_d17', label: 'Kebersihan ruang kabin' }
    ]
  }
];

// ── ANFO TRUCK P2H SECTIONS ──
const ANFO_P2H_SECTIONS = [
  STANDARD_OPERATOR_SECTION,
  {
    title: 'B. PEMERIKSAAN KELILING UNIT (UNIT WALK-AROUND INSPECTION)',
    color: '#ffb74d',
    bgColor: 'rgba(255,152,0,0.12)',
    borderColor: 'rgba(255,152,0,0.3)',
    items: [
      { id: 'anfo_b1', label: 'Kondisi ban & baut roda (Tire and Wheel Bolt Condition)' },
      { id: 'anfo_b2', label: 'Kondisi batteray & box (Battery and Battery Box Condition)' },
      { id: 'anfo_b3', label: 'Kondisi tangki BBC dan penutup (BBC Tank and Cap Condition)' },
      { id: 'anfo_b4', label: 'Buang air pada tabung angin (Drain Water from Air Tank)' },
      { id: 'anfo_b5', label: 'Kebocoran oli (Oil Leaks)' },
      { id: 'anfo_b6', label: 'Bersihkan filter udara (Clean Air Filter)' },
      { id: 'anfo_b7', label: 'Kondisi semua lampu (All Lights Condition)' },
      { id: 'anfo_b8', label: 'Safety Cone 2 buah (2 Safety Cones)' },
      { id: 'anfo_b9', label: 'Ganjal Ban 2 buah (2 Wheel Chocks)' },
      { id: 'anfo_b10', label: 'Apar 6 Kg 2 buah (2 Fire Extinguishers 6 kg)' },
      { id: 'anfo_b11', label: 'Kebersihan Unit (Unit Cleanliness)' },
      { id: 'anfo_b12', label: 'Fungsi alarm Mundur (Reverse Alarm Function)' },
      { id: 'anfo_b13', label: 'Rantai Grounding (Grounding Chain)' }
    ]
  },
  {
    title: 'C. PEMERIKSAAN RUANG MESIN (ENGINE COMPARTMENT INSPECTION)',
    color: '#ffd54f',
    bgColor: 'rgba(255,213,79,0.12)',
    borderColor: 'rgba(255,213,79,0.3)',
    items: [
      { id: 'anfo_c1', label: 'Level oli mesin (Engine Oil Level)' },
      { id: 'anfo_c2', label: 'Level Air radiator (Radiator Water Level)' },
      { id: 'anfo_c3', label: 'Level minyak rem (Brake Fluid Level)' },
      { id: 'anfo_c4', label: 'Level minyak steering (Power Steering Fluid Level)' },
      { id: 'anfo_c5', label: 'Level minyak kopling (Clutch Fluid Level)' }
    ]
  },
  {
    title: 'D. PEMERIKSAAN FABRICATION / MIXING UNIT (FABRICATION / MIXING UNIT INSPECTION)',
    color: '#64b5f6',
    bgColor: 'rgba(33,150,243,0.12)',
    borderColor: 'rgba(33,150,243,0.3)',
    items: [
      { id: 'anfo_d1', label: 'Kondisi Bin Anfo Truck (Anfo Truck Bin Condition)' },
      { id: 'anfo_d2', label: 'Kondisi baut pengikat dan braket bin (Bin Fastening Bolts and Bracket)' },
      { id: 'anfo_d3', label: 'Kondisi tangga bin & hand rail (Bin Ladder and Handrail Condition)' },
      { id: 'anfo_d4', label: 'Kondisi / fungsi kontrol panel & box (Control Panel and Box)' },
      { id: 'anfo_d5', label: 'Fungsi Emergency stop (Emergency Stop Function)' },
      { id: 'anfo_d6', label: 'Main pump hidraulik (Main Hydraulic Pump)' },
      { id: 'anfo_d7', label: 'Kondisi PTO sistem (PTO System Condition)' },
      { id: 'anfo_d8', label: 'Kondisi dan fungsi cooler hidraulik (Hydraulic Cooler Condition)' },
      { id: 'anfo_d9', label: 'Pompa Solar (Diesel Pump)' },
      { id: 'anfo_d10', label: 'Fungsi semua jarum pengontrol tekanan (All Pressure Gauge Needles)' },
      { id: 'anfo_d11', label: 'Fungsi semua tuas penggerak (All Control Levers)' },
      { id: 'anfo_d12', label: 'Kebocoran pada hydraulic sistem (Hydraulic System Leak Check)' },
      { id: 'anfo_d13', label: 'Kondisi auger unit (Auger Unit Condition)' },
      { id: 'anfo_d14', label: 'Kondisi cylinder boom (Boom Cylinder Condition)' },
      { id: 'anfo_d15', label: 'Kondisi braket (Bracket Condition)' },
      { id: 'anfo_d16', label: 'Kondisi safety cylinder boom (Safety Boom Cylinder Condition)' }
    ]
  },
  {
    title: 'E. PEMERIKSAAN DI DALAM KABIN (CABIN INSPECTION)',
    color: '#81c784',
    bgColor: 'rgba(76,175,80,0.12)',
    borderColor: 'rgba(76,175,80,0.3)',
    items: [
      { id: 'anfo_e1', label: 'Fungsi rem tangan / parkir (Parking Brake Function)' },
      { id: 'anfo_e2', label: 'Fungsi rem kaki (Foot Brake Function)' },
      { id: 'anfo_e3', label: 'Fungsi kopling (Clutch Function)' },
      { id: 'anfo_e4', label: 'Fungsi seatbelt (Seatbelt Function)' },
      { id: 'anfo_e5', label: 'Fungsi steering / kemudi (Steering Function)' },
      { id: 'anfo_e6', label: 'Panel monitor (Monitor Panel)' },
      { id: 'anfo_e7', label: 'Kondisi Air conditioner (Air Conditioner Condition)' },
      { id: 'anfo_e8', label: 'Fungsi Semua lampu kerja & Rotary (All Work Lights & Rotary Light)' },
      { id: 'anfo_e9', label: 'Kondisi spion (Mirror Condition)' },
      { id: 'anfo_e10', label: 'Fungsi klakson (Horn Function)' },
      { id: 'anfo_e11', label: 'Fungsi radio Komunikasi (Communication Radio Function)' },
      { id: 'anfo_e12', label: 'Kotak P3K (First Aid Kit)' },
      { id: 'anfo_e13', label: 'Safety Harness (Safety Harness)' },
      { id: 'anfo_e14', label: 'Apar 1 kg (Fire Extinguisher 1 kg)' },
      { id: 'anfo_e15', label: 'Kebersihan ruang kabin (Cabin Cleanliness)' }
    ]
  }
];

// ── LIGHT VEHICLE (LV) P2H SECTIONS ──
const LV_P2H_SECTIONS = [
  STANDARD_OPERATOR_SECTION,
  {
    title: 'SECTION B: ITEM KRITIS UNIT — STOP BEKERJA JIKA TERDAPAT JAWABAN "RUSAK / TIDAK NORMAL"',
    color: '#ffb74d',
    bgColor: 'rgba(255,152,0,0.12)',
    borderColor: 'rgba(255,152,0,0.3)',
    items: [
      { id: 'lv_kr1', label: 'Ban & Baut Roda' },
      { id: 'lv_kr2', label: 'Sabuk Pengaman' },
      { id: 'lv_kr3', label: 'Sistem Kemudi' },
      { id: 'lv_kr4', label: 'Semua Rem' },
      { id: 'lv_kr5', label: 'Klakson' },
      { id: 'lv_kr6', label: 'Alarm Mundur' },
      { id: 'lv_kr7', label: 'Radio Komunikasi' },
      { id: 'lv_kr8', label: 'Spion / Spy' },
      { id: 'lv_kr9', label: 'Pemeriksaan Aki - Kebersihan Aki' },
      { id: 'lv_kr10', label: 'Pemeriksaan Aki - Level Air Aki' },
      { id: 'lv_kr11', label: 'Pemeriksaan Aki - Penutup dan Lubang Breather' },
      { id: 'lv_kr12', label: 'Pemeriksaan Aki - Kepala Aki' },
      { id: 'lv_kr13', label: 'Pemeriksaan Aki - Kabel Rangkaian Aki' },
      { id: 'lv_kr14', label: 'Tabung Udara (Angin)' },
      { id: 'lv_kr15', label: 'Lampu Kerja Depan' },
      { id: 'lv_kr16', label: 'Lampu Kerja Sign' },
      { id: 'lv_kr17', label: 'Lampu Strobe / Rotary' },
      { id: 'lv_kr18', label: 'Safety / Traffic Cone' },
      { id: 'lv_kr19', label: 'Ganjal Ban / Wheel Chock' },
      { id: 'lv_kr20', label: 'APAR' },
      { id: 'lv_kr21', label: 'Buggy Whip' },
      { id: 'lv_kr22', label: 'Alat Keselamatan Berbasis Teknologi' }
    ]
  },
  {
    title: 'SECTION C: ITEM NON-KRITIS — MENGIKUTI REKOMENDASI MEKANIK (WAJIB PERBAIKAN 1X24 JAM)',
    color: '#64b5f6',
    bgColor: 'rgba(33,150,243,0.12)',
    borderColor: 'rgba(33,150,243,0.3)',
    items: [
      { id: 'lv_nk1', label: 'Fungsi Control Panel' },
      { id: 'lv_nk2', label: 'Oli (Hidrolik, Engine, Steering, Brake)' },
      { id: 'lv_nk3', label: 'Hose' },
      { id: 'lv_nk4', label: 'Fuel Meter' },
      { id: 'lv_nk5', label: 'Air Radiator' },
      { id: 'lv_nk6', label: 'Lampu (Kota, Brake, Sign, Mundur)' },
      { id: 'lv_nk7', label: 'Kondisi Attachment' }
    ]
  }
];

// ── FORKLIFT P2H SECTIONS ──
const FORKLIFT_P2H_SECTIONS = [
  STANDARD_OPERATOR_SECTION,
  {
    title: 'SECTION B: ITEM KRITIS UNIT — STOP BEKERJA JIKA TERDAPAT JAWABAN "RUSAK / TIDAK NORMAL"',
    color: '#ffb74d',
    bgColor: 'rgba(255,152,0,0.12)',
    borderColor: 'rgba(255,152,0,0.3)',
    items: [
      { id: 'fl_kr1', label: 'Ban & Baut Roda (Tire & Wheel Bolts)' },
      { id: 'fl_kr2', label: 'Sabuk Pengaman (Seatbelt)' },
      { id: 'fl_kr3', label: 'Sistem Kemudi (Steering System)' },
      { id: 'fl_kr4', label: 'Semua Rem (Brake)' },
      { id: 'fl_kr5', label: 'Klakson (Horn)' },
      { id: 'fl_kr6', label: 'Alarm Mundur (Reverse Alarm)' },
      { id: 'fl_kr7', label: 'Fungsi Attachment (Attachment Function)' },
      { id: 'fl_kr8', label: 'Spion (Spy)' },
      { id: 'fl_kr9', label: 'Lampu Kerja (Depan, strobe) (Work Lights (Front, strobe))' },
      { id: 'fl_kr10', label: 'APAR (Fire Extinguisher)' }
    ]
  },
  {
    title: 'SECTION C: ITEM NON-KRITIS — MENGIKUTI REKOMENDASI MEKANIK (WAJIB PERBAIKAN 1X24 JAM)',
    color: '#64b5f6',
    bgColor: 'rgba(33,150,243,0.12)',
    borderColor: 'rgba(33,150,243,0.3)',
    items: [
      { id: 'fl_nk1', label: 'Fungsi Control Panel (Control Panel Function)' },
      { id: 'fl_nk2', label: 'Oli (Hidrolik, Engine, Steering, Brake)' },
      { id: 'fl_nk3', label: 'Hose' },
      { id: 'fl_nk4', label: 'Fuel Meter' },
      { id: 'fl_nk5', label: 'Air Radiator (Water Radiator)' },
      { id: 'fl_nk6', label: 'Lampu (Kota, Brake, Sign, Mundur)' },
      { id: 'fl_nk7', label: 'Kondisi attachment (Attachment condition)' }
    ]
  }
];

// ── HOT WATER BOILER (HWB) P2H SECTIONS ──
const BOILER_P2H_SECTIONS = [
  STANDARD_OPERATOR_SECTION,
  {
    title: 'SECTION B: PEMERIKSAAN UNIT (UNIT INSPECTION)',
    color: '#ffb74d',
    bgColor: 'rgba(255,152,0,0.12)',
    borderColor: 'rgba(255,152,0,0.3)',
    items: [
      { id: 'hwb_b1', label: 'Cek level fuel (Check Fuel Level)' },
      { id: 'hwb_b2', label: 'Cek level air tangki expansion (Check Expansion Tank Water Level)' },
      { id: 'hwb_b3', label: 'Drain air boiler (hingga warna air kembali normal) (Drain Boiler Water)' },
      { id: 'hwb_b4', label: 'Cek monitor panel (Check Monitor Panel)' },
      { id: 'hwb_b5', label: 'Cek indikator lampu panel (Check Panel Indicator Lights)' },
      { id: 'hwb_b6', label: 'Cek kebocoran disekitar pada piping dan Flange (Check Leaks Around Piping/Flanges)' },
      { id: 'hwb_b7', label: 'Cek kondisi Sirkulasi Pump (Check Circulation Pump Condition)' },
      { id: 'hwb_b8', label: 'Cek Sight glasse Fire / lubang intip api (Check Fire Sight Glass / Inspection Port)' },
      { id: 'hwb_b9', label: 'Cek kondisi pressure dan temperature gauge (Check Pressure/Temp Gauge)' },
      { id: 'hwb_b10', label: 'Cek fungsi alarm sistem (Check Alarm System Function)' },
      { id: 'hwb_b11', label: 'Bersihkan area sekitar HWB (Clean Area Around HWB)' }
    ]
  }
];

// ── GENSET P2H SECTIONS ──
const GENSET_P2H_SECTIONS = [
  STANDARD_OPERATOR_SECTION,
  {
    title: 'SECTION B: PEMERIKSAAN ENGINE (ENGINE INSPECTION)',
    color: '#ffb74d',
    bgColor: 'rgba(255,152,0,0.12)',
    borderColor: 'rgba(255,152,0,0.3)',
    items: [
      { id: 'gs_b1', label: 'Cek level oli engine (Check Engine Oil Level)' },
      { id: 'gs_b2', label: 'Cek water coolant (Check Water Coolant)' },
      { id: 'gs_b3', label: 'Cek level fuel (Check Fuel Level)' },
      { id: 'gs_b4', label: 'Cek kekencangan V Belt (Check V Belt Tension)' },
      { id: 'gs_b5', label: 'Cek kebocoran disekitar engine (Check Leaks Around Engine)' }
    ]
  },
  {
    title: 'SECTION C: PEMERIKSAAN GENERATOR (GENERATOR INSPECTION)',
    color: '#ffd54f',
    bgColor: 'rgba(255,213,79,0.12)',
    borderColor: 'rgba(255,213,79,0.3)',
    items: [
      { id: 'gs_c1', label: 'Check Bolt Generator (Check Generator Bolts)' },
      { id: 'gs_c2', label: 'Check Cover Bolt Generator (Check Generator Cover Bolts)' },
      { id: 'gs_c3', label: 'Cek Kabel Generator (Check Generator Cables)' }
    ]
  },
  {
    title: 'SECTION D: PEMERIKSAAN ELECTRIC (ELECTRICAL INSPECTION)',
    color: '#64b5f6',
    bgColor: 'rgba(33,150,243,0.12)',
    borderColor: 'rgba(33,150,243,0.3)',
    items: [
      { id: 'gs_d1', label: 'Cek kondisi & fungsi monitor panel (Check Monitor Panel Condition & Function)' },
      { id: 'gs_d2', label: 'Cek Kondisi Level Battery & Terminal / 50 HM (Check Battery Level & Terminals)' },
      { id: 'gs_d3', label: 'Cek Kondisi Wiring (Check Wiring Condition)' },
      { id: 'gs_d4', label: 'Cek Emergency Stop (Check Emergency Stop)' }
    ]
  },
  {
    title: 'SECTION E: PEMERIKSAAN GENERAL (GENERAL INSPECTION)',
    color: '#81c784',
    bgColor: 'rgba(76,175,80,0.12)',
    borderColor: 'rgba(76,175,80,0.3)',
    items: [
      { id: 'gs_e1', label: 'Bersihkan Bagian Dalam Silent Unit (Clean Inside of Silent Unit)' },
      { id: 'gs_e2', label: 'Bersihkan Bodi Bagian Luar Genset (Clean Outer Body of Generator)' },
      { id: 'gs_e3', label: 'Pastikan Disekitar Area Bersih dan Terkontrol (Ensure Surrounding Area is Clean)' }
    ]
  }
];

// ── RIBBON BLENDER P2H SECTIONS (From Official Form Image) ──
const RIBBON_BLENDER_P2H_SECTIONS = [
  STANDARD_OPERATOR_SECTION,
  {
    title: 'SECTION B: PEMERIKSAAN UNIT (UNIT INSPECTION)',
    color: '#ffb74d',
    bgColor: 'rgba(255,152,0,0.12)',
    borderColor: 'rgba(255,152,0,0.3)',
    items: [
      { id: 'rb_b1', label: 'Cek kekencangan semua baut dan nut (Check Tightness of All Bolts and Nuts)' },
      { id: 'rb_b2', label: 'Cek kondisi dudukan bearing, motor, & gear box (Check Bearing Mounts, Motor, & Gearbox)' },
      { id: 'rb_b3', label: 'Cek kondisi motor listrik / pompa transfer (Check Transfer Pump Electric Motor)' },
      { id: 'rb_b4', label: 'Cek kondisi motor listrik / Ribbon Blender (Check Ribbon Blender Electric Motor)' },
      { id: 'rb_b5', label: 'Cek kondisi panel kontrol (Check Control Panel Condition)' },
      { id: 'rb_b6', label: 'Cek pompa transfer dan area pompa transfer (Check Transfer Pump & Area)' },
      { id: 'rb_b7', label: 'Cek kebocoran disekitar pada piping dan Flange (Check Leaks Around Piping/Flanges)' },
      { id: 'rb_b8', label: 'Cek kondisi dan Level oli pada gear box (Check Oil Condition & Level in Gearbox)' },
      { id: 'rb_b9', label: 'Cek kebocoran oli gear box (Check Oil Leaks from Gearbox)' },
      { id: 'rb_b10', label: 'Cek Visual kondisi motor dan gearbox saat beroperasi (Visually Inspect Motor & Gearbox)' },
      { id: 'rb_b11', label: 'Cek kondisi semua valve pada jalur Pompa Transfer (Check Valves on Transfer Line)' },
      { id: 'rb_b12', label: 'Bersihkan area sekitar Ribbon Blender (Clean Area Around Ribbon Blender)' }
    ]
  }
];

const JENIS_UNIT_OPTIONS = [
  'Light Vehicle (LV)',
  'MMU Truck',
  'Anfo Truck',
  'Hot Water Boiler (HWB)',
  'Ribbon Blender',
  'Forklift',
  'Dump Truck',
  'Genset',
  'Crane Truck'
];

const DUMMY_SPIP_DATABASE = [
  { id: '4b', jenisUnit: 'MMU Truck', noLambung: 'MMU-18', detail: 'Iveco Trakker', lastHmKm: 1450 },
  { id: 'anfo1', jenisUnit: 'Anfo Truck', noLambung: 'AFT-017', detail: 'Hino FM280JD', lastHmKm: 1579 },
];

function getLoggedInUser() {
  try {
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.name || parsed.full_name || parsed.username || 'Operator Site';
    }
  } catch (_) {}
  return 'Operator Site';
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
  good: { 
    backgroundColor: '#1b5e20', 
    border: '1px solid #4caf50', 
    color: '#ffffff',
    boxShadow: '0 2px 6px rgba(76, 175, 80, 0.2)'
  },
  bad: { 
    backgroundColor: '#b71c1c', 
    border: '1px solid #f44336', 
    color: '#ffffff',
    boxShadow: '0 2px 6px rgba(244, 67, 54, 0.2)'
  },
};

// ── CRANE TRUCK P2H SECTIONS (From Official Form Image) ──
const CRANE_TRUCK_P2H_SECTIONS = [
  STANDARD_OPERATOR_SECTION,
  {
    title: 'B. PEMERIKSAAN KELILING UNIT (UNIT PERIMETER INSPECTION)',
    color: '#ffb74d',
    bgColor: 'rgba(255,152,0,0.12)',
    borderColor: 'rgba(255,152,0,0.3)',
    items: [
      { id: 'cr_b1', label: 'Ban & baut roda (Tire and wheel bolts)' },
      { id: 'cr_b2', label: 'Kondisi spring dan pengikat spring (Spring and retainer condition)' },
      { id: 'cr_b3', label: 'Kondisi Battery & Box (Battery and battery box condition)' },
      { id: 'cr_b4', label: 'Kondisi Tangki Bahan Bakar (Fuel tank and cap condition)' },
      { id: 'cr_b5', label: 'Kondisi Penutup Tangki Bahan Bakar (Fuel tank cap condition)' },
      { id: 'cr_b6', label: 'Buang air pada tabung angin unit (Drain water from the air tank)' },
      { id: 'cr_b7', label: 'Periksa jalur angin dari kebocoran (Check air lines for leaks)' },
      { id: 'cr_b8', label: 'Kebocoran transmisi (Transmission leaks)' },
      { id: 'cr_b9', label: 'Kebocoran differential & Transfer case (Differential & transfer case leak)' },
      { id: 'cr_b10', label: 'Tutup mesin, Penahan lumpur & Body kabin (Engine cover, mudguard & body)' },
      { id: 'cr_b11', label: 'Indikator air cleaner (Air cleaner indicator)' },
      { id: 'cr_b12', label: 'Safety cone 2 (Safety cones 2)' },
      { id: 'cr_b13', label: 'Ganjal ban 2 (Two wheel chocks)' },
      { id: 'cr_b14', label: 'Apar 6 Kg 2 (Two 6 kg fire extinguishers)' },
      { id: 'cr_b15', label: 'Kelainan saat operasi (Abnormalities during operation)' },
      { id: 'cr_b16', label: 'Kondisi semua lampu depan / belakang (Front/rear lights condition)' },
      { id: 'cr_b17', label: 'Fungsi semua lampu depan / belakang (Front/rear lights function)' },
      { id: 'cr_b18', label: 'Kebersihan Unit (Unit cleanliness)' },
      { id: 'cr_b19', label: 'Kondisi rantai grounding (Grounding chain condition)' },
      { id: 'cr_b20', label: 'Fungsi dan kondisi alarm mundur (Reverse alarm function/condition)' }
    ]
  },
  {
    title: 'C. PEMERIKSAAN RUANG MESIN (ENGINE COMPARTMENT INSPECTION)',
    color: '#ffd54f',
    bgColor: 'rgba(255,213,79,0.12)',
    borderColor: 'rgba(255,213,79,0.3)',
    items: [
      { id: 'cr_c1', label: 'Kondisi Oli mesin dan level (Engine oil condition and level)' },
      { id: 'cr_c2', label: 'Kondisi air radiator dan level (Radiator coolant condition/level)' },
      { id: 'cr_c3', label: 'Level minyak steering (Steering oil level)' },
      { id: 'cr_c4', label: 'Level minyak kopling (Clutch oil level)' },
      { id: 'cr_c5', label: 'Kondisi hydraulic tilt cabin (Hydraulic tilt cabin system condition)' },
      { id: 'cr_c6', label: 'Kebocoran oli pada engine (Engine oil leak check)' },
      { id: 'cr_c7', label: 'Kondisi V-Belt (Condition of V-belt)' },
      { id: 'cr_c8', label: 'Kondisi Exhaust muffler (Condition of exhaust muffler)' }
    ]
  },
  {
    title: 'D. PEMERIKSAAN FUNGSI CRANE & ATTACHMENT (CRANE FUNCTION & ATTACHMENT INSPECTION)',
    color: '#64b5f6',
    bgColor: 'rgba(33,150,243,0.12)',
    borderColor: 'rgba(33,150,243,0.3)',
    items: [
      { id: 'cr_d1', label: 'PTO / Power Take Off (Fungsi engagement, suara & kebocoran)' },
      { id: 'cr_d2', label: 'Level & Kondisi Oli Hidrolik pada Tangki (Sight Glass Check)' },
      { id: 'cr_d3', label: 'Main Hydraulic Pump & Hose Line (Pompa utama & selang penyuplai)' },
      { id: 'cr_d4', label: 'Outrigger / Stabilizer Beam & Cylinder (Kondisi struktur & silinder kaki)' },
      { id: 'cr_d5', label: 'Lock Pin Outrigger / Pengunci Outrigger (Pin pengunci manual/otomatis)' },
      { id: 'cr_d6', label: 'Hoist / Winch Drum & Rollers (Gulungan drum winch & kawat)' },
      { id: 'cr_d7', label: 'Wire Rope / Sling Steel (Kawat seling, serabut putus & keausan)' },
      { id: 'cr_d8', label: 'Slewing Gear & Slewing Bearing (Meja putar, pelumasan & suara kasar)' },
      { id: 'cr_d9', label: 'Base / Badan Crane (Dudukan crane ke sasis & baut mounting)' },
      { id: 'cr_d10', label: 'Column / Tiang Crane (Kondisi struktur tiang utama crane)' },
      { id: 'cr_d11', label: 'Pipa & Hose Hidrolik Crane (Kebocoran, aus, & fleksibilitas selang)' },
      { id: 'cr_d12', label: 'Tuas / Valve Outrigger (4 tuas bagian bawah: fungsi & kebocoran)' },
      { id: 'cr_d13', label: 'Tuas / Valve Crane (4 tuas bagian atas/Master Valve: fungsi & kebocoran)' },
      { id: 'cr_d14', label: 'Boom / Cylinder Derrick (Silinder angkat utama & keausan seal)' },
      { id: 'cr_d15', label: 'Boom / Cylinder Teleskop (Silinder & slide plate perpanjangan boom)' },
      { id: 'cr_d16', label: 'Sistem Elektrikal Crane (Kabel, konektor & sensor)' },
      { id: 'cr_d17', label: 'Overwinding Alarm / Anti-Two-Block Device (Sensor batas atas hook)' },
      { id: 'cr_d18', label: 'Hook Standart & Safety Latch (Kondisi pengait & pengunci keselamatan)' },
      { id: 'cr_d19', label: 'Load Chart / Tabel Beban (Stiker grafik beban pada boom readable)' },
      { id: 'cr_d20', label: 'Klakson & Lampu Kerja Crane (Klakson peringatan & lampu sorot boom)' }
    ]
  },
  {
    title: 'E. PEMERIKSAAN DI DALAM KABIN (CABIN INSPECTION)',
    color: '#81c784',
    bgColor: 'rgba(76,175,80,0.12)',
    borderColor: 'rgba(76,175,80,0.3)',
    items: [
      { id: 'cr_e1', label: 'Fungsi rem tangan / parkir (Hand/parking brake function)' },
      { id: 'cr_e2', label: 'Fungsi rem kaki (Foot brake function)' },
      { id: 'cr_e3', label: 'Fungsi kopling (Clutch function)' },
      { id: 'cr_e4', label: 'Fungsi seatbelt (Seatbelt function)' },
      { id: 'cr_e5', label: 'Fungsi steering / kemudi (Steering function)' },
      { id: 'cr_e6', label: 'Kondisi Air conditioner (Air conditioner condition)' },
      { id: 'cr_e7', label: 'Fungsi Semua lampu kerja & Rotary (Work lights and rotary lights)' },
      { id: 'cr_e8', label: 'Fungsi mirror / spion (Mirrors function)' },
      { id: 'cr_e9', label: 'Wiper / Air wiper (Wiper / Air wiper)' },
      { id: 'cr_e10', label: 'Klakson (Horn)' },
      { id: 'cr_e11', label: 'Radio komunikasi (Communication radio)' },
      { id: 'cr_e12', label: 'Kelengkapan P3K (First aid kit completeness)' },
      { id: 'cr_e13', label: 'Safety harness (Safety harness)' },
      { id: 'cr_e14', label: 'Apar (Fire extinguisher)' },
      { id: 'cr_e15', label: 'Periksa kondisi switch fire suppression (Fire suppression switch condition)' },
      { id: 'cr_e16', label: 'Kebersihan ruang kabin (Cabin cleanliness)' }
    ]
  }
];

// ── DUMP TRUCK P2H SECTIONS (From Official Form Image) ──
const DUMP_TRUCK_P2H_SECTIONS = [
  STANDARD_OPERATOR_SECTION,
  {
    title: 'SECTION B: ITEM KRITIS UNIT — STOP BEKERJA JIKA TERDAPAT JAWABAN "RUSAK / TIDAK NORMAL"',
    color: '#ffb74d',
    bgColor: 'rgba(255,152,0,0.12)',
    borderColor: 'rgba(255,152,0,0.3)',
    items: [
      { id: 'dt_kr1', label: 'Ban & Baut Roda (Tire & Wheel Bolts)' },
      { id: 'dt_kr2', label: 'Sabuk Pengaman (Seatbelt)' },
      { id: 'dt_kr3', label: 'Sistem Kemudi (Steering System)' },
      { id: 'dt_kr4', label: 'Semua Rem (Brake)' },
      { id: 'dt_kr5', label: 'Klakson (Horn)' },
      { id: 'dt_kr6', label: 'Alarm Mundur (Reverse Alarm)' },
      { id: 'dt_kr7', label: 'Radio Komunikasi (Radio Communication)' },
      { id: 'dt_kr8', label: 'Spion (Spy / Mirror)' },
      { id: 'dt_kr9', label: 'Pemeriksaan Accu - Kebersihan Accu (Accu Cleanliness)' },
      { id: 'dt_kr10', label: 'Pemeriksaan Accu - Level Accu (Level Accu)' },
      { id: 'dt_kr11', label: 'Pemeriksaan Accu - Penutup dan Lubang Breather (Breather Cover and Holes)' },
      { id: 'dt_kr12', label: 'Pemeriksaan Accu - Kepala Accu (Accu Head)' },
      { id: 'dt_kr13', label: 'Pemeriksaan Accu - Kabel Rangkaian Accu (Accu Network Cable)' },
      { id: 'dt_kr14', label: 'Lampu Kerja - Lampu depan (Headlights)' },
      { id: 'dt_kr15', label: 'Lampu Kerja - Lampu Sign (Sign Lights)' },
      { id: 'dt_kr16', label: 'Lampu Strobe (Strobe Lamp)' },
      { id: 'dt_kr17', label: 'Safety Cone (Traffic Cone)' },
      { id: 'dt_kr18', label: 'Ganjal Ban (Wheel Chock)' },
      { id: 'dt_kr19', label: 'APAR (Fire Extinguisher)' },
      { id: 'dt_kr20', label: 'Buggy Whip (Buggy Whip)' }
    ]
  },
  {
    title: 'SECTION C: ITEM NON-KRITIS — WAJIB DIPERBAIKI DALAM 1x24 JAM',
    color: '#64b5f6',
    bgColor: 'rgba(33,150,243,0.12)',
    borderColor: 'rgba(33,150,243,0.3)',
    items: [
      { id: 'dt_nk1', label: 'Fungsi Control Panel (Control Panel Function)' },
      { id: 'dt_nk2', label: 'Oli (Hidrolik, Engine, Steering, Brake)' },
      { id: 'dt_nk3', label: 'Hose & Kebocoran (Hoses)' },
      { id: 'dt_nk4', label: 'Fuel Meter (Fuel Meter)' },
      { id: 'dt_nk5', label: 'Wiper & Air Wiper (Wiper & Water Wiper)' },
      { id: 'dt_nk6', label: 'Air Radiator (Water Radiator)' },
      { id: 'dt_nk7', label: 'Perlengkapan P3K (P3K Equipment)' },
      { id: 'dt_nk8', label: 'Wheel Nut Indicator' }
    ]
  }
];

export default function P2hService() {
  const { tab } = useParams();
  const activeTab = tab || 'create';
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [previewReport, setPreviewReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [dbUnits, setDbUnits] = useState([]);

  // Form State
  const [selectedJenisUnit, setSelectedJenisUnit] = useState('');
  const [selectedNoLambung, setSelectedNoLambung] = useState('');
  const [manualNoLambung, setManualNoLambung] = useState('');
  const [hmkm, setHmkm] = useState('');
  const [shift, setShift] = useState('Shift 1 (Siang)');
  const [selectedLeadingHand, setSelectedLeadingHand] = useState('');
  const [selectedMechanic, setSelectedMechanic] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]); // Allow Backdate

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    fetchUsers();
    fetchReports();
    fetchUnits();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase.from('units').select('*');
      if (!error && data) {
        const mapped = data.map(u => ({
          id: String(u.id),
          jenisUnit: u.jenis_unit || u.jenisUnit,
          noLambung: u.no_lambung || u.noLambung,
          merk: u.merk || '',
          tipe: u.tipe || '',
          lastHmKm: u.hm_km !== undefined ? u.hm_km : (u.hmkm || 0)
        }));
        setDbUnits(mapped);
      }
    } catch (err) {
      console.error('Error fetching units:', err);
    }
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

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('p2h_reports')
        .select('*')
        .order('report_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (!error && data) {
        // Normalize DB rows → local report shape
        const mapped = data.map(r => ({
          id: String(r.id),
          jenisUnit: r.jenis_unit,
          unit: r.no_lambung,
          hmkm: r.hmkm,
          operator: r.operator_name,
          leadingHand: r.leading_hand,
          mechanic: r.mechanic,
          shift: r.shift,
          date: r.report_date,
          statusReady: r.status_ready,
          approvalStatus: r.approval_status,
          hasKritisIssue: r.has_kritis,
          recommendation: r.recommendation || '',
          mechanicDecision: r.mechanic_decision || '',
          checklistData: r.checklist_data || {}
        }));
        setReports(mapped);
      }
    } catch (_) {}
  };

  // Determine which sections template to render
  const currentSections = useMemo(() => {
    if (selectedJenisUnit === 'MMU Truck') return MMU_P2H_SECTIONS;
    if (selectedJenisUnit === 'Anfo Truck') return ANFO_P2H_SECTIONS;
    if (selectedJenisUnit === 'Forklift') return FORKLIFT_P2H_SECTIONS;
    if (selectedJenisUnit === 'Hot Water Boiler (HWB)' || selectedJenisUnit.toLowerCase().includes('boiler')) return BOILER_P2H_SECTIONS;
    if (selectedJenisUnit === 'Ribbon Blender' || selectedJenisUnit.toLowerCase().includes('blender')) return RIBBON_BLENDER_P2H_SECTIONS;
    if (selectedJenisUnit === 'Crane Truck' || selectedJenisUnit.toLowerCase().includes('crane')) return CRANE_TRUCK_P2H_SECTIONS;
    if (selectedJenisUnit === 'Dump Truck' || selectedJenisUnit.toLowerCase().includes('dump')) return DUMP_TRUCK_P2H_SECTIONS;
    if (selectedJenisUnit === 'Genset') return GENSET_P2H_SECTIONS;
    return LV_P2H_SECTIONS; // Default template
  }, [selectedJenisUnit]);

  const getChecklistLabel = (id) => {
    const allSections = [
      ...LV_P2H_SECTIONS, ...MMU_P2H_SECTIONS, ...ANFO_P2H_SECTIONS, ...FORKLIFT_P2H_SECTIONS,
      ...CRANE_TRUCK_P2H_SECTIONS, ...DUMP_TRUCK_P2H_SECTIONS, ...GENSET_P2H_SECTIONS,
      ...BOILER_P2H_SECTIONS, ...RIBBON_BLENDER_P2H_SECTIONS
    ];
    for (const section of allSections) {
      if (section.items) {
        const found = section.items.find(i => i.id === id);
        if (found) return found.label;
      }
    }
    return id;
  };

  // Filter available No Lambung based on selected Jenis Unit
  const availableUnits = useMemo(() => {
    if (!selectedJenisUnit) return [];
    return dbUnits.filter(u => u.jenisUnit === selectedJenisUnit);
  }, [selectedJenisUnit, dbUnits]);

  // Selected Unit detail & last HM/KM from yesterday
  const selectedUnitObj = useMemo(() => {
    return availableUnits.find(u => u.noLambung === selectedNoLambung);
  }, [availableUnits, selectedNoLambung]);

  const lastHmKm = selectedUnitObj?.lastHmKm || 0;
  const isHmKmInvalid = hmkm !== '' && Number(hmkm) < lastHmKm;

  // Unified Checklist State { [id]: { status: 'good'|'bad', note: '' } }
  const [checklist, setChecklist] = useState({});
  const [mechanicNotes, setMechanicNotes] = useState({});
  
  const loggedUser = getLoggedInUser();
  const userRoleStr = localStorage.getItem('userRole') || '';
  const canManageAll = userRoleStr === 'Admin' || userRoleStr === 'Superadmin';

  const handleNoteChange = (id, val) => {
    setMechanicNotes(prev => ({...prev, [id]: val}));
  };

  const handleJenisUnitChange = (jenis) => {
    setSelectedJenisUnit(jenis);
    setSelectedNoLambung('');
    setManualNoLambung('');
    if (jenis === 'Ribbon Blender' || jenis.toLowerCase().includes('blender')) {
      setHmkm('0');
    } else {
      setHmkm('');
    }
    setChecklist({});
  };

  const handleItemStatus = (id, status) => {
    setChecklist(prev => ({
      ...prev,
      [id]: { status, note: status === 'bad' ? (prev[id]?.note || '') : '' }
    }));
  };

  const handleItemNote = (id, note) => {
    setChecklist(prev => ({ ...prev, [id]: { ...prev[id], note } }));
  };

  // Check if any item in checklist is marked Bad
  const hasBadItems = useMemo(() => {
    return Object.values(checklist).some(val => val.status === 'bad');
  }, [checklist]);

  const handleSetAllGood = () => {
    const nextChecklist = {};
    currentSections.forEach(section => {
      section.items.forEach(item => {
        nextChecklist[item.id] = { status: 'good', note: '' };
      });
    });
    setChecklist(nextChecklist);
  };

  const handleSetSectionGood = (sectionIndex) => {
    const nextChecklist = { ...checklist };
    currentSections[sectionIndex].items.forEach(item => {
      nextChecklist[item.id] = { status: 'good', note: '' };
    });
    setChecklist(nextChecklist);
  };

  const finalNoLambung = selectedNoLambung === 'manual' ? manualNoLambung : (selectedNoLambung || 'Belum Diisi');

  const [modalNotice, setModalNotice] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJenisUnit) return;
    if (isHmKmInvalid) {
      setModalNotice(`HM / KM tidak boleh lebih kecil dari HM / KM kemarin (${lastHmKm.toLocaleString('id-ID')})!`);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        report_date: reportDate,
        jenis_unit: selectedJenisUnit,
        no_lambung: finalNoLambung,
        hmkm: hmkm || '-',
        shift,
        operator_name: loggedUser,
        leading_hand: selectedLeadingHand || 'Belum Ditunjuk',
        mechanic: hasBadItems ? (selectedMechanic || 'Mekanik Site') : '-',
        status_ready: 'READY TO OPERATE',
        approval_status: 'Pending Leading Hand',
        has_kritis: hasBadItems,
        mechanic_decision: hasBadItems ? 'Menunggu Pengecekan' : 'Tetap Beroperasi',
        recommendation: '',
        checklist_data: checklist
      };

      const { data, error } = await supabase.from('p2h_reports').insert([payload]).select();
      if (error) {
        setModalNotice('Gagal menyimpan P2H: ' + error.message);
        return;
      }

      // NEW: Update hmkm di table units
      if (hmkm && !isNaN(hmkm)) {
        let { error: updateErr } = await supabase
          .from('units')
          .update({ hm_km: Number(hmkm) })
          .eq('no_lambung', finalNoLambung);
          
        if (updateErr) {
          // Fallback if column is named hmkm
          await supabase
            .from('units')
            .update({ hmkm: Number(hmkm) })
            .eq('no_lambung', finalNoLambung);
        }
      }

      // Refresh data
      fetchReports();
      fetchUnits(); // so the dropdown gets updated hmkm
      navigate('/p2h/pending');

      // Reset form
      setSelectedJenisUnit('');
      setSelectedNoLambung('');
      setManualNoLambung('');
      setHmkm('');
      setShift('Shift 1 (Siang)');
      setSelectedLeadingHand('');
      setSelectedMechanic('');
      setChecklist({});
    } catch (err) {
      setModalNotice('Terjadi kesalahan: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveP2h = async (reportId, action, reason) => {
    try {
      const report = reports.find(r => r.id === reportId);
      if (!report) return;

      let nextStatus = '';
      let nextDecision = '';

      if (report.approvalStatus === 'Pending Leading Hand' || report.approvalStatus === 'Pending') {
        if (action === 'Setuju Aman' && report.hasKritisIssue) {
          nextStatus = 'Pending Mekanik';
          nextDecision = 'Aman Beroperasi (Override LH)';
        } else if (action === 'Setuju Aman' || (!report.hasKritisIssue && action === 'Setuju')) {
          nextStatus = 'Approved';
          nextDecision = 'Tetap Beroperasi';
        } else if (action === 'STOP Mekanik' || (report.hasKritisIssue && action === 'Setuju')) {
          nextStatus = 'Pending Mekanik';
          nextDecision = ''; // Reset decision until mechanic evaluates
        } else if (action === 'Tolak') {
          nextStatus = 'Rejected';
          nextDecision = 'Ditolak oleh Leading Hand';
        }
      } else if (report.approvalStatus === 'Pending Mekanik') {
        nextStatus = 'Approved';
        nextDecision = action; // 'Tetap Beroperasi' or 'STOP'
      } else {
         nextStatus = 'Approved';
         nextDecision = action;
      }

      const updatePayload = {
        approval_status: nextStatus,
        mechanic_decision: nextDecision || report.mechanicDecision,
        recommendation: reason || report.recommendation
      };

      let finalStatusReady = report.statusReady;

      if (report.approvalStatus === 'Pending Mekanik') {
        if (action === 'Tetap Beroperasi' || action === 'Acknowledge') {
           finalStatusReady = 'READY TO OPERATE';
        } else if (action === 'Bantah STOP' || action === 'Validasi Breakdown') {
           finalStatusReady = 'STOP / BREAKDOWN';
        }
      } else if (report.approvalStatus === 'Pending Leading Hand' || report.approvalStatus === 'Pending') {
        if (action === 'Setuju Aman' && report.hasKritisIssue) {
           finalStatusReady = 'OPPORTUNITY BREAKDOWN'; // LH Setuju bad item
        } else if (action === 'STOP Mekanik') {
           finalStatusReady = 'STOP / BREAKDOWN'; // LH STOP
        } else if (action === 'Setuju Aman' || (!report.hasKritisIssue && action === 'Setuju')) {
           finalStatusReady = 'READY TO OPERATE';
        }
      }

      updatePayload.status_ready = finalStatusReady;

      const { error } = await supabase
        .from('p2h_reports')
        .update(updatePayload)
        .eq('id', reportId);

      if (!error) {
        setReports(prev => prev.map(r => {
          if (r.id === reportId) {
            return {
              ...r,
              approvalStatus: nextStatus,
              mechanicDecision: nextDecision || r.mechanicDecision,
              recommendation: reason || r.recommendation,
              statusReady: finalStatusReady
            };
          }
          return r;
        }));
      }
    } catch (_) {}
  };

  const pendingReports = useMemo(() => {
    return reports.filter(r => {
      const status = r.approvalStatus;
      if (!status.startsWith('Pending')) return false;

      if (canManageAll) return true;
      
      // Let anyone involved (Operator, LH, Mekanik) see the report in their Pending tab
      // (The Action Buttons logic already protects who can actually click approve/reject)
      if (r.operator === loggedUser || r.leadingHand === loggedUser || r.mechanic === loggedUser) {
        return true;
      }
      
      return false;
    });
  }, [reports, loggedUser]);

  const approvedReports = useMemo(() => reports.filter(r => r.approvalStatus === 'Approved' || r.approvalStatus === 'Rejected'), [reports]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* ── HEADER HALAMAN P2H ── */}
      <div style={{ flexShrink: 0, marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.2rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardCheck size={22} style={{ color: 'var(--color-yellow-primary)' }} />
              {activeTab === 'create' ? 'Input P2H Harian' : 'P2H (Pemeriksaan Harian)'}
            </h1>
            <div style={{ fontSize: '0.725rem', color: 'var(--color-silver)', marginTop: '0.15rem' }}>
              {activeTab === 'create' 
                ? 'Isi formulir pemeriksaan harian kondisi unit' 
                : 'Daftar verifikasi pending & riwayat pemeriksaan unit'}
            </div>
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
            marginTop: '1rem',
            overflowX: 'auto'
          }} className="hide-scrollbar">
            <button 
              onClick={() => navigate('/p2h/create')} 
              style={{
                flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer',
                background: activeTab === 'create' ? 'var(--color-yellow-primary)' : 'transparent',
                color: activeTab === 'create' ? 'var(--color-bg-main)' : 'var(--color-silver)',
                border: 'none', transition: 'all 0.2s', minWidth: '90px'
              }}
            >
              Input P2H
            </button>
            <button 
              onClick={() => navigate('/p2h/pending')} 
              style={{
                flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer',
                background: activeTab === 'pending' ? 'var(--color-yellow-primary)' : 'transparent',
                color: activeTab === 'pending' ? 'var(--color-bg-main)' : 'var(--color-silver)',
                border: 'none', transition: 'all 0.2s', minWidth: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem'
              }}
            >
              Pending {pendingReports.length > 0 && <span style={{ background: activeTab === 'pending' ? 'rgba(0,0,0,0.2)' : 'rgba(255,193,7,0.2)', padding: '0.1rem 0.35rem', borderRadius: '10px', fontSize: '0.65rem' }}>{pendingReports.length}</span>}
            </button>
            <button 
              onClick={() => navigate('/p2h/history')} 
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
      </div>

      {/* ── Tab Input P2H ── */}
      {activeTab === 'create' && (
        <div className="card hide-scrollbar" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', width: '100%', padding: isMobile ? '1rem 1rem 85px 1rem' : '1rem 1.25rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            
            {/* Header info unit & operator — FIXED */}
            <div style={{ flexShrink: 0, paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: 'var(--color-silver-light)', margin: 0 }}>
                  <ClipboardList size={18} style={{ color: 'var(--color-yellow-primary)' }} />
                  Form P2H {selectedJenisUnit ? `— ${selectedJenisUnit}` : ''}
                </h2>
                {selectedJenisUnit && (
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', height: '30px' }} 
                    onClick={handleSetAllGood}
                  >
                    ✓ Semua Baik / Normal
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
                
                {/* 1. Pilih Jenis Unit TERLEBIH DAHULU */}
                <div className="input-group mb-0">
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-yellow-primary)' }}>1. Pilih Jenis Unit / SPIP *</label>
                  <SearchableSelect 
                    className="input-field" 
                    style={{ height: '36px', fontSize: '0.85rem', width: '100%', borderColor: !selectedJenisUnit ? 'var(--color-yellow-primary)' : 'var(--color-border)' }}
                    value={selectedJenisUnit}
                    onChange={(e) => handleJenisUnitChange(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Jenis Unit / SPIP --</option>
                    {JENIS_UNIT_OPTIONS.map(j => {
                      // Check available P2H sections
                      const hasForm = ['Light Vehicle (LV)', 'MMU Truck', 'Anfo Truck', 'Hot Water Boiler (HWB)', 'Ribbon Blender', 'Forklift', 'Genset', 'Crane Truck', 'Dump Truck'].includes(j);
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

                {/* 2. No Lambung (Mengikuti data Tambah SPIP atau Manual) */}
                <div className="input-group mb-0">
                  <label style={{ fontSize: '0.8rem', fontWeight: '500' }}>2. No Lambung (ID Unit)</label>
                  {selectedNoLambung === 'manual' || availableUnits.length === 0 ? (
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        style={{ height: '36px', fontSize: '0.85rem', flex: 1 }}
                        placeholder="Ketik No Lambung..."
                        value={manualNoLambung}
                        onChange={(e) => setManualNoLambung(e.target.value)}
                        disabled={!selectedJenisUnit}
                      />
                      {availableUnits.length > 0 && (
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          style={{ padding: '0 0.5rem', height: '36px', fontSize: '0.75rem' }}
                          onClick={() => setSelectedNoLambung('')}
                        >
                          Pilih
                        </button>
                      )}
                    </div>
                  ) : (
                    <SearchableSelect 
                      className="input-field" 
                      style={{ height: '36px', fontSize: '0.85rem', width: '100%' }}
                      value={selectedNoLambung}
                      onChange={(e) => setSelectedNoLambung(e.target.value)}
                      disabled={!selectedJenisUnit}
                    >
                      <option value="">-- Pilih No Lambung --</option>
                      {availableUnits.map(u => (
                        <option key={u.id} value={u.noLambung}>{u.noLambung} — {u.detail}</option>
                      ))}
                      <option value="manual">+ Ketik No Lambung Manual...</option>
                    </SearchableSelect>
                  )}
                </div>

                {/* 3. HM / KM Kemarin */}
                <div className="input-group mb-0">
                  <label style={{ fontSize: '0.8rem', fontWeight: '500' }}>3. HM/KM Kemarin (Fix)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    style={{ height: '36px', fontSize: '0.85rem', width: '100%', opacity: 0.7, cursor: 'not-allowed', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--color-yellow-primary)', fontWeight: '600' }}
                    value={lastHmKm > 0 ? `${lastHmKm.toLocaleString('id-ID')} KM/HM` : '0 KM/HM'}
                    readOnly
                  />
                </div>

                {/* 4. HM / KM Sekarang */}
                <div className="input-group mb-0">
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: isHmKmInvalid ? '#ff8a80' : 'var(--color-yellow-primary)' }}>
                    4. HM / KM Sekarang {selectedJenisUnit === 'Ribbon Blender' ? '(Non-HM)' : '*'}
                  </label>
                  <input 
                    type="number" 
                    className="input-field" 
                    style={{ 
                      height: '36px', fontSize: '0.85rem', width: '100%',
                      borderColor: isHmKmInvalid ? '#f44336' : 'var(--color-border)',
                      backgroundColor: selectedJenisUnit === 'Ribbon Blender' ? 'rgba(255,255,255,0.03)' : (isHmKmInvalid ? 'rgba(244,67,54,0.1)' : 'var(--color-bg-main)'),
                      cursor: selectedJenisUnit === 'Ribbon Blender' ? 'not-allowed' : 'text',
                      opacity: selectedJenisUnit === 'Ribbon Blender' ? 0.6 : 1
                    }}
                    placeholder={selectedJenisUnit === 'Ribbon Blender' ? "N/A (Peralatan Non-HM)" : `Minimal ${lastHmKm}...`}
                    value={hmkm}
                    min={lastHmKm}
                    step="any"
                    onChange={(e) => setHmkm(e.target.value)}
                    disabled={!selectedJenisUnit || selectedJenisUnit === 'Ribbon Blender'}
                    required={selectedJenisUnit !== 'Ribbon Blender'}
                  />
                  {isHmKmInvalid && (
                    <div style={{ fontSize: '0.75rem', color: '#ff8a80', marginTop: '0.25rem', fontWeight: '500' }}>
                      ⚠️ HM/KM tidak boleh lebih kecil dari kemarin ({lastHmKm.toLocaleString('id-ID')})
                    </div>
                  )}
                </div>

                {/* 5. Shift */}
                <div className="input-group mb-0">
                  <label style={{ fontSize: '0.8rem', fontWeight: '500' }}>Shift Kerja</label>
                  <SearchableSelect 
                    className="input-field" 
                    style={{ height: '36px', fontSize: '0.85rem', width: '100%' }}
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    disabled={!selectedJenisUnit}
                  >
                    <option value="Shift 1 (Siang)">Shift 1 (Siang)</option>
                    <option value="Shift 2 (Malam)">Shift 2 (Malam)</option>
                  </SearchableSelect>
                </div>

                {/* 6. Tanggal P2H (Bisa di-backdate) */}
                <div className="input-group mb-0">
                  <label style={{ fontSize: '0.8rem', fontWeight: '500' }}>Tanggal P2H (Bisa Diubah)</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    style={{ height: '36px', fontSize: '0.85rem', width: '100%', colorScheme: 'dark' }}
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    required
                  />
                </div>

                {/* 7. Nama Operator */}
                <div className="input-group mb-0">
                  <label style={{ fontSize: '0.8rem', fontWeight: '500' }}>7. Nama Operator (Pelapor)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    style={{ height: '36px', fontSize: '0.85rem', width: '100%', opacity: 0.7, cursor: 'not-allowed', backgroundColor: 'rgba(0,0,0,0.3)' }}
                    value={loggedUser}
                    readOnly
                  />
                </div>

                {/* 8. Pilih Leading Hand (Diketahui / Known By) */}
                <div className="input-group mb-0">
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-yellow-primary)' }}>8. Leading Hand (Verifikator) *</label>
                  <SearchableSelect 
                    className="input-field" 
                    style={{ height: '36px', fontSize: '0.85rem', width: '100%', borderColor: !selectedLeadingHand ? 'var(--color-yellow-primary)' : 'var(--color-border)' }}
                    value={selectedLeadingHand}
                    onChange={(e) => setSelectedLeadingHand(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Leading Hand --</option>
                    {userOptions
                      .filter(u => u.jabatan && u.jabatan.toLowerCase().includes('leading hand'))
                      .map(u => (
                      <option key={u.id} value={u.name || u.full_name}>
                        {u.name || u.full_name} ({u.jabatan})
                      </option>
                    ))}
                  </SearchableSelect>
                </div>

                {/* 9. Pilih Mekanik / Leading Hand Maintenance (Jika Ada Temuan Kerusakan) */}
                {hasBadItems && (
                  <div className="input-group mb-0">
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#ff8a80' }}>9. Mekanik PIC (Ada Temuan Rusak) *</label>
                    <SearchableSelect 
                      className="input-field" 
                      style={{ height: '36px', fontSize: '0.85rem', width: '100%', borderColor: '#f44336', backgroundColor: 'rgba(244,67,54,0.08)' }}
                      value={selectedMechanic}
                      onChange={(e) => setSelectedMechanic(e.target.value)}
                      required
                    >
                      <option value="">-- Pilih Mekanik Evaluator --</option>
                      {userOptions
                        .filter(u => u.jabatan && (
                          u.jabatan.toLowerCase().includes('mekanik') || 
                          u.jabatan.toLowerCase().includes('mechanic') ||
                          u.jabatan.toLowerCase().includes('maintenance')
                        ))
                        .map(u => (
                        <option key={u.id} value={u.name || u.full_name}>
                          {u.name || u.full_name} ({u.jabatan})
                        </option>
                      ))}
                    </SearchableSelect>
                  </div>
                )}
              </div>
            </div>

            {/* ─ Checklist SCROLL area (Hanya muncul jika Jenis Unit telah dipilih) ─ */}
            {selectedJenisUnit ? (
              <div 
                className="hide-scrollbar" 
                style={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  paddingRight: '0.25rem', 
                  width: '100%', 
                  maxWidth: '960px', 
                  alignSelf: 'center',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                {currentSections.map((sec, sIdx) => (
                  <div key={sIdx} style={{ marginBottom: '1.25rem' }}>
                    <div style={{ padding: '0.4rem 0.75rem', borderRadius: '4px', backgroundColor: sec.bgColor, border: `1px solid ${sec.borderColor}`, color: sec.color, fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={15} />
                        <span>{sec.title}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleSetSectionGood(sIdx)}
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', border: `1px solid ${sec.borderColor}`, backgroundColor: 'rgba(255,255,255,0.1)', color: sec.color, cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        ✓ Baik Semua
                      </button>
                    </div>

                    {sec.items.map(item => {
                      const val = checklist[item.id];
                      const st = val?.status;
                      const rowBg = st === 'good' ? 'rgba(46,125,50,0.08)' : st === 'bad' ? 'rgba(183,28,28,0.15)' : 'rgba(255,255,255,0.015)';
                      const rowBorder = st === 'good' ? 'rgba(76,175,80,0.35)' : st === 'bad' ? 'rgba(244,67,54,0.5)' : 'var(--color-border)';

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
                          </div>

                          {/* OPSI & COMMENT WRAPPER */}
                          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: '0.4rem', flexShrink: 0, width: isMobile ? '100%' : 'auto' }}>
                            
                            {/* OPSI / BUTTONS DI TENGAH */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', width: isMobile ? '100%' : 'auto' }}>
                              <button 
                                type="button" 
                                onClick={() => handleItemStatus(item.id, 'good')}
                                style={{ ...BTN_STYLES.base, ...(st === 'good' ? BTN_STYLES.good : BTN_STYLES.inactive), flex: isMobile ? 1 : 'none', height: '32px' }}
                              >
                                {sec.isOperatorSection ? 'Ya / Baik' : 'Baik / Normal'}
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleItemStatus(item.id, 'bad')}
                                style={{ ...BTN_STYLES.base, ...(st === 'bad' ? BTN_STYLES.bad : BTN_STYLES.inactive), flex: isMobile ? 1 : 'none', height: '32px' }}
                              >
                                {sec.isOperatorSection ? 'Tidak' : 'Rusak / Tidak Normal'}
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
                                borderColor: st === 'bad' ? 'rgba(244,67,54,0.7)' : 'var(--color-border)',
                                backgroundColor: st === 'bad' ? 'var(--color-bg-main)' : 'rgba(0,0,0,0.2)',
                                color: st === 'bad' ? '#ffffff' : '#555555', 
                                opacity: st === 'bad' ? 1 : 0.5,
                                cursor: st === 'bad' ? 'text' : 'not-allowed'
                              }}
                              placeholder={st === 'bad' ? "Keterangan temuan (Wajib)... *" : "Catatan / komentar..."}
                              value={val?.note || ''}
                              onChange={e => handleItemNote(item.id, e.target.value)}
                              disabled={st !== 'bad'}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              /* Tampilan Prompt jika Belum Memilih Jenis Unit */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-silver-dark)', padding: '2rem', textAlign: 'center' }}>
                <Truck size={48} style={{ marginBottom: '1rem', opacity: 0.4, color: 'var(--color-yellow-primary)' }} />
                <h3 style={{ fontSize: '1.1rem', color: 'var(--color-silver-light)', marginBottom: '0.5rem' }}>Silakan Pilih Jenis Unit / SPIP Terlebih Dahulu</h3>
                <p style={{ fontSize: '0.85rem', maxWidth: '480px', color: 'var(--color-silver)' }}>
                  Pilih jenis unit pada dropdown nomor 1 di atas untuk membuka daftar checklist pemeriksaan P2H harian yang wajib diisi.
                </p>
              </div>
            )}

            {/* ─ Footer: Rekomendasi & Submit — FIXED ─ */}
            {selectedJenisUnit && (
              <div style={{ flexShrink: 0, paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', marginTop: '0.5rem' }}>
                
                {/* Alert Status Kesiapan Unit */}
                {hasBadItems ? (
                  <div style={{ marginBottom: '0.5rem', padding: '0.4rem 0.75rem', borderRadius: '4px', backgroundColor: 'rgba(244,67,54,0.15)', border: '1px solid #f44336', color: '#ff8a80', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldAlert size={16} />
                    PERINGATAN KESELAMATAN: Terdapat temuan TIDAK / RUSAK pada item pemeriksaan. Unit DIREKOMENDASIKAN STOP BEROPERASI!
                  </div>
                ) : (
                  <div style={{ marginBottom: '0.5rem', padding: '0.4rem 0.75rem', borderRadius: '4px', backgroundColor: 'rgba(76,175,80,0.12)', border: '1px solid #4caf50', color: '#81c784', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={16} />
                    STATUS KELAYAKAN: Seluruh item pemeriksaan aman. Unit SIAP BEROPERASI (READY TO OPERATE).
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', height: '38px', fontSize: '0.875rem', opacity: (isHmKmInvalid || submitting) ? 0.6 : 1, cursor: (isHmKmInvalid || submitting) ? 'not-allowed' : 'pointer' }}
                  disabled={isHmKmInvalid || submitting}
                >
                  <Save size={16} /> {submitting ? 'Menyimpan...' : `Simpan Laporan P2H Harian (${selectedJenisUnit})`}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ── Tab P2H Pending Approval ── */}
      {activeTab === 'pending' && (
        <div className="card" style={{ flex: 1, overflow: 'auto', width: '100%', padding: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '1.25rem', gap: '0.75rem' }}>
            <div>
              <h2 style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '1.1rem', margin: 0 }}>
                <ClipboardList size={18} style={{ color: '#ff9800', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ lineHeight: '1.3' }}>Daftar P2H Menunggu Verifikasi / Approval (P2H Pending)</span>
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginTop: '0.35rem', paddingLeft: '1.65rem' }}>
                Validasi 3 Pihak (Operator ➔ Leading Hand ➔ Mekanik). Laporan akan pindah ke Riwayat P2H setelah disetujui.
              </div>
            </div>
            <span style={{ padding: '0.25rem 0.75rem', borderRadius: '12px', backgroundColor: 'rgba(255,152,0,0.15)', color: '#ffb74d', fontSize: '0.8rem', fontWeight: 'bold', alignSelf: isMobile ? 'flex-start' : 'auto', marginLeft: isMobile ? '1.65rem' : 0 }}>
              {pendingReports.length} Laporan Pending
            </span>
          </div>

          {pendingReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-silver-dark)' }}>
              <CheckCircle2 size={44} style={{ margin: '0 auto 0.75rem', color: '#81c784', opacity: 0.8 }} />
              <h3 style={{ fontSize: '1rem', color: 'var(--color-silver-light)', marginBottom: '0.25rem' }}>Semua Laporan P2H Telah Diverifikasi</h3>
              <p style={{ fontSize: '0.85rem' }}>Tidak ada antrean laporan P2H yang memerlukan persetujuan saat ini.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1rem' }}>
              {pendingReports.map(rep => (
                <div key={rep.id} style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: `1px solid ${rep.hasKritisIssue ? 'rgba(244,67,54,0.4)' : 'rgba(255,193,7,0.4)'}`, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  
                  {/* Top Status & Unit Title */}
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-silver-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{rep.jenisUnit}</span>
                      <h3 style={{ fontSize: '1.15rem', color: 'var(--color-yellow-primary)', margin: '0.1rem 0' }}>{rep.unit}</h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-silver)' }}>Tgl: {rep.date} | HM: {rep.hmkm}</span>
                    </div>

                    <span style={{ 
                      padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                      backgroundColor: rep.statusReady === 'STOP / BREAKDOWN' ? 'rgba(244,67,54,0.15)' : rep.statusReady === 'OPPORTUNITY BREAKDOWN' ? 'rgba(255,152,0,0.15)' : 'rgba(76,175,80,0.15)',
                      color: rep.statusReady === 'STOP / BREAKDOWN' ? '#ff8a80' : rep.statusReady === 'OPPORTUNITY BREAKDOWN' ? '#ffb74d' : '#81c784',
                      border: `1px solid ${rep.statusReady === 'STOP / BREAKDOWN' ? '#f44336' : rep.statusReady === 'OPPORTUNITY BREAKDOWN' ? '#ff9800' : '#4caf50'}`,
                      width: isMobile ? '100%' : 'auto',
                      textAlign: 'center'
                    }}>
                      {rep.statusReady}
                    </span>
                  </div>

                  {/* Matrix 3 Pihak (Operator, Leading Hand, Mechanic) */}
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '0.65rem', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div>👤 <strong>Operator:</strong> <span style={{ color: '#ffffff' }}>{rep.operator}</span></div>
                    <div>👷 <strong>Leading Hand:</strong> <span style={{ color: 'var(--color-yellow-primary)' }}>{rep.leadingHand}</span></div>
                    {rep.hasKritisIssue && (
                      <div>🔧 <strong>Mekanik PIC:</strong> <span style={{ color: '#ff8a80' }}>{rep.mechanic}</span></div>
                    )}
                  </div>

                  {/* Form Approval Action */}
                  <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px dashed var(--color-border)' }}>
                    
                    {/* Preview Button */}
                    <div style={{ marginBottom: '0.75rem' }}>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                        onClick={() => setPreviewReport(rep)}
                      >
                        <FileText size={14} /> Lihat Detail P2H (Preview)
                      </button>
                    </div>

                    {((rep.approvalStatus === 'Pending Leading Hand' || rep.approvalStatus === 'Pending') && (rep.leadingHand === loggedUser || canManageAll)) ||
                     (rep.approvalStatus === 'Pending Mekanik' && (rep.mechanic === loggedUser || canManageAll)) ? (
                      <>
                        <label style={{ fontSize: '0.75rem', color: 'var(--color-silver)', display: 'block', marginBottom: '0.35rem' }}>
                          {(rep.approvalStatus === 'Pending Leading Hand' || rep.approvalStatus === 'Pending') ? 'Verifikasi Persetujuan Leading Hand:' : 'Rekomendasi Keputusan Mekanik:'}
                        </label>

                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          {(rep.approvalStatus === 'Pending Leading Hand' || rep.approvalStatus === 'Pending') ? (
                            <>
                              <button 
                                type="button" 
                                className="btn" 
                                style={{ flex: 1, backgroundColor: '#1b5e20', borderColor: '#4caf50', color: '#ffffff', fontSize: '0.78rem', padding: '0.4rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                                onClick={() => handleApproveP2h(rep.id, 'Setuju Aman', 'Disetujui aman beroperasi oleh Leading Hand')}
                              >
                                <CheckCircle2 size={14} /> {rep.hasKritisIssue ? 'Setujui (Abaikan Rusak)' : 'Setujui P2H'}
                              </button>
                              {rep.hasKritisIssue && (
                                <button 
                                  type="button" 
                                  className="btn" 
                                  style={{ flex: 1, backgroundColor: '#b71c1c', borderColor: '#f44336', color: '#ffffff', fontSize: '0.78rem', padding: '0.4rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                                  onClick={() => handleApproveP2h(rep.id, 'STOP Mekanik', 'STOP (Diteruskan ke Mekanik)')}
                                >
                                  <ShieldAlert size={14} /> STOP & Ke Mekanik
                                </button>
                              )}
                              <button 
                                type="button" 
                                className="btn" 
                                style={{ flex: 1, backgroundColor: 'transparent', borderColor: 'var(--color-border)', color: 'var(--color-silver-light)', fontSize: '0.78rem', padding: '0.4rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                                onClick={() => handleApproveP2h(rep.id, 'Tolak', 'Ditolak oleh Leading Hand')}
                              >
                                <X size={14} /> Tolak
                              </button>
                            </>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                              <textarea 
                                placeholder="Tambahkan catatan mekanik (Wajib diisi sebelum memproses)..."
                                style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--color-border)', borderRadius: '6px', color: '#fff', padding: '0.6rem', fontSize: '0.8rem', minHeight: '60px', resize: 'vertical' }}
                                value={mechanicNotes[rep.id] || ''}
                                onChange={(e) => handleNoteChange(rep.id, e.target.value)}
                              />
                              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.5rem' }}>
                                {rep.statusReady === 'OPPORTUNITY BREAKDOWN' && (
                                  <>
                                    <button 
                                      type="button" 
                                      className="btn" 
                                      style={{ flex: 1, backgroundColor: '#1b5e20', borderColor: '#4caf50', color: '#ffffff', fontSize: '0.78rem', padding: '0.4rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', opacity: !mechanicNotes[rep.id]?.trim() ? 0.5 : 1, pointerEvents: !mechanicNotes[rep.id]?.trim() ? 'none' : 'auto' }}
                                      onClick={() => handleApproveP2h(rep.id, 'Acknowledge', mechanicNotes[rep.id])}
                                    >
                                      <CheckCircle2 size={14} /> Tandai Aman (Ready)
                                    </button>
                                    
                                    <button 
                                      type="button" 
                                      className="btn" 
                                      style={{ flex: 1, backgroundColor: '#b71c1c', borderColor: '#f44336', color: '#ffffff', fontSize: '0.78rem', padding: '0.4rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', opacity: !mechanicNotes[rep.id]?.trim() ? 0.5 : 1, pointerEvents: !mechanicNotes[rep.id]?.trim() ? 'none' : 'auto' }}
                                      onClick={() => handleApproveP2h(rep.id, 'Bantah STOP', mechanicNotes[rep.id])}
                                    >
                                      <ShieldAlert size={14} /> Bantah & Jadikan Breakdown
                                    </button>
                                  </>
                                )}

                                {rep.statusReady === 'STOP / BREAKDOWN' && (
                                   <button 
                                     type="button" 
                                     className="btn" 
                                     style={{ flex: 1, backgroundColor: '#1b5e20', borderColor: '#4caf50', color: '#ffffff', fontSize: '0.78rem', padding: '0.4rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', opacity: !mechanicNotes[rep.id]?.trim() ? 0.5 : 1, pointerEvents: !mechanicNotes[rep.id]?.trim() ? 'none' : 'auto' }}
                                     onClick={() => handleApproveP2h(rep.id, 'Tetap Beroperasi', mechanicNotes[rep.id])}
                                   >
                                     <CheckCircle2 size={14} /> Selesai Diperbaiki (Ready To Use)
                                   </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--color-silver)', fontStyle: 'italic' }}>
                         Sedang menunggu verifikasi dari {rep.approvalStatus.replace('Pending ', '')}...
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab Riwayat P2H ── */}
      {activeTab === 'history' && (
        <div className="card" style={{ flex: 1, overflow: 'auto', width: '100%', padding: '1.25rem' }}>
          <h2 className="mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <List size={18} style={{ color: 'var(--color-yellow-primary)' }} />
            Riwayat Pelaporan P2H
          </h2>
          {reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-silver-dark)' }}>
              <ClipboardCheck size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
              <p style={{ fontSize: '0.9rem' }}>Belum ada laporan P2H tersimpan hari ini.</p>
              <button className="btn btn-primary" style={{ marginTop: '1rem', fontSize: '0.85rem' }} onClick={() => navigate('/p2h/create')}>Input P2H Sekarang</button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '0.6rem 0.85rem', color: 'var(--color-silver)', fontSize: '0.825rem' }}>Tanggal</th>
                  <th style={{ padding: '0.6rem 0.85rem', color: 'var(--color-silver)', fontSize: '0.825rem' }}>Jenis Unit & No Lambung</th>
                  <th style={{ padding: '0.6rem 0.85rem', color: 'var(--color-silver)', fontSize: '0.825rem' }}>HM / KM</th>
                  <th style={{ padding: '0.6rem 0.85rem', color: 'var(--color-silver)', fontSize: '0.825rem' }}>Operator</th>
                  <th style={{ padding: '0.6rem 0.85rem', color: 'var(--color-silver)', fontSize: '0.825rem' }}>Leading Hand</th>
                  <th style={{ padding: '0.6rem 0.85rem', color: 'var(--color-silver)', fontSize: '0.825rem' }}>Mekanik PIC</th>
                  <th style={{ padding: '0.6rem 0.85rem', color: 'var(--color-silver)', fontSize: '0.825rem' }}>Status Verifikasi</th>
                  <th style={{ padding: '0.6rem 0.85rem', color: 'var(--color-silver)', fontSize: '0.825rem' }}>Keputusan Unit</th>
                  <th style={{ padding: '0.6rem 0.85rem', color: 'var(--color-silver)', fontSize: '0.825rem', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}>{r.date}</td>
                    <td style={{ padding: '0.6rem 0.85rem' }}>
                      <div style={{ fontWeight: '600', color: 'var(--color-yellow-primary)', fontSize: '0.875rem' }}>{r.unit}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-silver)' }}>{r.jenisUnit}</div>
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}>{r.hmkm}</td>
                    <td style={{ padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}>{r.operator}</td>
                    <td style={{ padding: '0.6rem 0.85rem', fontSize: '0.85rem', color: 'var(--color-silver-light)' }}>{r.leadingHand || '-'}</td>
                    <td style={{ padding: '0.6rem 0.85rem', fontSize: '0.85rem', color: '#ff8a80' }}>{r.mechanic || '-'}</td>
                    <td style={{ padding: '0.6rem 0.85rem' }}>
                      <span style={{ 
                        padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600',
                        backgroundColor: r.approvalStatus === 'Approved' ? 'rgba(76,175,80,0.15)' : 'rgba(255,152,0,0.15)',
                        color: r.approvalStatus === 'Approved' ? '#81c784' : '#ffb74d',
                        border: `1px solid ${r.approvalStatus === 'Approved' ? '#4caf50' : '#ff9800'}`
                      }}>
                        {r.approvalStatus === 'Approved' ? '✓ Approved' : '⏳ Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem' }}>
                      <span style={{ 
                        padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600',
                        backgroundColor: r.statusReady === 'STOP / BREAKDOWN' ? 'rgba(244,67,54,0.15)' : r.statusReady === 'OPPORTUNITY BREAKDOWN' ? 'rgba(255,152,0,0.15)' : 'rgba(76,175,80,0.15)',
                        color: r.statusReady === 'STOP / BREAKDOWN' ? '#ff8a80' : r.statusReady === 'OPPORTUNITY BREAKDOWN' ? '#ffb74d' : '#81c784',
                        border: `1px solid ${r.statusReady === 'STOP / BREAKDOWN' ? '#f44336' : r.statusReady === 'OPPORTUNITY BREAKDOWN' ? '#ff9800' : '#4caf50'}`
                      }}>
                        {r.statusReady}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center' }}>
                      <button 
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        onClick={() => setPreviewReport(r)}
                        title="Lihat Detail P2H"
                      >
                        <FileText size={14} /> Preview
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal Popup Alert Custom */}
      {modalNotice && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#1e2227', borderRadius: '10px', border: '1px solid var(--color-yellow-primary)', padding: '1.25rem 1.5rem', maxWidth: '400px', width: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', textAlign: 'center' }}>
            <AlertTriangle size={40} style={{ color: 'var(--color-yellow-primary)', marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.05rem', color: '#ffffff', marginBottom: '0.5rem' }}>Pemberitahuan Sistem</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-silver-light)', marginBottom: '1.25rem', lineHeight: '1.4' }}>{modalNotice}</p>
            <button className="btn btn-primary" style={{ minWidth: '120px', margin: '0 auto' }} onClick={() => setModalNotice(null)}>Tutup</button>
          </div>
        </div>
      )}

      {/* Modal Preview P2H */}
      {previewReport && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#1e2227', borderRadius: '10px', border: '1px solid var(--color-border)', padding: '1.25rem 1.5rem', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} style={{ color: 'var(--color-yellow-primary)' }} />
                Preview P2H: {previewReport.unit}
              </h3>
              <button onClick={() => setPreviewReport(null)} style={{ background: 'transparent', border: 'none', color: 'var(--color-silver)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--color-silver-light)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div><strong>Tanggal:</strong> <span style={{color: '#fff'}}>{previewReport.date}</span></div>
              <div><strong>Operator:</strong> <span style={{color: '#fff'}}>{previewReport.operator}</span></div>
              <div><strong>HM / KM:</strong> <span style={{color: '#fff'}}>{previewReport.hmkm}</span></div>
              <div><strong>Shift:</strong> <span style={{color: '#fff'}}>{previewReport.shift}</span></div>
              <div><strong>Leading Hand:</strong> <span style={{color: '#fff'}}>{previewReport.leadingHand || '-'}</span></div>
              <div><strong>Mekanik PIC:</strong> <span style={{color: '#fff'}}>{previewReport.mechanic || '-'}</span></div>
            </div>

            <div style={{ fontSize: '0.85rem' }}>
              <h4 style={{ color: '#ffffff', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Detail Pengecekan Checklist:</h4>
              <div style={{ maxHeight: '45vh', overflowY: 'auto', paddingRight: '0.5rem' }} className="hide-scrollbar">
                {Object.entries(previewReport.checklistData || {}).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'var(--color-silver)', flex: 1, paddingRight: '1rem' }}>
                      {getChecklistLabel(key)}
                    </span>
                    <div style={{ textAlign: 'right', flexShrink: 0, maxWidth: '150px' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: value.status === 'bad' ? 'rgba(244,67,54,0.15)' : 'rgba(76,175,80,0.15)',
                        color: value.status === 'bad' ? '#ff8a80' : '#81c784', 
                        fontWeight: '600', 
                        fontSize: '0.75rem',
                        border: `1px solid ${value.status === 'bad' ? '#f44336' : '#4caf50'}`
                      }}>
                        {value.status === 'bad' ? 'Rusak' : 'Baik'}
                      </span>
                      {value.note && <div style={{ fontSize: '0.7rem', color: 'var(--color-yellow-primary)', fontStyle: 'italic', marginTop: '0.25rem' }}>Note: {value.note}</div>}
                    </div>
                  </div>
                ))}
                {Object.keys(previewReport.checklistData || {}).length === 0 && (
                  <div style={{ color: 'var(--color-silver)', fontStyle: 'italic', textAlign: 'center', padding: '2rem 1rem' }}>Tidak ada detail checklist untuk laporan ini.</div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', textAlign: 'right', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setPreviewReport(null)}>Tutup Preview</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
