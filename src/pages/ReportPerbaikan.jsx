import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PlusCircle, List, Save, Trash2, User, Gauge, Truck, Hash, Wrench, 
  Calendar, Printer, AlertTriangle, CheckCircle2, FileText, Plus, X, Edit, Eye, PenTool, ClipboardList
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Helper Angka Romawi untuk Bulan (1-12)
const getRomanMonth = (monthNumber) => {
  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return romanMonths[monthNumber - 1] || 'I';
};

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

export default function ReportPerbaikan() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = tab || 'create';

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [reports, setReports] = useState([]);
  const [units, setUnits] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [masterParts, setMasterParts] = useState([]);
  const [sparePartsIn, setSparePartsIn] = useState([]);

  // Category selection (PLANT / UNIT / ETC)
  const [kategoriForm, setKategoriForm] = useState('UNIT'); // 'PLANT' | 'UNIT' | 'ETC'

  // Header State
  const [noUrut, setNoUrut] = useState(''); // e.g. '01', '001', 'REP-01'
  const [selectedNoLambung, setSelectedNoLambung] = useState('');
  const [selectedUnitObj, setSelectedUnitObj] = useState(null);
  
  const [jobNo, setJobNo] = useState('');
  const [itemNo, setItemNo] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Section Body Form State
  const [indikasiMasalah, setIndikasiMasalah] = useState('');
  const [pemeriksaanAwal, setPemeriksaanAwal] = useState('');
  const [perbaikan, setPerbaikan] = useState('');
  const [downtimeHours, setDowntimeHours] = useState('');
  const [statusPerbaikan, setStatusPerbaikan] = useState('Selesai (Ready)'); // 'Selesai (Ready)' | 'Menunggu Sparepart' | 'Dalam Perbaikan'
  const [lokasi, setLokasi] = useState('');

  // Mekanik / Teknisi & Supervisor
  const [teknisi, setTeknisi] = useState('');
  const [supervisor, setSupervisor] = useState('');

  // Pending Work Orders
  const [pendingWorkOrders, setPendingWorkOrders] = useState([]);

  // Material / Spare Parts Usage List
  const [sparePartList, setSparePartList] = useState([
    { partName: '', qty: 1, unit: 'Pcs', keterangan: '' }
  ]);

  // Edit & Print Modal State
  const [editingId, setEditingId] = useState(null);
  const [selectedReportForPrint, setSelectedReportForPrint] = useState(null);

  const loggedUser = getLoggedInUser();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);

    fetchUnits();
    fetchUsers();
    fetchMasterParts();
    fetchSparePartsIn();
    fetchReports();
    fetchPendingWorkOrders();
    setTeknisi(loggedUser);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Format Nomor Laporan Otomatis: [Nomor Urut]/[No Lambung]/[Bulan Romawi]/[Tahun]
  // Contoh: 01/M18/VIII/2026
  const formattedNomorLaporan = useMemo(() => {
    if (!reportDate) return '';
    const d = new Date(reportDate);
    const romanMonth = getRomanMonth(d.getMonth() + 1);
    const year = d.getFullYear();
    const lambung = selectedNoLambung ? selectedNoLambung.trim() : '....';
    const urut = noUrut ? noUrut.trim() : '....';

    return `${urut}/${lambung}/${romanMonth}/${year}`;
  }, [noUrut, selectedNoLambung, reportDate]);

  const availableMasterParts = useMemo(() => {
    if (!reportDate) return masterParts;
    return masterParts.filter(m => {
      return sparePartsIn.some(inp => inp.part_id === m.id && inp.receive_date <= reportDate);
    });
  }, [masterParts, sparePartsIn, reportDate]);

  // Filter Pengguna dengan Jabatan Leading Hand ke atas untuk Pilihan Supervisor
  const supervisorOptions = useMemo(() => {
    return userOptions.filter(u => {
      const j = (u.jabatan || '').toLowerCase();
      return (
        j.includes('leading') || 
        j.includes('coordinator') || 
        j.includes('co-ordinator') || 
        j.includes('admin') || 
        j.includes('supervisor') ||
        j.includes('spv')
      );
    });
  }, [userOptions]);

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase.from('units').select('*').order('no_lambung', { ascending: true });
      if (!error && data) {
        const mapped = data.map(u => ({
          noLambung: u.no_lambung || u.noLambung,
          jenisUnit: u.jenis_unit || u.jenisUnit || '',
          merk: u.merk || '',
          tipe: u.tipe || ''
        }));
        setUnits(mapped);
      }
    } catch (_) {}
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('users').select('*').order('name', { ascending: true });
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
    } catch (_) {}
  };

  const fetchSparePartsIn = async () => {
    try {
      const { data, error } = await supabase.from('spare_parts_in').select('part_id, receive_date');
      if (!error && data) {
        setSparePartsIn(data);
      }
    } catch (_) {}
  };

  const fetchPendingWorkOrders = async () => {
    try {
      const { data, error } = await supabase.from('work_orders')
        .select('*')
        .in('status', ['Scheduled (Direncanakan)', 'In Progress (Sedang Dikerjakan)'])
        .order('planned_date', { ascending: true });
      if (!error && data) {
        setPendingWorkOrders(data);
      }
    } catch (_) {}
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase.from('repair_reports').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const mapped = data.map(r => ({
          id: r.id,
          nomorLaporan: r.nomor_laporan || r.nomorLaporan,
          noUrut: r.no_urut || r.noUrut || '',
          kategoriForm: r.kategori_form || r.kategoriForm || 'UNIT',
          noLambung: r.no_lambung || r.noLambung,
          unitDetail: r.unit_detail || r.unitDetail || '',
          jobNo: r.job_no || r.jobNo || '',
          itemNo: r.item_no || r.itemNo || '',
          reportDate: r.report_date || r.reportDate,
          indikasiMasalah: r.indikasi_masalah || r.indikasiMasalah || '',
          pemeriksaanAwal: r.pemeriksaan_awal || r.pemeriksaanAwal || '',
          perbaikan: r.perbaikan || '',
          statusPerbaikan: r.status_perbaikan || r.statusPerbaikan || 'Selesai (Ready)',
          lokasi: r.lokasi || 'Cikampek',
          downtime_hours: r.downtime_hours || 0,
          teknisi: r.teknisi || r.reporter || loggedUser,
          supervisor: r.supervisor || '',
          spareParts: typeof r.spare_parts === 'string' ? JSON.parse(r.spare_parts) : (r.spare_parts || [])
        }));
        setReports(mapped);
      }
    } catch (err) {
      console.warn('Fetch repair_reports fallback local:', err);
    }
  };

  const handleSelectPendingWo = (wo) => {
    handleUnitChange(wo.no_lambung);
    setIndikasiMasalah(wo.deskripsi_pekerjaan || '');
    if (wo.assigned_to) {
      setTeknisi(wo.assigned_to);
    }
  };

  const handleUnitChange = (noLambung) => {
    setSelectedNoLambung(noLambung);
    const match = units.find(u => u.noLambung === noLambung);
    setSelectedUnitObj(match || null);
  };

  const handleAddSparePart = () => {
    setSparePartList(prev => [...prev, { partName: '', qty: 1, unit: 'Pcs', keterangan: '' }]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedNoLambung) {
      alert('Silakan pilih Nomor Lambung Unit!');
      return;
    }

    if (!noUrut.trim()) {
      alert('Silakan isi Nomor Urut laporan (contoh: 01, 002)!');
      return;
    }

    const validSpareParts = sparePartList.filter(p => p.partName.trim() !== '');

    const payload = {
      nomor_laporan: formattedNomorLaporan,
      no_urut: noUrut.trim(),
      kategori_form: kategoriForm,
      no_lambung: selectedNoLambung,
      unit_detail: selectedUnitObj ? `${selectedUnitObj.jenisUnit} - ${selectedUnitObj.merk} ${selectedUnitObj.tipe}`.trim() : '',
      job_no: jobNo.trim(),
      item_no: itemNo.trim(),
      report_date: reportDate,
      indikasi_masalah: indikasiMasalah.trim(),
      pemeriksaan_awal: pemeriksaanAwal.trim(),
      perbaikan: perbaikan.trim(),
      status_perbaikan: statusPerbaikan,
      lokasi: lokasi.trim(),
      downtime_hours: Number(downtimeHours) || 0,
      teknisi: teknisi.trim() || loggedUser,
      supervisor: supervisor.trim(),
      spare_parts: validSpareParts
    };

    if (editingId) {
      // Edit mode
      try {
        await supabase.from('repair_reports').update(payload).eq('id', editingId);
      } catch (err) {
        console.warn('Update repair report error:', err);
      }

      setReports(prev => prev.map(r => r.id === editingId ? {
        id: editingId,
        nomorLaporan: payload.nomor_laporan,
        noUrut: payload.no_urut,
        kategoriForm: payload.kategori_form,
        noLambung: payload.no_lambung,
        unitDetail: payload.unit_detail,
        jobNo: payload.job_no,
        itemNo: payload.item_no,
        reportDate: payload.report_date,
        indikasiMasalah: payload.indikasi_masalah,
        pemeriksaanAwal: payload.pemeriksaan_awal,
        perbaikan: payload.perbaikan,
        statusPerbaikan: payload.status_perbaikan,
        downtime_hours: payload.downtime_hours,
        lokasi: payload.lokasi,
        teknisi: payload.teknisi,
        supervisor: payload.supervisor,
        spareParts: payload.spare_parts
      } : r));

      setEditingId(null);
      alert(`Laporan Kegiatan Perbaikan ${formattedNomorLaporan} berhasil diperbarui!`);
    } else {
      // Insert new mode
      const newId = Date.now().toString();
      try {
        await supabase.from('repair_reports').insert([payload]);
      } catch (err) {
        console.warn('Insert repair report error:', err);
      }

      const newReportItem = {
        id: newId,
        nomorLaporan: payload.nomor_laporan,
        noUrut: payload.no_urut,
        kategoriForm: payload.kategori_form,
        noLambung: payload.no_lambung,
        unitDetail: payload.unit_detail,
        jobNo: payload.job_no,
        itemNo: payload.item_no,
        reportDate: payload.report_date,
        indikasiMasalah: payload.indikasi_masalah,
        pemeriksaanAwal: payload.pemeriksaan_awal,
        perbaikan: payload.perbaikan,
        statusPerbaikan: payload.status_perbaikan,
        downtime_hours: payload.downtime_hours,
        lokasi: payload.lokasi,
        teknisi: payload.teknisi,
        supervisor: payload.supervisor,
        spareParts: payload.spare_parts
      };

      setReports(prev => [newReportItem, ...prev]);
      alert(`Laporan Kegiatan Perbaikan ${formattedNomorLaporan} berhasil disimpan!`);
    }

    // Reset Form
    setNoUrut('');
    setSelectedNoLambung('');
    setSelectedUnitObj(null);
    setJobNo('');
    setItemNo('');
    setIndikasiMasalah('');
    setPemeriksaanAwal('');
    setPerbaikan('');
    setStatusPerbaikan('Selesai (Ready)');
    setDowntimeHours('');
    setLokasi('');
    setSparePartList([{ partName: '', qty: 1, keterangan: '' }]);
    navigate('/report/history');
  };

  const handleStartEdit = (report) => {
    setEditingId(report.id);
    setNoUrut(report.noUrut || '');
    setKategoriForm(report.kategoriForm || 'UNIT');
    setSelectedNoLambung(report.noLambung || '');
    const match = units.find(u => u.noLambung === report.noLambung);
    setSelectedUnitObj(match || null);

    setJobNo(report.jobNo || '');
    setItemNo(report.itemNo || '');
    setReportDate(report.reportDate || new Date().toISOString().split('T')[0]);
    setIndikasiMasalah(report.indikasiMasalah || '');
    setPemeriksaanAwal(report.pemeriksaanAwal || '');
    setPerbaikan(report.perbaikan || '');
    setStatusPerbaikan(report.statusPerbaikan || 'Selesai (Ready)');
    setDowntimeHours(report.downtime_hours || '');
    setLokasi(report.lokasi || 'Cikampek');
    setTeknisi(report.teknisi || loggedUser);
    setSupervisor(report.supervisor || '');

    if (report.spareParts && Array.isArray(report.spareParts) && report.spareParts.length > 0) {
      setSparePartList(report.spareParts.map(sp => ({
        partName: sp.partName || '',
        qty: sp.qty || 1,
        unit: sp.unit || 'Pcs',
        keterangan: sp.keterangan || ''
      })));
    } else {
      setSparePartList([{ partName: '', qty: 1, unit: 'Pcs', keterangan: '' }]);
    }

    navigate('/report/create');
  };

  const handleDelete = async (id, nomor) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus laporan "${nomor}"?`)) {
      try {
        await supabase.from('repair_reports').delete().eq('id', id);
      } catch (_) {}
      setReports(prev => prev.filter(r => r.id !== id));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Header Page Title + Tabs */}
      <div className="no-print" style={{ flexShrink: 0, marginBottom: '0.75rem' }}>
        <h1 className="mb-1" style={{ textAlign: 'center', fontSize: '1.2rem', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <PenTool size={22} style={{ color: 'var(--color-yellow-primary)' }} />
          Laporan Kegiatan Perbaikan
        </h1>
        <p style={{ textAlign: 'center', fontSize: '0.725rem', color: 'var(--color-silver)', marginBottom: '0.65rem' }}>
          Formulir Resmi (F-KMB-BMP-BSIB-001-003, Rev. 02)
        </p>

      </div>

      {/* ── TAB BUAT LAPORAN PERBAIKAN ── */}
      {activeTab === 'create' && (
        <div className="card no-print hide-scrollbar" style={{ flex: 1, overflowY: 'auto', maxWidth: '840px', margin: '0 auto', width: '100%', padding: isMobile ? '0.75rem 0.75rem 85px 0.75rem' : '1rem 1rem 85px 1rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            
            {/* ── CARD 1: TOP SUMMARY CARD ── */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(35, 39, 45, 0.95) 0%, rgba(20, 24, 28, 0.98) 100%)',
              border: '1px solid var(--color-border)',
              borderRadius: '14px',
              padding: '0.85rem 1rem',
              marginBottom: '0.75rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,138,128,0.15)', border: '1px solid #ff8a80', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PenTool size={18} style={{ color: '#ff8a80' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#ffffff', lineHeight: '1.2' }}>
                    {selectedNoLambung ? `Laporan Perbaikan — ${selectedNoLambung}` : 'Laporan Kegiatan Perbaikan'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-silver)', marginTop: '0.1rem' }}>
                    Formulir Resmi F-KMB-BMP-BSIB-001-003
                  </div>
                </div>
              </div>
            </div>

            {/* ── CARD PENDING WORK ORDERS ── */}
            {pendingWorkOrders.length > 0 && !editingId && (
              <div style={{
                background: 'rgba(25, 29, 34, 0.95)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '14px',
                padding: isMobile ? '0.85rem' : '1rem',
                marginBottom: '1rem',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-yellow-primary)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertTriangle size={16} /> Work Order (SPK) Pending
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {pendingWorkOrders.map(wo => (
                    <div 
                      key={wo.id}
                      onClick={() => handleSelectPendingWo(wo)}
                      style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.65rem 0.85rem', 
                        background: 'rgba(255, 255, 255, 0.03)', 
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-yellow-primary)'; e.currentTarget.style.background = 'rgba(255, 193, 7, 0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; }}
                    >
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#ffffff' }}>
                          {wo.wo_number} — Unit: <span style={{ color: 'var(--color-yellow-primary)' }}>{wo.no_lambung}</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-silver)', marginTop: '0.2rem' }}>
                          {wo.deskripsi_pekerjaan ? wo.deskripsi_pekerjaan.substring(0, 60) + (wo.deskripsi_pekerjaan.length > 60 ? '...' : '') : '-'}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, paddingLeft: '0.5rem' }}>
                        <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem', borderRadius: '4px', background: 'rgba(33, 150, 243, 0.15)', color: '#64b5f6', fontWeight: 'bold' }}>
                          Klik untuk Lapor
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── CARD 2: IDENTITAS LAPORAN KEGIATAN PERBAIKAN (SINGLE COLUMN STACK) ── */}
            <div style={{
              background: 'rgba(25, 29, 34, 0.95)',
              border: '2px solid var(--color-yellow-primary)',
              borderRadius: '14px',
              padding: isMobile ? '0.85rem' : '1.15rem',
              marginBottom: '0.85rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
            }}>
              {/* Card Header Title */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <ClipboardList size={17} style={{ color: 'var(--color-yellow-primary)' }} />
                  Identitas Laporan Perbaikan
                </div>
                <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '6px', background: 'rgba(255,193,7,0.15)', color: 'var(--color-yellow-primary)', border: '1px solid var(--color-yellow-primary)', fontWeight: '600' }}>
                  F-KMB-001
                </span>
              </div>

              {/* Form Inputs Stacked Vertically (1 Column Stack) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                
                {/* Kategori Radio Selection */}
                <div className="input-group mb-0" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--color-silver-light)', marginBottom: '0.25rem', display: 'block' }}>
                    Kategori Laporan *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '0.4rem 0.65rem', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
                    {['PLANT', 'UNIT', 'ETC'].map(kat => (
                      <label key={kat} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.825rem', fontWeight: 'bold', color: kategoriForm === kat ? 'var(--color-yellow-primary)' : 'var(--color-silver)' }}>
                        <input 
                          type="radio" 
                          name="kategoriForm" 
                          value={kat} 
                          checked={kategoriForm === kat} 
                          onChange={e => setKategoriForm(e.target.value)}
                          style={{ accentColor: 'var(--color-yellow-primary)' }}
                        />
                        {kat}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Pilih Unit / No Lambung */}
                <div className="input-group mb-0" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--color-silver-light)', marginBottom: '0.25rem', display: 'block' }}>
                    Pilih Unit / No Lambung *
                  </label>
                  <select 
                    className="input-field" 
                    style={{ height: '38px', fontSize: '0.825rem', width: '100%', borderColor: !selectedNoLambung ? 'var(--color-yellow-primary)' : 'var(--color-border)', background: 'var(--color-bg-main)', fontWeight: 'bold' }}
                    value={selectedNoLambung}
                    onChange={e => handleUnitChange(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih No Lambung --</option>
                    {units.map(u => (
                      <option key={u.noLambung} value={u.noLambung}>
                        {u.noLambung} {u.jenisUnit ? `(${u.jenisUnit})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nomor Urut Laporan */}
                <div className="input-group mb-0" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--color-silver-light)', marginBottom: '0.25rem', display: 'block' }}>
                    Nomor Urut Laporan *
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    style={{ height: '38px', fontSize: '0.825rem', width: '100%', background: 'var(--color-bg-main)', borderColor: !noUrut ? 'var(--color-yellow-primary)' : 'var(--color-border)' }} 
                    placeholder="Contoh: 01 / 005"
                    value={noUrut}
                    onChange={e => setNoUrut(e.target.value)}
                    required
                  />
                </div>

                {/* Preview Format Nomor Laporan Otomatis */}
                <div className="input-group mb-0" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-silver)', marginBottom: '0.2rem', display: 'block' }}>
                    Format Nomor Laporan Resmi (Otomatis):
                  </label>
                  <div style={{ padding: '0.45rem 0.65rem', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-yellow-primary)', borderRadius: '6px', color: 'var(--color-yellow-primary)', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '0.03em' }}>
                    No: {formattedNomorLaporan}
                  </div>
                </div>

                {/* Job No */}
                <div className="input-group mb-0" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--color-silver-light)', marginBottom: '0.25rem', display: 'block' }}>Job No</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    style={{ height: '38px', fontSize: '0.825rem', width: '100%', background: 'var(--color-bg-main)' }} 
                    placeholder="Masukkan Job No..."
                    value={jobNo}
                    onChange={e => setJobNo(e.target.value)}
                  />
                </div>

                {/* Item No */}
                <div className="input-group mb-0" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--color-silver-light)', marginBottom: '0.25rem', display: 'block' }}>Item No</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    style={{ height: '38px', fontSize: '0.825rem', width: '100%', background: 'var(--color-bg-main)' }} 
                    placeholder="Masukkan Item No..."
                    value={itemNo}
                    onChange={e => setItemNo(e.target.value)}
                  />
                </div>

                {/* Tanggal Laporan */}
                <div className="input-group mb-0" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--color-silver-light)', marginBottom: '0.25rem', display: 'block' }}>Tanggal Laporan *</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    style={{ height: '38px', fontSize: '0.825rem', width: '100%', colorScheme: 'dark', background: 'var(--color-bg-main)' }}
                    value={reportDate}
                    onChange={e => setReportDate(e.target.value)}
                    required
                  />
                </div>

                {/* Downtime Hours */}
                <div className="input-group mb-0" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--color-silver-light)', marginBottom: '0.25rem', display: 'block' }}>Lama Waktu Perbaikan (Jam) *</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    className="input-field" 
                    style={{ height: '38px', fontSize: '0.825rem', width: '100%', background: 'var(--color-bg-main)', borderColor: !downtimeHours ? 'var(--color-yellow-primary)' : 'var(--color-border)' }}
                    placeholder="Contoh: 1.5 untuk satu setengah jam..."
                    value={downtimeHours}
                    onChange={e => setDowntimeHours(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 1: Indikasi / Masalah */}
            <div className="input-group mb-3">
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-yellow-primary)' }}>
                1. Indikasi / Masalah (Indication / Problem) *
              </label>
              <textarea 
                className="input-field" 
                rows="3" 
                placeholder="Tuliskan indikasi kerusakan atau keluhan masalah yang terjadi pada unit..."
                value={indikasiMasalah}
                onChange={e => setIndikasiMasalah(e.target.value)}
                required
              />
            </div>

            {/* Section 2: Pemeriksaan Awal */}
            <div className="input-group mb-3">
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-yellow-primary)' }}>
                2. Pemeriksaan Awal (Initial Checking) *
              </label>
              <textarea 
                className="input-field" 
                rows="3" 
                placeholder="Hasil temuan dan langkah analisa pemeriksaan awal oleh teknisi/mekanik..."
                value={pemeriksaanAwal}
                onChange={e => setPemeriksaanAwal(e.target.value)}
                required
              />
            </div>

            {/* Section 3: Perbaikan */}
            <div className="input-group mb-3">
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-yellow-primary)' }}>
                3. Perbaikan (Repair Action) *
              </label>
              <textarea 
                className="input-field" 
                rows="3" 
                placeholder="Tindakan penanganan perbaikan dan pembongkaran/penggantian part yang dilakukan..."
                value={perbaikan}
                onChange={e => setPerbaikan(e.target.value)}
                required
              />
            </div>

            {/* Section 4: Status Unit Akhir & Lokasi */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
              <div className="input-group mb-0">
                <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Status Akhir Perbaikan *</label>
                <select 
                  className="input-field" 
                  style={{ height: '36px', fontSize: '0.85rem' }}
                  value={statusPerbaikan}
                  onChange={e => setStatusPerbaikan(e.target.value)}
                >
                  <option value="Selesai (Ready)">Selesai (Ready Operasional)</option>
                  <option value="Menunggu Sparepart">Menunggu Sparepart (Waiting Part)</option>
                  <option value="Dalam Perbaikan">Dalam Perbaikan (Breakdown)</option>
                </select>
              </div>

              <div className="input-group mb-0">
                <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Lokasi Perbaikan</label>
                <input 
                  type="text" 
                  list="lokasi-perbaikan-list"
                  className="input-field" 
                  style={{ height: '36px', fontSize: '0.85rem' }} 
                  placeholder="Ketik lokasi perbaikan..."
                  value={lokasi}
                  onChange={e => setLokasi(e.target.value)}
                />
                <datalist id="lokasi-perbaikan-list">
                  {Array.from(new Set(reports.map(r => r.lokasi).filter(Boolean))).map(loc => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Section 5: Pemakaian Material / Spare Parts Usage */}
            <div style={{ marginTop: '1.25rem', marginBottom: '1.25rem', padding: '0.9rem', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--color-border)' }}>
              {/* Section Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <Wrench size={16} style={{ color: 'var(--color-yellow-primary)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-yellow-primary)' }}>
                  Pemakaian Material / Spare Parts
                </span>
              </div>

              {/* Datalist Auto-suggest Sparepart Name */}
              <datalist id="repair-sparepart-list">
                {availableMasterParts.map(m => (
                  <option key={m.id || m.part_name} value={m.part_name}>
                    {m.part_number ? `(${m.part_number})` : ''}
                  </option>
                ))}
              </datalist>

              {/* Part Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {sparePartList.map((part, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      background: 'rgba(30, 34, 40, 0.9)', 
                      border: '1px solid rgba(255,255,255,0.09)', 
                      borderRadius: '8px', 
                      padding: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    {/* Card Header: Item number + delete button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-yellow-primary)', background: 'rgba(255,193,7,0.12)', padding: '0.1rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(255,193,7,0.25)' }}>
                        Material #{index + 1}
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

                    {/* Nama Parts */}
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--color-silver)', marginBottom: '0.2rem', display: 'block' }}>Nama Parts / Material</label>
                      <input 
                        type="text" 
                        list="repair-sparepart-list"
                        className="input-field" 
                        style={{ height: '34px', fontSize: '0.82rem', width: '100%' }}
                        placeholder="Nama parts atau material..." 
                        value={part.partName} 
                        onChange={e => handleSparePartChange(index, 'partName', e.target.value)} 
                      />
                    </div>

                    {/* Qty + Satuan row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--color-silver)', marginBottom: '0.2rem', display: 'block' }}>Jumlah (Qty)</label>
                        <input 
                          type="number" 
                          className="input-field" 
                          style={{ height: '34px', fontSize: '0.82rem', width: '100%' }}
                          placeholder="Jumlah" 
                          min={1} 
                          value={part.qty} 
                          onChange={e => handleSparePartChange(index, 'qty', e.target.value)} 
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--color-silver)', marginBottom: '0.2rem', display: 'block' }}>Satuan</label>
                        <select 
                          className="input-field" 
                          style={{ height: '34px', fontSize: '0.82rem', width: '100%' }}
                          value={part.unit || 'Pcs'} 
                          onChange={e => handleSparePartChange(index, 'unit', e.target.value)}
                        >
                          <option value="Pcs">Pcs</option>
                          <option value="Set">Set</option>
                          <option value="Liter">Liter</option>
                          <option value="Meter">Meter</option>
                          <option value="Unit">Unit</option>
                        </select>
                      </div>
                    </div>

                    {/* Keterangan */}
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--color-silver)', marginBottom: '0.2rem', display: 'block' }}>Keterangan (Opsional)</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        style={{ height: '34px', fontSize: '0.82rem', width: '100%' }}
                        placeholder="Keterangan tambahan..." 
                        value={part.keterangan} 
                        onChange={e => handleSparePartChange(index, 'keterangan', e.target.value)} 
                      />
                    </div>
                  </div>
                ))}

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
                  <PlusCircle size={15} /> + Tambah Material / Spare Part
                </button>
              </div>
            </div>

            {/* Section 6: Penandatangan (Teknisi & Supervisor) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div className="input-group mb-0">
                <label style={{ fontSize: '0.8rem', fontWeight: '500' }}>Dilaporkan oleh (Pelapor Login) *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ height: '36px', fontSize: '0.85rem', backgroundColor: 'rgba(0,0,0,0.3)', opacity: 0.85, fontWeight: 'bold' }}
                  value={loggedUser}
                  readOnly
                  title="Otomatis dari Akun yang Sedang Login"
                  required
                />
              </div>

              <div className="input-group mb-0">
                <label style={{ fontSize: '0.8rem', fontWeight: '500' }}>Mengetahui (Supervisor / Leading Hand ke atas)</label>
                <select 
                  className="input-field" 
                  style={{ height: '36px', fontSize: '0.85rem' }}
                  value={supervisor}
                  onChange={e => setSupervisor(e.target.value)}
                >
                  <option value="">-- Pilih Supervisor / Leading Hand --</option>
                  {supervisorOptions.map(u => {
                    const dName = u.name || u.full_name || u.username;
                    return (
                      <option key={u.id} value={dName}>
                        {dName} ({u.jabatan || 'User'})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', height: '40px', fontSize: '0.9rem' }}
            >
              <Save size={18} /> {editingId ? 'Simpan Perubahan Laporan' : 'Simpan Laporan Perbaikan'}
            </button>
          </form>
        </div>
      )}

      {/* ── TAB RIWAYAT PERBAIKAN ── */}
      {activeTab === 'history' && (
        <div className="card no-print hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} style={{ color: 'var(--color-yellow-primary)' }} />
            Daftar Laporan Kegiatan Perbaikan Tersimpan
          </h2>

          {reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-silver-dark)' }}>
              <FileText size={48} style={{ margin: '0 auto', marginBottom: '1rem', opacity: 0.4 }} />
              <p>Belum ada laporan perbaikan yang dibuat.</p>
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setActiveTab('create')}>
                Buat Laporan Perbaikan Sekarang
              </button>
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
                  {/* Top Header Row: Nomor Laporan + Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.45rem' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--color-yellow-primary)' }}>
                        No: {r.nomorLaporan}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#ffffff', fontWeight: 'bold', marginTop: '0.1rem' }}>
                        Unit: {r.noLambung} <span style={{ color: 'var(--color-silver)', fontWeight: 'normal' }}>({r.unitDetail || r.kategoriForm})</span>
                      </div>
                    </div>
                    <span style={{ 
                      padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold',
                      backgroundColor: r.statusPerbaikan?.includes('Selesai') ? 'rgba(76,175,80,0.18)' : 'rgba(255,82,82,0.18)',
                      color: r.statusPerbaikan?.includes('Selesai') ? '#81c784' : '#ff8a80',
                      border: `1px solid ${r.statusPerbaikan?.includes('Selesai') ? 'rgba(76,175,80,0.4)' : 'rgba(255,82,82,0.4)'}`
                    }}>
                      {r.statusPerbaikan}
                    </span>
                  </div>

                  {/* Info Lines */}
                  <div style={{ fontSize: '0.775rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div>
                      <span style={{ color: 'var(--color-silver)' }}>Indikasi Kerusakan: </span>
                      <span style={{ color: '#ffffff' }}>{r.indikasiMasalah || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-silver)', marginTop: '0.1rem' }}>
                      <span>Tgl: <strong style={{ color: '#ffffff' }}>{r.reportDate}</strong></span>
                      <span>Teknisi: <strong style={{ color: '#ffffff' }}>{r.teknisi}</strong></span>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div style={{ display: 'flex', gap: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }} 
                      onClick={() => handleStartEdit(r)}
                    >
                      <Edit size={13} /> Edit
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', borderColor: 'var(--color-yellow-primary)', color: 'var(--color-yellow-primary)' }} 
                      onClick={() => setSelectedReportForPrint(r)}
                    >
                      <Printer size={13} /> Form Resmi
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: '#ff8a80', borderColor: 'rgba(255,138,128,0.3)' }} 
                      onClick={() => handleDelete(r.id, r.nomorLaporan)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '780px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem', color: 'var(--color-silver)' }}>No Laporan / Form</th>
                    <th style={{ padding: '0.75rem', color: 'var(--color-silver)' }}>Unit</th>
                    <th style={{ padding: '0.75rem', color: 'var(--color-silver)' }}>Indikasi Kerusakan</th>
                    <th style={{ padding: '0.75rem', color: 'var(--color-silver)' }}>Tgl & Mekanik</th>
                    <th style={{ padding: '0.75rem', color: 'var(--color-silver)' }}>Status Akhir</th>
                    <th style={{ padding: '0.75rem', color: 'var(--color-silver)', textAlign: 'center', width: '120px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--color-yellow-primary)' }}>
                        <div>{r.nomorLaporan}</div>
                        <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.35rem', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--color-silver-light)' }}>
                          {r.kategoriForm || 'UNIT'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#ffffff' }}>
                        <strong>{r.noLambung}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-silver)' }}>{r.unitDetail}</div>
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--color-silver-light)', maxWidth: '240px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.indikasiMasalah}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.8rem' }}>
                        <div>{r.reportDate}</div>
                        <div style={{ color: 'var(--color-silver)' }}>Teknisi: {r.teknisi}</div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ 
                          padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600',
                          backgroundColor: r.statusPerbaikan?.includes('Selesai') ? 'rgba(76,175,80,0.2)' : 'rgba(255,82,82,0.2)',
                          color: r.statusPerbaikan?.includes('Selesai') ? '#81c784' : '#ff8a80',
                          border: `1px solid ${r.statusPerbaikan?.includes('Selesai') ? 'rgba(76,175,80,0.3)' : 'rgba(255,82,82,0.3)'}`
                        }}>
                          {r.statusPerbaikan}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.3rem 0.4rem' }} 
                            onClick={() => setSelectedReportForPrint(r)} 
                            title="Pratinjau / Print Form Resmi"
                          >
                            <Printer size={15} />
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.3rem 0.4rem' }} 
                            onClick={() => handleStartEdit(r)} 
                            title="Edit Laporan"
                          >
                            <Edit size={15} />
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.3rem 0.4rem', color: '#ff8a80', borderColor: 'rgba(255,138,128,0.3)' }} 
                            onClick={() => handleDelete(r.id, r.nomorLaporan)} 
                            title="Hapus Laporan"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL PRATINJAU & PRINT FORMULIR RESMI F-KMB-BMP-BSIB-001-003 ── */}
      {selectedReportForPrint && (
        <div className="print-modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 99999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem',
          overflowY: 'auto'
        }}>
          {/* Action Bar Modal */}
          <div className="no-print" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', width: '100%', maxWidth: '210mm', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#ffffff', fontWeight: 'bold' }}>Pratinjau Formulir Laporan Perbaikan Resmi</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" onClick={handlePrint} style={{ height: '36px' }}>
                <Printer size={18} /> Cetak / Download PDF
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedReportForPrint(null)} style={{ height: '36px' }}>
                <X size={18} /> Tutup
              </button>
            </div>
          </div>

          {/* Halaman Kertas A4 Formulir Resmi */}
          <div className="printable-form-page" style={{
            backgroundColor: '#ffffff', color: '#000000', width: '210mm', minHeight: '297mm',
            padding: '12mm 15mm', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif', fontSize: '10pt',
            boxShadow: '0 5px 25px rgba(0,0,0,0.5)', lineHeight: '1.4'
          }}>
            
            {/* Header Table Logo & Document Title */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '10px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '25%', borderRight: '1px solid #000', padding: '8px', textAlign: 'center', verticalAlign: 'middle' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14pt', color: '#1a365d', fontStyle: 'italic' }}>mnk | bme</div>
                  </td>
                  <td style={{ width: '75%', textAlign: 'center', padding: '4px', verticalAlign: 'middle' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>FORMULIR</div>
                    <div style={{ fontSize: '9pt', fontStyle: 'italic', textDecoration: 'underline' }}>FORM</div>
                    <div style={{ fontWeight: 'bold', fontSize: '11pt', marginTop: '2px' }}>LAPORAN KEGIATAN PERBAIKAN</div>
                    <div style={{ fontSize: '9pt', fontStyle: 'italic', fontWeight: 'bold', color: '#0056b3' }}>REPAIR ACTIVITY REPORT</div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Sub-header Document Meta */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '8.5pt', marginBottom: '12px' }}>
              <tbody>
                <tr>
                  <td style={{ borderRight: '1px solid #000', padding: '3px 6px', width: '40%' }}>
                    No. Dokumen / <i>Document No.</i> : F-KMB-BMP-BSIB-001-003
                  </td>
                  <td style={{ borderRight: '1px solid #000', padding: '3px 6px', width: '25%' }}>
                    Revisi / <i>Revision</i> : 02
                  </td>
                  <td style={{ padding: '3px 6px', width: '35%' }}>
                    Tanggal Efektif / <i>Effective Date</i> : 30/03/2026
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Option Radio Header: PLANT / UNIT / ETC + NOMOR LAPORAN */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 5px' }}>
              <div style={{ display: 'flex', gap: '25px', fontSize: '10pt', fontWeight: 'bold' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', border: '1.5px solid #000', backgroundColor: selectedReportForPrint.kategoriForm === 'PLANT' ? '#000' : 'transparent' }}></span>
                  PLANT
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', border: '1.5px solid #000', backgroundColor: selectedReportForPrint.kategoriForm === 'UNIT' ? '#000' : 'transparent' }}></span>
                  UNIT
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', border: '1.5px solid #000', backgroundColor: selectedReportForPrint.kategoriForm === 'ETC' ? '#000' : 'transparent' }}></span>
                  ETC
                </div>
              </div>

              <div style={{ fontSize: '10.5pt', fontWeight: 'bold' }}>
                No. {selectedReportForPrint.nomorLaporan}
              </div>
            </div>

            {/* Job No, Item No, Tanggal */}
            <table style={{ width: '100%', marginBottom: '12px', fontSize: '9.5pt' }}>
              <tbody>
                <tr>
                  <td style={{ width: '33%' }}>Job No : <u>{selectedReportForPrint.jobNo || '__________'}</u></td>
                  <td style={{ width: '33%', textAlign: 'center' }}>Item No. : <u>{selectedReportForPrint.itemNo || '__________'}</u></td>
                  <td style={{ width: '33%', textAlign: 'right' }}>Tanggal / <i>Date</i> : <u>{selectedReportForPrint.reportDate}</u></td>
                </tr>
              </tbody>
            </table>

            {/* 1. Indikasi / Masalah */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10pt' }}>
                Indikasi / Masalah :
              </div>
              <div style={{ fontStyle: 'italic', color: '#0056b3', fontSize: '9pt', marginBottom: '4px' }}>
                Indication/Problem:
              </div>
              <div style={{ borderBottom: '1px dotted #888', minHeight: '45px', padding: '4px 0', fontSize: '9.5pt', whiteSpace: 'pre-wrap' }}>
                {selectedReportForPrint.indikasiMasalah || '-'}
              </div>
            </div>

            {/* 2. Pemeriksaan Awal */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10pt' }}>
                Pemeriksaan Awal :
              </div>
              <div style={{ fontStyle: 'italic', color: '#0056b3', fontSize: '9pt', marginBottom: '4px' }}>
                Initial Checking:
              </div>
              <div style={{ borderBottom: '1px dotted #888', minHeight: '45px', padding: '4px 0', fontSize: '9.5pt', whiteSpace: 'pre-wrap' }}>
                {selectedReportForPrint.pemeriksaanAwal || '-'}
              </div>
            </div>

            {/* 3. Perbaikan */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10pt' }}>
                Perbaikan :
              </div>
              <div style={{ fontStyle: 'italic', color: '#0056b3', fontSize: '9pt', marginBottom: '4px' }}>
                Repair:
              </div>
              <div style={{ borderBottom: '1px dotted #888', minHeight: '55px', padding: '4px 0', fontSize: '9.5pt', whiteSpace: 'pre-wrap' }}>
                {selectedReportForPrint.perbaikan || '-'}
              </div>
            </div>

            {/* Status */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10pt', display: 'inline-block', marginRight: '8px' }}>
                Status :
              </div>
              <span style={{ fontSize: '10pt', fontWeight: 'bold', textDecoration: 'underline' }}>
                {selectedReportForPrint.statusPerbaikan}
              </span>
            </div>

            {/* 4. Pemakaian Material / Spare Parts */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10pt' }}>
                Pemakaian Material / Spare Parts
              </div>
              <div style={{ fontStyle: 'italic', color: '#0056b3', fontSize: '9pt', marginBottom: '6px' }}>
                Material / Spare Parts Usage
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '9pt' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0', textAlign: 'center' }}>
                    <th style={{ border: '1px solid #000', padding: '4px', width: '35px' }}>No.</th>
                    <th style={{ border: '1px solid #000', padding: '4px' }}>Nama Parts / <i>Parts Name</i></th>
                    <th style={{ border: '1px solid #000', padding: '4px', width: '80px' }}>Jml / <i>Quantity</i></th>
                    <th style={{ border: '1px solid #000', padding: '4px', width: '200px' }}>Keterangan / <i>Description</i></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReportForPrint.spareParts && selectedReportForPrint.spareParts.length > 0 ? (
                    selectedReportForPrint.spareParts.map((sp, idx) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #000', padding: '4px' }}>{sp.partName}</td>
                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>
                          {sp.qty} {sp.unit || 'Pcs'}
                        </td>
                        <td style={{ border: '1px solid #000', padding: '4px' }}>{sp.keterangan || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #000', padding: '4px' }}>&nbsp;</td>
                        <td style={{ border: '1px solid #000', padding: '4px' }}>&nbsp;</td>
                        <td style={{ border: '1px solid #000', padding: '4px' }}>&nbsp;</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Signature Area Footer */}
            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between', fontSize: '9.5pt' }}>
              
              <div style={{ width: '40%', textAlign: 'center' }}>
                <div>Dilaporkan oleh,</div>
                <div style={{ fontStyle: 'italic', color: '#0056b3', fontSize: '8.5pt' }}>Reported by,</div>
                <div style={{ height: '55px' }}></div>
                <div style={{ borderTop: '1px solid #000', display: 'inline-block', width: '160px', paddingTop: '2px', fontWeight: 'bold' }}>
                  {selectedReportForPrint.teknisi || 'Teknisi'}
                </div>
                <div style={{ fontSize: '8.5pt' }}>Teknisi / <i>Technician</i></div>
              </div>

              <div style={{ width: '20%', textAlign: 'center', verticalAlign: 'bottom', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <div style={{ fontSize: '9pt' }}>{selectedReportForPrint.lokasi ? `${selectedReportForPrint.lokasi},` : '____________,'} ____________</div>
              </div>

              <div style={{ width: '40%', textAlign: 'center' }}>
                <div>Mengetahui,</div>
                <div style={{ fontStyle: 'italic', color: '#0056b3', fontSize: '8.5pt' }}>Acknowledge,</div>
                <div style={{ height: '55px' }}></div>
                <div style={{ borderTop: '1px solid #000', display: 'inline-block', width: '160px', paddingTop: '2px', fontWeight: 'bold' }}>
                  {selectedReportForPrint.supervisor || '________________'}
                </div>
                <div style={{ fontSize: '8.5pt' }}>Sup'v. Mek./ Elec./ Inst.</div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
