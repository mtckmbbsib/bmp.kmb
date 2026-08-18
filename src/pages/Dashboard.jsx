import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  AlertTriangle, Wrench, Calendar, CheckCircle2, Clock, ShieldAlert, Truck, Search, RefreshCw, Sparkles, Cpu, Activity,
  LayoutDashboard, PlusCircle, ClipboardCheck, PenTool, UserPlus, LogOut, ChevronLeft, ChevronRight, Bell, X, TrendingUp, CalendarClock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ProblemUaWidget from '../components/ProblemUaWidget';
import SearchableSelect from '../components/SearchableSelect';


// ── DATA STORE UNTUK DASHBOARD ──
const INITIAL_UNITS = [];
const INITIAL_REPAIR_HISTORY = [];

// Helper kalkulasi tanggal estimasi AI
function addDaysToCurrentDate(days) {
  const result = new Date();
  result.setDate(result.getDate() + Math.max(0, days));
  return result.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [units, setUnits] = useState(INITIAL_UNITS);
  const [repairHistory, setRepairHistory] = useState(INITIAL_REPAIR_HISTORY);
  const [rawPmReports, setRawPmReports] = useState([]);
  const [todayWeeklySchedules, setTodayWeeklySchedules] = useState([]);
  const [todayP2hReports, setTodayP2hReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mobile View & Slider State
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const [activeSlide, setActiveSlide] = useState(0); // 0: Weekly Pending, 1: Belum P2H, 2: Riwayat P2H
  const [p2hFilter, setP2hFilter] = useState('All'); // 'All', 'Sudah', 'Belum'
  const [showNotifModal, setShowNotifModal] = useState(false);
  
  // Desktop Tabs State
  const [desktopTab, setDesktopTab] = useState('overview');

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar dari sistem?")) {
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  // Filters
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceAlertFilter, setServiceAlertFilter] = useState('All');
  const [repairSearchQuery, setRepairSearchQuery] = useState('');
  
  // Pending Goods Issue State
  const [pendingGoodsIssues, setPendingGoodsIssues] = useState([]);

  // Function to handle Goods Issue checklist
  const handleGoodsIssueCheck = async (reportId, reportType, partIndex) => {
    try {
      const table = reportType === 'pm' ? 'pm_reports' : 'repair_reports';
      const { data, error } = await supabase.from(table).select('spare_parts').eq('id', reportId).single();
      
      if (error) throw error;
      if (!data || !data.spare_parts) return;
      
      const updatedParts = [...data.spare_parts];
      if (updatedParts[partIndex]) {
        updatedParts[partIndex].is_goods_issued = true;
      }
      
      const { error: updateErr } = await supabase.from(table).update({ spare_parts: updatedParts }).eq('id', reportId);
      if (updateErr) throw updateErr;
      
      // Update local state to immediately remove it from view
      setPendingGoodsIssues(prev => prev.filter(item => !(item.reportId === reportId && item.reportType === reportType && item.partIndex === partIndex)));
      
    } catch (err) {
      console.error('Error updating goods issue:', err);
      alert('Gagal mengupdate status Goods Issue.');
    }
  };

  // Interactive Sparepart Monitor Filters
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('All');
  const [selectedPartFilter, setSelectedPartFilter] = useState('All');
  const [chartUnitType, setChartUnitType] = useState('Pcs'); // Pcs or Liter

  // AI Simulation Settings (Default Rate Adjustment)
  const [simulatedDailyRateMultiplier, setSimulatedDailyRateMultiplier] = useState(1.0);

  // MMU Capacity Simulation State
  const simTargetRitasi = 2; // Hardcoded default max ritasi per hari
  const [activeBreakdownWOs, setActiveBreakdownWOs] = useState([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Laporan PM Service & Perbaikan Terbaru
      const [pmRes, repRes] = await Promise.all([
        supabase.from('pm_reports').select('*').order('created_at', { ascending: false }),
        supabase.from('repair_reports').select('*').order('created_at', { ascending: false })
      ]);
      
      const pmData = pmRes.data || [];
      const repData = repRes.data || [];
      
      // Map HM terbaru per unit dari laporan PM Service
      const latestHmByUnit = {};
      if (pmData.length > 0) {
        setRawPmReports(pmData);
        pmData.forEach(p => {
          if (p.no_lambung && p.hm_value) {
            const val = Number(p.hm_value);
            if (!isNaN(val) && val > 0) {
              latestHmByUnit[p.no_lambung] = Math.max(latestHmByUnit[p.no_lambung] || 0, val);
            }
          }
        });
      }

      const pendingGI = [];
      const combinedHistory = [];

      // Process PM Reports
      pmData.forEach(p => {
        if (p.spare_parts && Array.isArray(p.spare_parts) && p.spare_parts.length > 0) {
          const partsText = p.spare_parts
            .map(sp => `${sp.partName}${sp.partNumber ? ` (${sp.partNumber})` : ''} - ${sp.qty} ${sp.unit} [${sp.statusPart || 'Baru'}]`)
            .join(', ');

          combinedHistory.push({
            id: `pm_${p.id}`,
            tanggal: p.report_date || p.created_at?.split('T')[0] || '-',
            noLambung: p.no_lambung,
            jenisUnit: p.jenis_unit,
            jenisKerusakan: `Pergantian Rutin ${p.pm_tier || 'PM Service'}`,
            pergantianPart: partsText,
            rawParts: p.spare_parts,
            mekanik: p.reporter || 'Mekanik Site',
            status: 'Selesai'
          });

          // Check pending Goods Issue
          p.spare_parts.forEach((sp, idx) => {
            if (!sp.is_goods_issued) {
              pendingGI.push({
                reportId: p.id,
                reportType: 'pm',
                partIndex: idx,
                tanggal: p.report_date || p.created_at?.split('T')[0],
                noLambung: p.no_lambung,
                partName: sp.partName,
                partNumber: sp.partNumber,
                qty: sp.qty,
                unit: sp.unit,
                mekanik: p.reporter || 'Mekanik'
              });
            }
          });
        }
      });

      // Process Repair Reports
      repData.forEach(r => {
        if (r.spare_parts && Array.isArray(r.spare_parts) && r.spare_parts.length > 0) {
          const partsText = r.spare_parts
            .map(sp => `${sp.partName}${sp.partNumber ? ` (${sp.partNumber})` : ''} - ${sp.qty} ${sp.unit} [${sp.statusPart || 'Baru'}]`)
            .join(', ');

          combinedHistory.push({
            id: `rep_${r.id}`,
            tanggal: r.report_date || r.created_at?.split('T')[0] || '-',
            noLambung: r.no_lambung,
            jenisUnit: r.unit_detail?.split('-')[0]?.trim() || '',
            jenisKerusakan: r.perbaikan || r.indikasi_masalah || 'Perbaikan',
            pergantianPart: partsText,
            rawParts: r.spare_parts,
            mekanik: r.teknisi || r.mekanik || 'Mekanik',
            status: r.status_perbaikan || 'Selesai'
          });

          // Check pending Goods Issue
          r.spare_parts.forEach((sp, idx) => {
            if (!sp.is_goods_issued) {
              pendingGI.push({
                reportId: r.id,
                reportType: 'repair',
                partIndex: idx,
                tanggal: r.report_date || r.created_at?.split('T')[0],
                noLambung: r.no_lambung,
                partName: sp.partName,
                partNumber: sp.partNumber,
                qty: sp.qty,
                unit: sp.unit,
                mekanik: r.teknisi || r.mekanik || 'Mekanik'
              });
            }
          });
        }
      });

      // Sort combined history desc by date
      combinedHistory.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      setRepairHistory(combinedHistory);
      
      // Sort pending GI desc by date
      pendingGI.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      setPendingGoodsIssues(pendingGI);

      // 1.5. Fetch P2H Reports to calculate dynamic HM daily usage rate per unit
      const { data: p2hData } = await supabase
        .from('p2h_reports')
        .select('no_lambung, report_date, hmkm, created_at')
        .order('created_at', { ascending: true });
        
      const dynamicDailyRates = {};

      if (p2hData && p2hData.length > 0) {
        const reportsByUnit = {};
        p2hData.forEach(r => {
          const unitNo = r.no_lambung;
          const hm = Number(r.hmkm);
          const dateStr = r.report_date || r.created_at?.split('T')[0];
          if (unitNo && !isNaN(hm) && hm > 0 && dateStr) {
            if (!reportsByUnit[unitNo]) reportsByUnit[unitNo] = [];
            const existingIndex = reportsByUnit[unitNo].findIndex(x => x.dateStr === dateStr);
            if (existingIndex >= 0) {
              reportsByUnit[unitNo][existingIndex].hm = Math.max(reportsByUnit[unitNo][existingIndex].hm, hm);
            } else {
              reportsByUnit[unitNo].push({ dateStr, dateObj: new Date(dateStr), hm });
            }
          }
        });

        Object.keys(reportsByUnit).forEach(unitNo => {
          const list = reportsByUnit[unitNo].sort((a, b) => a.dateObj - b.dateObj);
          if (list.length >= 2) {
            const minEntry = list[0];
            const maxEntry = list[list.length - 1];
            const diffTime = Math.abs(maxEntry.dateObj - minEntry.dateObj);
            const diffDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
            const diffHm = maxEntry.hm - minEntry.hm;

            if (diffDays > 0 && diffHm >= 0) {
              const calculatedRate = diffHm / diffDays;
              dynamicDailyRates[unitNo] = Number(calculatedRate.toFixed(1));
            }
          }
        });
      }

      // 2. Fetch Master Data Unit & Timpa dengan HM Terbaru dari Laporan PM
      const { data: unitData, error: unitErr } = await supabase.from('units').select('*');
      if (!unitErr && unitData && unitData.length > 0) {
        const mappedUnits = unitData.map(u => {
          const noLambung = u.no_lambung || u.noLambung;
          const baseHm = Number(u.hm_km || u.hmkm || 0);
          const pmHm = latestHmByUnit[noLambung] || 0;
          const currentHm = Math.max(baseHm, pmHm);

          const calculatedRate = dynamicDailyRates[noLambung];
          const fallbackRate = u.jenis_unit?.includes('LV') ? 45 : 14;
          const finalDailyRate = (calculatedRate !== undefined && calculatedRate > 0) ? calculatedRate : (calculatedRate === 0 ? 0.5 : fallbackRate);

          return {
            id: u.id,
            jenisUnit: u.jenis_unit || u.jenisUnit || 'Unit',
            noLambung,
            merk: u.merk || '',
            tipe: u.tipe || '',
            hmkm: currentHm,
            dailyRate: finalDailyRate,
            isDynamicRate: calculatedRate !== undefined,
            status: u.status || 'Unit Aktif',
            nextService: u.next_service || u.nextService || null,
            brakeTest: u.next_brake_test || u.nextBrakeTest || 'NA',
            commissioning: u.next_commissioning || u.nextCommissioning || 'NA',
            sertifikasi: u.next_sertifikasi || u.nextSertifikasi || 'NA'
          };
        });
        setUnits(mappedUnits);
      }

      // 3. Fetch Jadwal Weekly Service & Cek Notifikasi Hari Ini (Cek weekly_reports DAN pm_reports)
      try {
        const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const todayName = DAYS_ID[new Date().getDay()];
        const todayDateStr = new Date().toISOString().split('T')[0];

        const [resSched, resW, resP] = await Promise.all([
          supabase.from('weekly_schedules').select('*'),
          supabase.from('weekly_reports').select('no_lambung, report_date').eq('report_date', todayDateStr),
          supabase.from('pm_reports').select('no_lambung, report_date').eq('report_date', todayDateStr)
        ]);

        const completedUnitsToday = new Set([
          ...(resW.data || []).map(r => r.no_lambung || r.noLambung),
          ...(resP.data || []).map(r => r.no_lambung || r.noLambung)
        ]);

        if (!resSched.error && resSched.data) {
          const mappedTodaySched = resSched.data
            .filter(s => s.day === todayName)
            .map(s => {
              const unitNo = s.no_lambung || s.unit;
              const isCompleted = completedUnitsToday.has(unitNo);
              return {
                id: s.id,
                day: s.day,
                noLambung: unitNo,
                jenisUnit: s.jenis_unit || s.jenisUnit || 'Unit',
                shift: s.shift || 'Shift 1 (Siang)',
                lokasi: s.lokasi || 'Workshop Main',
                isCompleted
              };
            });

          setTodayWeeklySchedules(mappedTodaySched);
        }
        // 4. Fetch Laporan P2H Hari Ini
        try {
          const { data: p2hData, error: p2hErr } = await supabase.from('p2h_reports').select('*').eq('report_date', todayDateStr);
          if (!p2hErr && p2hData) {
            setTodayP2hReports(p2hData);
          }
        } catch (e) {
          console.warn('P2H fetch error:', e);
        }

        // 5. Fetch Active Breakdown Work Orders
        try {
          const { data: woData, error: woErr } = await supabase
            .from('work_orders')
            .select('*')
            .eq('kategori_pekerjaan', 'Perbaikan Breakdown');
            
          if (!woErr && woData) {
            const activeWo = woData.filter(wo => 
              wo.status !== 'Completed (Selesai)' && wo.status !== 'Canceled (Dibatalkan)'
            );
            setActiveBreakdownWOs(activeWo);
          }
        } catch (e) {
          console.warn('WO fetch error:', e);
        }

      } catch (err) {
        console.warn('Fetch weekly schedules error on dashboard:', err);
      }

    } catch (err) {
      console.warn('Dashboard fetch fallback to local state:', err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchDashboardData();
  }, []);

  // AI PREDICTIVE SERVICE CALCULATIONS (Target HM Terdekat dalam Kelipatan 250 HM)
  const processedUnits = useMemo(() => {
    return units.map(u => {
      const curHm = u.hmkm;
      const rate = (u.dailyRate || 14) * simulatedDailyRateMultiplier;

      // 1. Jika pengguna secara manual mengisi target Next Service (misal 2750), gunakan angka tersebut!
      // 2. Jika tidak diisi atau sudah pernah service, hitung otomatis ke kelipatan 250 HM berikutnya.
      let nextTargetHm = u.nextService && Number(u.nextService) > 0 ? Number(u.nextService) : Math.ceil((curHm + 1) / 250) * 250;

      // Jika sudah ada laporan PM Service / Weekly Service yang masuk untuk unit ini dan melampaui target lama
      if (curHm >= nextTargetHm) {
        const hasRecentReport = rawPmReports.some(r => r.no_lambung === u.noLambung && Number(r.hm_value) >= nextTargetHm - 50);
        if (hasRecentReport) {
          nextTargetHm = Math.ceil((curHm + 1) / 250) * 250;
        }
      }


      // Jika HM saat ini sudah MELEBIHI / MELEWATI target (misal target 2750 tapi HM sekarang 2763):
      // Maka statusnya menjadi OVERDUE (Terlewat) dari target 2750 HM tersebut!
      const isServiceOverdue = curHm >= nextTargetHm;
      const remainingHm = isServiceOverdue ? 0 : nextTargetHm - curHm;
      const overdueHm = isServiceOverdue ? curHm - nextTargetHm : 0;

      const daysToNext = isServiceOverdue ? 0 : Math.ceil(remainingHm / rate);
      const estNextDate = addDaysToCurrentDate(daysToNext);

      // Penentuan Form PM yang digunakan
      let pmType = 'PM 250';
      let formNote = 'Gunakan Form PM 250';

      if (nextTargetHm % 1000 === 0) {
        pmType = 'PM 1000';
        formNote = 'Gunakan Form PM 1000 (Major Service)';
      } else if (nextTargetHm % 500 === 0) {
        pmType = 'PM 500';
        formNote = 'Gunakan Form PM 500 (Medium Service)';
      } else {
        pmType = `PM ${nextTargetHm % 1000 || 250}`;
        formNote = 'Gunakan Form PM 250';
      }

      // Progress bar percentage ke target HM berikutnya
      const prevTarget = nextTargetHm - 250;
      const progressPercent = isServiceOverdue ? 100 : Math.min(100, Math.max(0, Math.round(((curHm - prevTarget) / 250) * 100)));

      // Status Badges & Alerts
      let isServiceDueSoon = !isServiceOverdue && remainingHm <= 30;

      let remarkBadge = {
        label: `NORMAL (${remainingHm} HM)`,
        color: '#81c784',
        bg: 'rgba(76,175,80,0.15)',
        border: 'rgba(76,175,80,0.3)',
      };

      if (isServiceOverdue) {
        remarkBadge = {
          label: `🚨 OVERDUE (${overdueHm > 0 ? `Lewat ${overdueHm} HM` : `${nextTargetHm} HM`})`,
          color: '#ff5252',
          bg: 'rgba(255,82,82,0.2)',
          border: '#f44336',
        };
      } else if (isServiceDueSoon) {
        const isIdleStagnant = u.dailyRate <= 1;
        remarkBadge = {
          label: isIdleStagnant ? `⚠️ PM DUE SOON (MEPET ${remainingHm < 1 ? remainingHm.toFixed(2) : Math.round(remainingHm)} HM - UNIT IDLE)` : `⚠️ PM DUE SOON (${Math.round(remainingHm)} HM)`,
          color: '#ffb74d',
          bg: 'rgba(255,183,77,0.2)',
          border: '#ff9800',
        };
      }

      return {
        ...u,
        dailyRateEst: Math.round(rate),
        nextTargetHm,
        remainingHm,
        overdueHm,
        daysToNext,
        estNextDate,
        pmType,
        formNote,
        progressPercent,
        isServiceOverdue,
        isServiceDueSoon,
        remarkBadge
      };
    });
  }, [units, simulatedDailyRateMultiplier]);

  // Filtered Monitored Units
  const filteredUnits = useMemo(() => {
    return processedUnits.filter(u => {
      const matchType = filterType === 'All' || u.jenisUnit === filterType;
      const matchSearch = !searchQuery || u.noLambung.toLowerCase().includes(searchQuery.toLowerCase()) || u.jenisUnit.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchAlert = true;
      if (serviceAlertFilter === 'Overdue') matchAlert = u.isServiceOverdue;
      if (serviceAlertFilter === 'DueSoon') matchAlert = u.isServiceDueSoon || u.isServiceOverdue;
      if (serviceAlertFilter === 'Repair') matchAlert = u.status === 'Dalam Perbaikan';

      return matchType && matchSearch && matchAlert;
    });
  }, [processedUnits, filterType, searchQuery, serviceAlertFilter]);

  // Upcoming AI Service Forecast List (Sorted by nearest estimated date)
  const aiForecastQueue = useMemo(() => {
    return [...processedUnits].sort((a, b) => a.daysToNext - b.daysToNext);
  }, [processedUnits]);

  // Filtered Repair History
  const filteredRepairs = useMemo(() => {
    return repairHistory.filter(r => {
      if (!repairSearchQuery) return true;
      const q = repairSearchQuery.toLowerCase();
      return r.noLambung.toLowerCase().includes(q) || 
             r.jenisKerusakan.toLowerCase().includes(q) || 
             r.pergantianPart.toLowerCase().includes(q) ||
             r.jenisUnit.toLowerCase().includes(q);
    });
  }, [repairHistory, repairSearchQuery]);

  // Analytics & Aggregation untuk Monitoring Dynamic Spareparts
  const allDispatchedPartsList = useMemo(() => {
    const list = [];
    rawPmReports.forEach(rep => {
      if (rep.spare_parts && Array.isArray(rep.spare_parts)) {
        rep.spare_parts.forEach(sp => {
          if (sp.partName && sp.partName.trim() !== '') {
            list.push({
              reportId: rep.id,
              tanggal: rep.report_date || rep.created_at?.split('T')[0] || '-',
              noLambung: rep.no_lambung,
              jenisUnit: rep.jenis_unit,
              partName: sp.partName,
              partNumber: sp.partNumber || '-',
              qty: Number(sp.qty) || 1,
              unit: sp.unit || 'Pcs',
              statusPart: sp.statusPart || 'Baru',
              reporter: rep.reporter || 'Mekanik Site',
              pmTier: rep.pm_tier || 'PM Service'
            });
          }
        });
      }
    });
    return list;
  }, [rawPmReports]);

  // Unique Unit Options & Part Name Options for Filters
  const uniqueUnitsForParts = useMemo(() => {
    return Array.from(new Set(allDispatchedPartsList.map(p => p.noLambung))).sort();
  }, [allDispatchedPartsList]);

  const uniquePartNames = useMemo(() => {
    return Array.from(new Set(allDispatchedPartsList.map(p => p.partName))).sort();
  }, [allDispatchedPartsList]);

  // Dynamic Chart Data: Top 6 Most Replaced Parts (Grafik Frekuensi / Volume Keluar)
  const sparePartChartData = useMemo(() => {
    const counts = {};
    allDispatchedPartsList.forEach(item => {
      // Pisahkan oli (Liter) dengan part umum (Non-Liter) agar skala chart tidak rusak
      if (chartUnitType === 'Liter' && item.unit !== 'Liter') return;
      if (chartUnitType === 'Pcs' && item.unit === 'Liter') return;

      const pNum = (item.partNumber || '').trim();
      const pName = (item.partName || '').trim();
      const key = (pNum && pNum !== '-') ? pNum : pName;
      const label = (pNum && pNum !== '-') ? `${pNum} (${pName})` : pName;

      if (!counts[key]) counts[key] = { name: label, totalQty: 0, count: 0 };
      counts[key].totalQty += item.qty;
      counts[key].count += 1;
    });

    return Object.values(counts)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 6);
  }, [allDispatchedPartsList, chartUnitType]);

  // Filtered Dispatched Parts Table Data (Bidirectional Monitor)
  const filteredDispatchedParts = useMemo(() => {
    return allDispatchedPartsList.filter(item => {
      const matchUnit = selectedUnitFilter === 'All' || item.noLambung === selectedUnitFilter;
      const matchPart = selectedPartFilter === 'All' || item.partName === selectedPartFilter;
      return matchUnit && matchPart;
    });
  }, [allDispatchedPartsList, selectedUnitFilter, selectedPartFilter]);

  // Data Unit P2H Status Hari Ini (Sudah vs Belum)
  const p2hStatusList = useMemo(() => {
    const todayDateStr = new Date().toISOString().split('T')[0];
    return units.map(u => {
      const rep = todayP2hReports.find(r => 
        (r.no_lambung || r.unit || r.noLambung) === u.noLambung &&
        (r.report_date || r.date || '').includes(todayDateStr)
      );

      return {
        ...u,
        hasP2hToday: !!rep,
        p2hReport: rep || null
      };
    });
  }, [units, todayP2hReports]);

  const p2hSudahCount = useMemo(() => p2hStatusList.filter(u => u.hasP2hToday).length, [p2hStatusList]);
  const p2hBelumCount = useMemo(() => p2hStatusList.filter(u => !u.hasP2hToday).length, [p2hStatusList]);

  const filteredP2hStatusList = useMemo(() => {
    if (p2hFilter === 'Sudah') return p2hStatusList.filter(u => u.hasP2hToday);
    if (p2hFilter === 'Belum') return p2hStatusList.filter(u => !u.hasP2hToday);
    return p2hStatusList;
  }, [p2hStatusList, p2hFilter]);

  // KPI Summary Calculations
  const totalUnits = units.length;
  const activeCount = units.filter(u => u.status === 'Unit Aktif').length;
  const repairCount = units.filter(u => u.status === 'Dalam Perbaikan').length;
  const overdueCount = processedUnits.filter(u => u.isServiceOverdue).length;
  const dueSoonCount = processedUnits.filter(u => u.isServiceDueSoon).length;

  // Chart Data by Category
  const chartData = useMemo(() => {
    const categories = Array.from(new Set(units.map(u => u.jenisUnit)));
    return categories.map(cat => {
      const catUnits = units.filter(u => u.jenisUnit === cat);
      return {
        name: cat,
        active: catUnits.filter(u => u.status === 'Unit Aktif').length,
        repair: catUnits.filter(u => u.status === 'Dalam Perbaikan').length,
        total: catUnits.length
      };
    });
  }, [units]);

  // MMU Simulation Logic
  const mmuUnits = useMemo(() => {
    return units.filter(u => u.jenisUnit && u.jenisUnit.toLowerCase().includes('mmu'));
  }, [units]);

  const autoBreakdownData = useMemo(() => {
    const downMmuSet = new Set();
    let totalLostCycles = 0;
    
    activeBreakdownWOs.forEach(wo => {
      const isMmu = mmuUnits.some(u => u.noLambung === wo.no_lambung);
      if (isMmu) {
        downMmuSet.add(wo.no_lambung);
        const estJam = Number(wo.estimasi_jam) || 0;
        
        // Calculate lost cycles capped at daily target (simTargetRitasi)
        // 1 Cycle = 4 Jam. If estJam > 0, at least 1 cycle is lost.
        const cycles = estJam > 0 ? Math.ceil(estJam / 4) : 0;
        const lostCycles = Math.min(simTargetRitasi, cycles);
        totalLostCycles += lostCycles;
      }
    });

    return {
      downUnits: Array.from(downMmuSet),
      totalLostCycles
    };
  }, [activeBreakdownWOs, mmuUnits, simTargetRitasi]);

  const mmuCapacityStats = useMemo(() => {
    const maxHeavyAnfo = 17;
    const maxEmulsion = 19.8;
    
    const lostCycles = autoBreakdownData.totalLostCycles;
    const totalTargetCycles = mmuUnits.length * simTargetRitasi;
    const remainingCycles = Math.max(0, totalTargetCycles - lostCycles);

    return {
      lostHeavyAnfo: lostCycles * maxHeavyAnfo,
      lostEmulsion: lostCycles * maxEmulsion,
      readyHeavyAnfo: remainingCycles * maxHeavyAnfo,
      readyEmulsion: remainingCycles * maxEmulsion,
    };
  }, [autoBreakdownData.totalLostCycles, mmuUnits.length, simTargetRitasi]);

  const userStr = localStorage.getItem('user');
  const loggedInUserObj = userStr ? JSON.parse(userStr) : null;
  const userName = loggedInUserObj?.name || loggedInUserObj?.full_name || loggedInUserObj?.username || 'Pengguna';
  const userRole = loggedInUserObj?.jabatan || 'User';
  const userRoleLower = userRole.toLowerCase();
  const isAdmin = userRoleLower.includes('admin');
  const canManage = 
    userRoleLower.includes('admin') || 
    userRoleLower.includes('leading hand maintenance') || 
    userRoleLower.includes('mechanic') || 
    userRoleLower.includes('mekanik');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', overflowY: 'auto' }}>
      
      {/* ── MOBILE DASHBOARD VIEW (< 768px atau toggle mobile) ── */}
      {isMobileView ? (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', overflowY: 'auto', paddingBottom: '62px' }}>
          
          {/* ── BAGIAN ATAS: HEADER WELCOME UNTUK USER ── */}
          <div className="mobile-welcome-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
              <div className="mobile-avatar-badge">
                👤
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-silver)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Selamat Datang 👋
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--color-yellow-primary)', lineHeight: '1.2' }}>
                  {userName}
                </div>
                <div style={{ fontSize: '0.675rem', color: '#81c784', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.1rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4caf50', display: 'inline-block' }}></span>
                  {userRole}
                </div>
              </div>
            </div>

            {/* Notification Bell (Lonceng Notifikasi Jika Ada Pending) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button 
                type="button"
                className="mobile-notif-btn"
                onClick={() => setShowNotifModal(true)} 
                title="Notifikasi & Tugas Pending"
              >
                <Bell size={19} />
                {(todayWeeklySchedules.filter(s => !s.isCompleted).length + p2hBelumCount) > 0 && (
                  <span className="mobile-notif-badge">
                    {todayWeeklySchedules.filter(s => !s.isCompleted).length + p2hBelumCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ── MENU UTAMA 3 x 2 GRID (Tanpa Dashboard & Keluar) ── */}
          <div className="mobile-menu-container">
            {canManage && (
              <Link to="/add-unit" className="mobile-menu-card">
                <PlusCircle size={22} style={{ marginBottom: '0.2rem', color: '#ffb74d' }} />
                <span>Tambah SPIP</span>
              </Link>
            )}
            <Link to="/p2h" className="mobile-menu-card">
              <ClipboardCheck size={22} style={{ marginBottom: '0.2rem', color: '#81c784' }} />
              <span>P2H Harian</span>
            </Link>
            <Link to="/timesheet" className="mobile-menu-card">
              <CalendarClock size={22} style={{ marginBottom: '0.2rem', color: '#4db6ac' }} />
              <span>PA / UA</span>
            </Link>
            {canManage && (
              <>
                <Link to="/weekly-service" className="mobile-menu-card">
                  <Calendar size={22} style={{ marginBottom: '0.2rem', color: '#64b5f6' }} />
                  <span>Weekly</span>
                </Link>
                <Link to="/pm-service" className="mobile-menu-card">
                  <Wrench size={22} style={{ marginBottom: '0.2rem', color: '#ba68c8' }} />
                  <span>PM Service</span>
                </Link>
                <Link to="/report" className="mobile-menu-card">
                  <PenTool size={22} style={{ marginBottom: '0.2rem', color: '#ff8a80' }} />
                  <span>Report</span>
                </Link>
              </>
            )}
            {isAdmin && (
              <Link to="/add-user" className="mobile-menu-card">
                <UserPlus size={22} style={{ marginBottom: '0.2rem', color: '#4dd0e1' }} />
                <span>Tambah Akun</span>
              </Link>
            )}
          </div>

          {/* ── RUANG SLIDER P2H LENGKAP & WEEKLY SERVICE ── */}
          <div className="mobile-slider-wrapper">
            {/* Tab Switching Bar Modern (Pill Tabs) */}
            <div className="mobile-slider-tabs-modern">
              <button 
                type="button"
                className={`mobile-slider-tab-pill ${activeSlide === 0 ? 'active' : ''}`}
                onClick={() => setActiveSlide(0)}
              >
                <Calendar size={13} />
                <span>Pengingat ({todayWeeklySchedules.length + pendingGoodsIssues.length})</span>
              </button>
              <button 
                type="button"
                className={`mobile-slider-tab-pill ${activeSlide === 1 ? 'active' : ''}`}
                onClick={() => setActiveSlide(1)}
              >
                <Clock size={13} />
                <span>🔴 Belum P2H ({p2hBelumCount})</span>
              </button>
              <button 
                type="button"
                className={`mobile-slider-tab-pill ${activeSlide === 2 ? 'active' : ''}`}
                onClick={() => setActiveSlide(2)}
              >
                <CheckCircle2 size={13} />
                <span>🟢 Riwayat ({p2hSudahCount})</span>
              </button>
            </div>

            {/* Slider Content Body */}
            <div className="mobile-slider-content hide-scrollbar">
              
              {/* TAB 1: PENGINGAT WEEKLY SERVICE PENDING */}
              {activeSlide === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-yellow-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={15} /> Pengingat Weekly Service Hari Ini
                    </div>
                    <Link to="/weekly-service" style={{ fontSize: '0.725rem', color: '#64b5f6', textDecoration: 'none', fontWeight: '600' }}>
                      Ke Weekly →
                    </Link>
                  </div>

                  {todayWeeklySchedules.length === 0 ? (
                    <div style={{ padding: '1.5rem 1rem', textAlign: 'center', background: 'var(--color-bg-card)', borderRadius: '8px', border: '1px dashed var(--color-border)', color: 'var(--color-silver)' }}>
                      <CheckCircle2 size={32} style={{ color: '#81c784', marginBottom: '0.4rem', display: 'inline-block' }} />
                      <div style={{ fontSize: '0.825rem', fontWeight: '600', color: '#ffffff' }}>Tidak ada jadwal Weekly Service pending hari ini</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--color-silver-dark)', marginTop: '0.2rem' }}>Semua unit dalam kondisi terpelihara dengan baik.</div>
                    </div>
                  ) : (
                    todayWeeklySchedules.map(sched => (
                      <div 
                        key={sched.id} 
                        style={{
                          padding: '0.65rem 0.75rem',
                          background: 'var(--color-bg-card)',
                          borderRadius: '8px',
                          borderLeft: `4px solid ${sched.isCompleted ? '#4caf50' : '#ff9800'}`,
                          borderTop: '1px solid var(--color-border)',
                          borderRight: '1px solid var(--color-border)',
                          borderBottom: '1px solid var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--color-yellow-primary)', fontSize: '0.9rem' }}>{sched.noLambung}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-silver)', background: 'var(--color-bg-main)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{sched.jenisUnit}</span>
                          </div>
                          <div style={{ fontSize: '0.725rem', color: 'var(--color-silver)', marginTop: '0.2rem' }}>
                            📍 {sched.lokasi} • {sched.shift}
                          </div>
                        </div>

                        <div>
                          {sched.isCompleted ? (
                            <span style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: 'rgba(76,175,80,0.15)', color: '#81c784', border: '1px solid #4caf50', fontWeight: '600' }}>
                              ✓ Selesai
                            </span>
                          ) : (
                            <Link 
                              to="/weekly-service" 
                              style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem', borderRadius: '4px', backgroundColor: 'rgba(255,152,0,0.2)', color: '#ffb74d', border: '1px solid #ff9800', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                            >
                              Isi Form →
                            </Link>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* PENDING GOODS ISSUE MOBILE WIDGET */}
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: pendingGoodsIssues.length > 0 ? '#ff5252' : '#81c784', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
                      {pendingGoodsIssues.length > 0 ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
                      {pendingGoodsIssues.length > 0 ? `Pending Goods Issue (${pendingGoodsIssues.length})` : 'Semua Part Telah di-GI'}
                    </div>
                    
                    {pendingGoodsIssues.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {pendingGoodsIssues.map((item, idx) => (
                          <div key={`${item.reportId}-${item.partIndex}-${idx}`} style={{
                            padding: '0.65rem 0.75rem',
                            background: 'var(--color-bg-card)',
                            borderRadius: '8px',
                            borderLeft: '4px solid #ff5252',
                            borderTop: '1px solid var(--color-border)',
                            borderRight: '1px solid var(--color-border)',
                            borderBottom: '1px solid var(--color-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.5rem'
                          }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ fontWeight: 'bold', color: 'var(--color-yellow-primary)', fontSize: '0.9rem' }}>{item.noLambung}</span>
                                <span style={{ fontSize: '0.7rem', color: '#ff8a80', fontWeight: 'bold' }}>{item.qty} {item.unit}</span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#ffffff', marginTop: '0.2rem' }}>
                                {item.partName} <span style={{ color: 'var(--color-silver)' }}>{item.partNumber ? `(${item.partNumber})` : ''}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleGoodsIssueCheck(item.reportId, item.reportType, item.partIndex)}
                              className="btn btn-primary"
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', height: 'auto', borderRadius: '4px' }}
                            >
                              <CheckCircle2 size={12} /> Selesai
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '1rem', textAlign: 'center', background: 'var(--color-bg-card)', borderRadius: '8px', border: '1px dashed #4caf50', color: 'var(--color-silver)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-silver-dark)' }}>Tidak ada part yang perlu diproses Goods Issue.</div>
                      </div>
                    )}
                  </div>
                  
                </div>
              )}

              {/* TAB 2: DATA UNIT BELUM P2H (PENDING P2H) */}
              {activeSlide === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#ff8a80', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <AlertTriangle size={15} /> Daftar Unit Belum Mengisi P2H Hari Ini ({p2hBelumCount})
                    </div>
                    <Link to="/p2h" style={{ fontSize: '0.725rem', color: '#81c784', textDecoration: 'none', fontWeight: '600' }}>
                      ⚡ Form P2H →
                    </Link>
                  </div>

                  {p2hStatusList.filter(u => !u.hasP2hToday).length === 0 ? (
                    <div style={{ padding: '1.5rem 1rem', textAlign: 'center', background: 'var(--color-bg-card)', borderRadius: '8px', border: '1px dashed #4caf50', color: 'var(--color-silver)' }}>
                      <CheckCircle2 size={32} style={{ color: '#81c784', marginBottom: '0.4rem', display: 'inline-block' }} />
                      <div style={{ fontSize: '0.825rem', fontWeight: '600', color: '#ffffff' }}>Semua Unit Telah Mengisi P2H Hari Ini!</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--color-silver-dark)', marginTop: '0.2rem' }}>100% kepatuhan pemeriksaan harian unit tercapai.</div>
                    </div>
                  ) : (
                    p2hStatusList.filter(u => !u.hasP2hToday).map(u => (
                      <div 
                        key={u.id || u.noLambung} 
                        style={{
                          padding: '0.6rem 0.75rem',
                          background: 'var(--color-bg-card)',
                          borderRadius: '8px',
                          borderLeft: '4px solid #ff5252',
                          borderTop: '1px solid var(--color-border)',
                          borderRight: '1px solid var(--color-border)',
                          borderBottom: '1px solid var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '0.875rem' }}>{u.noLambung}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-silver)', background: 'var(--color-bg-main)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>{u.jenisUnit}</span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-silver)', marginTop: '0.15rem' }}>
                            Status: <span style={{ color: '#ff8a80', fontWeight: 'bold' }}>Belum Ada Lap. P2H</span>
                          </div>
                        </div>

                        <div>
                          <Link 
                            to="/p2h" 
                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem', borderRadius: '4px', backgroundColor: 'rgba(255,82,82,0.18)', color: '#ff8a80', border: '1px solid #ff5252', fontWeight: 'bold', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                          >
                            ⚡ Input P2H →
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: RIWAYAT UNIT SUDAH P2H HARI INI */}
              {activeSlide === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#81c784', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CheckCircle2 size={15} /> Riwayat Pemeriksaan P2H Hari Ini ({p2hSudahCount})
                    </div>
                    <Link to="/p2h" style={{ fontSize: '0.725rem', color: '#81c784', textDecoration: 'none', fontWeight: '600' }}>
                      Buka P2H →
                    </Link>
                  </div>

                  {p2hStatusList.filter(u => u.hasP2hToday).length === 0 ? (
                    <div style={{ padding: '1.5rem 1rem', textAlign: 'center', background: 'var(--color-bg-card)', borderRadius: '8px', border: '1px dashed var(--color-border)', color: 'var(--color-silver)' }}>
                      Belum ada laporan P2H yang masuk hari ini.
                    </div>
                  ) : (
                    p2hStatusList.filter(u => u.hasP2hToday).map(u => (
                      <div 
                        key={u.id || u.noLambung} 
                        style={{
                          padding: '0.6rem 0.75rem',
                          background: 'var(--color-bg-card)',
                          borderRadius: '8px',
                          borderLeft: '4px solid #4caf50',
                          borderTop: '1px solid var(--color-border)',
                          borderRight: '1px solid var(--color-border)',
                          borderBottom: '1px solid var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '0.875rem' }}>{u.noLambung}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-silver)', background: 'var(--color-bg-main)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>{u.jenisUnit}</span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-silver)', marginTop: '0.15rem' }}>
                            Dilaporkan oleh: <strong style={{ color: '#ffffff' }}>{u.p2hReport?.operator_name || u.p2hReport?.inspector || 'Mekanik/Operator'}</strong>
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: 'rgba(76,175,80,0.15)', color: '#81c784', border: '1px solid #4caf50', fontWeight: '600' }}>
                            ✓ P2H Terisi
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>

            {/* Slider Dots Navigation Indicator */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', padding: '0.3rem', background: 'var(--color-bg-card)', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
              <span 
                onClick={() => setActiveSlide(0)} 
                style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeSlide === 0 ? 'var(--color-yellow-primary)' : 'var(--color-silver-dark)', cursor: 'pointer' }}
              />
              <span 
                onClick={() => setActiveSlide(1)} 
                style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeSlide === 1 ? 'var(--color-yellow-primary)' : 'var(--color-silver-dark)', cursor: 'pointer' }}
              />
              <span 
                onClick={() => setActiveSlide(2)} 
                style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeSlide === 2 ? 'var(--color-yellow-primary)' : 'var(--color-silver-dark)', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* ── NOTIFICATION DRAWER / MODAL POPUP ── */}
          {showNotifModal && (
            <div className="mobile-profile-modal-overlay" onClick={() => setShowNotifModal(false)}>
              <div className="mobile-profile-modal-card" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bell size={20} style={{ color: 'var(--color-yellow-primary)' }} />
                    <span style={{ fontWeight: 'bold', fontSize: '1rem', color: '#ffffff' }}>Notifikasi & Tugas Pending</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowNotifModal(false)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-silver)', cursor: 'pointer', padding: '0.2rem' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '320px', overflowY: 'auto', paddingRight: '0.2rem' }} className="hide-scrollbar">
                  
                  {/* Item Notif 1: Weekly Service */}
                  <div style={{ padding: '0.75rem', background: 'rgba(255,193,7,0.08)', borderRadius: '8px', border: '1px solid rgba(255,193,7,0.3)', display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <Calendar size={22} style={{ color: 'var(--color-yellow-primary)', flexShrink: 0, marginTop: '0.1rem' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '0.85rem' }}>Jadwal Weekly Service Pending</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-silver)', marginTop: '0.15rem' }}>
                        Terdapat {todayWeeklySchedules.filter(s => !s.isCompleted).length} unit yang perlu dilakukan pemeriksaan mingguan hari ini.
                      </div>
                      <Link to="/weekly-service" onClick={() => setShowNotifModal(false)} style={{ fontSize: '0.725rem', color: 'var(--color-yellow-primary)', textDecoration: 'none', fontWeight: 'bold', marginTop: '0.35rem', display: 'inline-block' }}>
                        Buka Weekly Service →
                      </Link>
                    </div>
                  </div>

                  {/* Item Notif 2: Belum P2H */}
                  <div style={{ padding: '0.75rem', background: 'rgba(255,82,82,0.08)', borderRadius: '8px', border: '1px solid rgba(255,82,82,0.3)', display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <AlertTriangle size={22} style={{ color: '#ff8a80', flexShrink: 0, marginTop: '0.1rem' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '0.85rem' }}>Pemeriksaan P2H Belum Diisi</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-silver)', marginTop: '0.15rem' }}>
                        Terdapat {p2hBelumCount} unit yang belum menginput P2H harian hari ini.
                      </div>
                      <Link to="/p2h" onClick={() => setShowNotifModal(false)} style={{ fontSize: '0.725rem', color: '#ff8a80', textDecoration: 'none', fontWeight: 'bold', marginTop: '0.35rem', display: 'inline-block' }}>
                        Input P2H Harian →
                      </Link>
                    </div>
                  </div>

                </div>

                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ width: '100%', padding: '0.55rem', fontSize: '0.825rem' }}
                    onClick={() => setShowNotifModal(false)}
                  >
                    Tutup Notifikasi
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* ── DESKTOP DASHBOARD VIEW ── */
        <>
          {/* Welcome Banner di Atas Judul Dashboard */}
          <div style={{
            flexShrink: 0,
            marginBottom: '0.85rem',
            padding: '0.65rem 1rem',
            background: 'linear-gradient(90deg, rgba(255, 193, 7, 0.15) 0%, rgba(255, 193, 7, 0.03) 100%)',
            borderLeft: '4px solid var(--color-yellow-primary)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>👋</span>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-yellow-primary)', lineHeight: '1.2' }}>
                  Selamat Datang, {userName}!
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginTop: '0.1rem' }}>
                  Anda saat ini terhubung sebagai <strong style={{ color: '#ffffff' }}>{userRole}</strong>.
                </div>
              </div>
            </div>
          </div>

          {/* Header Page */}
          <div style={{ flexShrink: 0, marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h1 style={{ fontSize: '1.3rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Dashboard Maintenance & Monitoring Service
              </h1>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-silver)', margin: '0.2rem 0 0 0' }}>
                Perkiraan Tanggal Service Terdekat (Target HM 250, 500, 750, 1000) & Riwayat Perbaikan Part.
              </p>
            </div>
            <button className="btn btn-secondary" onClick={fetchDashboardData} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', height: '34px' }}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Data
            </button>
          </div>

          {/* Desktop Tabs Navigation */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', overflowX: 'auto', flexShrink: 0, minHeight: '45px' }} className="hide-scrollbar">
            <button
              onClick={() => setDesktopTab('overview')}
              style={{
                background: desktopTab === 'overview' ? 'var(--color-yellow-primary)' : 'rgba(255,255,255,0.05)',
                color: desktopTab === 'overview' ? '#111' : 'var(--color-silver)',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s'
              }}
            >
              <LayoutDashboard size={16} />
              Ringkasan & KPI
            </button>
            <button
              onClick={() => setDesktopTab('monitoring')}
              style={{
                background: desktopTab === 'monitoring' ? 'var(--color-yellow-primary)' : 'rgba(255,255,255,0.05)',
                color: desktopTab === 'monitoring' ? '#111' : 'var(--color-silver)',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s'
              }}
            >
              <Clock size={16} />
              Monitoring & Jadwal
            </button>
            <button
              onClick={() => setDesktopTab('analytics')}
              style={{
                background: desktopTab === 'analytics' ? 'var(--color-yellow-primary)' : 'rgba(255,255,255,0.05)',
                color: desktopTab === 'analytics' ? '#111' : 'var(--color-silver)',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s'
              }}
            >
              <Activity size={16} />
              Analisis & Riwayat
            </button>
          </div>

          {desktopTab === 'overview' && (
            <>
              {/* ── 1. KPI WIDGET CARDS ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1rem' }}>
                <div className="card" style={{ padding: '0.85rem 1rem', borderLeft: '4px solid var(--color-yellow-primary)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 193, 7, 0.15)', color: 'var(--color-yellow-primary)' }}>
                    <Truck size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-silver)', fontWeight: '500' }}>TOTAL SPIP / UNIT</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#ffffff' }}>{totalUnits} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--color-silver)' }}>Unit</span></div>
                  </div>
                </div>

                <div className="card" style={{ padding: '0.85rem 1rem', borderLeft: '4px solid #4caf50', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(76, 175, 80, 0.15)', color: '#81c784' }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-silver)', fontWeight: '500' }}>UNIT AKTIF & READY</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#81c784' }}>{activeCount} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--color-silver)' }}>Unit</span></div>
                  </div>
                </div>

                <div className="card" style={{ padding: '0.85rem 1rem', borderLeft: '4px solid #ff5252', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 82, 82, 0.15)', color: '#ff8a80' }}>
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-silver)', fontWeight: '500' }}>SERVIS OVERDUE</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#ff8a80' }}>{overdueCount} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--color-silver)' }}>Unit</span></div>
                  </div>
                </div>

                <div className="card" style={{ padding: '0.85rem 1rem', borderLeft: '4px solid #ffb74d', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.65rem', borderRadius: '8px', backgroundColor: 'rgba(255, 183, 77, 0.15)', color: '#ffb74d' }}>
                    <Clock size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-silver)', fontWeight: '500' }}>PM DUE SOON (&lt;30 HM)</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#ffb74d' }}>{dueSoonCount} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--color-silver)' }}>Unit</span></div>
                  </div>
                </div>
              </div>
              <div className="card mb-4" style={{ 
            padding: '1rem 1.25rem', 
            background: todayWeeklySchedules.length > 0 
              ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.12) 0%, rgba(30, 34, 42, 0.95) 100%)' 
              : 'linear-gradient(135deg, rgba(40, 44, 52, 0.6) 0%, rgba(20, 24, 30, 0.8) 100%)',
            border: todayWeeklySchedules.length > 0 ? '1px solid rgba(255, 193, 7, 0.4)' : '1px solid var(--color-border)',
            borderRadius: '8px',
            boxShadow: todayWeeklySchedules.length > 0 ? '0 4px 15px rgba(255, 193, 7, 0.08)' : 'none'
          }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: todayWeeklySchedules.length > 0 ? '0.75rem' : '0', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                padding: '0.55rem', 
                borderRadius: '8px', 
                backgroundColor: todayWeeklySchedules.length > 0 ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255,255,255,0.05)',
                color: todayWeeklySchedules.length > 0 ? 'var(--color-yellow-primary)' : 'var(--color-silver)'
              }}>
                <Calendar size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--color-yellow-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  🔔 Pengingat Notifikasi: Jadwal Weekly Service Hari Ini
                  {todayWeeklySchedules.length > 0 && (
                    <span style={{ 
                      padding: '0.15rem 0.55rem', 
                      borderRadius: '12px', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold',
                      backgroundColor: todayWeeklySchedules.some(s => !s.isCompleted) ? 'rgba(255, 193, 7, 0.25)' : 'rgba(76, 175, 80, 0.25)', 
                      color: todayWeeklySchedules.some(s => !s.isCompleted) ? '#ffffff' : '#81c784',
                      border: todayWeeklySchedules.some(s => !s.isCompleted) ? '1px solid var(--color-yellow-primary)' : '1px solid #81c784'
                    }}>
                      {todayWeeklySchedules.filter(s => !s.isCompleted).length > 0 
                        ? `${todayWeeklySchedules.filter(s => !s.isCompleted).length} Unit Menunggu Service`
                        : 'Semua Unit Selesai ✓'}
                    </span>
                  )}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-silver)', margin: '0.2rem 0 0 0' }}>
                  {todayWeeklySchedules.length > 0 
                    ? `Daftar unit yang dijadwalkan pemeliharaan rutin pada hari ${['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date().getDay()]}:`
                    : `Belum ada unit yang dijadwalkan pemeliharaan rutin Weekly Service pada hari ${['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date().getDay()]}.`}
                </p>
              </div>
            </div>

            <Link 
              to="/weekly-service" 
              className="btn btn-secondary" 
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderColor: 'var(--color-yellow-primary)', color: 'var(--color-yellow-primary)' }}
            >
              <Wrench size={14} /> Kelola Weekly Service
            </Link>
          </div>

          {todayWeeklySchedules.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.65rem', marginTop: '0.75rem' }}>
              {todayWeeklySchedules.map((item, idx) => (
                <div key={item.id || idx} style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '6px',
                  backgroundColor: item.isCompleted ? 'rgba(76, 175, 80, 0.08)' : 'rgba(255, 193, 7, 0.08)',
                  border: item.isCompleted ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid rgba(255, 193, 7, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#ffffff' }}>{item.noLambung}</span>
                      <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--color-silver-light)' }}>
                        {item.jenisUnit}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-silver)', marginTop: '0.2rem' }}>
                      📍 {item.lokasi} • 🕒 {item.shift}
                    </div>
                  </div>
                  <div>
                    {item.isCompleted ? (
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#81c784', padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: 'rgba(76, 175, 80, 0.15)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                        ✓ Selesai
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#ffd54f', padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: 'rgba(255, 193, 7, 0.15)', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
                        ⏳ Menunggu Service
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

            {/* ── UA WIDGET ── */}
            <ProblemUaWidget />

            {/* ── 0.5 PENDING GOODS ISSUE WIDGET ── */}
            <div className="card mb-4" style={{ padding: '1rem 1.25rem', border: pendingGoodsIssues.length > 0 ? '1px solid #ff5252' : '1px solid rgba(76, 175, 80, 0.3)', background: pendingGoodsIssues.length > 0 ? 'linear-gradient(135deg, rgba(255, 82, 82, 0.08) 0%, rgba(30, 34, 42, 0.95) 100%)' : 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(30, 34, 42, 0.95) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: pendingGoodsIssues.length > 0 ? '0.75rem' : '0' }}>
                <h2 style={{ fontSize: '1rem', margin: 0, color: pendingGoodsIssues.length > 0 ? '#ff5252' : '#81c784', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {pendingGoodsIssues.length > 0 ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                  {pendingGoodsIssues.length > 0 ? 'Peringatan: Sparepart Belum di-Goods Issue (GI)' : 'Semua Sparepart Telah di-Goods Issue (GI)'}
                </h2>
              </div>
              
              {pendingGoodsIssues.length > 0 ? (
                <>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-silver-light)', marginBottom: '1rem' }}>
                    Terdapat {pendingGoodsIssues.length} item sparepart yang telah digunakan pada servis / perbaikan namun belum dilaporkan keluar dari gudang (Goods Issue). Silakan centang setelah melakukan GI di sistem.
                  </div>
                  
                  <div style={{ overflowX: 'auto', maxHeight: '300px' }} className="hide-scrollbar">
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                          <th style={{ padding: '0.5rem', color: 'var(--color-silver)' }}>Tanggal</th>
                          <th style={{ padding: '0.5rem', color: 'var(--color-silver)' }}>No Lambung</th>
                          <th style={{ padding: '0.5rem', color: 'var(--color-silver)' }}>Nama & Part Number</th>
                          <th style={{ padding: '0.5rem', color: 'var(--color-silver)' }}>Qty</th>
                          <th style={{ padding: '0.5rem', color: 'var(--color-silver)' }}>Mekanik</th>
                          <th style={{ padding: '0.5rem', color: 'var(--color-silver)', textAlign: 'center' }}>Aksi GI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingGoodsIssues.map((item, idx) => (
                          <tr key={`${item.reportId}-${item.partIndex}-${idx}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '0.5rem', color: 'var(--color-silver-light)' }}>{item.tanggal}</td>
                            <td style={{ padding: '0.5rem', fontWeight: 'bold', color: 'var(--color-yellow-primary)' }}>{item.noLambung}</td>
                            <td style={{ padding: '0.5rem' }}>
                              <div style={{ color: '#ffffff' }}>{item.partName}</div>
                              {item.partNumber && <div style={{ fontSize: '0.7rem', color: 'var(--color-silver)' }}>{item.partNumber}</div>}
                            </td>
                            <td style={{ padding: '0.5rem', fontWeight: 'bold', color: '#ff8a80' }}>{item.qty} {item.unit}</td>
                            <td style={{ padding: '0.5rem', color: 'var(--color-silver-light)' }}>{item.mekanik}</td>
                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                              <button 
                                onClick={() => handleGoodsIssueCheck(item.reportId, item.reportType, item.partIndex)}
                                className="btn btn-primary"
                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', height: 'auto', borderRadius: '4px' }}
                              >
                                <CheckCircle2 size={14} /> Selesai
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginTop: '0.5rem' }}>
                  Tidak ada part yang perlu diproses Goods Issue. Gudang dan servis sudah tersinkronisasi.
                </div>
              )}
            </div>

            {/* ── 2. PERKIRAAN SERVIS TERDEKAT (AI PREDICTIVE LIST) ── */}
            <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1rem', margin: 0, color: 'var(--color-yellow-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={18} /> Antrean Perkiraan Servis Terdekat (AI Predictive Service Forecast)
                  </h2>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-silver)' }}>Urutan unit berdasarkan perkiraan tanggal servis terdekat</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-silver)' }}>Laju Operasional (Daily Rate):</span>
                  <SearchableSelect 
                    className="input-field"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: '28px', backgroundColor: '#1a1c1e', borderColor: 'var(--color-border)' }}
                    value={simulatedDailyRateMultiplier}
                    onChange={(e) => setSimulatedDailyRateMultiplier(Number(e.target.value))}
                  >
                    <option value={1.0}>Standar (Normal Shift)</option>
                    <option value={1.3}>Tinggi (High Demand 1.3x)</option>
                    <option value={0.7}>Rendah (Low Demand 0.7x)</option>
                  </SearchableSelect>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-silver)' }}>No. Lambung</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-silver)' }}>Jenis Unit</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-silver)' }}>HM Saat Ini</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-silver)' }}>Target Servis Next</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-silver)' }}>Perkiraan Tanggal Servis</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-silver)' }}>Rekomendasi Form PM</th>
                      <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-silver)' }}>Status Prioritas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiForecastQueue.slice(0, 6).map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 'bold', color: 'var(--color-yellow-primary)' }}>{u.noLambung}</td>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-silver-light)' }}>{u.jenisUnit}</td>
                        <td style={{ padding: '0.5rem 0.75rem', color: '#ffffff' }}>{u.hmkm} HM</td>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 'bold', color: u.isServiceOverdue ? '#ff5252' : '#ffffff' }}>{u.nextTargetHm} HM</td>
                        <td style={{ padding: '0.5rem 0.75rem', color: u.isServiceOverdue ? '#ff5252' : '#81c784', fontWeight: '500' }}>
                          {u.isServiceOverdue ? '⚠️ Overdue (Jatuh Tempo)' : `📅 ${u.estNextDate} (~${u.daysToNext} hari lagi)`}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <span style={{ padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.725rem', backgroundColor: 'rgba(255, 193, 7, 0.15)', color: 'var(--color-yellow-primary)', border: '1px solid rgba(255, 193, 7, 0.3)', fontWeight: 'bold' }}>
                            {u.pmType}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.725rem', backgroundColor: u.remarkBadge.bg, color: u.remarkBadge.color, border: `1px solid ${u.remarkBadge.border}`, fontWeight: 'bold' }}>
                            {u.remarkBadge.label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

        {/* ── 1.5. MMU BREAKDOWN CAPACITY SIMULATION WIDGET ── */}
        <div className="card mb-4" style={{ 
          padding: '1.25rem', 
          background: autoBreakdownData.totalLostCycles === 0 
            ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(30,34,42,0.9) 100%)' 
            : 'linear-gradient(135deg, rgba(255, 82, 82, 0.05) 0%, rgba(30,34,42,0.9) 100%)', 
          border: autoBreakdownData.totalLostCycles === 0 
            ? '1px solid rgba(76, 175, 80, 0.3)' 
            : '1px solid rgba(255, 82, 82, 0.3)' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ flex: '1 1 300px' }}>
              <h2 style={{ 
                fontSize: '1.15rem', 
                margin: 0, 
                color: autoBreakdownData.totalLostCycles === 0 ? '#81c784' : '#ff5252', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem' 
              }}>
                <Activity size={20} />
                Simulasi Dampak Breakdown MMU
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-silver)', margin: '0.35rem 0 1rem 0', lineHeight: '1.4' }}>
                Simulasikan penurunan kapasitas jika terjadi breakdown pada unit MMU. <br />
                Kapasitas per siklus (termasuk 1x reload AN): <strong>Max 17 Ton</strong> untuk Heavy Anfo, <strong>Max 19.8 Ton</strong> untuk Emulsion.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-silver-light)', marginBottom: '0.25rem', display: 'block' }}>Unit MMU Breakdown (Sumber: Work Order)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {autoBreakdownData.downUnits.length === 0 ? (
                      <span style={{ fontSize: '0.75rem', color: '#81c784', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <CheckCircle2 size={14} /> Semua Unit MMU Beroperasi Normal
                      </span>
                    ) : (
                      autoBreakdownData.downUnits.map(unitNo => (
                        <span
                          key={unitNo}
                          style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: '12px',
                            border: '1px solid #ff5252',
                            backgroundColor: 'rgba(255,82,82,0.15)',
                            color: '#ff5252',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <AlertTriangle size={12} />
                          {unitNo}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: '0 0 350px' }}>
              {autoBreakdownData.totalLostCycles === 0 ? (
                <div style={{ 
                  backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                  borderRadius: '8px', 
                  padding: '1.25rem', 
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.85rem', color: '#81c784', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>
                    <CheckCircle2 size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.25rem' }} />
                    All Unit Ready
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-silver)', margin: '0.75rem 0 0.5rem 0' }}>Estimasi Produksi Hari Ini</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '0.5rem' }}>
                    <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-silver-light)' }}>Heavy Anfo</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff', marginTop: '0.2rem' }}>{mmuCapacityStats.readyHeavyAnfo.toLocaleString('id-ID')} <span style={{ fontSize: '0.7rem', color: 'var(--color-silver)' }}>Ton</span></div>
                    </div>
                    <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-silver-light)' }}>Emulsion Product</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff', marginTop: '0.2rem' }}>{mmuCapacityStats.readyEmulsion.toLocaleString('id-ID')} <span style={{ fontSize: '0.7rem', color: 'var(--color-silver)' }}>Ton</span></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ 
                  backgroundColor: 'rgba(255, 82, 82, 0.1)', 
                  borderRadius: '8px', 
                  padding: '1.25rem', 
                  border: '1px solid rgba(255, 82, 82, 0.3)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.85rem', color: '#ff5252', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>
                    <AlertTriangle size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.25rem' }} />
                    Potensi Kehilangan Produksi
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-silver)', margin: '0.5rem 0' }}>
                    Akibat hilangnya <strong>{autoBreakdownData.totalLostCycles} Siklus/Hari</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '0.5rem' }}>
                    <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-silver-light)' }}>Heavy Anfo</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff5252', marginTop: '0.2rem' }}>{mmuCapacityStats.lostHeavyAnfo.toLocaleString('id-ID')} <span style={{ fontSize: '0.7rem', color: 'var(--color-silver)' }}>Ton</span></div>
                    </div>
                    <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-silver-light)' }}>Emulsion Product</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff5252', marginTop: '0.2rem' }}>{mmuCapacityStats.lostEmulsion.toLocaleString('id-ID')} <span style={{ fontSize: '0.7rem', color: 'var(--color-silver)' }}>Ton</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </>
      )}

      {desktopTab === 'monitoring' && (
        <>
        {/* ── 2. PREDICTIVE SERVICE FORECAST CALENDAR WIDGET ── */}

        <div className="card mb-4" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(30,34,42,0.9) 0%, rgba(20,24,30,0.95) 100%)', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--color-yellow-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={20} />
                Jadwal Next Service Terdekat (Proyeksi)
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-silver)' }}>
                Perkiraan tanggal pencapaian HM Service berikutnya berdasarkan simulasi ritme pemakaian harian.
              </span>
            </div>

            {/* Workload Simulator Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
              <Activity size={16} style={{ color: 'var(--color-yellow-primary)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-silver-light)' }}>Simulasi Jam Kerja Site:</span>
              <SearchableSelect 
                className="input-field" 
                style={{ height: '28px', fontSize: '0.75rem', padding: '0 0.5rem' }}
                value={simulatedDailyRateMultiplier}
                onChange={(e) => setSimulatedDailyRateMultiplier(Number(e.target.value))}
              >
                <option value={1.0}>Normal (100% Workload)</option>
                <option value={1.25}>Tinggi (125% Workload)</option>
                <option value={1.5}>Lembur / High-Shift (150% Workload)</option>
              </SearchableSelect>
            </div>
          </div>

          {/* Forecast Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
            {aiForecastQueue.slice(0, 4).map((u, idx) => (
              <div key={u.id} style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.85rem', border: `1px solid ${idx === 0 ? 'rgba(255,193,7,0.5)' : 'var(--color-border)'}`, position: 'relative' }}>
                
                {/* Header Unit */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--color-yellow-primary)', fontSize: '0.95rem' }}>{u.noLambung}</span>
                  <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--color-silver-light)' }}>
                    {u.jenisUnit}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginBottom: '0.4rem' }}>
                  HM Sekarang: <b>{u.hmkm.toLocaleString('id-ID')} HM</b> ({u.dailyRateEst} HM/Hari)
                </div>

                {/* Progress bar to Next Target HM */}
                <div style={{ marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem', color: 'var(--color-silver-light)' }}>
                    <span>Target: <b>{u.nextTargetHm.toLocaleString('id-ID')} HM</b> ({u.pmType})</span>
                    <span><b>{u.progressPercent}%</b></span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${u.progressPercent}%`, height: '100%', backgroundColor: u.progressPercent > 90 ? '#ff5252' : u.progressPercent > 75 ? '#ffd54f' : '#81c784', transition: 'width 0.3s ease' }}></div>
                  </div>
                </div>

                {/* Predicted Date Box */}
                <div style={{ padding: '0.5rem 0.65rem', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#81c784' }}>
                      <CalendarClock size={13} style={{ color: '#81c784' }} />
                      <span>Estimasi Service:</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#ffffff' }}>
                      {u.estNextDate} ({u.daysToNext <= 0 ? 'Hari Ini' : `${u.daysToNext} hari`})
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-silver-dark)', fontStyle: 'italic' }}>
                    ℹ️ {u.formNote}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* ── 3. DETAILED TABLE MONITORED HM/KM & SIMULATION ── */}
        <div className="card mb-4" style={{ padding: '1.25rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} style={{ color: 'var(--color-yellow-primary)' }} />
                Tabel Monitoring HM / KM & Jadwal Next Service Terdekat (Proyeksi)
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-silver)' }}>
                Daftar HM/KM unit terkini beserta estimasi tanggal pencapaian target service berikutnya.
              </span>
            </div>

            {/* Quick Alert Filter Pills */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              <button 
                className="btn" 
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', borderRadius: '20px', backgroundColor: serviceAlertFilter === 'All' ? 'var(--color-yellow-primary)' : 'rgba(255,255,255,0.05)', color: serviceAlertFilter === 'All' ? '#000' : '#fff' }}
                onClick={() => setServiceAlertFilter('All')}
              >
                Semua ({units.length})
              </button>
              <button 
                className="btn" 
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', borderRadius: '20px', backgroundColor: serviceAlertFilter === 'Overdue' ? '#f44336' : 'rgba(244,67,54,0.15)', color: '#ff8a80', border: '1px solid rgba(244,67,54,0.3)' }}
                onClick={() => setServiceAlertFilter('Overdue')}
              >
                Overdue ({overdueCount})
              </button>
              <button 
                className="btn" 
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', borderRadius: '20px', backgroundColor: serviceAlertFilter === 'DueSoon' ? '#ff9800' : 'rgba(255,152,0,0.15)', color: '#ffb74d', border: '1px solid rgba(255,152,0,0.3)' }}
                onClick={() => setServiceAlertFilter('DueSoon')}
              >
                Segera Service ({dueSoonCount + overdueCount})
              </button>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
            <div className="input-group mb-0">
              <label style={{ fontSize: '0.75rem' }}>Filter Jenis Unit</label>
              <SearchableSelect className="input-field" style={{ height: '34px', fontSize: '0.8rem' }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="All">Semua Jenis Unit</option>
                {Array.from(new Set(units.map(u => u.jenisUnit))).map(j => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </SearchableSelect>
            </div>

            <div className="input-group mb-0">
              <label style={{ fontSize: '0.75rem' }}>Cari No Lambung</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.75rem', color: 'var(--color-silver)' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ height: '34px', fontSize: '0.8rem', paddingLeft: '2.2rem' }} 
                  placeholder="Ketik No Lambung..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table Monitored HM/KM Units with Focused Single Column Next Service */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver)' }}>No Lambung & Unit</th>
                  <th style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver)' }}>HM / KM Sekarang</th>
                  <th style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver)' }}>Target Next Service (Tier PM)</th>
                  <th style={{ padding: '0.75rem', color: 'var(--color-silver)', fontSize: '0.8rem' }}>Perkiraan Tanggal (Proyeksi Service)</th>
                  <th style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver)' }}>Status Remark</th>
                </tr>
              </thead>
              <tbody>
                {filteredUnits.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-silver-dark)' }}>
                      Tidak ada unit yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredUnits.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--color-yellow-primary)' }}>{u.noLambung}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-silver)' }}>{u.jenisUnit}</div>
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', fontWeight: '600' }}>
                        {u.hmkm ? `${u.hmkm.toLocaleString('id-ID')} HM` : '-'}
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-silver-dark)' }}>Rata-rata: ~{u.dailyRateEst} HM/hari</div>
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <div style={{ fontWeight: 'bold', color: '#ffffff' }}>
                          Target {u.nextTargetHm.toLocaleString('id-ID')} HM <span style={{ fontSize: '0.75rem', color: 'var(--color-yellow-primary)' }}>({u.pmType})</span>
                        </div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--color-silver)' }}>
                          {u.formNote}
                        </div>
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <div style={{ fontWeight: 'bold', color: '#81c784', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={14} />
                          {u.estNextDate}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--color-silver-light)' }}>
                          {u.daysToNext <= 0 ? 'Waktunya Service Hari Ini' : `Sisa ${u.remainingHm} HM (~${u.daysToNext} hari lagi)`}
                        </div>
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600',
                          backgroundColor: u.remarkBadge.bg, color: u.remarkBadge.color, border: `1px solid ${u.remarkBadge.border}`,
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem'
                        }}>
                          {u.isServiceOverdue && <AlertTriangle size={13} />}
                          {u.remarkBadge.label}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {desktopTab === 'monitoring' && (
        <>
            {/* MOVED TO OVERVIEW */}
        </>
      )}

      {desktopTab === 'analytics' && (
        <>
            {/* ── 3. DYNAMIC MONITORING BEKAS REPAIR / REPLACEMENT PARTS (SPAREPART LOG MONITOR) ── */}
            <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1rem', margin: 0, color: 'var(--color-yellow-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Activity size={18} /> Monitoring Penggunaan Sparepart & Histori Pergantian Part Unit
                  </h2>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-silver)' }}>Filter interaktif dua arah berdasarkan Unit atau Nama Part</div>
                </div>

                {/* Filter Controls Dua Arah */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-silver)' }}>Unit:</span>
                    <SearchableSelect 
                      className="input-field" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: '28px', backgroundColor: '#1a1c1e', borderColor: 'var(--color-border)' }}
                      value={selectedUnitFilter}
                      onChange={(e) => setSelectedUnitFilter(e.target.value)}
                    >
                      <option value="All">Semua Unit</option>
                      {uniqueUnitsForParts.map(u => <option key={u} value={u}>{u}</option>)}
                    </SearchableSelect>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-silver)' }}>Sparepart:</span>
                    <SearchableSelect 
                      className="input-field" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: '28px', backgroundColor: '#1a1c1e', borderColor: 'var(--color-border)' }}
                      value={selectedPartFilter}
                      onChange={(e) => setSelectedPartFilter(e.target.value)}
                    >
                      <option value="All">Semua Sparepart</option>
                      {uniquePartNames.map(p => <option key={p} value={p}>{p}</option>)}
                    </SearchableSelect>
                  </div>
                </div>
              </div>

              {/* Dynamic Chart Top Sparepart Usage */}
              {(sparePartChartData.length > 0 || chartUnitType !== 'Pcs') && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#1e2227', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-silver-light)' }}>
                      📊 Top Sparepart Terbanyak Diganti / Dikluarkan (Total Qty)
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button 
                        type="button"
                        onClick={() => setChartUnitType('Pcs')}
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', cursor: 'pointer', border: '1px solid var(--color-border)', background: chartUnitType === 'Pcs' ? 'var(--color-yellow-primary)' : 'transparent', color: chartUnitType === 'Pcs' ? '#111' : 'var(--color-silver)' }}
                      >
                        Part Umum (Pcs)
                      </button>
                      <button 
                        type="button"
                        onClick={() => setChartUnitType('Liter')}
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', cursor: 'pointer', border: '1px solid var(--color-border)', background: chartUnitType === 'Liter' ? 'var(--color-yellow-primary)' : 'transparent', color: chartUnitType === 'Liter' ? '#111' : 'var(--color-silver)' }}
                      >
                        Oli & Cairan (Liter)
                      </button>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <BarChart data={sparePartChartData} margin={{ top: 15, right: 20, left: -15, bottom: 75 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3a3e41" />
                        <XAxis dataKey="name" type="category" stroke="#a0a4a8" fontSize={10} interval={0} angle={-35} textAnchor="end" height={75} />
                        <YAxis type="number" stroke="#a0a4a8" fontSize={11} width={45} />
                        <Tooltip contentStyle={{ backgroundColor: '#2f3336', borderColor: '#3a3e41', color: '#f5f5f5', borderRadius: '6px', fontSize: '11px' }} />
                        <Bar dataKey="totalQty" name="Total Qty Diganti" fill="#ffc107" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Table Monitoring Dispatched Sparepart */}
              <div style={{ overflowX: 'auto', maxHeight: '220px' }} className="hide-scrollbar">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', backgroundColor: '#1a1c1e' }}>
                      <th style={{ padding: '0.45rem 0.65rem', color: 'var(--color-silver)' }}>Tanggal</th>
                      <th style={{ padding: '0.45rem 0.65rem', color: 'var(--color-silver)' }}>No. Lambung</th>
                      <th style={{ padding: '0.45rem 0.65rem', color: 'var(--color-silver)' }}>Nama Sparepart</th>
                      <th style={{ padding: '0.45rem 0.65rem', color: 'var(--color-silver)' }}>Part Number</th>
                      <th style={{ padding: '0.45rem 0.65rem', color: 'var(--color-silver)' }}>Qty</th>
                      <th style={{ padding: '0.45rem 0.65rem', color: 'var(--color-silver)' }}>Kondisi/Status</th>
                      <th style={{ padding: '0.45rem 0.65rem', color: 'var(--color-silver)' }}>Mekanik Report</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDispatchedParts.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-silver)' }}>
                          Belum ada data sparepart yang dicatat untuk filter ini.
                        </td>
                      </tr>
                    ) : (
                      filteredDispatchedParts.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '0.45rem 0.65rem', color: 'var(--color-silver-light)' }}>{item.tanggal}</td>
                          <td style={{ padding: '0.45rem 0.65rem', fontWeight: 'bold', color: 'var(--color-yellow-primary)' }}>{item.noLambung}</td>
                          <td style={{ padding: '0.45rem 0.65rem', fontWeight: '600', color: '#ffffff' }}>{item.partName}</td>
                          <td style={{ padding: '0.45rem 0.65rem', color: 'var(--color-silver)' }}>{item.partNumber}</td>
                          <td style={{ padding: '0.45rem 0.65rem', color: '#81c784', fontWeight: 'bold' }}>{item.qty} {item.unit}</td>
                          <td style={{ padding: '0.45rem 0.65rem' }}>
                            <span style={{ padding: '0.1rem 0.4rem', borderRadius: '3px', fontSize: '0.7rem', backgroundColor: 'rgba(76, 175, 80, 0.15)', color: '#81c784', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                              {item.statusPart}
                            </span>
                          </td>
                          <td style={{ padding: '0.45rem 0.65rem', color: 'var(--color-silver)' }}>{item.reporter}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── 4. TABLE LOG HISTORI PERBAIKAN DARI PM REPORT ── */}
            <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1rem', margin: 0, color: 'var(--color-yellow-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Wrench size={18} /> Histori Laporan Perbaikan & Service Unit
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Search size={14} style={{ color: 'var(--color-silver)' }} />
                  <input 
                    type="text" 
                    placeholder="Cari No Lambung / Part..." 
                    className="input-field" 
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: '180px', height: '28px' }}
                    value={repairSearchQuery}
                    onChange={(e) => setRepairSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ overflowX: 'auto', maxHeight: '200px' }} className="hide-scrollbar">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', backgroundColor: '#1a1c1e' }}>
                      <th style={{ padding: '0.45rem 0.65rem', color: 'var(--color-silver)' }}>Tanggal</th>
                      <th style={{ padding: '0.45rem 0.65rem', color: 'var(--color-silver)' }}>No. Lambung</th>
                      <th style={{ padding: '0.45rem 0.65rem', color: 'var(--color-silver)' }}>Jenis Service / Perbaikan</th>
                      <th style={{ padding: '0.45rem 0.65rem', color: 'var(--color-silver)' }}>Sparepart Diganti</th>
                      <th style={{ padding: '0.45rem 0.65rem', color: 'var(--color-silver)' }}>Mekanik</th>
                      <th style={{ padding: '0.45rem 0.65rem', color: 'var(--color-silver)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRepairs.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-silver)' }}>
                          Belum ada histori perbaikan yang tercatat.
                        </td>
                      </tr>
                    ) : (
                      filteredRepairs.map(rep => (
                        <tr key={rep.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '0.45rem 0.65rem', color: 'var(--color-silver-light)' }}>{rep.tanggal}</td>
                          <td style={{ padding: '0.45rem 0.65rem', fontWeight: 'bold', color: 'var(--color-yellow-primary)' }}>{rep.noLambung}</td>
                          <td style={{ padding: '0.45rem 0.65rem', color: '#ffffff' }}>{rep.jenisKerusakan}</td>
                          <td style={{ padding: '0.45rem 0.65rem', color: 'var(--color-silver-light)' }}>{rep.pergantianPart}</td>
                          <td style={{ padding: '0.45rem 0.65rem', color: 'var(--color-silver)' }}>{rep.mekanik}</td>
                          <td style={{ padding: '0.45rem 0.65rem' }}>
                            <span style={{ 
                              padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold',
                              backgroundColor: 'rgba(76, 175, 80, 0.15)', color: '#81c784', border: '1px solid rgba(76, 175, 80, 0.3)'
                            }}>
                              {rep.status || rep.statusPerbaikan || 'Selesai'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── 5. STATISTIK CHART UNIT SECTION ── */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Statistik Kesiapan & Perbaikan Unit per Kategori</h2>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3a3e41" />
                    <XAxis dataKey="name" stroke="#a0a4a8" fontSize={12} />
                    <YAxis stroke="#a0a4a8" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#2f3336', borderColor: '#3a3e41', color: '#f5f5f5', borderRadius: '6px' }} />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '0.85rem' }}/>
                    <Bar dataKey="active" name="Unit Aktif (Ready)" fill="#ffc107" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="repair" name="Dalam Perbaikan / Breakdown" fill="#63686d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
        </>
      )}
        </>
      )}

    </div>
  );
}
