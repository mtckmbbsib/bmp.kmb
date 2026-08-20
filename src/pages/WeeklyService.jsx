import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, List, PlusCircle, Save, Trash2, User, Gauge, Truck, Hash, CheckSquare, ClipboardList, AlertTriangle, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SearchableSelect from '../components/SearchableSelect';


// ─── Checklist template ──────────────────────────────────────────────────────
const CHECKLIST_TEMPLATE = {
  'Anfo Truck': [
    { id: '1_1', section: 'Umum', label: 'Form P2H sebelumnya telah dilengkapi' },
    { id: '1_2', section: 'Umum', label: 'Lembar arsip kerja tertunda telah dilengkapi' },
    { id: '2_1', section: 'Engine & Transmisi', label: 'Kondisi dan level minyak power steering' },
    { id: '2_2', section: 'Engine & Transmisi', label: 'Kondisi dan level minyak kopling' },
    { id: '2_3', section: 'Engine & Transmisi', label: 'Kondisi dan level minyak rem' },
    { id: '2_4', section: 'Engine & Transmisi', label: 'Kondisi dan level air radiator' },
    { id: '2_5', section: 'Engine & Transmisi', label: 'Kondisi dan tegangan van belt' },
    { id: '2_6', section: 'Engine & Transmisi', label: 'Kebocoran oli atau angin' },
    { id: '2_7', section: 'Engine & Transmisi', label: 'Sistem pembuangan / kebocoran knalpot' },
    { id: '2_8', section: 'Engine & Transmisi', label: 'Saluran buangan AC (tidak tersumbat)' },
    { id: '2_9', section: 'Engine & Transmisi', label: 'Level oli mesin (tambah jika diperlukan)' },
    { id: '2_10', section: 'Engine & Transmisi', label: 'Saringan udara (dibuka & dibersihkan)' },
    { id: '2_11', section: 'Engine & Transmisi', label: 'Kondisi PTO' },
    { id: '3_1', section: 'Chasis & Drive Train', label: 'Kipas / wiper dan semprotan air bekerja aman' },
    { id: '3_2', section: 'Chasis & Drive Train', label: 'Kondisi ban, baut dan tekanan udara' },
    { id: '3_3', section: 'Chasis & Drive Train', label: 'Kebocoran transmisi dan differensial' },
    { id: '3_4', section: 'Chasis & Drive Train', label: 'Rangkaian steering dan tie rod' },
    { id: '3_5', section: 'Chasis & Drive Train', label: 'Kondisi dan lumasi rangkaian berputar (propeller)' },
    { id: '3_6', section: 'Chasis & Drive Train', label: 'Level air aki, kepala aki (bersihkan karat)' },
    { id: '3_7', section: 'Chasis & Drive Train', label: 'Rem depan dan rem belakang' },
    { id: '3_8', section: 'Chasis & Drive Train', label: 'Kondisi dan lumasi semua point greas (spring & brake)' },
    { id: '3_9', section: 'Chasis & Drive Train', label: 'Kondisi stoper spring, spring depan + belakang' },
    { id: '3_10', section: 'Chasis & Drive Train', label: 'Bolt + nut chassis' },
    { id: '4_1', section: 'Lampu & Indikator', label: 'Fungsi semua lampu kerja' },
    { id: '4_2', section: 'Lampu & Indikator', label: 'Fungsi alarm mundur' },
    { id: '5_1', section: 'Engine Kubota', label: 'Kondisi dan level air radiator' },
    { id: '5_2', section: 'Engine Kubota', label: 'Kondisi dan tegangan van belt' },
    { id: '5_3', section: 'Engine Kubota', label: 'Kebocoran oli dan air' },
    { id: '5_4', section: 'Engine Kubota', label: 'Sistem pembuangan / kebocoran knalpot' },
    { id: '5_5', section: 'Engine Kubota', label: 'Kondisi dan level oli mesin (tambah jika diperlukan)' },
    { id: '5_6', section: 'Engine Kubota', label: 'Kondisi saringan udara (dibersihkan)' },
    { id: '6_1', section: 'Mixing Unit / ANFO Mixer', label: 'Kondisi dan lumasi semua bearing mixing proses' },
    { id: '6_2', section: 'Mixing Unit / ANFO Mixer', label: 'Kondisi hydraulic pump' },
    { id: '6_3', section: 'Mixing Unit / ANFO Mixer', label: 'Kondisi semua motor hydraulik' },
    { id: '6_4', section: 'Mixing Unit / ANFO Mixer', label: 'Kondisi semua coupling' },
    { id: '6_5', section: 'Mixing Unit / ANFO Mixer', label: 'Kondisi dan level oli hidraulik (ganti setiap HM 3000)' },
    { id: '6_6', section: 'Mixing Unit / ANFO Mixer', label: 'Kondisi hose hydraulik (ganti jika fatik)' },
    { id: '6_7', section: 'Mixing Unit / ANFO Mixer', label: 'Kondisi piping hydraulik' },
    { id: '6_8', section: 'Mixing Unit / ANFO Mixer', label: 'Kondisi hydraulik cooler' },
    { id: '6_9', section: 'Mixing Unit / ANFO Mixer', label: 'Kondisi cylinder boom auger (leaking & crack)' },
    { id: '6_10', section: 'Mixing Unit / ANFO Mixer', label: 'Kondisi pin cylinder boom auger' },
    { id: '6_11', section: 'Mixing Unit / ANFO Mixer', label: 'Kondisi bracket cylinder boom auger (crack)' },
    { id: '6_12', section: 'Mixing Unit / ANFO Mixer', label: 'Kondisi rantai swing (lakukan greas)' },
    { id: '6_13', section: 'Mixing Unit / ANFO Mixer', label: 'Kondisi hose fuel process' },
    { id: '6_14', section: 'Mixing Unit / ANFO Mixer', label: 'Kondisi semua pressure gauge' },
    { id: '6_15', section: 'Mixing Unit / ANFO Mixer', label: 'Kondisi panel control (hydraulic & electric)' },
    { id: '6_16', section: 'Mixing Unit / ANFO Mixer', label: 'Kondisi kontrol valve bank' },
    { id: '6_17', section: 'Mixing Unit / ANFO Mixer', label: 'Kondisi hand reel' },
    { id: '6_18', section: 'Mixing Unit / ANFO Mixer', label: 'Kondisi tangga' },
    { id: '6_19', section: 'Mixing Unit / ANFO Mixer', label: 'Kondisi main hole' },
    { id: '6_20', section: 'Mixing Unit / ANFO Mixer', label: 'Kondisi APAR (6 kg)' },
    { id: '6_21', section: 'Mixing Unit / ANFO Mixer', label: 'Bolt + nut bin MMU' },
    { id: '6_22', section: 'Mixing Unit / ANFO Mixer', label: 'Kondisi mud guard' },
    { id: '6_23', section: 'Mixing Unit / ANFO Mixer', label: 'Kondisi semua sign pada tank' },
  ],
  'MMU Truck': [
    // 1. UMUM
    { id: 'mmu_1_1', section: 'Umum', label: 'Form P2H sebelumnya telah dilengkapi' },
    { id: 'mmu_1_2', section: 'Umum', label: 'Lembar laporan kerusakan pada pemeriksaan harian' },
    { id: 'mmu_1_3', section: 'Umum', label: 'Kebersihan unit termasuk interior' },

    // 2. ENGINE & TRANSMISI
    { id: 'mmu_2_1', section: 'Engine & Transmisi', label: 'Minyak power steering (level dan kondisi)' },
    { id: 'mmu_2_2', section: 'Engine & Transmisi', label: 'Minyak kopling (level dan kondisi)' },
    { id: 'mmu_2_3', section: 'Engine & Transmisi', label: 'Level air radiator' },
    { id: 'mmu_2_4', section: 'Engine & Transmisi', label: 'Oli mesin (level, kondisi, & tambah jika perlu)' },
    { id: 'mmu_2_5', section: 'Engine & Transmisi', label: 'Kebocoran oli atau air' },
    { id: 'mmu_2_6', section: 'Engine & Transmisi', label: 'V-Belt (kekencangan dan kondisi fisik)' },
    { id: 'mmu_2_7', section: 'Engine & Transmisi', label: 'Rangkaian yang berputar (propeller) & pelumasan' },
    { id: 'mmu_2_8', section: 'Engine & Transmisi', label: 'Sistem pembuangan & jalur knalpot' },
    { id: 'mmu_2_9', section: 'Engine & Transmisi', label: 'Saluran buangan AC (tidak tersumbat)' },
    { id: 'mmu_2_10', section: 'Engine & Transmisi', label: 'Filter AC (dibersihkan)' },
    { id: 'mmu_2_11', section: 'Engine & Transmisi', label: 'Filter udara (dibersihkan)' },

    // 3. CHASIS & DRIVE TRAIN
    { id: 'mmu_3_1', section: 'Chasis & Drive Train', label: 'Kipas / wiper dan semprotan air' },
    { id: 'mmu_3_2', section: 'Chasis & Drive Train', label: 'Ban, kekencangan baut, dan tekanan ban' },
    { id: 'mmu_3_3', section: 'Chasis & Drive Train', label: 'Transfer case, transmisi, dan differensial' },
    { id: 'mmu_3_4', section: 'Chasis & Drive Train', label: 'PTO (kekencangan baut dan kebocoran oli)' },
    { id: 'mmu_3_5', section: 'Chasis & Drive Train', label: 'Rangkaian steering dan tie rod' },
    { id: 'mmu_3_6', section: 'Chasis & Drive Train', label: 'Aki (level air, kepala aki, baut braket)' },
    { id: 'mmu_3_7', section: 'Chasis & Drive Train', label: 'Rem depan & belakang (kampas, jalur angin, pedal)' },
    { id: 'mmu_3_8', section: 'Chasis & Drive Train', label: 'Pelumasan semua point grease (spring & brake)' },
    { id: 'mmu_3_9', section: 'Chasis & Drive Train', label: 'Spring depan + belakang, baut, dan stopper' },
    { id: 'mmu_3_10', section: 'Chasis & Drive Train', label: 'Bolt + nut chassis' },
    { id: 'mmu_3_11', section: 'Chasis & Drive Train', label: 'Spring stopper depan dan belakang' },

    // 4. LAMPU & INDIKATOR
    { id: 'mmu_4_1', section: 'Lampu & Indikator', label: 'Fungsi semua lampu kerja' },
    { id: 'mmu_4_2', section: 'Lampu & Indikator', label: 'Fungsi alarm mundur' },

    // 5. MIXING UNIT / MMU
    { id: 'mmu_5_1', section: 'Mixing Unit / MMU', label: 'Rangkaian berputar (Propeller PTO) & pelumasan' },
    { id: 'mmu_5_2', section: 'Mixing Unit / MMU', label: 'Bearing dan chain coupling mixing proses & pelumasan' },
    { id: 'mmu_5_3', section: 'Mixing Unit / MMU', label: 'Hydraulic pump (baut pengikat & kebocoran)' },
    { id: 'mmu_5_4', section: 'Mixing Unit / MMU', label: 'Semua motor hydraulik (baut pengikat & kebocoran)' },
    { id: 'mmu_5_5', section: 'Mixing Unit / MMU', label: 'Semua coupling' },
    { id: 'mmu_5_6', section: 'Mixing Unit / MMU', label: 'Level oli hidraulik (ganti per 200 HM / 1 Thn)' },
    { id: 'mmu_5_7', section: 'Mixing Unit / MMU', label: 'Hose hydraulik (baut pengikat & kebocoran)' },
    { id: 'mmu_5_8', section: 'Mixing Unit / MMU', label: 'Piping hydraulik (baut pengikat & kebocoran)' },
    { id: 'mmu_5_9', section: 'Mixing Unit / MMU', label: 'Cylinder boom auger (leaking & crack)' },
    { id: 'mmu_5_10', section: 'Mixing Unit / MMU', label: 'Hydraulic cooler' },
    { id: 'mmu_5_11', section: 'Mixing Unit / MMU', label: 'Nemo pump visual (baut pengikat & coupling)' },
    { id: 'mmu_5_12', section: 'Mixing Unit / MMU', label: 'Hose emulsion dan product' },
    { id: 'mmu_5_13', section: 'Mixing Unit / MMU', label: 'Level oli & kebocoran cat pump' },
    { id: 'mmu_5_14', section: 'Mixing Unit / MMU', label: 'Hose gasser dan air' },
    { id: 'mmu_5_15', section: 'Mixing Unit / MMU', label: 'Semua pressure gauge (kekencangan & kebocoran)' },
    { id: 'mmu_5_16', section: 'Mixing Unit / MMU', label: 'Panel control (hydraulic & electric)' },
    { id: 'mmu_5_17', section: 'Mixing Unit / MMU', label: 'Kontrol valve bank (baut pengikat & kebocoran)' },
    { id: 'mmu_5_18', section: 'Mixing Unit / MMU', label: 'Hand reel & baut pengikat' },
    { id: 'mmu_5_19', section: 'Mixing Unit / MMU', label: 'Tangga & baut pengikat' },
    { id: 'mmu_5_20', section: 'Mixing Unit / MMU', label: 'Main hole' },
    { id: 'mmu_5_21', section: 'Mixing Unit / MMU', label: 'APAR (6 kg)' },
    { id: 'mmu_5_22', section: 'Mixing Unit / MMU', label: 'Bolt + nut bin MMU' },
    { id: 'mmu_5_23', section: 'Mixing Unit / MMU', label: 'Mud guard' },
    { id: 'mmu_5_24', section: 'Mixing Unit / MMU', label: 'Semua sign di tank' },
    { id: 'mmu_5_25', section: 'Mixing Unit / MMU', label: 'Semua tank & kebocoran' },
  ],
  'Crane Truck': [],
  'Dump Truck': [],
  'Forklift': [
    // 1. UMUM
    { id: 'fl_1_1', section: 'Umum', label: 'Form P2H sebelumnya telah dilengkapi' },
    { id: 'fl_1_2', section: 'Umum', label: 'Lembar laporan kerusakan pada pemeriksaan harian' },
    { id: 'fl_1_3', section: 'Umum', label: 'Kebersihan unit termasuk interior' },

    // 2. ENGINE, TRANSMISI & DRIVE TRAIN
    { id: 'fl_2_1', section: 'Engine, Transmisi & Drive Train', label: 'Oli mesin (level & tambah jika perlu)' },
    { id: 'fl_2_2', section: 'Engine, Transmisi & Drive Train', label: 'Minyak kopling (level & tambah jika perlu)' },
    { id: 'fl_2_3', section: 'Engine, Transmisi & Drive Train', label: 'Level oli hydraulic (tambah jika perlu)' },
    { id: 'fl_2_4', section: 'Engine, Transmisi & Drive Train', label: 'Level air dan kondisi radiator' },
    { id: 'fl_2_5', section: 'Engine, Transmisi & Drive Train', label: 'Van belt (retakan & tegangan)' },
    { id: 'fl_2_6', section: 'Engine, Transmisi & Drive Train', label: 'Kebocoran oli atau air' },
    { id: 'fl_2_7', section: 'Engine, Transmisi & Drive Train', label: 'Sistem pembuangan / kebocoran knalpot' },
    { id: 'fl_2_8', section: 'Engine, Transmisi & Drive Train', label: 'Saringan udara (dibuka & dibersihkan)' },
    { id: 'fl_2_9', section: 'Engine, Transmisi & Drive Train', label: 'Strainer filter hydraulic (dibersihkan)' },
    { id: 'fl_2_10', section: 'Engine, Transmisi & Drive Train', label: 'Rem depan dan rem belakang' },
    { id: 'fl_2_11', section: 'Engine, Transmisi & Drive Train', label: 'Hose hydraulic dan kontrol valve' },

    // 3. KELISTRIKAN
    { id: 'fl_3_1', section: 'Kelistrikan', label: 'Fungsi semua lampu kerja' },
    { id: 'fl_3_2', section: 'Kelistrikan', label: 'Aki (air, kepala aki, bersihkan karat)' },
    { id: 'fl_3_3', section: 'Kelistrikan', label: 'Fungsi alarm mundur' },
    { id: 'fl_3_4', section: 'Kelistrikan', label: 'Sensor jok operator' },

    // 4. MAST & GARPU
    { id: 'fl_4_1', section: 'Mast & Garpu', label: 'Rantai mast & pelumasan' },
    { id: 'fl_4_2', section: 'Mast & Garpu', label: 'Bearing mast & pelumasan' },
    { id: 'fl_4_3', section: 'Mast & Garpu', label: 'Cylinder up / tilt' },
    { id: 'fl_4_4', section: 'Mast & Garpu', label: 'Rel garpu pengangkut & pelumasan' },
    { id: 'fl_4_5', section: 'Mast & Garpu', label: 'Garpu forklift' },
    { id: 'fl_4_6', section: 'Mast & Garpu', label: 'Pin lock garpu (fungsi & kondisi)' },

    // 5. STEERING SYSTEM
    { id: 'fl_5_1', section: 'Steering System', label: 'Steering system & pelumasan' },
    { id: 'fl_5_2', section: 'Steering System', label: 'Bearing roda & pelumasan' },
  ],
  'Genset': [
    // A. LENGKAPI FORM P2H
    { id: 'gen_0_1', section: 'Umum', label: 'Lengkapi dan periksa form P2H sebelumnya' },

    // 1. BAHAN BAKAR / FUEL
    { id: 'gen_1_1', section: 'Bahan Bakar', label: 'Cek Kondisi tangki solar' },
    { id: 'gen_1_2', section: 'Bahan Bakar', label: 'Cek bersihkan filter separator solar' },

    // 2. ENGINE
    { id: 'gen_2_1', section: 'Engine', label: 'Cek kebocoran pada radiator' },
    { id: 'gen_2_2', section: 'Engine', label: 'Cek kondisi bagian dari radiator (hose, clamp, mounting dll)' },
    { id: 'gen_2_3', section: 'Engine', label: 'Cek kekencangan dan kondisi V - belt' },
    { id: 'gen_2_4', section: 'Engine', label: 'Cek kondisi hose dan jalur fuel' },

    // 3. ELECTRIC
    { id: 'gen_3_1', section: 'Electric', label: 'Cek fungsi panel' },
    { id: 'gen_3_2', section: 'Electric', label: 'Cek kondisi wiring' },
    { id: 'gen_3_3', section: 'Electric', label: 'Cek Kondisi Maint Switch Breaker' },
  ],
  'Hot Water Boiler (HWB)': [
    // 1. UMUM
    { id: 'hwb_1_1', section: 'Umum', label: 'Lengkapi dan periksa form P2H sebelumnya' },
    { id: 'hwb_1_2', section: 'Umum', label: 'Lengkapi dan pemeriksa lembar arsip untuk kerja yang tertunda' },

    // 2. BOILER
    { id: 'hwb_2_1', section: 'Boiler', label: 'Bersihkan fuel filter' },
    { id: 'hwb_2_2', section: 'Boiler', label: 'Cek dan bersihkan Y strainer' },
    { id: 'hwb_2_3', section: 'Boiler', label: 'Cek safety valve' },
    { id: 'hwb_2_4', section: 'Boiler', label: 'Check fungsi pressure, temp gauge saat boiler bekerja' },
  ],
  'Compressor': [
    // 1. UMUM
    { id: 'comp_1_1', section: 'Umum', label: 'Lengkapi dan periksa form P2H sebelumnya' },

    // 2. WEEKLY COMPRESSOR
    { id: 'comp_2_1', section: 'Weekly Compressor', label: 'Bersihkan filter udara' },
    { id: 'comp_2_2', section: 'Weekly Compressor', label: 'Bersihkan filter panel' },
    { id: 'comp_2_3', section: 'Weekly Compressor', label: 'Periksa kondisi van belt (Ganti jika diperlukan)' },
    { id: 'comp_2_4', section: 'Weekly Compressor', label: 'Bersihkan bagian dalam compressor' },
    { id: 'comp_2_5', section: 'Weekly Compressor', label: 'Bersihkan bagian luar dan body compressor' },
  ],
  'On Site Plant (OSP)': [
    // 1. RIBBON BLANDER
    { id: 'osp_1_1', section: 'Ribbon Blander', label: 'Bersihkan Housing dan Shaft Ribbon' },
    { id: 'osp_1_2', section: 'Ribbon Blander', label: 'Periksa dan Lumasi Bearing yang ada' },
    { id: 'osp_1_3', section: 'Ribbon Blander', label: 'Periksa Kondisi Kopling dan Rubber' },
    { id: 'osp_1_4', section: 'Ribbon Blander', label: 'Periksa Kondisi dan Level Oli Gear Box Motor (Ganti 6 Bln Sekali)' },
    { id: 'osp_1_5', section: 'Ribbon Blander', label: 'Periksa Kebocoran Oli Pada Gear Box' },
    { id: 'osp_1_6', section: 'Ribbon Blander', label: 'Periksa Kondisi V-Belt dari keretakan dan kekencangan' },
    { id: 'osp_1_7', section: 'Ribbon Blander', label: 'Periksa Kekencangan Semua Baut dan Nut' },
    { id: 'osp_1_8', section: 'Ribbon Blander', label: 'Periksa Kondisi Dudukan Bearing, Motor dan Gear Box' },
    { id: 'osp_1_9', section: 'Ribbon Blander', label: 'Periksa Kondisi Motor Listrik (Fan, Terminal dan Kabel Power Motor Listrik)' },
    { id: 'osp_1_10', section: 'Ribbon Blander', label: 'Periksa Secara Visual Kondisi Motor dan Gear Box Saat Alat Dioperasikan' },
    { id: 'osp_1_11', section: 'Ribbon Blander', label: 'Periksa Kondisi Permukaan Shaft Ribbon' },
    { id: 'osp_1_12', section: 'Ribbon Blander', label: 'Periksa Kondisi Panel Kontrol' },
    { id: 'osp_1_13', section: 'Ribbon Blander', label: 'Periksa Gasket Housing Ribbon (Ganti 6 Bln Sekali)' },
    { id: 'osp_1_14', section: 'Ribbon Blander', label: 'Bersihkan Pompa Transfer dan Area Pompa Transfer' },
    { id: 'osp_1_15', section: 'Ribbon Blander', label: 'Periksa dan lumasi bearing-bearing yang ada' },
    { id: 'osp_1_16', section: 'Ribbon Blander', label: 'Periksa Kondisi dan Level Oli Gear Box Motor (Ganti 6 Bln Sekali)' },
    { id: 'osp_1_17', section: 'Ribbon Blander', label: 'Periksa Kebocoran Oli Pada Gear Box' },
    { id: 'osp_1_18', section: 'Ribbon Blander', label: 'Periksa Jalur Pipa Transfer (Pastikan Tidak Ada Kristalisasi Pada Flange Pompa)' },
    { id: 'osp_1_19', section: 'Ribbon Blander', label: 'Periksa Kondisi Motor Listrik (Fan, Terminal dan Kabel Power Motor Listrik)' },
    { id: 'osp_1_20', section: 'Ribbon Blander', label: 'Periksa Secara Visual Kondisi Motor dan Gear Box Saat Alat Dioperasikan' },
    { id: 'osp_1_21', section: 'Ribbon Blander', label: 'Periksa Kondisi Semua Valve Pada Jalur Pompa Transfer' },

    // 2. ANSOL AREA
    { id: 'osp_2_1', section: 'Ansol Area', label: 'Bersihkan Motor, Gear Box dan Area Atas Ansol Tank' },
    { id: 'osp_2_2', section: 'Ansol Area', label: 'Periksa dan Lumasi Bearing-Bearing yang ada' },
    { id: 'osp_2_3', section: 'Ansol Area', label: 'Periksa Kondisi Blade dan Shaft Blade' },
    { id: 'osp_2_4', section: 'Ansol Area', label: 'Periksa Kondisi Dudukan Bearing, Motor dan Gear Box' },
    { id: 'osp_2_5', section: 'Ansol Area', label: 'Periksa Kondisi dan Level Oli Gear Box Motor (Ganti 6 Bln Sekali)' },
    { id: 'osp_2_6', section: 'Ansol Area', label: 'Periksa Kebocoran Oli Pada Gear Box' },
    { id: 'osp_2_7', section: 'Ansol Area', label: 'Periksa Kekencangan Semua Baut dan Nut' },
    { id: 'osp_2_8', section: 'Ansol Area', label: 'Periksa Kondisi Motor Listrik (Fan, Terminal dan Kabel Power Motor Listrik)' },
    { id: 'osp_2_9', section: 'Ansol Area', label: 'Periksa Secara Visual Kondisi Motor dan Gear Box Saat Alat Dioperasikan' },
    { id: 'osp_2_10', section: 'Ansol Area', label: 'Bersihkan Y Strainer' },
    { id: 'osp_2_11', section: 'Ansol Area', label: 'Periksa Jalur Pipa Transfer (Pastikan tidak ada Kebocoran dan Sign Pada Jalur Pipa ada)' },
    { id: 'osp_2_12', section: 'Ansol Area', label: 'Periksa Kondisi Semua Valve Pada Jalur Pipa ANSOL' },

    // 3. FUEL BLAND AREA
    { id: 'osp_3_1', section: 'Fuel Bland Area', label: 'Bersihkan Motor, Gear Box dan Area Atas Tank' },
    { id: 'osp_3_2', section: 'Fuel Bland Area', label: 'Periksa dan lumasi bearing-bearing yang ada' },
    { id: 'osp_3_3', section: 'Fuel Bland Area', label: 'Periksa Kondisi Dudukan Bearing, Motor dan Gear Box' },
    { id: 'osp_3_4', section: 'Fuel Bland Area', label: 'Periksa Kondisi Blade dan Shaft Blade' },
    { id: 'osp_3_5', section: 'Fuel Bland Area', label: 'Periksa Kondisi dan Level Oli Gear Box Motor (Ganti 6 Bln Sekali)' },
    { id: 'osp_3_6', section: 'Fuel Bland Area', label: 'Periksa Kebocoran Oli Pada Gear Box' },
    { id: 'osp_3_7', section: 'Fuel Bland Area', label: 'Periksa Kekencangan Semua Baut dan Nut' },
    { id: 'osp_3_8', section: 'Fuel Bland Area', label: 'Periksa Kondisi Motor Listrik (Fan, Terminal dan Kabel Power Motor Listrik)' },
    { id: 'osp_3_9', section: 'Fuel Bland Area', label: 'Periksa Secara Visual Kondisi Motor dan Gear Box Saat Alat Dioperasikan' },
    { id: 'osp_3_10', section: 'Fuel Bland Area', label: 'Periksa Jalur Pipa Transfer (Pastikan Tidak ada Kebocoran dan Sign Pada Jalur Pipa ada)' },
    { id: 'osp_3_11', section: 'Fuel Bland Area', label: 'Bersihkan Y Strainer' },
    { id: 'osp_3_12', section: 'Fuel Bland Area', label: 'Periksa Kondisi Semua Valve Pada Jalur Fuel Bland' },

    // 4. POMPA TRANSFER / TRANSFER PUMP
    { id: 'osp_4_1', section: 'Pompa Transfer', label: 'Bersihkan Pompa Transfer dan Area Pompa Transfer' },
    { id: 'osp_4_2', section: 'Pompa Transfer', label: 'Periksa Kondisi Hose Jalur Angin ke Pompa' },
    { id: 'osp_4_3', section: 'Pompa Transfer', label: 'Bersihkan Air Sparator Pompa (Cuci)' },
    { id: 'osp_4_4', section: 'Pompa Transfer', label: 'Bersihkan Filter Product (lakukan 2 minggu sekali)' },
    { id: 'osp_4_5', section: 'Pompa Transfer', label: 'Periksa Kondisi Motor Listrik (Fan, Terminal dan Kabel Power Motor Listrik)' },
    { id: 'osp_4_6', section: 'Pompa Transfer', label: 'Periksa dan lumasi bearing-bearing yang ada' },
    { id: 'osp_4_7', section: 'Pompa Transfer', label: 'Periksa Kondisi dan Level Oli Gear Box Motor (Ganti 6 Bln Sekali)' },
    { id: 'osp_4_8', section: 'Pompa Transfer', label: 'Periksa Kebocoran Oli Pada Gear Box' },
    { id: 'osp_4_9', section: 'Pompa Transfer', label: 'Periksa Secara Visual Kondisi Motor dan Gear Box Saat Alat Dioperasikan' },
    { id: 'osp_4_10', section: 'Pompa Transfer', label: 'Periksa Jalur Pipa Transfer (Pastikan Tidak Ada Kristalisasi Pada Flange Pompa)' },
    { id: 'osp_4_11', section: 'Pompa Transfer', label: 'Periksa Kondisi Semua Valve Pada Jalur Pompa Transfer' },

    // 5. FUEL AREA
    { id: 'osp_5_1', section: 'Fuel Area', label: 'Bersihkan Pompa Transfer dan Area Pompa Transfer' },
    { id: 'osp_5_2', section: 'Fuel Area', label: 'Periksa Kondisi Fuel Level (Jika Hose Buram Ganti)' },
    { id: 'osp_5_3', section: 'Fuel Area', label: 'Bersihkan Y Strainer' },
    { id: 'osp_5_4', section: 'Fuel Area', label: 'Periksa Kondisi Flow Rate / Liter Meter (Lakukan Kalibrasi 1 Bulan Sekali)' },
    { id: 'osp_5_5', section: 'Fuel Area', label: 'Periksa Kondisi Motor Listrik (Fan, Terminal dan Kabel Power Motor Listrik)' },
    { id: 'osp_5_6', section: 'Fuel Area', label: 'Periksa Secara Visual Kondisi Motor dan Gear Box Saat Alat Dioperasikan' },
    { id: 'osp_5_7', section: 'Fuel Area', label: 'Periksa Jalur Pipa Transfer (Pastikan Tidak Ada Kebocoran dan Sign Pada Jalur Pipa ada)' },
    { id: 'osp_5_8', section: 'Fuel Area', label: 'Periksa Kondisi Semua Valve Pada Jalur Fuel' },

    // 6. GASSER AREA
    { id: 'osp_6_1', section: 'Gasser Area', label: 'Bersihkan Motor Agitator dan Area Tank / Drum' },
    { id: 'osp_6_2', section: 'Gasser Area', label: 'Periksa kondisi Blade dan Shaft Blade' },
    { id: 'osp_6_3', section: 'Gasser Area', label: 'Periksa Kondisi Motor Listrik (Fan, Terminal dan Kabel Power Motor Listrik)' },
    { id: 'osp_6_4', section: 'Gasser Area', label: 'Periksa Secara Visual Kondisi Motor Saat Alat Dioperasikan' },
    { id: 'osp_6_5', section: 'Gasser Area', label: 'Periksa Kondisi Pompa Transfer' },
    { id: 'osp_6_6', section: 'Gasser Area', label: 'Periksa Kondisi Hose Jalur Angin ke Pompa' },
    { id: 'osp_6_7', section: 'Gasser Area', label: 'Bersihkan Filter Pompa' },
    { id: 'osp_6_8', section: 'Gasser Area', label: 'Periksa Hose Transfer' },

    // 7. GENERAL AREA
    { id: 'osp_7_1', section: 'General Area', label: 'Periksa Kondisi Semua APAR Yang Ada Di Plant' },
    { id: 'osp_7_2', section: 'General Area', label: 'Periksa Kondisi Semua Sign Di Tank dan Area Plant' },
    { id: 'osp_7_3', section: 'General Area', label: 'Bersihkan Semua Area Tank' },
    { id: 'osp_7_4', section: 'General Area', label: 'Periksa Kondisi Semua Sign yg ada di Jalur Pipa' },
    { id: 'osp_7_5', section: 'General Area', label: 'Periksa Kondisi Jalur pipa yang ada di Plant' },
    { id: 'osp_7_6', section: 'General Area', label: 'Periksa Kondisi Kabel Tray yang ada di Plant' },
    { id: 'osp_7_7', section: 'General Area', label: 'Periksa Kondisi Semua Panel Listrik' },
    { id: 'osp_7_8', section: 'General Area', label: 'Periksa dan Bersihkan Pompa Air dan Filter Air' },
  ],
  'Dump Truck': [
    // 1. UMUM
    { id: 'dt_1_1', section: 'Umum', label: 'Lengkapi tugas pada daftar pemeriksaan harian (P2H)' },
    { id: 'dt_1_2', section: 'Umum', label: 'Periksa lembar laporan kerusakan pada pemeriksaan harian' },
    { id: 'dt_1_3', section: 'Umum', label: 'Bersihkan unit termasuk interiornya' },

    // 2. ENGINE DAN TRANSMISI
    { id: 'dt_2_1', section: 'Engine & Transmisi', label: 'Periksa minyak power steering (Level dan Kondisi)' },
    { id: 'dt_2_2', section: 'Engine & Transmisi', label: 'Periksa minyak kopling (Level dan Kondisi)' },
    { id: 'dt_2_3', section: 'Engine & Transmisi', label: 'Periksa level air radiator' },
    { id: 'dt_2_4', section: 'Engine & Transmisi', label: 'Periksa oli mesin (kondisi, level oil dan tambah jika perlu)' },
    { id: 'dt_2_5', section: 'Engine & Transmisi', label: 'Periksa adanya kebocoran oli atau air' },
    { id: 'dt_2_6', section: 'Engine & Transmisi', label: 'Periksa kondisi V-Belt (kekencangan dan kondisi fisik)' },
    { id: 'dt_2_7', section: 'Engine & Transmisi', label: 'Periksa dan lumasi rangkaian yang berputar (propeller)' },
    { id: 'dt_2_8', section: 'Engine & Transmisi', label: 'Periksa sistem pembuangan (kebocoran dan kondisi jalur knalpot)' },
    { id: 'dt_2_9', section: 'Engine & Transmisi', label: 'Periksa saluran buangan AC (Pastikan tidak ada yg tersumbat)' },
    { id: 'dt_2_10', section: 'Engine & Transmisi', label: 'Periksa dan bersihkan filter AC (tembak dengan angin dari bagian dalam)' },
    { id: 'dt_2_11', section: 'Engine & Transmisi', label: 'Periksa dan bersihkan filter udara (tembak dengan angin dari bagian dalam)' },

    // 3. CHASIS AND DRIVE TRAIN
    { id: 'dt_3_1', section: 'Chasis & Drive Train', label: 'Periksa kipas / wiper dan semprotan air bekerja dengan aman' },
    { id: 'dt_3_2', section: 'Chasis & Drive Train', label: 'Periksa bagian ban, (kondisi Ban, Kekencangan Baut dan tekanan ban)' },
    { id: 'dt_3_3', section: 'Chasis & Drive Train', label: 'Periksa bagian transfer case, transmisi dan differensial (kekencangan Baut dan Kebocoran)' },
    { id: 'dt_3_4', section: 'Chasis & Drive Train', label: 'Periksa bagian PTO (kekencangan baut dan kebocoran oli)' },
    { id: 'dt_3_5', section: 'Chasis & Drive Train', label: 'Periksa rangkaian steering dan tie rod' },
    { id: 'dt_3_6', section: 'Chasis & Drive Train', label: 'Periksa aki (Level air aki, kepala aki, baut braket dan bersihkan dari karat)' },
    { id: 'dt_3_7', section: 'Chasis & Drive Train', label: 'Periksa bagian rem depan & belakang (Keteftalan kampas, kebocoran jalur angin dan fungsi pedal rem)' },
    { id: 'dt_3_8', section: 'Chasis & Drive Train', label: 'Periksa dan lumasi semua point grease (spring dan brake)' },
    { id: 'dt_3_9', section: 'Chasis & Drive Train', label: 'Periksa bagian spring depan + belakang (kondisi spring, baut spring dan stoper)' },
    { id: 'dt_3_10', section: 'Chasis & Drive Train', label: 'Periksa bolt + nut chassis (kondisi dan kekencangan bolt dan nut)' },
    { id: 'dt_3_11', section: 'Chasis & Drive Train', label: 'Periksa spring stopper depan dan belakang (ganti jika perlu)' },
    { id: 'dt_3_12', section: 'Chasis & Drive Train', label: 'Periksa kondisi APAR (6 kg) (kondisi dan level apar)' },
    { id: 'dt_3_13', section: 'Chasis & Drive Train', label: 'Cek semua bolt + nut Vessel' },
    { id: 'dt_3_14', section: 'Chasis & Drive Train', label: 'Periksa kondisi mud guard' },

    // 4. LAMPU DAN INDIKATOR
    { id: 'dt_4_1', section: 'Lampu & Indikator', label: 'Periksa fungsi semua lampu kerja' },
    { id: 'dt_4_2', section: 'Lampu & Indikator', label: 'Periksa fungsi alarm mundur' },
  ],
};

const DUMMY_UNITS = [
  { id: '3b', jenisUnit: 'MMU Truck', noLambung: 'MMU-18', merk: 'Iveco', tipe: 'Trakker' },
];

const JENIS_UNIT_OPTIONS = [
  'Anfo Truck',
  'MMU Truck',
  'Light Vehicle (LV)',
  'Forklift',
  'Genset',
  'Hot Water Boiler (HWB)',
  'Compressor',
  'On Site Plant (OSP)',
  'Crane Truck',
  'Dump Truck'
];

function getLoggedInUser() {
  try {
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.name || parsed.full_name || parsed.username || 'Unknown';
    }
  } catch (_) {}
  return 'Unknown';
}

// ── Status button styles ─────────────────────────────────────────────────────
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

// ── Mini status badge for history table ──────────────────────────────────────
const HistoryBadge = ({ done, total, tidakBaik }) => {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const color = pct === 100 ? '#81c784' : pct >= 50 ? '#ffd54f' : '#ff8a80';
  return (
    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
      <span style={{ padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}>
        {done}/{total} ({pct}%)
      </span>
      {tidakBaik > 0 && (
        <span style={{ padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: 'rgba(255,82,82,0.12)', color: '#ff8a80', border: '1px solid rgba(255,82,82,0.3)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <AlertTriangle size={12} /> {tidakBaik}
        </span>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
export default function WeeklyService() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = tab || 'create';

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [reports, setReports] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [modalNotice, setModalNotice] = useState(null);

  // Schedule Matrix state (Hari vs Unit)
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [spipUnits, setSpipUnits] = useState([]);

  // Form State untuk Tambah/Edit Jadwal
  const [scheduleDay, setScheduleDay] = useState('Senin');
  const [scheduleUnit, setScheduleUnit] = useState('MMU-18');
  const [scheduleJenis, setScheduleJenis] = useState('MMU Truck');
  const [scheduleShift, setScheduleShift] = useState('Shift 1 (Siang)');
  const [scheduleLokasi, setScheduleLokasi] = useState('Workshop Main');

  // Fetch data dari Supabase saat komponen dipasang
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);

    fetchSchedules();
    fetchReports();
    fetchUsers();
    fetchSpipUnits();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchSpipUnits = async () => {
    try {
      const { data, error } = await supabase.from('units').select('*').order('no_lambung', { ascending: true });
      if (!error && data && data.length > 0) {
        const mapped = data.map(u => ({
          id: u.id || u.no_lambung,
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

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase.from('weekly_schedules').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        const mapped = data.map(s => ({
          id: s.id,
          day: s.day,
          unit: s.no_lambung || s.unit,
          jenisUnit: s.jenis_unit || s.jenisUnit,
          shift: s.shift,
          lokasi: s.lokasi
        }));
        setWeeklySchedule(mapped);
      }
    } catch (err) {
      console.warn('Fetch weekly schedules fallback:', err);
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase.from('weekly_reports').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const mapped = data.map(r => ({
          id: r.id,
          jenisUnit: r.jenis_unit || r.jenisUnit,
          noLambung: r.no_lambung || r.noLambung,
          unitDetail: r.unit_detail || r.unitDetail || '',
          hm: r.hm_value || r.hm || '-',
          date: r.report_date || r.date,
          reporter: r.reporter,
          checklist: r.checklist || [],
          ringkasan: r.ringkasan || '',
          totalItems: r.total_items || 0,
          filledItems: r.filled_items || 0,
          tidakBaikItems: r.tidak_baik_items || 0
        }));
        setReports(mapped);
      }
    } catch (err) {
      console.warn('Fetch weekly reports fallback:', err);
    }
  };

  const handleSaveScheduleItem = async (e) => {
    e.preventDefault();
    if (!scheduleUnit) return;

    const payload = {
      day: scheduleDay,
      no_lambung: scheduleUnit,
      jenis_unit: scheduleJenis,
      shift: scheduleShift,
      lokasi: scheduleLokasi
    };

    try {
      const { error } = await supabase.from('weekly_schedules').insert([payload]);
      if (!error) fetchSchedules();
    } catch (err) {
      console.warn('Save schedule online error:', err);
    }

    setWeeklySchedule(prev => {
      const existsIdx = prev.findIndex(s => s.day === scheduleDay && s.unit === scheduleUnit);
      if (existsIdx >= 0) {
        const updated = [...prev];
        updated[existsIdx] = { day: scheduleDay, unit: scheduleUnit, jenisUnit: scheduleJenis, shift: scheduleShift, lokasi: scheduleLokasi };
        return updated;
      }
      return [...prev, { day: scheduleDay, unit: scheduleUnit, jenisUnit: scheduleJenis, shift: scheduleShift, lokasi: scheduleLokasi }];
    });

    setModalNotice(`Jadwal Weekly Service hari ${scheduleDay} untuk ${scheduleUnit} berhasil disimpan!`);
  };

  const handleDeleteScheduleItem = async (index) => {
    const item = weeklySchedule[index];
    if (window.confirm("Apakah Anda yakin ingin menghapus entri jadwal ini?")) {
      if (item && item.id) {
        try {
          await supabase.from('weekly_schedules').delete().eq('id', item.id);
        } catch (_) {}
      }
      setWeeklySchedule(prev => prev.filter((_, i) => i !== index));
    }
  };

  const [selectedJenis, setSelectedJenis] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [hmValue, setHmValue] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [additionalMekanik, setAdditionalMekanik] = useState('');
  const [checklist, setChecklist] = useState({});
  const [ringkasan, setRingkasan] = useState('');
  const loggedUser = getLoggedInUser();

  const allUnits = useMemo(() => {
    const combined = [...spipUnits, ...DUMMY_UNITS];
    const unique = [];
    const map = new Map();
    for (const u of combined) {
      if (u.noLambung && !map.has(u.noLambung)) {
        map.set(u.noLambung, true);
        unique.push(u);
      }
    }
    return unique;
  }, [spipUnits]);

  const scheduleJenisUnits = useMemo(() => {
    if (!scheduleJenis) return [];
    return allUnits.filter(u => u.jenisUnit === scheduleJenis);
  }, [scheduleJenis, allUnits]);

  const filteredUnits = useMemo(() => {
    if (!selectedJenis) return [];
    return allUnits.filter(u => u.jenisUnit === selectedJenis);
  }, [selectedJenis, allUnits]);

  const checklistTemplate = useMemo(() => CHECKLIST_TEMPLATE[selectedJenis] || [], [selectedJenis]);

  const filledCount    = checklistTemplate.filter(i => checklist[i.id]?.status).length;
  const tidakBaikCount = checklistTemplate.filter(i => checklist[i.id]?.status === 'tidak_baik').length;

  const handleJenisChange = (jenis) => { 
    setSelectedJenis(jenis); 
    setSelectedUnit(null); 
    if (jenis === 'Ribbon Blender' || jenis === 'On Site Plant (OSP)' || jenis.toLowerCase().includes('blender')) {
      setHmValue('0');
    } else {
      setHmValue('');
    }
    setChecklist({}); 
  };
  const handleUnitChange  = (nl) => setSelectedUnit(allUnits.find(u => u.noLambung === nl) || (nl ? { noLambung: nl } : null));


  const isNonHmAsset = selectedJenis === 'Ribbon Blender' || selectedJenis === 'On Site Plant (OSP)' || selectedJenis.toLowerCase().includes('blender');

  const missingFields = useMemo(() => {
    const list = [];
    if (!selectedJenis || selectedJenis === '') {
      list.push('Jenis Unit belum dipilih');
    }
    if (!selectedUnit || !selectedUnit.noLambung) {
      list.push('No Lambung Unit belum dipilih');
    }
    if (!isNonHmAsset && (!hmValue || String(hmValue).trim() === '' || Number(hmValue) <= 0)) {
      list.push('HM Saat Service belum diisi / invalid');
    }
    if (!reportDate || reportDate.trim() === '') {
      list.push('Tanggal Pelaporan belum diisi');
    }

    if (selectedJenis && checklistTemplate.length > 0) {
      const unfilledCount = checklistTemplate.length - filledCount;
      if (unfilledCount > 0) {
        list.push(`Masih ada ${unfilledCount} dari ${checklistTemplate.length} item checklist yang belum diisi statusnya (Baik / Tidak Baik / N/A)`);
      }

      const missingTemuanItems = checklistTemplate.filter(i => checklist[i.id]?.status === 'tidak_baik' && !checklist[i.id]?.temuan?.trim());
      if (missingTemuanItems.length > 0) {
        list.push(`Keterangan temuan wajib diisi untuk ${missingTemuanItems.length} item yang ditandai "Tidak Baik"`);
      }
    }

    return list;
  }, [selectedJenis, selectedUnit, hmValue, reportDate, checklistTemplate, filledCount, checklist]);

  const isValid = () => missingFields.length === 0;

  const [showValidationModal, setShowValidationModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (missingFields.length > 0) {
      setShowValidationModal(true);
      return;
    }
    const snap = checklistTemplate.map(i => ({ ...i, status: checklist[i.id]?.status || 'na', temuan: checklist[i.id]?.temuan || '' }));
    
    // Gabungkan pelapor utama (user login) dengan mekanik tambahan (bila ada)
    const fullReporters = additionalMekanik.trim() 
      ? `${loggedUser}, ${additionalMekanik.trim()}` 
      : loggedUser;
    
    const newReport = {
      id: Date.now().toString(),
      jenisUnit: selectedJenis,
      noLambung: selectedUnit.noLambung,
      unitDetail: `${selectedUnit.merk} ${selectedUnit.tipe}`,
      hm: hmValue, date: reportDate, reporter: fullReporters,
      checklist: snap, ringkasan,
      totalItems: checklistTemplate.length, filledItems: filledCount, tidakBaikItems: tidakBaikCount,
    };

    // Kirim ke Supabase
    try {
      await supabase.from('weekly_reports').insert([{
        jenis_unit: selectedJenis,
        no_lambung: selectedUnit.noLambung,
        unit_detail: `${selectedUnit.merk} ${selectedUnit.tipe}`,
        hm_value: Number(hmValue) || 0,
        report_date: reportDate,
        reporter: fullReporters,
        checklist: snap,
        ringkasan,
        total_items: checklistTemplate.length,
        filled_items: filledCount,
        tidak_baik_items: tidakBaikCount
      }]);
    } catch (err) {
      console.warn('Save report online error:', err);
    }

    setReports(prev => [newReport, ...prev]);

    // Auto-update HM saat ini dan target Next Service unit di database Supabase
    const newHmVal = Number(hmValue) || 0;
    if (newHmVal > 0 && selectedUnit?.noLambung) {
      // Weekly Service TIDAK BOLEH memajukan target PM Service yang ada. Hanya update HM saja.
      const nextTarget = selectedUnit?.next_service && Number(selectedUnit.next_service) > 0 
        ? Number(selectedUnit.next_service) 
        : Math.ceil((newHmVal + 1) / 250) * 250;
      try {
        await supabase.from('units').update({
          hm_km: newHmVal,
          next_service: nextTarget
        }).eq('no_lambung', selectedUnit.noLambung);
      } catch (err) {
        console.warn('Update unit next_service error:', err);
      }
    }

    setSelectedJenis(''); setSelectedUnit(null); setHmValue('');

    setReportDate(new Date().toISOString().split('T')[0]);
    setAdditionalMekanik('');
    setChecklist({}); setRingkasan('');
    window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Laporan telah terkirim!' }));
    navigate('/dashboard');
  };

  const handleStatus = (id, status) => setChecklist(prev => ({
    ...prev,
    [id]: { status, temuan: status === 'tidak_baik' ? (prev[id]?.temuan || '') : '' },
  }));
  const handleTemuan = (id, temuan) => setChecklist(prev => ({ ...prev, [id]: { ...prev[id], temuan } }));
  const handleSetAllBaik = () => {
    const s = {};
    checklistTemplate.forEach(i => { s[i.id] = { status: 'baik', temuan: '' }; });
    setChecklist(s);
  };

  const sections = useMemo(() => checklistTemplate.reduce((acc, item) => {
    const s = item.section || 'Umum';
    if (!acc[s]) acc[s] = [];
    acc[s].push(item);
    return acc;
  }, {}), [checklistTemplate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── HEADER HALAMAN WEEKLY SERVICE ── */}
      <div className="no-print" style={{ flexShrink: 0, marginBottom: '1rem', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-end', gap: '1rem' }}>
        <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
          <h1 className="mb-1" style={{ fontSize: '1.4rem', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start', gap: '0.5rem', margin: 0 }}>
            <Calendar size={22} style={{ color: 'var(--color-yellow-primary)' }} />
            Weekly Service
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-silver)', margin: '0.2rem 0 0 0' }}>
            {isMobile 
              ? 'Pembuatan Laporan & Riwayat Perawatan Mingguan Unit' 
              : 'Pengaturan Jadwal, Form Laporan, & Riwayat Perawatan Mingguan Unit'}
          </p>
        </div>
      </div>

      {activeTab === 'create' && (
        <div className="card hide-scrollbar" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', width: '100%', padding: isMobile ? '0.75rem 0.75rem 85px 0.75rem' : '1rem 1.25rem' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: checklistTemplate.length > 0 ? '0.5rem' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(100,181,246,0.15)', border: '1px solid #64b5f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Calendar size={18} style={{ color: '#64b5f6' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#ffffff', lineHeight: '1.2' }}>
                      {selectedJenis ? `${selectedJenis} ${selectedUnit ? `(${selectedUnit.noLambung})` : ''}` : 'Form Weekly Service'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-silver)', marginTop: '0.1rem' }}>
                      {checklistTemplate.length > 0 
                        ? `${filledCount}/${checklistTemplate.length} item diisi` 
                        : 'Lengkapi identitas inspeksi di bawah'}
                    </div>
                  </div>
                </div>
                {checklistTemplate.length > 0 && (
                  <div style={{ fontSize: '0.9rem', fontWeight: '800', color: filledCount === checklistTemplate.length ? '#81c784' : 'var(--color-yellow-primary)' }}>
                    {Math.round((filledCount / checklistTemplate.length) * 100)}%
                  </div>
                )}
              </div>
              
              {/* Progress Bar */}
              {checklistTemplate.length > 0 && (
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${(filledCount / checklistTemplate.length) * 100}%`, 
                    height: '100%', 
                    background: 'linear-gradient(90deg, #64b5f6 0%, #4caf50 100%)', 
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
                  <ClipboardList size={17} style={{ color: '#64b5f6' }} />
                  Identitas Inspeksi Weekly
                </div>
                <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: 'var(--color-silver)', border: '1px solid var(--color-border)', fontWeight: '600' }}>
                  WKL-SERV-2026
                </span>
              </div>

              {/* Form Inputs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem 1.25rem' }}>
                
                {/* 1. Jenis Unit */}
                <div className="input-group mb-0" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--color-silver-light)', marginBottom: '0.25rem', display: 'block' }}>
                    Jenis Unit *
                  </label>
                  <SearchableSelect 
                    className="input-field" 
                    style={{ height: '38px', fontSize: '0.825rem', width: '100%', borderColor: !selectedJenis ? 'var(--color-yellow-primary)' : 'var(--color-border)', fontWeight: 'bold', background: 'var(--color-bg-main)' }}
                    value={selectedJenis} 
                    onChange={e => handleJenisChange(e.target.value)} 
                    required
                  >
                    <option value="">-- Pilih Jenis Unit --</option>
                    {JENIS_UNIT_OPTIONS.map(j => {
                      const hasForm = Boolean(CHECKLIST_TEMPLATE[j] && CHECKLIST_TEMPLATE[j].length > 0);
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

                {/* 2. No Lambung */}
                <div className="input-group mb-0" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--color-silver-light)', marginBottom: '0.25rem', display: 'block' }}>
                    No Lambung *
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Truck size={15} style={{ position: 'absolute', left: '0.75rem', color: 'var(--color-silver-dark)' }} />
                    <SearchableSelect 
                      className="input-field" 
                      style={{ paddingLeft: '2.3rem', height: '38px', fontSize: '0.825rem', width: '100%', background: 'var(--color-bg-main)', borderColor: !selectedUnit ? 'var(--color-yellow-primary)' : 'var(--color-border)' }} 
                      value={selectedUnit?.noLambung || ''} 
                      onChange={e => handleUnitChange(e.target.value)} 
                      disabled={!selectedJenis} 
                      required
                    >
                      <option value="">-- Pilih No Lambung Unit --</option>
                      {filteredUnits.map(u => <option key={u.id} value={u.noLambung}>{u.noLambung} — {u.merk}</option>)}
                    </SearchableSelect>
                  </div>
                </div>

                {/* 3. HM Saat Service */}
                <div className="input-group mb-0" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--color-silver-light)', marginBottom: '0.25rem', display: 'block' }}>
                    HM Saat Service {isNonHmAsset ? '(Non-HM Asset)' : '*'}
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Gauge size={15} style={{ position: 'absolute', left: '0.75rem', color: 'var(--color-silver-dark)' }} />
                    <input 
                      type="number" 
                      className="input-field" 
                      style={{ 
                        paddingLeft: '2.3rem', height: '38px', fontSize: '0.825rem', width: '100%', 
                        borderColor: !hmValue && !isNonHmAsset ? 'var(--color-yellow-primary)' : 'var(--color-border)',
                        backgroundColor: isNonHmAsset ? 'rgba(255,255,255,0.03)' : 'var(--color-bg-main)',
                        opacity: isNonHmAsset ? 0.6 : 1,
                        cursor: isNonHmAsset ? 'not-allowed' : 'text'
                      }} 
                      placeholder={isNonHmAsset ? "N/A (Peralatan Non-HM)" : "Masukkan HM saat ini..."} 
                      value={hmValue} 
                      onChange={e => setHmValue(e.target.value)} 
                      min={1} 
                    />
                  </div>
                </div>

                {/* 4. Tanggal Pelaporan */}
                <div className="input-group mb-0" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--color-silver-light)', marginBottom: '0.25rem', display: 'block' }}>
                    Tanggal Pelaporan *
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Calendar size={15} style={{ position: 'absolute', left: '0.75rem', color: 'var(--color-silver-dark)' }} />
                    <input 
                      type="date" 
                      className="input-field" 
                      style={{ paddingLeft: '2.3rem', height: '38px', fontSize: '0.825rem', width: '100%', colorScheme: 'dark', background: 'var(--color-bg-main)' }} 
                      value={reportDate} 
                      onChange={e => setReportDate(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                {/* 5. Mekanik / Petugas Pelapor */}
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

            {/* ── CARD 3: INSTRUCTION BANNER ── */}
            <div style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '12px',
              background: 'rgba(76, 175, 80, 0.08)',
              border: '1px solid rgba(76, 175, 80, 0.25)',
              color: '#81c784',
              fontSize: '0.75rem',
              marginBottom: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.4rem',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 'bold' }}>ℹ️ Petunjuk:</span>
                <span><strong>✅ Baik</strong> / Normal &nbsp;|&nbsp; <strong>❌ Tidak Baik</strong> = Temuan &nbsp;|&nbsp; <strong>N/A</strong></span>
              </div>
              {selectedJenis && (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.725rem', borderRadius: '6px', height: '26px' }} 
                  onClick={handleSetAllBaik}
                >
                  ✓ Set Semua Baik
                </button>
              )}
            </div>
            {selectedJenis ? (
              <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', paddingRight: '0.25rem', width: '100%', scrollbarWidth: 'none' }}>
                {Object.entries(sections).map(([sectionName, items]) => (
                  <div key={sectionName} style={{ marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0', marginBottom: '0.35rem', borderBottom: '1px solid var(--color-border)' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-yellow-primary)' }}>{sectionName}</span>
                    </div>
                    {items.map(item => {
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
                          </div>

                          {/* OPSI & COMMENT WRAPPER */}
                          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: '0.4rem', flexShrink: 0, width: isMobile ? '100%' : 'auto' }}>
                            
                            {/* OPSI / BUTTONS DI TENGAH */}
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
                              placeholder={st === 'tidak_baik' ? "Catatan temuan (Wajib)... *" : "Catatan / komentar..."}
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
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-silver-dark)', padding: '2rem', textAlign: 'center' }}>
                <Truck size={48} style={{ marginBottom: '1rem', opacity: 0.4, color: 'var(--color-yellow-primary)' }} />
                <h3 style={{ fontSize: '1.1rem', color: 'var(--color-silver-light)', marginBottom: '0.5rem' }}>Silakan Pilih Jenis Unit Terlebih Dahulu</h3>
                <p style={{ fontSize: '0.85rem', maxWidth: '480px', color: 'var(--color-silver)' }}>Pilih Jenis Unit di atas untuk membuka formulir pemeriksaan **Weekly Service**.</p>
              </div>
            )}

            <div style={{ flexShrink: 0, paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', marginTop: '0.5rem' }}>
              <div className="input-group mb-0" style={{ marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '500' }}>Ringkasan & Catatan Mekanik</label>
                <textarea className="input-field" rows={2} placeholder="Tuliskan ringkasan hasil service..." value={ringkasan} onChange={e => setRingkasan(e.target.value)} style={{ resize: 'none', fontSize: '0.85rem' }} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '38px', fontSize: '0.875rem' }}>
                <Save size={16} /> Simpan Laporan
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

      {/* ── Tab Jadwal Weekly Service ── */}
      {activeTab === 'schedule' && (
        <div className="card hide-scrollbar" style={{ flex: 1, overflowY: 'auto', width: '100%', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--color-yellow-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} />
                Pengaturan Jadwal Rutin Weekly Service
              </h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-silver)', margin: '0.25rem 0 0 0' }}>
                Jadwal pemeliharaan mingguan ini akan berlaku secara berulang <b>(berkelanjutan setiap minggunya)</b> kecuali ada penyesuaian khusus.
              </p>
            </div>
          </div>

          {/* Form Pengaturan / Tambah Jadwal Hari */}
          <form onSubmit={handleSaveScheduleItem} style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--color-silver-light)' }}>+ Tambah / Update Pemetaan Jadwal Unit Hari Ini</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              
              <div className="input-group mb-0">
                <label style={{ fontSize: '0.78rem' }}>Hari Service *</label>
                <SearchableSelect className="input-field" style={{ height: '34px', fontSize: '0.825rem' }} value={scheduleDay} onChange={e => setScheduleDay(e.target.value)}>
                  {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </SearchableSelect>
              </div>

              {/* Jenis Unit (Didahulukan) */}
              <div className="input-group mb-0">
                <label style={{ fontSize: '0.78rem' }}>Jenis Unit *</label>
                <SearchableSelect 
                  className="input-field" 
                  style={{ height: '34px', fontSize: '0.825rem' }} 
                  value={scheduleJenis} 
                  onChange={e => {
                    const newJenis = e.target.value;
                    setScheduleJenis(newJenis);
                    const matching = allUnits.filter(u => u.jenisUnit === newJenis);
                    if (matching.length > 0) {
                      setScheduleUnit(matching[0].noLambung);
                    } else {
                      setScheduleUnit('');
                    }
                  }}
                >
                  <option value="">-- Pilih Jenis Unit --</option>
                  {JENIS_UNIT_OPTIONS.map(j => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </SearchableSelect>
              </div>

              {/* No Lambung Unit (Tersaring Berdasarkan Jenis Unit) */}
              <div className="input-group mb-0">
                <label style={{ fontSize: '0.78rem' }}>No Lambung Unit *</label>
                {scheduleJenisUnits.length > 0 ? (
                  <SearchableSelect 
                    className="input-field" 
                    style={{ height: '34px', fontSize: '0.825rem' }} 
                    value={scheduleUnit} 
                    onChange={e => setScheduleUnit(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih No Lambung --</option>
                    {scheduleJenisUnits.map(u => (
                      <option key={u.id || u.noLambung} value={u.noLambung}>
                        {u.noLambung} {u.merk ? `(${u.merk})` : ''}
                      </option>
                    ))}
                  </SearchableSelect>
                ) : (
                  <input 
                    type="text" 
                    className="input-field" 
                    style={{ height: '34px', fontSize: '0.825rem' }} 
                    placeholder={scheduleJenis ? "Ketik No Lambung..." : "Pilih Jenis Unit dahulu"} 
                    value={scheduleUnit} 
                    onChange={e => setScheduleUnit(e.target.value)} 
                    disabled={!scheduleJenis}
                    required 
                  />
                )}
              </div>

              <div className="input-group mb-0">
                <label style={{ fontSize: '0.78rem' }}>Shift Kerjanya *</label>
                <SearchableSelect className="input-field" style={{ height: '34px', fontSize: '0.825rem' }} value={scheduleShift} onChange={e => setScheduleShift(e.target.value)}>
                  <option value="Shift 1 (Siang)">Shift 1 (Siang)</option>
                  <option value="Shift 2 (Malam)">Shift 2 (Malam)</option>
                </SearchableSelect>
              </div>


              <div className="input-group mb-0">
                <label style={{ fontSize: '0.78rem' }}>Lokasi Pengerjaan</label>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ height: '34px', fontSize: '0.825rem' }} 
                  placeholder="Workshop / Pit A / Gudang..." 
                  value={scheduleLokasi} 
                  onChange={e => setScheduleLokasi(e.target.value)} 
                />
              </div>

            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 1.25rem', fontSize: '0.825rem' }}>
              <Save size={14} /> Simpan Penjadwalan Hari {scheduleDay}
            </button>
          </form>

          {/* Matrix Tabel Jadwal Mingguan */}
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} style={{ color: 'var(--color-yellow-primary)' }} />
            Matriks Jadwal Mingguan Rutin (Berlaku Berulang)
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '650px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '0.65rem 0.85rem', color: 'var(--color-yellow-primary)', width: '120px' }}>Hari</th>
                  <th style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver)' }}>Jenis Unit</th>
                  <th style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver)' }}>No Lambung Unit</th>
                  <th style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver)' }}>Shift</th>
                  <th style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver)' }}>Lokasi</th>
                  <th style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver)', textAlign: 'center', width: '80px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(dayName => {
                  const dayItems = weeklySchedule.filter(s => s.day === dayName);
                  if (dayItems.length === 0) {
                    return (
                      <tr key={dayName} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.65rem 0.85rem', fontWeight: 'bold', color: 'var(--color-yellow-primary)' }}>{dayName}</td>
                        <td colSpan="5" style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver-dark)', fontStyle: 'italic' }}>
                          Belum ada jadwal unit di hari {dayName}.
                        </td>
                      </tr>
                    );
                  }

                  return dayItems.map((item, idx) => (
                    <tr key={`${dayName}-${idx}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {idx === 0 && (
                        <td rowSpan={dayItems.length} style={{ padding: '0.65rem 0.85rem', fontWeight: 'bold', color: 'var(--color-yellow-primary)', backgroundColor: 'rgba(255,193,7,0.03)', verticalAlign: 'top' }}>
                          {dayName}
                        </td>
                      )}
                      <td style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver-light)' }}>{item.jenisUnit}</td>
                      <td style={{ padding: '0.65rem 0.85rem', fontWeight: 'bold', color: '#ffffff' }}>{item.unit}</td>

                      <td style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver-light)' }}>{item.shift}</td>
                      <td style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver-light)' }}>{item.lokasi}</td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                        <button 
                          type="button"
                          className="btn btn-secondary" 
                          style={{ padding: '0.25rem', minWidth: '30px', color: '#ff8a80', borderColor: 'rgba(255,138,128,0.3)' }} 
                          onClick={() => handleDeleteScheduleItem(weeklySchedule.indexOf(item))} 
                          title="Hapus Jadwal"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ── Tab Riwayat Laporan ── */}
      {activeTab === 'history' && (
        <div className="card" style={{ flex: 1, overflow: 'auto', margin: '0 auto', width: '100%', padding: isMobile ? '0.85rem 0.85rem 85px 0.85rem' : '1.25rem' }}>
          <h2 className="mb-3" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}>
            <List size={18} style={{ color: 'var(--color-yellow-primary)' }} />
            Riwayat Laporan Weekly Service
          </h2>
          {reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-silver-dark)' }}>
              <ClipboardList size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
              <p style={{ fontSize: '0.9rem' }}>Belum ada laporan yang disimpan.</p>
              <button className="btn btn-primary" style={{ marginTop: '1rem', fontSize: '0.85rem' }} onClick={() => setActiveTab('create')}>Buat Laporan Sekarang</button>
            </div>
          ) : isMobile ? (
            /* Tampilan Cards untuk Mobile View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {reports.map(r => (
                <div 
                  key={r.id} 
                  style={{
                    padding: '0.75rem',
                    background: 'var(--color-bg-card)',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    borderLeft: '4px solid var(--color-yellow-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--color-yellow-primary)', fontSize: '0.95rem' }}>{r.noLambung}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-silver)', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{r.jenisUnit}</span>
                    </div>
                    <span style={{ fontSize: '0.725rem', color: 'var(--color-silver)' }}>📅 {r.date}</span>
                  </div>

                  <div style={{ fontSize: '0.775rem', color: 'var(--color-silver-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>HM: <strong style={{ color: '#ffffff' }}>{r.hm} HM</strong></span>
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '160px' }}>Pelapor: <strong style={{ color: '#ffffff' }}>{r.reporter}</strong></span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem', paddingTop: '0.4rem', borderTop: '1px dashed var(--color-border)' }}>
                    <HistoryBadge done={r.filledItems} total={r.totalItems} tidakBaik={r.tidakBaikItems} />
                    <button 
                      type="button"
                      className="btn btn-secondary" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.725rem', color: '#ff8a80', borderColor: 'rgba(255,138,128,0.3)' }} 
                      onClick={() => setReports(rs => rs.filter(x => x.id !== r.id))} 
                      title="Hapus Laporan"
                    >
                      <Trash2 size={13} style={{ marginRight: '0.2rem' }} /> Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Tampilan Tabel untuk Desktop View */
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Tanggal', 'Unit', 'HM', 'Pelapor', 'Checklist', 'Aksi'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.85rem', color: 'var(--color-silver)', textAlign: h === 'Aksi' ? 'center' : 'left', fontSize: '0.825rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}>{r.date}</td>
                    <td style={{ padding: '0.6rem 0.85rem' }}>
                      <div style={{ fontWeight: '600', color: 'var(--color-yellow-primary)', fontSize: '0.875rem' }}>{r.noLambung}</div>
                      <div className="text-silver" style={{ fontSize: '0.78rem' }}>{r.jenisUnit} · {r.unitDetail}</div>
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}>{r.hm} HM</td>
                    <td style={{ padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}>{r.reporter}</td>
                    <td style={{ padding: '0.6rem 0.85rem' }}><HistoryBadge done={r.filledItems} total={r.totalItems} tidakBaik={r.tidakBaikItems} /></td>
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.3rem', minWidth: '32px', color: '#ff8a80', borderColor: 'rgba(255,138,128,0.3)' }} onClick={() => setReports(rs => rs.filter(x => x.id !== r.id))} title="Hapus">
                        <Trash2 size={14} />
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
            <CheckCircle2 size={40} style={{ color: 'var(--color-yellow-primary)', marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.05rem', color: '#ffffff', marginBottom: '0.5rem' }}>Pemberitahuan Sistem</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-silver-light)', marginBottom: '1.25rem', lineHeight: '1.4' }}>{modalNotice}</p>
            <button className="btn btn-primary" style={{ minWidth: '120px', margin: '0 auto' }} onClick={() => setModalNotice(null)}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
