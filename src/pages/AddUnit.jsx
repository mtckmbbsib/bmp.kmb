import { useState, useEffect } from 'react';
import { PlusCircle, Truck, Hash, Settings, CheckCircle2, AlertCircle, Wrench, Tag, Gauge, List, Edit, Trash2, X, Save, Calendar, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SearchableSelect from '../components/SearchableSelect';
import { showConfirm, showSuccess, showWarning, showError } from '../components/UniversalDialog';


const CustomCombobox = ({ icon: Icon, placeholder, value, setValue, options, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const filtered = options.filter(opt => opt.toLowerCase().includes(value.toLowerCase()));

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <Icon size={16} style={{ position: 'absolute', left: '0.75rem', color: 'var(--color-silver-dark)', zIndex: 1 }} />
      <input 
        type="text" 
        className="input-field" 
        style={{ width: '100%', paddingLeft: '2.4rem', height: '38px', fontSize: '0.825rem' }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          setIsFocused(true);
          setIsOpen(true);
        }}
        onBlur={() => {
          setIsFocused(false);
          setTimeout(() => setIsOpen(false), 200);
        }}
        required={required}
      />
      {isOpen && isFocused && filtered.length > 0 && (
        <div className="hide-scrollbar" style={{ 
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          right: 0, 
          backgroundColor: 'var(--color-bg-card)', 
          border: '1px solid var(--color-border)', 
          borderRadius: 'var(--border-radius-md)', 
          marginTop: '0.25rem', 
          zIndex: 10,
          maxHeight: '200px',
          overflowY: 'auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}>
          {filtered.map((opt, i) => (
            <div 
              key={i} 
              style={{ padding: '0.75rem 1rem', cursor: 'pointer', transition: 'background-color 0.2s', color: 'var(--color-text-primary)' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,193,7,0.1)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              onMouseDown={(e) => {
                e.preventDefault(); // Mencegah input kehilangan fokus terlalu cepat
                setValue(opt);
                setIsOpen(false);
                setIsFocused(false);
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const KATEGORI_JENIS_MAP = {
  'Sarana': ['Anfo Truck', 'MMU Truck', 'Crane Truck', 'Dump Truck', 'Forklift', 'LV / Minibus'],
  'Prasarana': ['Gedung Workshop', 'Gedung Office', 'Gudang Handak', 'Area Washbay'],
  'Instalasi': ['Instalasi Listrik Utama', 'Instalasi Air / Pipa', 'Instalasi Pompa Fuel', 'Panel Distribusi'],
  'Peralatan': ['Genset', 'Compressor', 'Welding Machine / Mesin Las', 'Lighting Tower'],
};

export default function AddUnit() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userSite = (user?.site || user?.lokasi || '').toLowerCase();
  const isBalikpapan = userSite === 'balikpapan' || userSite.includes('balikpapan');

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeTab, setActiveTab] = useState(isBalikpapan ? 'list' : 'add');
  const [units, setUnits] = useState([]);

  const [kategori, setKategori] = useState('Sarana');
  const [jenisUnit, setJenisUnit] = useState('');
  const [merk, setMerk] = useState('');
  const [tipe, setTipe] = useState('');
  const [noLambung, setNoLambung] = useState('');
  const [hmkm, setHmkm] = useState('');
  const [status, setStatus] = useState('Unit Aktif');
  const [nextService, setNextService] = useState('');
  const [nextServiceType, setNextServiceType] = useState('HM/KM');
  const [nextBrakeTest, setNextBrakeTest] = useState('');
  const [nextCommissioning, setNextCommissioning] = useState('');
  const [nextSertifikasi, setNextSertifikasi] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);

  // Edit Form State
  const [editForm, setEditForm] = useState({});

  const availableJenisOptions = KATEGORI_JENIS_MAP[kategori] || [];
  const existingJenisUnits = Array.from(new Set(units.filter(u => u.kategori === kategori).map(u => u.jenisUnit).filter(Boolean)));
  const combinedJenisOptions = Array.from(new Set([...availableJenisOptions, ...existingJenisUnits]));
  
  const defaultMerk = Array.from(new Set(units.map(u => u.merk).filter(Boolean)));
  const defaultTipe = Array.from(new Set(units.map(u => u.tipe).filter(Boolean)));

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    fetchUnits();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase.from('units').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        const mapped = data.map(u => ({
          id: u.id,
          kategori: u.kategori || 'Sarana',
          jenisUnit: u.jenis_unit || u.jenisUnit,
          merk: u.merk || '',
          tipe: u.tipe || '',
          noLambung: u.no_lambung || u.noLambung,
          hmkm: u.hm_km || u.hmkm || 0,
          status: u.status || 'Unit Aktif',
          nextService: u.next_service || '-',
          nextBrakeTest: u.next_brake_test || 'NA',
          nextCommissioning: u.next_commissioning || 'NA',
          nextSertifikasi: u.next_sertifikasi || 'NA'
        }));

        mapped.sort((a, b) => {
          const jenisA = (a.jenisUnit || '').toLowerCase();
          const jenisB = (b.jenisUnit || '').toLowerCase();
          if (jenisA < jenisB) return -1;
          if (jenisA > jenisB) return 1;
          
          const lambungA = (a.noLambung || '').toLowerCase();
          const lambungB = (b.noLambung || '').toLowerCase();
          if (lambungA < lambungB) return -1;
          if (lambungA > lambungB) return 1;
          return 0;
        });

        setUnits(mapped);
      }
    } catch (err) {
      console.warn('Fetch units error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isBalikpapan) {
      alert('Akun Balikpapan hanya memiliki akses monitoring (Read Only) dan tidak dapat menambah/mengubah data.');
      return;
    }
    setLoading(true);
    setMessage(null);

    const finalBrakeTest = nextBrakeTest ? nextBrakeTest : 'NA';
    const finalCommissioning = nextCommissioning ? nextCommissioning : 'NA';
    const finalSertifikasi = nextSertifikasi ? nextSertifikasi : 'NA';

    try {
      // First try standard payload
      let insertPayload = { 
        kategori: kategori,
        jenis_unit: jenisUnit, 
        merk: merk, 
        tipe: tipe, 
        no_lambung: noLambung, 
        hm_km: Number(hmkm) || 0, 
        status: status,
        next_service: nextService || null,
        next_brake_test: finalBrakeTest,
        next_commissioning: finalCommissioning,
        next_sertifikasi: finalSertifikasi
      };

      let { data, error } = await supabase
        .from('units')
        .insert([insertPayload])
        .select();

      // If column mismatch error occurs (e.g. hm_km vs hmkm or no_lambung vs noLambung)
      if (error && error.code === 'PGRST204') {
        console.warn('Retrying with alternative column naming (camelCase fallback)...');
        const altPayload = {
          kategori: kategori,
          jenisUnit: jenisUnit,
          merk: merk,
          tipe: tipe,
          noLambung: noLambung,
          hmkm: Number(hmkm) || 0,
          status: status,
          nextService: nextService || null,
          nextBrakeTest: finalBrakeTest,
          nextCommissioning: finalCommissioning,
          nextSertifikasi: finalSertifikasi
        };
        const altResult = await supabase.from('units').insert([altPayload]).select();
        error = altResult.error;
        data = altResult.data;
      }

      if (error) throw error;

      setMessage(`SPIP ${noLambung} (${kategori}) berhasil ditambahkan ke Database!`);
      setIsError(false);
      setKategori('Sarana');
      setJenisUnit('');
      setMerk('');
      setTipe('');
      setNoLambung('');
      setHmkm('');
      setStatus('Unit Aktif');
      setNextService('');
      setNextServiceType('HM/KM');
      setNextBrakeTest('');
      setNextCommissioning('');
      setNextSertifikasi('');
      fetchUnits();
    } catch (err) {
      console.error('Supabase Error:', err);
      // Fallback local save if Supabase offline/columns missing
      const newUnit = {
        id: Date.now().toString(),
        kategori,
        jenisUnit,
        merk,
        tipe,
        noLambung,
        hmkm,
        status,
        nextService: nextService || '-',
        nextBrakeTest: finalBrakeTest,
        nextCommissioning: finalCommissioning,
        nextSertifikasi: finalSertifikasi
      };
      setUnits(prev => [newUnit, ...prev]);
      setMessage(`SPIP ${noLambung} berhasil ditambahkan (Lokal)! Catatan Supabase: ${err.message || 'Cek koneksi'}`);
      setIsError(false);
      setJenisUnit('');
      setMerk('');
      setTipe('');
      setNoLambung('');
      setHmkm('');
      setNextService('');
      setNextServiceType('HM/KM');
      setNextBrakeTest('');
      setNextCommissioning('');
      setNextSertifikasi('');
    } finally {
      setLoading(false);
    }
  };

  // State Filter Kategori untuk Daftar SPIP
  const [selectedListCategory, setSelectedListCategory] = useState('All');
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saveEditLoading, setSaveEditLoading] = useState(false);

  const handleDelete = async (id, noLambung) => {
    if (isBalikpapan) {
      await showWarning('Akun Balikpapan hanya memiliki akses monitoring (Read Only).');
      return;
    }
    const ok = await showConfirm(`Apakah Anda yakin ingin menghapus unit/SPIP "${noLambung || id}"?`, 'Konfirmasi Hapus');
    if (ok) {
      try {
        const { error } = await supabase.from('units').delete().eq('id', id);
        if (error) throw error;
        await fetchUnits();
        await showSuccess(`Unit "${noLambung || id}" berhasil dihapus.`);
      } catch (err) {
        console.warn('Delete error:', err);
        setUnits(prev => prev.filter(u => u.id !== id));
        await showSuccess(`Unit "${noLambung || id}" berhasil dihapus.`);
      }
    }
  };

  const handleEditClick = async (unit) => {
    if (isBalikpapan) {
      await showWarning('Akun Balikpapan hanya memiliki akses monitoring (Read Only).');
      return;
    }
    const rawSvc = (unit.nextService && unit.nextService !== '-') ? String(unit.nextService) : '';
    const isMonthService = rawSvc.includes('-') && rawSvc.length >= 7;
    setEditForm({
      ...unit,
      originalNoLambung: unit.noLambung,
      nextService: rawSvc,
      nextServiceType: isMonthService ? 'Bulan' : 'HM/KM',
      nextBrakeTest: (!unit.nextBrakeTest || unit.nextBrakeTest === 'NA') ? '' : unit.nextBrakeTest,
      nextCommissioning: (!unit.nextCommissioning || unit.nextCommissioning === 'NA') ? '' : unit.nextCommissioning,
      nextSertifikasi: (!unit.nextSertifikasi || unit.nextSertifikasi === 'NA') ? '' : unit.nextSertifikasi
    });
    setEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setEditForm({});
  };

  const handleEditSaveModal = async (e) => {
    e.preventDefault();
    setSaveEditLoading(true);

    const trimmedLambung = (editForm.noLambung || '').trim();
    if (!trimmedLambung) {
      await showWarning('No Lambung (ID Unit) tidak boleh kosong.');
      setSaveEditLoading(false);
      return;
    }

    const finalBrakeTest = editForm.nextBrakeTest && editForm.nextBrakeTest.trim() ? editForm.nextBrakeTest.trim() : 'NA';
    const finalCommissioning = editForm.nextCommissioning && editForm.nextCommissioning.trim() ? editForm.nextCommissioning.trim() : 'NA';
    const finalSertifikasi = editForm.nextSertifikasi && editForm.nextSertifikasi.trim() ? editForm.nextSertifikasi.trim() : 'NA';
    const finalNextService = editForm.nextService && editForm.nextService.trim() ? editForm.nextService.trim() : null;

    try {
      let updatePayload = {
        kategori: editForm.kategori || 'Sarana',
        jenis_unit: (editForm.jenisUnit || '').trim(),
        merk: (editForm.merk || '').trim(),
        tipe: (editForm.tipe || '').trim(),
        no_lambung: trimmedLambung,
        hm_km: Number(editForm.hmkm) || 0,
        status: editForm.status || 'Unit Aktif',
        next_service: finalNextService,
        next_brake_test: finalBrakeTest,
        next_commissioning: finalCommissioning,
        next_sertifikasi: finalSertifikasi
      };

      let { error } = await supabase.from('units').update(updatePayload).eq('id', editForm.id);

      if (error && error.code === 'PGRST204') {
        const altPayload = {
          kategori: editForm.kategori || 'Sarana',
          jenisUnit: (editForm.jenisUnit || '').trim(),
          merk: (editForm.merk || '').trim(),
          tipe: (editForm.tipe || '').trim(),
          noLambung: trimmedLambung,
          hmkm: Number(editForm.hmkm) || 0,
          status: editForm.status || 'Unit Aktif',
          nextService: finalNextService,
          nextBrakeTest: finalBrakeTest,
          nextCommissioning: finalCommissioning,
          nextSertifikasi: finalSertifikasi
        };
        const altResult = await supabase.from('units').update(altPayload).eq('id', editForm.id);
        error = altResult.error;
      }

      if (error) {
        throw error;
      }

      // If no_lambung changed and was not a placeholder dash, cascade update related records in other tables
      const oldLambung = editForm.originalNoLambung;
      if (oldLambung && oldLambung !== trimmedLambung && oldLambung !== '-') {
        try {
          await Promise.allSettled([
            supabase.from('weekly_reports').update({ no_lambung: trimmedLambung }).eq('no_lambung', oldLambung),
            supabase.from('pm_reports').update({ no_lambung: trimmedLambung }).eq('no_lambung', oldLambung),
            supabase.from('p2h_reports').update({ no_lambung: trimmedLambung }).eq('no_lambung', oldLambung),
            supabase.from('work_orders').update({ no_lambung: trimmedLambung }).eq('no_lambung', oldLambung),
            supabase.from('timesheet_reports').update({ unit_number: trimmedLambung }).eq('unit_number', oldLambung)
          ]);
        } catch (cascadeErr) {
          console.warn('Cascade update warning:', cascadeErr);
        }
      }

      await fetchUnits();
      setEditModalOpen(false);
      setEditForm({});
      await showSuccess(`Data SPIP ${trimmedLambung} berhasil diperbarui di Database!`, 'Sukses');
    } catch (err) {
      console.error('Update unit error:', err);
      // Fallback local update if Supabase fails
      const updatedUnitObj = {
        ...editForm,
        noLambung: trimmedLambung,
        nextService: finalNextService || '-',
        nextBrakeTest: finalBrakeTest,
        nextCommissioning: finalCommissioning,
        nextSertifikasi: finalSertifikasi
      };
      setUnits(prev => prev.map(u => u.id === editForm.id ? updatedUnitObj : u));
      setEditModalOpen(false);
      setEditForm({});
      await showWarning(`Gagal menyimpan ke server database: ${err.message || 'Cek koneksi'}. Perubahan hanya berlaku sementara secara lokal.`);
    } finally {
      setSaveEditLoading(false);
    }
  };

  const filteredListUnits = units.filter(u => {
    const matchCat = selectedListCategory === 'All' || (u.kategori || 'Sarana') === selectedListCategory;
    const matchSearch = !listSearchQuery || 
      (u.noLambung || '').toLowerCase().includes(listSearchQuery.toLowerCase()) ||
      (u.jenisUnit || '').toLowerCase().includes(listSearchQuery.toLowerCase()) ||
      (u.merk || '').toLowerCase().includes(listSearchQuery.toLowerCase()) ||
      (u.tipe || '').toLowerCase().includes(listSearchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const categoryCounts = {
    All: units.length,
    Sarana: units.filter(u => (u.kategori || 'Sarana') === 'Sarana').length,
    Prasarana: units.filter(u => u.kategori === 'Prasarana').length,
    Instalasi: units.filter(u => u.kategori === 'Instalasi').length,
    Peralatan: units.filter(u => u.kategori === 'Peralatan').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="no-print" style={{ flexShrink: 0, marginBottom: '0.65rem' }}>
        <h1 className="mb-1" style={{ textAlign: 'center', fontSize: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <Settings size={20} style={{ color: 'var(--color-yellow-primary)' }} />
          Manajemen SPIP
        </h1>
        <p style={{ textAlign: 'center', fontSize: '0.725rem', color: 'var(--color-silver)', marginBottom: '0.5rem' }}>
          Pencatatan Sarana, Prasarana, Instalasi, & Peralatan (SPIP)
        </p>
        {/* Universal Segmented Tab Pills */}
        <div className="tab-pill-container">
          <button 
            type="button"
            className={`tab-pill-btn ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')} 
          >
            <PlusCircle size={14} />
            <span>Tambah SPIP</span>
          </button>

          <button 
            type="button"
            className={`tab-pill-btn ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')} 
          >
            <List size={14} />
            <span>Daftar SPIP ({units.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'add' && (
        <div className="card hide-scrollbar" style={{ flex: 1, overflowY: 'auto', width: '100%', margin: '0 auto', padding: isMobile ? '1rem 1rem 85px 1rem' : '1.25rem' }}>
          <p className="text-silver mb-3" style={{ textAlign: 'center', fontSize: '0.75rem' }}>Masukkan detail sarana, prasarana, instalasi, atau peralatan (SPIP) baru ke dalam sistem.</p>
          
          {message && (
            <div className="mb-3" style={{ 
              padding: '0.65rem 0.85rem', 
              borderRadius: 'var(--border-radius-md)', 
              backgroundColor: isError ? 'rgba(248, 81, 73, 0.12)' : 'rgba(63, 185, 80, 0.12)',
              border: `1px solid ${isError ? 'rgba(248, 81, 73, 0.3)' : 'rgba(63, 185, 80, 0.3)'}`,
              color: isError ? '#ff7b72' : '#7ee787',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.8rem'
            }}>
              {isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            
            {/* ── BAGIAN 1: IDENTITAS & KLASIFIKASI SPIP ── */}
            <div style={{
              background: 'rgba(25, 29, 34, 0.6)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '0.85rem 1rem'
            }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 'bold', color: 'var(--color-yellow-primary)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.4rem' }}>
                <Settings size={15} /> 1. Identitas & Klasifikasi SPIP
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem' }}>
                
                {/* Kategori SPIP */}
                <div className="input-group mb-0">
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-silver)' }}>Kategori SPIP *</label>
                  <SearchableSelect 
                    style={{ height: '38px', fontSize: '0.825rem' }}
                    value={kategori}
                    onChange={(e) => {
                      setKategori(e.target.value);
                      setJenisUnit('');
                    }}
                    required
                  >
                    <option value="Sarana">🚜 Sarana (Kendaraan Bergerak)</option>
                    <option value="Prasarana">🏢 Prasarana (Bangunan / Workshop)</option>
                    <option value="Instalasi">⚡ Instalasi (Listrik / Pipa)</option>
                    <option value="Peralatan">🔧 Peralatan (Genset / Mesin)</option>
                  </SearchableSelect>
                </div>
                
                {/* Jenis Unit */}
                <div className="input-group mb-0">
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-silver)' }}>Jenis Unit / Item ({kategori}) *</label>
                  <CustomCombobox 
                    icon={Truck} 
                    placeholder={`Ketik jenis ${kategori.toLowerCase()}...`}
                    value={jenisUnit} 
                    setValue={setJenisUnit} 
                    options={combinedJenisOptions} 
                    required 
                  />
                </div>

                {/* Merk */}
                <div className="input-group mb-0">
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-silver)' }}>Merk *</label>
                  <CustomCombobox 
                    icon={Tag} 
                    placeholder="Pilih atau ketik merk..." 
                    value={merk} 
                    setValue={setMerk} 
                    options={defaultMerk} 
                    required 
                  />
                </div>

                {/* Tipe */}
                <div className="input-group mb-0">
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-silver)' }}>Tipe / Model *</label>
                  <CustomCombobox 
                    icon={Wrench} 
                    placeholder="Pilih atau ketik tipe..." 
                    value={tipe} 
                    setValue={setTipe} 
                    options={defaultTipe} 
                    required 
                  />
                </div>

                {/* No Lambung */}
                <div className="input-group mb-0">
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-silver)' }}>No Lambung (ID Unit) *</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Hash size={16} style={{ position: 'absolute', left: '0.75rem', color: 'var(--color-silver-dark)' }} />
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ width: '100%', paddingLeft: '2.4rem', height: '38px', fontSize: '0.825rem' }}
                      placeholder="Contoh: MMU-01, LV-02..."
                      value={noLambung}
                      onChange={(e) => setNoLambung(e.target.value.toUpperCase())}
                      required
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* ── BAGIAN 2: STATUS OPERASIONAL & PERAWATAN ── */}
            <div style={{
              background: 'rgba(25, 29, 34, 0.6)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '0.85rem 1rem'
            }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 'bold', color: 'var(--color-yellow-primary)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.4rem' }}>
                <Gauge size={15} /> 2. Status Operasional & Jadwal Servis
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
                
                {/* Initial HM / KM */}
                <div className="input-group mb-0">
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-silver)' }}>Initial HM / KM Terkini *</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Gauge size={16} style={{ position: 'absolute', left: '0.75rem', color: 'var(--color-silver-dark)' }} />
                    <input 
                      type="number" 
                      step="0.1"
                      className="input-field" 
                      style={{ width: '100%', paddingLeft: '2.4rem', height: '38px', fontSize: '0.825rem' }}
                      placeholder="0"
                      value={hmkm}
                      onChange={(e) => setHmkm(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Status Awal */}
                <div className="input-group mb-0">
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-silver)' }}>Status Operasional *</label>
                  <SearchableSelect 
                    style={{ height: '38px', fontSize: '0.825rem' }}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="Unit Aktif">🟢 Unit Aktif & Ready</option>
                    <option value="Dalam Perbaikan">🔴 Dalam Perbaikan (Breakdown)</option>
                  </SearchableSelect>
                </div>

                {/* Jadwal Service Berikutnya */}
                <div className="input-group mb-0">
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-silver)' }}>Jadwal PM Service Berikutnya</label>
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <SearchableSelect 
                      style={{ width: '85px', height: '38px', fontSize: '0.8rem', flexShrink: 0 }}
                      value={nextServiceType}
                      onChange={(e) => {
                        setNextServiceType(e.target.value);
                        setNextService('');
                      }}
                    >
                      <option value="HM/KM">HM</option>
                      <option value="Bulan">Bulan</option>
                    </SearchableSelect>
                    <input 
                      type={nextServiceType === 'Bulan' ? "month" : "number"}
                      className="input-field" 
                      style={{ flex: 1, colorScheme: 'dark', height: '38px', fontSize: '0.825rem' }}
                      placeholder={nextServiceType === 'Bulan' ? "Pilih bulan" : "Target HM"}
                      value={nextService}
                      onChange={(e) => setNextService(e.target.value)}
                      onClick={(e) => nextServiceType === 'Bulan' && e.target.showPicker && e.target.showPicker()}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* ── BAGIAN 3: JADWAL KEPATUHAN & TANGGAL UJI (3 Kolom Simetris) ── */}
            <div style={{
              background: 'rgba(25, 29, 34, 0.6)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '0.85rem 1rem'
            }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 'bold', color: 'var(--color-yellow-primary)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.4rem' }}>
                <ShieldCheck size={15} /> 3. Jadwal Kepatuhan Uji & Sertifikasi (Opsional)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '0.65rem' }}>
                
                {/* Next Brake Test */}
                <div className="input-group mb-0">
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-silver)' }}>🛑 Next Brake Test</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <AlertCircle size={16} style={{ position: 'absolute', left: '0.75rem', color: '#ffb74d' }} />
                    <input 
                      type="date" 
                      className="input-field" 
                      style={{ width: '100%', paddingLeft: '2.4rem', colorScheme: 'dark', height: '38px', fontSize: '0.825rem' }}
                      value={nextBrakeTest}
                      onChange={(e) => setNextBrakeTest(e.target.value)}
                      onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    />
                  </div>
                </div>

                {/* Next Commissioning */}
                <div className="input-group mb-0">
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-silver)' }}>📋 Next Commissioning</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Calendar size={16} style={{ position: 'absolute', left: '0.75rem', color: '#58a6ff' }} />
                    <input 
                      type="date" 
                      className="input-field" 
                      style={{ width: '100%', paddingLeft: '2.4rem', colorScheme: 'dark', height: '38px', fontSize: '0.825rem' }}
                      value={nextCommissioning}
                      onChange={(e) => setNextCommissioning(e.target.value)}
                      onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    />
                  </div>
                </div>

                {/* Next Sertifikasi */}
                <div className="input-group mb-0">
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-silver)' }}>🛡️ Next Sertifikasi</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <ShieldCheck size={16} style={{ position: 'absolute', left: '0.75rem', color: '#7ee787' }} />
                    <input 
                      type="date" 
                      className="input-field" 
                      style={{ width: '100%', paddingLeft: '2.4rem', colorScheme: 'dark', height: '38px', fontSize: '0.825rem' }}
                      value={nextSertifikasi}
                      onChange={(e) => setNextSertifikasi(e.target.value)}
                      onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    />
                  </div>
                </div>

              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', height: '40px', fontSize: '0.85rem', fontWeight: '700', marginTop: '0.25rem' }}
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : (
                <>
                  <PlusCircle size={18} />
                  <span>Simpan SPIP Baru</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', margin: '0 auto', width: '100%', padding: isMobile ? '0.75rem 0.75rem 85px 0.75rem' : '1rem' }}>
          
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.2rem' }} className="hide-scrollbar">
              {[
                { key: 'All', label: 'Semua SPIP', icon: '📦' },
                { key: 'Sarana', label: 'Sarana', icon: '🚜' },
                { key: 'Prasarana', label: 'Prasarana', icon: '🏢' },
                { key: 'Instalasi', label: 'Instalasi', icon: '⚡' },
                { key: 'Peralatan', label: 'Peralatan', icon: '🔧' },
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedListCategory(tab.key)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    border: selectedListCategory === tab.key ? '1px solid var(--color-yellow-primary)' : '1px solid var(--color-border)',
                    background: selectedListCategory === tab.key ? 'rgba(229, 165, 10, 0.18)' : 'var(--color-bg-main)',
                    color: selectedListCategory === tab.key ? 'var(--color-yellow-primary)' : 'var(--color-silver)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span style={{ 
                    fontSize: '0.65rem', 
                    padding: '0.05rem 0.35rem', 
                    borderRadius: '10px', 
                    background: selectedListCategory === tab.key ? 'var(--color-yellow-primary)' : 'var(--color-bg-card)',
                    color: selectedListCategory === tab.key ? '#0a0c10' : 'var(--color-silver)'
                  }}>
                    {categoryCounts[tab.key]}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', minWidth: isMobile ? '100%' : '220px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Cari No Lambung / Merk..."
                value={listSearchQuery}
                onChange={(e) => setListSearchQuery(e.target.value)}
                style={{ width: '100%', fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }} className="hide-scrollbar">
            {filteredListUnits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-silver-dark)' }}>
                <Truck size={40} style={{ margin: '0 auto', marginBottom: '0.75rem', opacity: 0.4 }} />
                <p style={{ fontSize: '0.85rem' }}>Tidak ada item pada kategori ini.</p>
              </div>
            ) : isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredListUnits.map(unit => (
                  <div 
                    key={unit.id} 
                    style={{
                      padding: '0.7rem',
                      background: 'var(--color-bg-main)',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      borderLeft: `4px solid ${unit.status === 'Unit Aktif' ? 'var(--color-yellow-primary)' : 'var(--color-danger)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--color-yellow-primary)', fontSize: '0.9rem' }}>{unit.noLambung}</span>
                        <span style={{ fontSize: '0.675rem', color: '#ffd54f', background: 'rgba(229,165,10,0.12)', border: '1px solid rgba(229,165,10,0.25)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                          {unit.kategori || 'Sarana'}
                        </span>
                      </div>
                      <span style={{ 
                        padding: '0.1rem 0.4rem', 
                        borderRadius: '4px', 
                        fontSize: '0.675rem', 
                        fontWeight: '600',
                        backgroundColor: unit.status === 'Unit Aktif' ? 'rgba(63, 185, 80, 0.15)' : 'rgba(248, 81, 73, 0.15)',
                        color: unit.status === 'Unit Aktif' ? '#7ee787' : '#ff7b72',
                        border: `1px solid ${unit.status === 'Unit Aktif' ? 'rgba(63, 185, 80, 0.3)' : 'rgba(248, 81, 73, 0.3)'}`
                      }}>
                        {unit.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#ffffff', fontWeight: '500' }}>
                      {unit.jenisUnit} <span style={{ color: 'var(--color-silver)', fontWeight: 'normal', fontSize: '0.725rem' }}>({unit.merk} {unit.tipe ? `- ${unit.tipe}` : ''})</span>
                    </div>

                    <div style={{ fontSize: '0.725rem', color: 'var(--color-silver)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', marginTop: '0.15rem', paddingTop: '0.35rem', borderTop: '1px dashed var(--color-border)' }}>
                      <div>HM/KM: <strong style={{ color: '#ffffff' }}>{unit.hmkm}</strong></div>
                      <div>Svc: <strong style={{ color: '#ffffff' }}>{unit.nextService || '-'}</strong></div>
                      <div>Brake: <strong style={{ color: '#ffffff' }}>{unit.nextBrakeTest || 'NA'}</strong></div>
                      <div>Comm: <strong style={{ color: '#ffffff' }}>{unit.nextCommissioning || 'NA'}</strong></div>
                      <div>Sert: <strong style={{ color: '#ffffff' }}>{unit.nextSertifikasi || 'NA'}</strong></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '0.2rem' }}>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.725rem' }} 
                        onClick={() => handleEditClick(unit)}
                      >
                        <Edit size={13} style={{ marginRight: '0.2rem' }} /> Edit / Update
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.725rem', color: '#ff7b72', borderColor: 'rgba(248,81,73,0.3)' }} 
                        onClick={() => handleDelete(unit.id, unit.noLambung)}
                      >
                        <Trash2 size={13} style={{ marginRight: '0.2rem' }} /> Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)' }}>
                    <th style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver)', width: '110px' }}>No Lambung</th>
                    <th style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver)' }}>Detail & Kategori</th>
                    <th style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver)', width: '85px' }}>HM/KM</th>
                    <th style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver)', width: '110px' }}>Status</th>
                    <th style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver)' }}>Jadwal Service & Tanggal Uji</th>
                    <th style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver)', width: '130px', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredListUnits.map(unit => (
                    <tr key={unit.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '0.65rem 0.85rem', fontWeight: 'bold', color: 'var(--color-yellow-primary)' }}>{unit.noLambung}</td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '600', color: '#ffffff' }}>{unit.jenisUnit}</span>
                          <span style={{ padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.7rem', backgroundColor: 'rgba(229, 165, 10, 0.12)', color: '#ffd54f', border: '1px solid rgba(229, 165, 10, 0.25)' }}>
                            {unit.kategori || 'Sarana'}
                          </span>
                        </div>
                        <div className="text-silver" style={{ fontSize: '0.725rem', marginTop: '0.15rem' }}>{unit.merk} {unit.tipe ? `- ${unit.tipe}` : ''}</div>
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', fontWeight: '600' }}>{unit.hmkm}</td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <span style={{ 
                          padding: '0.15rem 0.45rem', 
                          borderRadius: '4px', 
                          fontSize: '0.725rem', 
                          backgroundColor: unit.status === 'Unit Aktif' ? 'rgba(63, 185, 80, 0.15)' : 'rgba(248, 81, 73, 0.15)',
                          color: unit.status === 'Unit Aktif' ? '#7ee787' : '#ff7b72',
                          border: `1px solid ${unit.status === 'Unit Aktif' ? 'rgba(63, 185, 80, 0.3)' : 'rgba(248, 81, 73, 0.3)'}`
                        }}>
                          {unit.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', fontSize: '0.75rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Wrench size={12} className="text-silver" /> <span>Svc: <strong>{unit.nextService || '-'}</strong></span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <AlertCircle size={12} className="text-silver" /> <span>Brake: <strong>{unit.nextBrakeTest || 'NA'}</strong></span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Calendar size={12} className="text-silver" /> <span>Comm: <strong>{unit.nextCommissioning || 'NA'}</strong></span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <ShieldCheck size={12} className="text-silver" /> <span>Sert: <strong>{unit.nextSertifikasi || 'NA'}</strong></span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.725rem' }} 
                            onClick={() => handleEditClick(unit)} 
                            title="Edit & Update Tanggal"
                          >
                            <Edit size={13} style={{ marginRight: '0.2rem' }} /> Edit
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.725rem', color: '#ff7b72', borderColor: 'rgba(248,81,73,0.3)' }} 
                            onClick={() => handleDelete(unit.id, unit.noLambung)} 
                            title="Hapus Unit"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {editModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="card hide-scrollbar" style={{
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.65rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--color-yellow-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Edit size={18} /> Update Data & Tanggal SPIP
                </h3>
                <span style={{ fontSize: '0.725rem', color: 'var(--color-silver)' }}>No Lambung: <strong style={{ color: '#ffffff' }}>{editForm.noLambung}</strong></span>
              </div>
              <button 
                type="button" 
                onClick={handleEditModalClose}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-silver)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSaveModal}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.65rem' }}>
                
                <div className="input-group mb-0">
                  <label>Kategori SPIP</label>
                  <SearchableSelect 
                    className="input-field" 
                    value={editForm.kategori || 'Sarana'} 
                    onChange={(e) => setEditForm({ ...editForm, kategori: e.target.value })}
                  >
                    <option value="Sarana">🚜 Sarana</option>
                    <option value="Prasarana">🏢 Prasarana</option>
                    <option value="Instalasi">⚡ Instalasi</option>
                    <option value="Peralatan">🔧 Peralatan</option>
                  </SearchableSelect>
                </div>

                <div className="input-group mb-0">
                  <label>No Lambung (ID Unit)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={editForm.noLambung || ''} 
                    onChange={(e) => setEditForm({ ...editForm, noLambung: e.target.value.toUpperCase() })} 
                    required 
                  />
                </div>

                <div className="input-group mb-0">
                  <label>Jenis Unit</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    list="edit-jenis-list"
                    value={editForm.jenisUnit || ''} 
                    onChange={(e) => setEditForm({ ...editForm, jenisUnit: e.target.value })} 
                    placeholder="Contoh: Forklift, Genset..."
                    required 
                  />
                  <datalist id="edit-jenis-list">
                    {Array.from(new Set([
                      ...(KATEGORI_JENIS_MAP[editForm.kategori || 'Sarana'] || []),
                      ...units.filter(u => u.kategori === editForm.kategori).map(u => u.jenisUnit).filter(Boolean)
                    ])).map((opt, i) => (
                      <option key={i} value={opt} />
                    ))}
                  </datalist>
                </div>

                <div className="input-group mb-0">
                  <label>Merk</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    list="edit-merk-list"
                    value={editForm.merk || ''} 
                    onChange={(e) => setEditForm({ ...editForm, merk: e.target.value })} 
                    placeholder="Merk unit (opsional)"
                  />
                  <datalist id="edit-merk-list">
                    {defaultMerk.map((m, i) => (
                      <option key={i} value={m} />
                    ))}
                  </datalist>
                </div>

                <div className="input-group mb-0">
                  <label>Tipe</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    list="edit-tipe-list"
                    value={editForm.tipe || ''} 
                    onChange={(e) => setEditForm({ ...editForm, tipe: e.target.value })} 
                    placeholder="Tipe/Model (opsional)"
                  />
                  <datalist id="edit-tipe-list">
                    {defaultTipe.map((t, i) => (
                      <option key={i} value={t} />
                    ))}
                  </datalist>
                </div>

                <div className="input-group mb-0">
                  <label>Current HM / KM</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="input-field" 
                    value={editForm.hmkm !== undefined && editForm.hmkm !== null ? editForm.hmkm : ''} 
                    onChange={(e) => setEditForm({ ...editForm, hmkm: e.target.value })} 
                  />
                </div>

                <div className="input-group mb-0">
                  <label>Status Operasional</label>
                  <SearchableSelect 
                    className="input-field" 
                    value={editForm.status || 'Unit Aktif'} 
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="Unit Aktif">Unit Aktif</option>
                    <option value="Dalam Perbaikan">Dalam Perbaikan</option>
                  </SearchableSelect>
                </div>

                <div className="input-group mb-0">
                  <label>Jadwal Service Berikutnya</label>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <SearchableSelect 
                      className="input-field" 
                      style={{ width: '85px', flexShrink: 0 }} 
                      value={editForm.nextServiceType || 'HM/KM'} 
                      onChange={(e) => setEditForm({ ...editForm, nextServiceType: e.target.value, nextService: '' })}
                    >
                      <option value="HM/KM">HM</option>
                      <option value="Bulan">Bulan</option>
                    </SearchableSelect>
                    <input 
                      type={editForm.nextServiceType === 'Bulan' ? "month" : "number"} 
                      className="input-field" 
                      style={{ flex: 1, colorScheme: 'dark' }} 
                      value={editForm.nextService || ''} 
                      onChange={(e) => setEditForm({ ...editForm, nextService: e.target.value })} 
                      placeholder={editForm.nextServiceType === 'Bulan' ? "Pilih Bulan" : "Target HM/KM"}
                      onClick={(e) => editForm.nextServiceType === 'Bulan' && e.target.showPicker && e.target.showPicker()} 
                    />
                  </div>
                </div>

                <div className="input-group mb-0">
                  <label style={{ color: 'var(--color-yellow-primary)', fontWeight: '600' }}>📅 Next Brake Test</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    style={{ colorScheme: 'dark' }} 
                    value={editForm.nextBrakeTest || ''} 
                    onChange={(e) => setEditForm({ ...editForm, nextBrakeTest: e.target.value })} 
                    onClick={(e) => e.target.showPicker && e.target.showPicker()} 
                  />
                </div>

                <div className="input-group mb-0">
                  <label style={{ color: '#58a6ff', fontWeight: '600' }}>📅 Next Commissioning</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    style={{ colorScheme: 'dark' }} 
                    value={editForm.nextCommissioning || ''} 
                    onChange={(e) => setEditForm({ ...editForm, nextCommissioning: e.target.value })} 
                    onClick={(e) => e.target.showPicker && e.target.showPicker()} 
                  />
                </div>

                <div className="input-group mb-0" style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                  <label style={{ color: '#7ee787', fontWeight: '600' }}>🛡️ Next Sertifikasi</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    style={{ colorScheme: 'dark' }} 
                    value={editForm.nextSertifikasi || ''} 
                    onChange={(e) => setEditForm({ ...editForm, nextSertifikasi: e.target.value })} 
                    onClick={(e) => e.target.showPicker && e.target.showPicker()} 
                  />
                </div>

              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleEditModalClose}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={saveEditLoading}
                >
                  {saveEditLoading ? 'Menyimpan...' : (
                    <>
                      <Save size={16} />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
