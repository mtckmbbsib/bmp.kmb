import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Download, Calendar as CalendarIcon, Filter, Image as ImageIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import SearchableSelect from '../components/SearchableSelect';


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

// All others are considered Problem/Standby

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
  if (e < s) e += 24; // Crossed midnight
  return e - s;
};

export default function UaReport() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  
  const [uaData, setUaData] = useState([]); // [{ date: '01-Aug-26', "AFT 017": 26, "MMU-17": 47, ... }]
  const [problemData, setProblemData] = useState([]); // [{ name: 'Standby Waiting Drilling', hours: 6.2 }]
  const [unitList, setUnitList] = useState([]);
  const [unitTypes, setUnitTypes] = useState({}); // { 'MMU-18': 'MMU Truck' }
  const [averagesUA, setAveragesUA] = useState({});
  const [averagesPA, setAveragesPA] = useState({});

  const chartRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [selectedMonth, selectedYear]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // 1. Get all units to form the table columns
      const { data: unitsData } = await supabase.from('units').select('no_lambung, jenis_unit').order('no_lambung');
      const units = [];
      const types = {};
      unitsData?.forEach(u => {
        units.push(u.no_lambung);
        types[u.no_lambung] = u.jenis_unit;
      });
      setUnitList(units);
      setUnitTypes(types);

      // 2. Determine start and end date of the month
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0); // Last day of month
      
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      // 3. Fetch Timesheet Reports and Activities (For UA)
      const { data: reports, error } = await supabase
        .from('timesheet_reports')
        .select(`
          id, report_date, unit_number,
          timesheet_activities ( activity, start_time, end_time )
        `)
        .gte('report_date', startStr)
        .lte('report_date', endStr);

      if (error) throw error;

      // 3b. Fetch PM Reports (For PA)
      const { data: pmReports } = await supabase
        .from('pm_reports')
        .select('report_date, no_lambung, downtime_hours')
        .gte('report_date', startStr)
        .lte('report_date', endStr);

      // 3c. Fetch Repair Reports (For PA)
      const { data: repairReports } = await supabase
        .from('repair_reports')
        .select('report_date, no_lambung, downtime_hours')
        .gte('report_date', startStr)
        .lte('report_date', endStr);

      // 4. Process Data for Table (UA & PA %) and Chart (Problem Hours)
      const daysInMonth = endDate.getDate();
      const dailyUA = {}; // dailyUA['2026-08-01']['AFT 017'] = totalProductiveHours
      const dailyBreakdown = {}; // dailyBreakdown['2026-08-01']['AFT 017'] = totalDowntimeHours
      const problemHoursMap = {};

      // Initialize daily arrays for all days
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(selectedYear, selectedMonth - 1, i);
        // Format: YYYY-MM-DD for easier matching
        const dateKey = d.toISOString().split('T')[0];
        dailyUA[dateKey] = {};
        dailyBreakdown[dateKey] = {};
        units.forEach(u => {
          dailyUA[dateKey][u] = 0;
          dailyBreakdown[dateKey][u] = 0;
        });
      }

      // Aggregate data
      reports?.forEach(report => {
        const dateKey = report.report_date;
        const unit = report.unit_number;
        
        if (!dailyUA[dateKey]) {
          dailyUA[dateKey] = {};
        }
        if (dailyUA[dateKey][unit] === undefined) {
          dailyUA[dateKey][unit] = 0;
        }

        report.timesheet_activities?.forEach(act => {
          const duration = getDurationHours(act.start_time, act.end_time);
          const isProductive = PRODUCTIVE_ACTIVITIES.includes(act.activity);

          if (isProductive) {
            dailyUA[dateKey][unit] += duration;
          } else {
            // It's a problem/standby
            const actName = act.activity || 'Lain-lain';
            problemHoursMap[actName] = (problemHoursMap[actName] || 0) + duration;
          }
        });
      });

      // Aggregate PA Breakdown Hours
      pmReports?.forEach(report => {
        const dateKey = report.report_date;
        const unit = report.no_lambung;
        const dtHours = Number(report.downtime_hours) || 0;
        if (dailyBreakdown[dateKey] && dailyBreakdown[dateKey][unit] !== undefined) {
          dailyBreakdown[dateKey][unit] += dtHours;
        }
      });
      
      repairReports?.forEach(report => {
        const dateKey = report.report_date;
        const unit = report.no_lambung;
        const dtHours = Number(report.downtime_hours) || 0;
        if (dailyBreakdown[dateKey] && dailyBreakdown[dateKey][unit] !== undefined) {
          dailyBreakdown[dateKey][unit] += dtHours;
        }
      });

      // Format Table Data
      const monthShort = startDate.toLocaleString('en-US', { month: 'short' });
      const formattedTableData = [];
      const sumUA = {};
      const countUA = {};
      const sumPA = {};
      const countPA = {};
      units.forEach(u => { 
        sumUA[u] = 0; countUA[u] = 0; 
        sumPA[u] = 0; countPA[u] = 0;
      });

      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(selectedYear, selectedMonth - 1, i);
        const dateKey = d.toISOString().split('T')[0];
        const displayDate = `${String(i).padStart(2, '0')}-${monthShort}-${String(selectedYear).substring(2)}`;
        
        const row = { date: displayDate, rawDate: dateKey };
        units.forEach(u => {
          // UA % = (Productive / 12) * 100
          const prodHours = dailyUA[dateKey]?.[u] || 0;
          let uaPercentage = Math.round((prodHours / 12) * 100);
          if (uaPercentage > 100) uaPercentage = 100;
          
          row[`${u}_UA`] = uaPercentage;
          sumUA[u] += uaPercentage;
          countUA[u] += 1;

          // PA % = ((12 - Breakdown) / 12) * 100
          const isPaTarget = types[u] === 'MMU Truck' || types[u] === 'Anfo Truck';
          if (isPaTarget) {
            const dtHours = dailyBreakdown[dateKey]?.[u] || 0;
            let netAvailable = 12 - dtHours;
            if (netAvailable < 0) netAvailable = 0;
            let paPercentage = Math.round((netAvailable / 12) * 100);
            if (paPercentage > 100) paPercentage = 100;

            row[`${u}_PA`] = paPercentage;
            sumPA[u] += paPercentage;
            countPA[u] += 1;
          } else {
            row[`${u}_PA`] = null; // No PA calculation for others
          }
        });
        formattedTableData.push(row);
      }

      // Calculate Averages
      const avgUARow = {};
      const avgPARow = {};
      units.forEach(u => {
        avgUARow[u] = countUA[u] > 0 ? Math.round(sumUA[u] / countUA[u]) : 0;
        if (types[u] === 'MMU Truck' || types[u] === 'Anfo Truck') {
          avgPARow[u] = countPA[u] > 0 ? Math.round(sumPA[u] / countPA[u]) : 0;
        } else {
          avgPARow[u] = null;
        }
      });
      setAveragesUA(avgUARow);
      setAveragesPA(avgPARow);
      setUaData(formattedTableData);

      // Format Chart Data
      const formattedChartData = Object.keys(problemHoursMap).map(key => ({
        name: key,
        hours: Number(problemHoursMap[key].toFixed(1))
      })).sort((a, b) => b.hours - a.hours); // Sort by highest hours
      
      setProblemData(formattedChartData);

    } catch (err) {
      console.error(err);
      alert("Gagal memuat data laporan UA.");
    }
    setLoading(false);
  };

  const downloadExcel = () => {
    // Transform table data for Excel
    const excelData = uaData.map(row => {
      const newRow = { Date: row.date };
      unitList.forEach(u => {
        const isPaTarget = unitTypes[u] === 'MMU Truck' || unitTypes[u] === 'Anfo Truck';
        newRow[`${u} (UA)`] = `${row[`${u}_UA`]}%`;
        if (isPaTarget) {
          newRow[`${u} (PA)`] = `${row[`${u}_PA`]}%`;
        }
      });
      return newRow;
    });

    // Add Average Row
    const avgObj = { Date: 'AVERAGE' };
    unitList.forEach(u => {
      const isPaTarget = unitTypes[u] === 'MMU Truck' || unitTypes[u] === 'Anfo Truck';
      avgObj[`${u} (UA)`] = `${averagesUA[u]}%`;
      if (isPaTarget) {
        avgObj[`${u} (PA)`] = `${averagesPA[u]}%`;
      }
    });
    excelData.push(avgObj);

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan UA");
    
    // Auto-size columns slightly
    const wscols = [{wch: 15}, ...unitList.map(() => ({wch: 12}))];
    worksheet['!cols'] = wscols;

    const monthName = new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('id-ID', { month: 'long' });
    XLSX.writeFile(workbook, `Laporan_UA_${monthName}_${selectedYear}.xlsx`);
  };

  const downloadChartJpg = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#1a1d21', // Dark background to match theme
        scale: 2 // High resolution
      });
      const link = document.createElement('a');
      link.download = `Grafik_Problem_UA_${selectedMonth}_${selectedYear}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
    } catch (err) {
      console.error("Gagal mendownload grafik:", err);
      alert("Gagal mendownload grafik. Pastikan halaman termuat dengan baik.");
    }
  };

  // Helper for Chart labels
  const renderCustomBarLabel = ({ x, y, width, value }) => {
    return (
      <text x={x + width / 2} y={y - 10} fill="var(--color-silver)" textAnchor="middle" fontSize={12} fontWeight="bold">
        {value > 0 ? value.toFixed(1) : ''}
      </text>
    );
  };

  return (
    <div className="page-container" style={{ paddingBottom: isMobile ? '80px' : '20px' }}>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarIcon size={22} style={{ color: 'var(--color-yellow-primary)' }} />
            Laporan UA (Unit Availability)
          </h1>
          <div style={{ fontSize: '0.725rem', color: 'var(--color-silver)', marginTop: '0.15rem' }}>
            Persentase utilisasi unit harian dan grafik problem
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-bg-card)', padding: '0.25rem 0.5rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <Filter size={16} color="var(--color-silver)" />
            <SearchableSelect 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(Number(e.target.value))}
              style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
            >
              {[...Array(12)].map((_, i) => (
                <option key={i+1} value={i+1} style={{ color: '#000' }}>
                  {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
                </option>
              ))}
            </SearchableSelect>
            <SearchableSelect 
              value={selectedYear} 
              onChange={e => setSelectedYear(Number(e.target.value))}
              style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
            >
              {[...Array(5)].map((_, i) => {
                const y = new Date().getFullYear() - 2 + i;
                return <option key={y} value={y} style={{ color: '#000' }}>{y}</option>
              })}
            </SearchableSelect>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-silver)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
          Memuat data laporan...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Grafik Problem */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--color-yellow-primary)' }}>PROBLEM UA (Jam)</h2>
              <button onClick={downloadChartJpg} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ImageIcon size={14} /> Download JPG
              </button>
            </div>

            <div ref={chartRef} style={{ width: '100%', overflowX: 'auto', padding: '1rem 0', background: '#1a1d21' }}>
              <div style={{ minWidth: isMobile ? '600px' : '100%', height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={problemData} margin={{ top: 20, right: 30, left: 0, bottom: 90 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="var(--color-silver)" 
                      fontSize={11} 
                      interval={0} 
                      angle={-45} 
                      textAnchor="end" 
                      height={90}
                    />
                    <YAxis stroke="var(--color-silver)" fontSize={11} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ background: '#2a2d32', border: '1px solid var(--color-border)', borderRadius: '8px', color: '#fff' }}
                      formatter={(value) => [`${value} Jam`, 'Total Waktu']}
                    />
                    <Bar dataKey="hours" fill="#024bba" radius={[4, 4, 0, 0]} maxBarSize={50}>
                      {problemData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#024bba" />
                      ))}
                      <LabelList dataKey="hours" content={renderCustomBarLabel} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {problemData.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-silver)' }}>
                Tidak ada data problem/standby di bulan ini.
              </div>
            )}
          </div>

          {/* Tabel UA */}
          <div className="card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--color-yellow-primary)' }}>Tabel Persentase UA</h2>
              <button onClick={downloadExcel} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Download size={14} /> Download Excel
              </button>
            </div>

            <div className="table-responsive hide-scrollbar">
              <table className="table" style={{ width: '100%', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th rowSpan={2} style={{ background: '#b7401c', color: '#fff', textAlign: 'center', borderRight: '1px solid #fff', verticalAlign: 'middle' }}>Date</th>
                    {unitList.map(u => {
                      const isPaTarget = unitTypes[u] === 'MMU Truck' || unitTypes[u] === 'Anfo Truck';
                      return (
                        <th key={u} colSpan={isPaTarget ? 2 : 1} style={{ background: '#e1a613', color: '#fff', textAlign: 'center', borderLeft: '1px solid rgba(0,0,0,0.1)' }}>
                          {u}
                        </th>
                      )
                    })}
                  </tr>
                  <tr>
                    {unitList.map(u => {
                      const isPaTarget = unitTypes[u] === 'MMU Truck' || unitTypes[u] === 'Anfo Truck';
                      if (isPaTarget) {
                        return (
                          <React.Fragment key={`${u}-sub`}>
                            <th style={{ background: '#eab839', color: '#fff', textAlign: 'center', borderLeft: '1px solid rgba(0,0,0,0.1)' }}>UA</th>
                            <th style={{ background: '#d6a32a', color: '#fff', textAlign: 'center', borderLeft: '1px solid rgba(0,0,0,0.1)' }}>PA</th>
                          </React.Fragment>
                        );
                      }
                      return (
                        <th key={`${u}-sub`} style={{ background: '#eab839', color: '#fff', textAlign: 'center', borderLeft: '1px solid rgba(0,0,0,0.1)' }}>UA</th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {uaData.map((row, idx) => (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.2)' }}>
                      <td style={{ fontWeight: 'bold', color: 'var(--color-silver-light)', borderRight: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                        {row.date}
                      </td>
                      {unitList.map(u => {
                        const isPaTarget = unitTypes[u] === 'MMU Truck' || unitTypes[u] === 'Anfo Truck';
                        return (
                          <React.Fragment key={`${row.date}-${u}`}>
                            <td style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                              {row[`${u}_UA`]}%
                            </td>
                            {isPaTarget && (
                              <td style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.05)', color: 'var(--color-yellow-primary)' }}>
                                {row[`${u}_PA`]}%
                              </td>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                  {/* AVERAGE ROW */}
                  <tr style={{ background: 'var(--color-yellow-primary)', color: '#000', fontWeight: 'bold' }}>
                    <td style={{ borderRight: '1px solid rgba(0,0,0,0.2)', textAlign: 'center' }}>AVERAGE</td>
                    {unitList.map(u => {
                      const isPaTarget = unitTypes[u] === 'MMU Truck' || unitTypes[u] === 'Anfo Truck';
                      return (
                        <React.Fragment key={`avg-${u}`}>
                          <td style={{ textAlign: 'center', borderLeft: '1px solid rgba(0,0,0,0.1)' }}>
                            {averagesUA[u]}%
                          </td>
                          {isPaTarget && (
                            <td style={{ textAlign: 'center', borderLeft: '1px solid rgba(0,0,0,0.1)' }}>
                              {averagesPA[u]}%
                            </td>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
