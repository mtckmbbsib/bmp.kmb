import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ClipboardList, Calendar, User, Truck, PlusCircle, Trash2, 
  Save, Clock, CheckCircle2, History 
} from 'lucide-react';

const ACTIVITIES = [
  "P5M",
  "P2H / Pemeriksaan sebelum memulai",
  "Pengisian AN",
  "Pengisian Emulsion",
  "Pengisian solar engine",
  "Pengisian solar proses",
  "Perjalanan ke lokasi",
  "Pindah lokasi",
  "Pengisian lubang (charging)",
  "Standby menunggu drilling",
  "Standby menunggu perbaikan lokasi",
  "Standby menunggu akses / jalan",
  "Menunggu aksesoris",
  "Kembali ke gudang",
  "Menunggu fuel truck",
  "Menunggu perbaikan (breakdown)",
  "Menunggu escort",
  "Menunggu informasi dari Customer",
  "Menunggu peledakan",
  "Jadwal pemeliharaan",
  "Istirahat / makan",
  "Pencucian unit",
  "Lain-lain"
];

export default function TimesheetOperator() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = tab || 'create';
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [units, setUnits] = useState([]);
  
  // User info
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const operatorName = user?.name || user?.full_name || user?.username || 'Operator';

  // Form State
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [unitNumber, setUnitNumber] = useState('');
  const [activities, setActivities] = useState([
    { id: Date.now(), startTime: '05:00', endTime: '06:00', activity: 'P5M', remarks: '' }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    fetchUnits();
    if (activeTab === 'history') fetchHistory();
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  const fetchUnits = async () => {
    try {
      const { data } = await supabase.from('units').select('no_lambung').order('no_lambung');
      if (data) setUnits(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await supabase
        .from('timesheet_reports')
        .select(`
          *,
          timesheet_activities (*)
        `)
        .order('created_at', { ascending: false });
      if (data) setHistory(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddActivity = () => {
    // Set default start time to the end time of the last activity
    let lastEndTime = '06:00';
    if (activities.length > 0) {
      lastEndTime = activities[activities.length - 1].endTime;
    }
    setActivities([...activities, { id: Date.now(), startTime: lastEndTime, endTime: '', activity: '', remarks: '' }]);
  };

  const handleRemoveActivity = (id) => {
    if (activities.length === 1) return; // minimal 1
    setActivities(activities.filter(a => a.id !== id));
  };

  const handleActivityChange = (id, field, value) => {
    setActivities(activities.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!unitNumber) {
      alert("Silakan pilih No. Unit (MMU) terlebih dahulu.");
      return;
    }
    
    // Validasi activities
    for (let i=0; i<activities.length; i++) {
      const a = activities[i];
      if (!a.startTime || !a.endTime || !a.activity) {
        alert(`Mohon lengkapi Waktu dan Aktivitas pada baris ke-${i+1}.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      // 1. Insert Report
      const { data: reportData, error: reportError } = await supabase.from('timesheet_reports').insert([{
        report_date: reportDate,
        operator_name: operatorName,
        unit_number: unitNumber
      }]).select();

      if (reportError) throw reportError;

      const reportId = reportData[0].id;

      // 2. Insert Activities
      const actsToInsert = activities.map(a => ({
        timesheet_id: reportId,
        start_time: a.startTime,
        end_time: a.endTime,
        activity: a.activity,
        remarks: a.remarks || ''
      }));

      const { error: actError } = await supabase.from('timesheet_activities').insert(actsToInsert);
      if (actError) throw actError;

      alert("Laporan Time Sheet berhasil dikirim!");
      
      // Reset
      setActivities([{ id: Date.now(), startTime: '05:00', endTime: '06:00', activity: 'P5M', remarks: '' }]);
      setUnitNumber('');
      navigate('/timesheet/history');

    } catch (err) {
      alert("Terjadi kesalahan saat menyimpan data.");
      console.error(err);
    }
    setSubmitting(false);
  };

  return (
    <div className="page-container" style={{ paddingBottom: isMobile ? '80px' : '20px' }}>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList size={22} style={{ color: 'var(--color-yellow-primary)' }} />
            Time Sheet Operator (PA/UA)
          </h1>
          <div style={{ fontSize: '0.725rem', color: 'var(--color-silver)', marginTop: '0.15rem' }}>
            Lembar Kerja Harian MMU / Unit
          </div>
        </div>
      </div>
      {activeTab === 'create' && (
        <div className="card hide-scrollbar" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', width: '100%', padding: isMobile ? '1rem' : '1.25rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '100%', animation: 'fadeIn 0.3s ease-out' }}>
            
            {/* Header info unit & operator */}
            <div style={{ flexShrink: 0, paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)', marginBottom: '0.75rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: 'var(--color-silver-light)', margin: 0 }}>
                <ClipboardList size={18} style={{ color: 'var(--color-yellow-primary)' }} />
                Form Time Sheet (PA/UA)
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem', marginBottom: '1.25rem' }}>
              
              <div className="input-group mb-0">
                <label style={{ fontSize: '0.8rem', fontWeight: '500' }}>1. Tanggal Laporan *</label>
                <input type="date" required className="input-field" style={{ height: '36px', fontSize: '0.85rem' }} value={reportDate} onChange={e => setReportDate(e.target.value)} />
              </div>
              
              <div className="input-group mb-0">
                <label style={{ fontSize: '0.8rem', fontWeight: '500' }}>2. Nama Operator</label>
                <input type="text" className="input-field" value={operatorName} readOnly style={{ height: '36px', fontSize: '0.85rem', opacity: 0.7, backgroundColor: 'rgba(0,0,0,0.3)', cursor: 'not-allowed' }} />
              </div>
              
              <div className="input-group mb-0">
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-yellow-primary)' }}>3. Pilih Unit / SPIP *</label>
                <select className="input-field" required style={{ height: '36px', fontSize: '0.85rem', borderColor: !unitNumber ? 'var(--color-yellow-primary)' : 'var(--color-border)' }} value={unitNumber} onChange={e => setUnitNumber(e.target.value)}>
                  <option value="">-- Pilih Unit --</option>
                  {units.map((u, i) => <option key={i} value={u.no_lambung}>{u.no_lambung}</option>)}
                </select>
              </div>
            </div>

            {/* ACTIVITIES SECTION */}
            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', marginTop: '0.5rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-yellow-primary)', marginBottom: '0.5rem' }}>4. Uraian Aktivitas Harian</h3>
              
              <p style={{ fontSize: '0.75rem', color: 'var(--color-silver)', marginBottom: '1rem' }}>
                Masukkan rentang waktu dan jenis aktivitas yang Anda kerjakan. Anda dapat menambah baris baru untuk aktivitas selanjutnya.
              </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {activities.map((act, index) => (
                <div key={act.id} style={{ 
                  display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.5rem', 
                  alignItems: isMobile ? 'stretch' : 'center',
                  background: 'var(--color-bg-main)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: isMobile ? '100%' : '180px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--color-silver)' }}>Mulai</label>
                      <input type="time" required className="input-field" style={{ padding: '0.4rem', fontSize: '0.85rem' }} value={act.startTime} onChange={e => handleActivityChange(act.id, 'startTime', e.target.value)} />
                    </div>
                    <span style={{ color: 'var(--color-silver)' }}>-</span>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--color-silver)' }}>Selesai</label>
                      <input type="time" required className="input-field" style={{ padding: '0.4rem', fontSize: '0.85rem' }} value={act.endTime} onChange={e => handleActivityChange(act.id, 'endTime', e.target.value)} />
                    </div>
                  </div>
                  
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--color-silver)' }}>Aktivitas</label>
                    <select required className="input-field" style={{ padding: '0.4rem', fontSize: '0.85rem' }} value={act.activity} onChange={e => handleActivityChange(act.id, 'activity', e.target.value)}>
                      <option value="">-- Pilih Aktivitas --</option>
                      {ACTIVITIES.map((a, i) => <option key={i} value={a}>{a}</option>)}
                    </select>
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--color-silver)' }}>Keterangan</label>
                    <input type="text" className="input-field" placeholder="Catatan tambahan (opsional)" style={{ padding: '0.4rem', fontSize: '0.85rem' }} value={act.remarks} onChange={e => handleActivityChange(act.id, 'remarks', e.target.value)} />
                  </div>

                  {activities.length > 1 && (
                    <button type="button" onClick={() => handleRemoveActivity(act.id)} style={{ 
                      background: 'transparent', border: 'none', color: '#ff8a80', cursor: 'pointer', padding: '0.4rem', marginTop: isMobile ? '0' : '1.2rem', alignSelf: isMobile ? 'flex-end' : 'center'
                    }} title="Hapus Baris">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" onClick={handleAddActivity} className="btn btn-secondary" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 1rem', alignSelf: 'flex-start' }}>
              <PlusCircle size={16} /> Tambah Aktivitas Selanjutnya
            </button>
            </div>

          <div style={{ flexShrink: 0, paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', marginTop: '1rem' }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', height: '38px', fontSize: '0.875rem', fontWeight: 'bold' }}
              disabled={submitting || !unitNumber}
            >
              <Save size={16} /> {submitting ? 'Menyimpan...' : 'Kirim Time Sheet'}
            </button>
          </div>
          </form>
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          {history.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <History size={48} style={{ color: 'var(--color-silver-dark)', marginBottom: '1rem', opacity: 0.5 }} />
              <h3 style={{ color: 'var(--color-silver)', marginBottom: '0.5rem' }}>Belum Ada Riwayat</h3>
              <p style={{ color: 'var(--color-silver-light)', fontSize: '0.85rem' }}>Time sheet yang Anda kirim akan muncul di sini.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {history.map(report => (
                <div key={report.id} className="glass-card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-yellow-primary)' }}>{report.unit_number}</h3>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-silver)' }}>{report.report_date} • {report.operator_name}</div>
                    </div>
                    <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(76,175,80,0.1)', color: '#81c784', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} /> Terkirim
                    </span>
                  </div>

                  <div style={{ marginTop: '0.8rem' }}>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--color-silver-light)', margin: '0 0 0.5rem 0' }}>Rincian Aktivitas:</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {report.timesheet_activities?.map(act => (
                        <div key={act.id} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', padding: '0.4rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                          <div style={{ color: '#ffd54f', fontWeight: 'bold', width: '85px', flexShrink: 0 }}>
                            {act.start_time.substring(0,5)} - {act.end_time.substring(0,5)}
                          </div>
                          <div style={{ color: '#fff', flex: 1 }}>{act.activity}</div>
                          {act.remarks && <div style={{ color: 'var(--color-silver)', fontStyle: 'italic', flex: 1 }}>{act.remarks}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
