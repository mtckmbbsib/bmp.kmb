import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

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

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-silver)' }}>Memuat data grafik...</div>;
  }

  return (
    <div className="card mb-4" style={{ padding: '1.25rem' }}>
      <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', color: 'var(--color-yellow-primary)' }}>PROBLEM UA (Bulan Ini)</h2>
      
      <div style={{ width: '100%', overflowX: 'auto', padding: '1rem 0', background: '#1a1d21', borderRadius: '8px' }}>
        <div style={{ minWidth: isMobile ? '600px' : '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={problemData} margin={{ top: 20, right: 30, left: 0, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
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
                contentStyle={{ background: '#2a2d32', border: '1px solid var(--color-border)', borderRadius: '8px', color: '#fff' }}
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
