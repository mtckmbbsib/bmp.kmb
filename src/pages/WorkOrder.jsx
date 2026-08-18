import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PlusCircle, List, Save, Trash2, User, Gauge, Truck, Hash, Wrench, 
  Calendar, Printer, AlertTriangle, CheckCircle2, FileText, Plus, X, Edit, Eye, PenTool, ClipboardList
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import SearchableSelect from '../components/SearchableSelect';


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

export default function WorkOrder() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = tab || 'create';

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [workOrders, setWorkOrders] = useState([]);
  const [units, setUnits] = useState([]);
  const [userOptions, setUserOptions] = useState([]);

  // Header State
  const [noUrut, setNoUrut] = useState(''); // e.g. '01', '001'
  const [selectedNoLambung, setSelectedNoLambung] = useState('');
  const [selectedUnitObj, setSelectedUnitObj] = useState(null);
  
  const [kategoriPekerjaan, setKategoriPekerjaan] = useState('PM Service');
  const [plannedDate, setPlannedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Section Body Form State
  const [deskripsiPekerjaan, setDeskripsiPekerjaan] = useState('');
  const [statusWo, setStatusWo] = useState('Scheduled (Direncanakan)');
  const [assignedTo, setAssignedTo] = useState('');
  const [estimasiJam, setEstimasiJam] = useState('');
  
  // Edit & Print Modal State
  const [editingId, setEditingId] = useState(null);

  const loggedUser = getLoggedInUser();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);

    fetchUnits();
    fetchUsers();
    fetchWorkOrders();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-generate nomor urut WO
  useEffect(() => {
    if (editingId) return; // Don't auto-generate if editing

    if (!plannedDate) {
      setNoUrut('01');
      return;
    }

    const d = new Date(plannedDate);
    const month = d.getMonth();
    const year = d.getFullYear();

    let maxUrut = 0;
    workOrders.forEach(wo => {
      if (wo.plannedDate) {
        const woDate = new Date(wo.plannedDate);
        if (woDate.getMonth() === month && woDate.getFullYear() === year) {
          const urutNum = parseInt(wo.noUrut, 10);
          if (!isNaN(urutNum) && urutNum > maxUrut) {
            maxUrut = urutNum;
          }
        }
      }
    });

    const nextUrut = maxUrut + 1;
    setNoUrut(nextUrut.toString().padStart(2, '0'));
  }, [plannedDate, workOrders, editingId]);

  // Format Nomor WO Otomatis: [Nomor Urut]/WO/[No Lambung]/[Bulan Romawi]/[Tahun]
  const formattedWoNumber = useMemo(() => {
    if (!plannedDate) return '';
    const d = new Date(plannedDate);
    const romanMonth = getRomanMonth(d.getMonth() + 1);
    const year = d.getFullYear();
    const lambung = selectedNoLambung ? selectedNoLambung.trim() : '....';
    const urut = noUrut ? noUrut.trim() : '....';

    return `${urut}/WO/${lambung}/${romanMonth}/${year}`;
  }, [noUrut, selectedNoLambung, plannedDate]);

  const mechanicOptions = useMemo(() => {
    return userOptions.filter(u => {
      const j = (u.jabatan || '').toLowerCase();
      return (
        j.includes('mechanic') || 
        j.includes('mekanik') || 
        j.includes('teknisi')
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

  const fetchWorkOrders = async () => {
    try {
      const { data, error } = await supabase.from('work_orders').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const mapped = data.map(r => ({
          id: r.id,
          woNumber: r.wo_number,
          noUrut: r.no_urut,
          kategoriPekerjaan: r.kategori_pekerjaan,
          noLambung: r.no_lambung,
          deskripsiPekerjaan: r.deskripsi_pekerjaan,
          plannedDate: r.planned_date,
          assignedTo: r.assigned_to,
          statusWo: r.status,
          createdBy: r.created_by,
          estimasiJam: r.estimasi_jam
        }));
        setWorkOrders(mapped);
      }
    } catch (err) {
      console.warn('Fetch work_orders error (Make sure table exists):', err);
    }
  };

  const handleUnitChange = (noLambung) => {
    setSelectedNoLambung(noLambung);
    const match = units.find(u => u.noLambung === noLambung);
    setSelectedUnitObj(match || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedNoLambung) {
      alert('Silakan pilih Nomor Lambung Unit!');
      return;
    }

    if (!noUrut.trim()) {
      alert('Silakan isi Nomor Urut WO (contoh: 01, 002)!');
      return;
    }

    const payload = {
      wo_number: formattedWoNumber,
      no_urut: noUrut.trim(),
      no_lambung: selectedNoLambung,
      kategori_pekerjaan: kategoriPekerjaan,
      deskripsi_pekerjaan: deskripsiPekerjaan.trim(),
      planned_date: plannedDate,
      assigned_to: assignedTo,
      status: statusWo,
      created_by: loggedUser,
      estimasi_jam: kategoriPekerjaan === 'Perbaikan Breakdown' ? (Number(estimasiJam) || 0) : 0
    };

    if (editingId) {
      try {
        const { error } = await supabase.from('work_orders').update(payload).eq('id', editingId);
        if (error) {
          console.error('Update work_order error:', error);
          alert('Gagal memperbarui Work Order. Pastikan tabel work_orders sudah dibuat di Supabase!\n\nDetail: ' + error.message);
          return;
        }
      } catch (err) {
        console.error('Update work_order exception:', err);
      }

      setWorkOrders(prev => prev.map(r => r.id === editingId ? {
        id: editingId,
        woNumber: payload.wo_number,
        noUrut: payload.no_urut,
        noLambung: payload.no_lambung,
        kategoriPekerjaan: payload.kategori_pekerjaan,
        deskripsiPekerjaan: payload.deskripsi_pekerjaan,
        plannedDate: payload.planned_date,
        assignedTo: payload.assigned_to,
        statusWo: payload.status,
        createdBy: payload.created_by,
        estimasiJam: payload.estimasi_jam
      } : r));

      setEditingId(null);
      alert(`Work Order ${formattedWoNumber} berhasil diperbarui!`);
    } else {
      try {
        const { error } = await supabase.from('work_orders').insert([payload]);
        if (error) {
          console.error('Insert work_order error:', error);
          alert('Gagal menyimpan Work Order. Pastikan tabel work_orders sudah dibuat di Supabase!\n\nDetail: ' + error.message);
          return;
        }
      } catch (err) {
        console.error('Insert work_order exception:', err);
      }
      // Re-fetch to get accurate DB ID
      fetchWorkOrders();
      alert(`Work Order ${formattedWoNumber} berhasil disimpan!`);
    }

    // Reset Form
    setNoUrut('');
    setSelectedNoLambung('');
    setSelectedUnitObj(null);
    setDeskripsiPekerjaan('');
    setStatusWo('Scheduled (Direncanakan)');
    setAssignedTo('');
    setEstimasiJam('');
    navigate('/work-order/history');
  };

  const handleStartEdit = (wo) => {
    setEditingId(wo.id);
    setNoUrut(wo.noUrut || '');
    setSelectedNoLambung(wo.noLambung || '');
    const match = units.find(u => u.noLambung === wo.noLambung);
    setSelectedUnitObj(match || null);

    setKategoriPekerjaan(wo.kategoriPekerjaan || 'PM Service');
    setPlannedDate(wo.plannedDate || new Date().toISOString().split('T')[0]);
    setDeskripsiPekerjaan(wo.deskripsiPekerjaan || '');
    setStatusWo(wo.statusWo || 'Scheduled (Direncanakan)');
    setAssignedTo(wo.assignedTo || '');
    setEstimasiJam(wo.estimasiJam || '');

    navigate('/work-order/create');
  };

  const handleDelete = async (id, nomor) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus Work Order "${nomor}"?`)) {
      try {
        await supabase.from('work_orders').delete().eq('id', id);
      } catch (_) {}
      setWorkOrders(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Header Page Title + Tabs */}
      <div className="no-print" style={{ flexShrink: 0, marginBottom: '0.75rem' }}>
        <h1 className="mb-1" style={{ textAlign: 'center', fontSize: '1.2rem', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <ClipboardList size={22} style={{ color: 'var(--color-yellow-primary)' }} />
          Surat Perintah Kerja (Work Order)
        </h1>
        <p style={{ textAlign: 'center', fontSize: '0.725rem', color: 'var(--color-silver)', marginBottom: '0.65rem' }}>
          Perencanaan & Penugasan Pekerjaan
        </p>
      </div>

      {/* ── TAB BUAT WORK ORDER ── */}
      {activeTab === 'create' && (
        <div className="card no-print hide-scrollbar" style={{ flex: 1, overflowY: 'auto', maxWidth: '840px', margin: '0 auto', width: '100%', padding: isMobile ? '0.75rem 0.75rem 85px 0.75rem' : '1rem 1rem 85px 1rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            
            <div style={{
              background: 'linear-gradient(135deg, rgba(35, 39, 45, 0.95) 0%, rgba(20, 24, 28, 0.98) 100%)',
              border: '1px solid var(--color-border)',
              borderRadius: '14px',
              padding: '0.85rem 1rem',
              marginBottom: '0.75rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,193,7,0.15)', border: '1px solid var(--color-yellow-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ClipboardList size={18} style={{ color: 'var(--color-yellow-primary)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#ffffff', lineHeight: '1.2' }}>
                    {selectedNoLambung ? `Work Order — ${selectedNoLambung}` : 'Work Order Baru'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-silver)', marginTop: '0.1rem' }}>
                    Dokumen Perencanaan Perbaikan/Servis
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(25, 29, 34, 0.95)',
              border: '2px solid var(--color-yellow-primary)',
              borderRadius: '14px',
              padding: isMobile ? '0.85rem' : '1.15rem',
              marginBottom: '0.85rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                
                {/* Pilih Unit / No Lambung */}
                <div className="input-group mb-0" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--color-silver-light)', marginBottom: '0.25rem', display: 'block' }}>
                    Pilih Unit / No Lambung *
                  </label>
                  <SearchableSelect 
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
                  </SearchableSelect>
                </div>
                {/* Preview Format Nomor WO Otomatis */}
                <div className="input-group mb-0" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-silver)', marginBottom: '0.2rem', display: 'block' }}>
                    Nomor Work Order (Otomatis):
                  </label>
                  <div style={{ padding: '0.45rem 0.65rem', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-yellow-primary)', borderRadius: '6px', color: 'var(--color-yellow-primary)', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '0.03em' }}>
                    No: {formattedWoNumber}
                  </div>
                </div>

                {/* Kategori Pekerjaan */}
                <div className="input-group mb-0" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--color-silver-light)', marginBottom: '0.25rem', display: 'block' }}>
                    Kategori Pekerjaan *
                  </label>
                  <SearchableSelect 
                    className="input-field" 
                    style={{ height: '38px', fontSize: '0.825rem', width: '100%', background: 'var(--color-bg-main)' }}
                    value={kategoriPekerjaan}
                    onChange={e => setKategoriPekerjaan(e.target.value)}
                    required
                  >
                    <option value="Perbaikan Breakdown">Perbaikan Breakdown</option>
                    <option value="PM Service">PM Service</option>
                    <option value="Weekly Service">Weekly Service</option>
                    <option value="Modifikasi Unit">Modifikasi Unit</option>
                    <option value="Lainnya">Lainnya</option>
                  </SearchableSelect>
                </div>

                {/* Tanggal Direncanakan */}
                <div className="input-group mb-0" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: '600', color: 'var(--color-silver-light)', marginBottom: '0.25rem', display: 'block' }}>Tanggal Direncanakan *</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    style={{ height: '38px', fontSize: '0.825rem', width: '100%', colorScheme: 'dark', background: 'var(--color-bg-main)' }}
                    value={plannedDate}
                    onChange={e => setPlannedDate(e.target.value)}
                    required
                  />
                </div>

                {/* Estimasi Waktu (Khusus Breakdown) */}
                {kategoriPekerjaan === 'Perbaikan Breakdown' && (
                  <div className="input-group mb-0" style={{ width: '100%' }}>
                    <label style={{ fontSize: '0.775rem', fontWeight: '600', color: '#ff5252', marginBottom: '0.25rem', display: 'block' }}>
                      Estimasi Waktu Perbaikan (Jam) *
                    </label>
                    <input 
                      type="number"
                      min="1"
                      className="input-field" 
                      style={{ height: '38px', fontSize: '0.825rem', width: '100%', background: 'var(--color-bg-main)', borderColor: '#ff5252' }}
                      value={estimasiJam}
                      onChange={e => setEstimasiJam(e.target.value)}
                      placeholder="Contoh: 4"
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Deskripsi Pekerjaan */}
            <div className="input-group mb-3">
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-yellow-primary)' }}>
                Deskripsi Pekerjaan / Keluhan *
              </label>
              <textarea 
                className="input-field" 
                rows="4" 
                placeholder="Tuliskan secara spesifik apa yang harus dikerjakan mekanik atau apa keluhan yang terjadi..."
                value={deskripsiPekerjaan}
                onChange={e => setDeskripsiPekerjaan(e.target.value)}
                required
              />
            </div>

            {/* Status & Assignee */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
              <div className="input-group mb-0">
                <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Tugaskan Kepada (Mekanik)</label>
                <SearchableSelect 
                  className="input-field" 
                  style={{ height: '36px', fontSize: '0.85rem' }}
                  value={assignedTo}
                  onChange={e => setAssignedTo(e.target.value)}
                >
                  <option value="">-- Belum Ditugaskan --</option>
                  {mechanicOptions.map(m => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                  <option value="Mekanik Site">Mekanik Site</option>
                </SearchableSelect>
              </div>

              <div className="input-group mb-0">
                <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Status WO *</label>
                <SearchableSelect 
                  className="input-field" 
                  style={{ height: '36px', fontSize: '0.85rem' }}
                  value={statusWo}
                  onChange={e => setStatusWo(e.target.value)}
                >
                  <option value="Scheduled (Direncanakan)">Scheduled (Direncanakan)</option>
                  <option value="In Progress (Sedang Dikerjakan)">In Progress (Sedang Dikerjakan)</option>
                  <option value="Waiting for Parts (Menunggu Sparepart)">Waiting for Parts (Menunggu Sparepart)</option>
                  <option value="Completed (Selesai)">Completed (Selesai)</option>
                  <option value="Canceled (Dibatalkan)">Canceled (Dibatalkan)</option>
                </SearchableSelect>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.75rem', fontSize: '0.95rem' }}>
                <Save size={18} /> {editingId ? 'Simpan Perubahan' : 'Buat Work Order'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB DAFTAR WORK ORDER (HISTORY) ── */}
      {activeTab === 'history' && (
        <div className="card hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0.75rem' : '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.05rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <List size={18} style={{ color: 'var(--color-yellow-primary)' }} />
              Daftar Work Order Aktif & Riwayat
            </h2>
          </div>

          <div className="table-responsive">
            <table className="table" style={{ fontSize: '0.825rem' }}>
              <thead>
                <tr>
                  <th style={{ minWidth: '130px' }}>Nomor WO</th>
                  <th>Tanggal</th>
                  <th>Unit</th>
                  <th>Kategori</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-silver)' }}>
                      Belum ada Work Order.
                    </td>
                  </tr>
                ) : (
                  workOrders.map((wo) => (
                    <tr key={wo.id}>
                      <td style={{ fontWeight: '600', color: 'var(--color-yellow-primary)' }}>{wo.woNumber}</td>
                      <td>
                        {new Date(wo.plannedDate).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </td>
                      <td style={{ fontWeight: 'bold' }}>{wo.noLambung}</td>
                      <td>{wo.kategoriPekerjaan}</td>
                      <td>
                        <span style={{ 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.7rem', 
                          fontWeight: 'bold',
                          backgroundColor: 
                            wo.statusWo.includes('Completed') ? 'rgba(76, 175, 80, 0.15)' : 
                            wo.statusWo.includes('Progress') ? 'rgba(33, 150, 243, 0.15)' : 
                            wo.statusWo.includes('Scheduled') ? 'rgba(255, 193, 7, 0.15)' : 
                            wo.statusWo.includes('Canceled') ? 'rgba(244, 67, 54, 0.15)' :
                            'rgba(255, 255, 255, 0.1)',
                          color: 
                            wo.statusWo.includes('Completed') ? '#4caf50' : 
                            wo.statusWo.includes('Progress') ? '#64b5f6' : 
                            wo.statusWo.includes('Scheduled') ? '#ffca28' : 
                            wo.statusWo.includes('Canceled') ? '#e57373' :
                            '#ffffff'
                        }}>
                          {wo.statusWo.split(' ')[0]}
                        </span>
                      </td>
                      <td>{wo.assignedTo || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                          <button 
                            className="btn-icon" 
                            style={{ padding: '0.35rem', background: 'rgba(33, 150, 243, 0.1)', color: '#2196f3', border: '1px solid rgba(33, 150, 243, 0.2)' }}
                            onClick={() => handleStartEdit(wo)}
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            className="btn-icon" 
                            style={{ padding: '0.35rem', background: 'rgba(244, 67, 54, 0.1)', color: '#f44336', border: '1px solid rgba(244, 67, 54, 0.2)' }}
                            onClick={() => handleDelete(wo.id, wo.woNumber)}
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
