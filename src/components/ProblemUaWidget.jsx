import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Download, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import { showError } from './UniversalDialog';

const parseTimeToHours = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h + (m / 60);
};

const getDurationHours = (start, end) => {
  let s = parseTimeToHours(start);
  let e = parseTimeToHours(end);
  if (e < s) e += 24; 
  return e - s;
};

const PRODUCTIVE_ACTIVITIES = [
  "P5M",
  "P2H / Pemeriksaan sebelum memulai",
  "Pengisian AN",
  "Pengisian Emulsion",
  "Pengisian solar engine",
  "Pengisian solar proses",
  "Perjalanan ke lokasi",
  "Pindah lokasi",
  "Pengisian lubang (charging)",
  "Pencucian unit",
  "Kembali ke gudang"
];

export default function ProblemUaWidget() {
  const [problemData, setProblemData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    fetchData();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); 
      
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      const { data: reports, error } = await supabase
        .from('timesheet_reports')
        .select(`
          id, report_date,
          timesheet_activities ( activity, start_time, end_time )
        `)
        .gte('report_date', startStr)
        .lte('report_date', endStr);

      if (error) throw error;

      const problemHoursMap = {};

      reports?.forEach(report => {
        report.timesheet_activities?.forEach(act => {
          const isProductive = PRODUCTIVE_ACTIVITIES.includes(act.activity);
          if (!isProductive) {
            const duration = getDurationHours(act.start_time, act.end_time);
            const actName = act.activity || 'Lain-lain';
            problemHoursMap[actName] = (problemHoursMap[actName] || 0) + duration;
          }
        });
      });

      const formattedChartData = Object.keys(problemHoursMap).map(key => ({
        name: key,
        hours: Number(problemHoursMap[key].toFixed(1))
      })).sort((a, b) => b.hours - a.hours);
      
      setProblemData(formattedChartData);
    } catch (err) {
      console.error('Error fetching UA problems for widget:', err);
    }
    setLoading(false);
  };

  const renderCustomBarLabel = ({ x, y, width, value }) => {
    return (
      <text x={x + width / 2} y={y - 10} fill="var(--color-silver)" textAnchor="middle" fontSize={12} fontWeight="bold">
        {value > 0 ? value.toFixed(1) : ''}
      </text>
    );
  };

  const chartRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const downloadChartImage = async () => {
    if (!chartRef.current) return;
    setDownloading(true);
    try {
      const now = new Date();
      const monthName = now.toLocaleString('id-ID', { month: 'long' });
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#161b22',
        scale: 2,
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = `Grafik_Problem_UA_${monthName}_${now.getFullYear()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) {
      console.error('Error downloading chart image:', err);
      await showError('Gagal mendownload gambar grafik.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-silver)' }}>Memuat data grafik...</div>;
  }

  return (
    <div className="card mb-4" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--color-yellow-primary)' }}>PROBLEM UA (Bulan Ini)</h2>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-silver)', marginTop: '0.2rem' }}>Ringkasan durasi kendala & problem standby operasional unit</div>
        </div>
        
        {problemData.length > 0 && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={downloadChartImage}
            disabled={downloading}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: 'var(--color-border)', backgroundColor: 'rgba(255,255,255,0.04)' }}
            title="Download Grafik sebagai Gambar (PNG)"
          >
            <ImageIcon size={14} style={{ color: 'var(--color-yellow-primary)' }} />
            <span>{downloading ? 'Memproses...' : 'Download Gambar (PNG)'}</span>
          </button>
        )}
      </div>
      
      <div ref={chartRef} style={{ width: '100%', overflowX: 'auto', padding: '1rem', background: '#161b22', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
        <div style={{ minWidth: isMobile ? '600px' : '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={problemData} margin={{ top: 20, right: 30, left: 0, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="var(--color-silver)" 
                fontSize={10} 
                interval={0} 
                angle={-45} 
                textAnchor="end" 
                height={80}
              />
              <YAxis stroke="var(--color-silver)" fontSize={10} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ background: '#21262d', border: '1px solid var(--color-border)', borderRadius: '8px', color: '#fff' }}
                formatter={(value) => [`${value} Jam`, 'Total Waktu']}
              />
              <Bar dataKey="hours" fill="#024bba" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {problemData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#024bba" />
                ))}
                <LabelList dataKey="hours" content={renderCustomBarLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {problemData.length === 0 && (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-silver)' }}>
            Belum ada data problem/standby di bulan ini.
          </div>
        )}
      </div>
    </div>
  );
}
