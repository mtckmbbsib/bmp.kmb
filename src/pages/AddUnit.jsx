import { useState, useEffect } from 'react';
import { PlusCircle, Truck, Hash, Settings, CheckCircle2, AlertCircle, Wrench, Tag, Gauge, List, Edit, Trash2, X, Save, Calendar, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

const CustomCombobox = ({ icon: Icon, placeholder, value, setValue, options, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const filtered = options.filter(opt => opt.toLowerCase().includes(value.toLowerCase()));

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <Icon size={20} style={{ position: 'absolute', left: '1rem', color: 'var(--color-silver-dark)', zIndex: 1 }} />
      <input 
        type="text" 
        className="input-field" 
        style={{ width: '100%', paddingLeft: '3rem' }}
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeTab, setActiveTab] = useState('add');
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

  // Edit States
  const [editingId, setEditingId] = useState(null);
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

  const handleDelete = (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus unit ini?")) {
      setUnits(units.filter(u => u.id !== id));
    }
  };

  const handleEditClick = (unit) => {
    setEditingId(unit.id);
    const type = (unit.nextService && String(unit.nextService).includes('-')) ? 'Bulan' : 'HM/KM';
    setEditForm({ ...unit, nextServiceType: type });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditSave = () => {
    setUnits(units.map(u => u.id === editingId ? editForm : u));
    setEditingId(null);
    setEditForm({});
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* ── HEADER MANAJEMEN SPIP ── */}
      <div className="no-print" style={{ flexShrink: 0, marginBottom: '0.75rem' }}>
        <h1 className="mb-1" style={{ textAlign: 'center', fontSize: '1.2rem', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <Settings size={22} style={{ color: 'var(--color-yellow-primary)' }} />
          Manajemen SPIP
        </h1>
        <p style={{ textAlign: 'center', fontSize: '0.725rem', color: 'var(--color-silver)', marginBottom: '0.65rem' }}>
          Pencatatan Sarana, Prasarana, Instalasi, & Peralatan (SPIP)
        </p>

        {/* Segmented Pill Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(22, 25, 29, 0.95)',
          padding: '0.3rem',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          gap: '0.35rem',
          maxWidth: '480px',
          margin: '0 auto'
        }}>
          <button 
            type="button"
            className="btn"
            onClick={() => setActiveTab('add')} 
            style={{
              flex: 1,
              padding: '0.45rem 0.65rem',
              fontSize: '0.8rem',
              fontWeight: '600',
              borderRadius: '8px',
              border: activeTab === 'add' ? '1px solid var(--color-yellow-primary)' : '1px solid transparent',
              background: activeTab === 'add' ? 'rgba(255, 193, 7, 0.2)' : 'transparent',
              color: activeTab === 'add' ? 'var(--color-yellow-primary)' : 'var(--color-silver)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease'
            }}
          >
            <PlusCircle size={15} />
            <span>Tambah SPIP</span>
          </button>

          <button 
            type="button"
            className="btn"
            onClick={() => setActiveTab('list')} 
            style={{
              flex: 1,
              padding: '0.45rem 0.65rem',
              fontSize: '0.8rem',
              fontWeight: '600',
              borderRadius: '8px',
              border: activeTab === 'list' ? '1px solid #64b5f6' : '1px solid transparent',
              background: activeTab === 'list' ? 'rgba(33, 150, 243, 0.2)' : 'transparent',
              color: activeTab === 'list' ? '#64b5f6' : 'var(--color-silver)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease'
            }}
          >
            <List size={15} />
            <span>Daftar SPIP ({units.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'add' && (
        <div className="card hide-scrollbar" style={{ flex: 1, overflowY: 'auto', maxWidth: '840px', margin: '0 auto', width: '100%', padding: isMobile ? '1rem 1rem 85px 1rem' : '1.5rem' }}>
          <p className="text-silver mb-4" style={{ textAlign: 'center', fontSize: '0.78rem' }}>Masukkan detail sarana, prasarana, instalasi, atau peralatan (SPIP) baru ke dalam sistem.</p>
          
          {message && (
            <div className="mb-4" style={{ 
              padding: '0.75rem 1rem', 
              borderRadius: 'var(--border-radius-md)', 
              backgroundColor: isError ? 'rgba(255, 82, 82, 0.1)' : 'rgba(76, 175, 80, 0.1)',
              border: `1px solid ${isError ? 'rgba(255, 82, 82, 0.3)' : 'rgba(76, 175, 80, 0.3)'}`,
              color: isError ? '#ff8a80' : '#81c784',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.85rem'
            }}>
              {isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              
              {/* Kategori SPIP */}
              <div className="input-group mb-0">
                <label>Kategori SPIP</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Settings size={20} style={{ position: 'absolute', left: '1rem', color: 'var(--color-silver-dark)' }} />
                  <select 
                    className="input-field" 
                    style={{ width: '100%', paddingLeft: '3rem' }}
                    value={kategori}
                    onChange={(e) => {
                      setKategori(e.target.value);
                      setJenisUnit('');
                    }}
                    required
                  >
                    <option value="Sarana">Sarana (Kendaraan / Unit Operasional)</option>
                    <option value="Prasarana">Prasarana (Gedung / Bangunan)</option>
                    <option value="Instalasi">Instalasi (Listrik / Pipa / Sistem)</option>
                    <option value="Peralatan">Peralatan (Mesin / Tools / Genset)</option>
                  </select>
                </div>
              </div>
              
              {/* Jenis Unit */}
              <div className="input-group mb-0">
                <label>Jenis Unit / Item ({kategori})</label>
                <CustomCombobox 
                  icon={Truck} 
                  placeholder={`Ketik jenis ${kategori.toLowerCase()} (contoh: ${kategori === 'Sarana' ? 'Anfo Truck, Dump Truck' : kategori === 'Peralatan' ? 'Genset, Compressor' : 'Sesuai kebutuhan site...'})`}
                  value={jenisUnit} 
                  setValue={setJenisUnit} 
                  options={combinedJenisOptions} 
                  required 
                />
              </div>

              {/* Merk */}
              <div className="input-group mb-0">
                <label>Merk</label>
                <CustomCombobox 
                  icon={Tag} 
                  placeholder="Pilih atau ketik baru..." 
                  value={merk} 
                  setValue={setMerk} 
                  options={defaultMerk} 
                  required 
                />
              </div>

              {/* Tipe */}
              <div className="input-group mb-0">
                <label>Tipe</label>
                <CustomCombobox 
                  icon={Wrench} 
                  placeholder="Pilih atau ketik baru..." 
                  value={tipe} 
                  setValue={setTipe} 
                  options={defaultTipe} 
                  required 
                />
              </div>

              {/* No Lambung */}
              <div className="input-group mb-0">
                <label>No Lambung (ID Unit)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Hash size={20} style={{ position: 'absolute', left: '1rem', color: 'var(--color-silver-dark)' }} />
                  <input 
                    type="text" 
                    className="input-field" 
                    style={{ width: '100%', paddingLeft: '3rem' }}
                    placeholder="Ketik No Lambung..."
                    value={noLambung}
                    onChange={(e) => setNoLambung(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              {/* HM/KM */}
              <div className="input-group mb-0">
                <label>HM/KM Saat Ini</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Gauge size={20} style={{ position: 'absolute', left: '1rem', color: 'var(--color-silver-dark)' }} />
                  <input 
                    type="number" 
                    className="input-field" 
                    style={{ width: '100%', paddingLeft: '3rem' }}
                    placeholder="Masukkan angka (0)"
                    value={hmkm}
                    onChange={(e) => setHmkm(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Status */}
              <div className="input-group mb-0">
                <label>Status Awal</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Settings size={20} style={{ position: 'absolute', left: '1rem', color: 'var(--color-silver-dark)' }} />
                  <select 
                    className="input-field" 
                    style={{ width: '100%', paddingLeft: '3rem' }}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    required
                  >
                    <option value="Unit Aktif">Unit Aktif (Ready)</option>
                    <option value="Dalam Perbaikan">Dalam Perbaikan (Breakdown)</option>
                  </select>
                </div>
              </div>

              {/* Next Service */}
              <div className="input-group mb-0">
                <label>Next Service</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ width: '100px', flexShrink: 0 }}>
                    <select 
                      className="input-field" 
                      style={{ width: '100%', paddingLeft: '0.5rem', appearance: 'auto', fontSize: '0.85rem' }}
                      value={nextServiceType}
                      onChange={(e) => {
                        setNextServiceType(e.target.value);
                        setNextService('');
                      }}
                    >
                      <option value="HM/KM">HM/KM</option>
                      <option value="Bulan">Bulan</option>
                    </select>
                  </div>
                  <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', minWidth: 0 }}>
                    <Wrench size={16} style={{ position: 'absolute', left: '0.75rem', color: 'var(--color-silver-dark)' }} />
                    <input 
                      type={nextServiceType === 'Bulan' ? "month" : "number"} 
                      className="input-field" 
                      style={{ width: '100%', paddingLeft: '2.4rem', colorScheme: 'dark', fontSize: '0.85rem' }}
                      placeholder={nextServiceType === 'Bulan' ? "Pilih bulan..." : "Angka target..."}
                      value={nextService}
                      onChange={(e) => setNextService(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Next Brake Test */}
              <div className="input-group mb-0">
                <label>Next Brake Test (Kosongkan jika NA)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <AlertCircle size={20} style={{ position: 'absolute', left: '1rem', color: 'var(--color-silver-dark)' }} />
                  <input 
                    type="date" 
                    className="input-field" 
                    style={{ width: '100%', paddingLeft: '3rem', colorScheme: 'dark' }}
                    value={nextBrakeTest}
                    onChange={(e) => setNextBrakeTest(e.target.value)}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  />
                </div>
              </div>

              {/* Next Commissioning */}
              <div className="input-group mb-0">
                <label>Next Commissioning (Kosongkan jika NA)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Calendar size={20} style={{ position: 'absolute', left: '1rem', color: 'var(--color-silver-dark)' }} />
                  <input 
                    type="date" 
                    className="input-field" 
                    style={{ width: '100%', paddingLeft: '3rem', colorScheme: 'dark' }}
                    value={nextCommissioning}
                    onChange={(e) => setNextCommissioning(e.target.value)}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  />
                </div>
              </div>

              {/* Next Sertifikasi */}
              <div className="input-group mb-0">
                <label>Next Sertifikasi (Kosongkan jika NA)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <ShieldCheck size={20} style={{ position: 'absolute', left: '1rem', color: 'var(--color-silver-dark)' }} />
                  <input 
                    type="date" 
                    className="input-field" 
                    style={{ width: '100%', paddingLeft: '3rem', colorScheme: 'dark' }}
                    value={nextSertifikasi}
                    onChange={(e) => setNextSertifikasi(e.target.value)}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  />
                </div>
              </div>

            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : (
                <>
                  <PlusCircle size={20} />
                  <span>Simpan Unit Baru</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="card" style={{ flex: 1, overflow: 'auto', margin: '0 auto', width: '100%', padding: isMobile ? '0.85rem 0.85rem 85px 0.85rem' : '1.25rem' }}>
          <h2 className="mb-3" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}>
            <List size={18} style={{ color: 'var(--color-yellow-primary)' }} />
            Daftar Unit SPIP Tersimpan
          </h2>
          {units.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-silver-dark)' }}>
              <Truck size={48} style={{ margin: '0 auto', marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '0.9rem' }}>Belum ada unit yang ditambahkan.</p>
              <button 
                className="btn btn-primary" 
                style={{ marginTop: '1rem', fontSize: '0.85rem' }}
                onClick={() => setActiveTab('add')}
              >
                Tambah Unit Sekarang
              </button>
            </div>
          ) : isMobile ? (
            /* Tampilan Mobile Cards untuk Daftar SPIP */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {units.map(unit => (
                <div 
                  key={unit.id} 
                  style={{
                    padding: '0.75rem',
                    background: 'var(--color-bg-card)',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    borderLeft: `4px solid ${unit.status === 'Unit Aktif' ? 'var(--color-yellow-primary)' : '#ff8a80'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--color-yellow-primary)', fontSize: '0.95rem' }}>{unit.noLambung}</span>
                      <span style={{ fontSize: '0.7rem', color: '#ffd54f', background: 'rgba(255,193,7,0.12)', border: '1px solid rgba(255,193,7,0.25)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        {unit.kategori || 'Sarana'}
                      </span>
                    </div>
                    <span style={{ 
                      padding: '0.15rem 0.45rem', 
                      borderRadius: '4px', 
                      fontSize: '0.7rem', 
                      fontWeight: '600',
                      backgroundColor: unit.status === 'Unit Aktif' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 82, 82, 0.2)',
                      color: unit.status === 'Unit Aktif' ? '#81c784' : '#ff8a80',
                      border: `1px solid ${unit.status === 'Unit Aktif' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 82, 82, 0.3)'}`
                    }}>
                      {unit.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: '500' }}>
                    {unit.jenisUnit} <span style={{ color: 'var(--color-silver)', fontWeight: 'normal', fontSize: '0.75rem' }}>({unit.merk} {unit.tipe ? `- ${unit.tipe}` : ''})</span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--color-silver-light)', display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginTop: '0.2rem', paddingTop: '0.35rem', borderTop: '1px dashed var(--color-border)' }}>
                    <span>HM/KM: <strong style={{ color: '#ffffff' }}>{unit.hmkm}</strong></span>
                    <span>Svc: <strong style={{ color: '#ffffff' }}>{unit.nextService || '-'}</strong></span>
                    <span>Brake: <strong style={{ color: '#ffffff' }}>{unit.nextBrakeTest || 'NA'}</strong></span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '0.2rem' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.725rem' }} 
                      onClick={() => handleEditClick(unit)}
                    >
                      <Edit size={13} style={{ marginRight: '0.2rem' }} /> Edit
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.725rem', color: '#ff8a80', borderColor: 'rgba(255,138,128,0.3)' }} 
                      onClick={() => handleDelete(unit.id)}
                    >
                      <Trash2 size={13} style={{ marginRight: '0.2rem' }} /> Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Tampilan Tabel untuk Desktop View */
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '1rem', color: 'var(--color-silver)', width: '120px' }}>No Lambung</th>
                  <th style={{ padding: '1rem', color: 'var(--color-silver)' }}>Detail Unit</th>
                  <th style={{ padding: '1rem', color: 'var(--color-silver)' }}>HM/KM</th>
                  <th style={{ padding: '1rem', color: 'var(--color-silver)' }}>Status</th>
                  <th style={{ padding: '1rem', color: 'var(--color-silver)' }}>Jadwal Service</th>
                  <th style={{ padding: '1rem', color: 'var(--color-silver)', width: '100px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {units.map(unit => (
                  <tr key={unit.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    {editingId === unit.id ? (
                      <>
                        <td style={{ padding: '1rem' }}>
                          <input type="text" className="input-field" style={{ width: '100px', padding: '0.5rem' }} value={editForm.noLambung} onChange={(e) => setEditForm({...editForm, noLambung: e.target.value})} />
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <input type="text" className="input-field" style={{ padding: '0.5rem' }} placeholder="Jenis" value={editForm.jenisUnit} onChange={(e) => setEditForm({...editForm, jenisUnit: e.target.value})} />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input type="text" className="input-field" style={{ padding: '0.5rem', width: '50%' }} placeholder="Merk" value={editForm.merk} onChange={(e) => setEditForm({...editForm, merk: e.target.value})} />
                              <input type="text" className="input-field" style={{ padding: '0.5rem', width: '50%' }} placeholder="Tipe" value={editForm.tipe} onChange={(e) => setEditForm({...editForm, tipe: e.target.value})} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <input type="number" className="input-field" style={{ width: '90px', padding: '0.5rem' }} value={editForm.hmkm} onChange={(e) => setEditForm({...editForm, hmkm: e.target.value})} />
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <select className="input-field" style={{ padding: '0.5rem', width: '140px' }} value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})}>
                            <option value="Unit Aktif">Unit Aktif</option>
                            <option value="Dalam Perbaikan">Dalam Perbaikan</option>
                          </select>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ fontSize: '0.8em', color: 'var(--color-silver)' }}>Service:</div>
                            <div style={{ display: 'flex', gap: '0.2rem' }}>
                              <select 
                                className="input-field" 
                                style={{ padding: '0.4rem', width: '85px', flexShrink: 0, appearance: 'auto', fontSize: '0.8em' }} 
                                value={editForm.nextServiceType || 'HM/KM'} 
                                onChange={(e) => setEditForm({...editForm, nextServiceType: e.target.value, nextService: ''})}
                              >
                                <option value="HM/KM">HM</option>
                                <option value="Bulan">Bulan</option>
                              </select>
                              <input 
                                type={editForm.nextServiceType === 'Bulan' ? "month" : "number"} 
                                className="input-field" 
                                style={{ padding: '0.4rem', flex: 1, colorScheme: 'dark', fontSize: '0.8em' }} 
                                value={editForm.nextService} 
                                onChange={(e) => setEditForm({...editForm, nextService: e.target.value})} 
                              />
                            </div>
                            <div style={{ fontSize: '0.8em', color: 'var(--color-silver)' }}>Brake Test:</div>
                            <input type="date" className="input-field" style={{ padding: '0.5rem', colorScheme: 'dark' }} value={editForm.nextBrakeTest} onChange={(e) => setEditForm({...editForm, nextBrakeTest: e.target.value})} onClick={(e) => e.target.showPicker && e.target.showPicker()} />
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button className="btn btn-primary" style={{ padding: '0.5rem', minWidth: '40px' }} onClick={handleEditSave} title="Simpan"><Save size={16} /></button>
                            <button className="btn btn-secondary" style={{ padding: '0.5rem', minWidth: '40px' }} onClick={handleEditCancel} title="Batal"><X size={16} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{unit.noLambung}</td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: '500', color: 'var(--color-yellow-primary)' }}>{unit.jenisUnit}</span>
                            {unit.kategori && (
                              <span style={{ padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.75em', backgroundColor: 'rgba(255, 193, 7, 0.12)', color: '#ffd54f', border: '1px solid rgba(255, 193, 7, 0.25)' }}>
                                {unit.kategori}
                              </span>
                            )}
                          </div>
                          <div className="text-silver" style={{ fontSize: '0.85em', marginTop: '0.25rem' }}>{unit.merk} {unit.tipe ? `- ${unit.tipe}` : ''}</div>
                        </td>
                        <td style={{ padding: '1rem' }}>{unit.hmkm}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.85em', 
                            backgroundColor: unit.status === 'Unit Aktif' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 82, 82, 0.2)',
                            color: unit.status === 'Unit Aktif' ? '#81c784' : '#ff8a80',
                            border: `1px solid ${unit.status === 'Unit Aktif' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 82, 82, 0.3)'}`
                          }}>
                            {unit.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.85em' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                            <Wrench size={13} className="text-silver" /> <span>Svc: {unit.nextService || '-'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                            <AlertCircle size={13} className="text-silver" /> <span>Brake: {unit.nextBrakeTest || 'NA'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                            <Calendar size={13} className="text-silver" /> <span>Comm: {unit.nextCommissioning || 'NA'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldCheck size={13} className="text-silver" /> <span>Sert: {unit.nextSertifikasi || 'NA'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button className="btn btn-secondary" style={{ padding: '0.5rem', minWidth: '40px' }} onClick={() => handleEditClick(unit)} title="Edit"><Edit size={16} /></button>
                            <button className="btn btn-secondary" style={{ padding: '0.5rem', minWidth: '40px', color: '#ff8a80', borderColor: 'rgba(255,138,128,0.3)' }} onClick={() => handleDelete(unit.id)} title="Hapus"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
