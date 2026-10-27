import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Wrench, PenTool, WrenchIcon, PlusCircle, ClipboardCheck, UserPlus, LogOut, Home, User, ListChecks, X, ShieldCheck, List, ChevronDown, ChevronRight, ClipboardList } from 'lucide-react';
import { showConfirm } from '../components/UniversalDialog';

export default function MainLayout() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const jabatan = user?.jabatan?.toLowerCase() || '';
  const userName = user?.name || user?.full_name || user?.username || 'Pengguna';
  const userRole = user?.jabatan || 'User';

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isP2hOpen, setIsP2hOpen] = useState(false);
  const [isWoOpen, setIsWoOpen] = useState(false);
  const [isWeeklyOpen, setIsWeeklyOpen] = useState(false);
  const [isPmOpen, setIsPmOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSparePartOpen, setIsSparePartOpen] = useState(false);
  const [isTimesheetOpen, setIsTimesheetOpen] = useState(false);

  const toggleMenu = (menu, defaultPath) => {
    if (menu === 'p2h') {
      setIsP2hOpen(!isP2hOpen);
      if (!isP2hOpen) { 
        setIsWoOpen(false); setIsWeeklyOpen(false); setIsPmOpen(false); setIsReportOpen(false); setIsSparePartOpen(false); setIsTimesheetOpen(false); 
        if (defaultPath) navigate(defaultPath);
      }
    } else if (menu === 'wo') {
      setIsWoOpen(!isWoOpen);
      if (!isWoOpen) { 
        setIsP2hOpen(false); setIsWeeklyOpen(false); setIsPmOpen(false); setIsReportOpen(false); setIsSparePartOpen(false); setIsTimesheetOpen(false); 
        if (defaultPath) navigate(defaultPath);
      }
    } else if (menu === 'weekly') {
      setIsWeeklyOpen(!isWeeklyOpen);
      if (!isWeeklyOpen) { 
        setIsP2hOpen(false); setIsWoOpen(false); setIsPmOpen(false); setIsReportOpen(false); setIsSparePartOpen(false); setIsTimesheetOpen(false); 
        if (defaultPath) navigate(defaultPath);
      }
    } else if (menu === 'pm') {
      setIsPmOpen(!isPmOpen);
      if (!isPmOpen) { 
        setIsP2hOpen(false); setIsWoOpen(false); setIsWeeklyOpen(false); setIsReportOpen(false); setIsSparePartOpen(false); setIsTimesheetOpen(false); 
        if (defaultPath) navigate(defaultPath);
      }
    } else if (menu === 'report') {
      setIsReportOpen(!isReportOpen);
      if (!isReportOpen) { 
        setIsP2hOpen(false); setIsWoOpen(false); setIsWeeklyOpen(false); setIsPmOpen(false); setIsSparePartOpen(false); setIsTimesheetOpen(false); 
        if (defaultPath) navigate(defaultPath);
      }
    } else if (menu === 'sparepart') {
      setIsSparePartOpen(!isSparePartOpen);
      if (!isSparePartOpen) { 
        setIsP2hOpen(false); setIsWoOpen(false); setIsWeeklyOpen(false); setIsPmOpen(false); setIsReportOpen(false); setIsTimesheetOpen(false); 
        if (defaultPath) navigate(defaultPath);
      }
    } else if (menu === 'timesheet') {
      setIsTimesheetOpen(!isTimesheetOpen);
      if (!isTimesheetOpen) { 
        setIsP2hOpen(false); setIsWoOpen(false); setIsWeeklyOpen(false); setIsPmOpen(false); setIsReportOpen(false); setIsSparePartOpen(false); 
        if (defaultPath) navigate(defaultPath);
      }
    }
  };

  const site = (user?.site || user?.lokasi || '').toLowerCase();
  const isBalikpapan = site === 'balikpapan' || site.includes('balikpapan');
  
  // User Balikpapan dapat melihat seluruh menu operasional (monitoring), namun tidak Tambah Akun
  const canManage = 
    isBalikpapan ||
    jabatan.includes('admin') || 
    jabatan.includes('leading hand maintenance') || 
    jabatan.includes('mechanic') || 
    jabatan.includes('mekanik');

  // Tambah Akun hanya untuk role admin
  const isAdmin = jabatan.includes('admin');

  const handleLogout = async () => {
    const ok = await showConfirm(
      'Apakah Anda yakin ingin keluar dari sistem?',
      'Konfirmasi Keluar'
    );
    if (ok) {
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <WrenchIcon size={26} className="text-yellow" />
          <span className="sidebar-title" style={{ fontSize: '0.82rem', lineHeight: '1.2', textAlign: 'left' }}>BULK MAINTENANCE &<br/>PROJECT ENGINEERING</span>
        </div>

        <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ fontSize: '0.675rem', color: 'var(--color-silver)', marginBottom: '0.25rem' }}>Selamat datang,</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#ffffff', marginBottom: '0.15rem', lineHeight: '1.2' }}>
            {userName}
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--color-yellow-primary)', opacity: 0.9 }}>
            {userRole}
          </div>
        </div>

        <div className="sidebar-scrollable-content hide-scrollbar">
          <ul className="nav-links">
            <li>
              <NavLink 
                to="/dashboard" 
                className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </NavLink>
            </li>
            
            {canManage && (
              <li>
                <NavLink 
                  to="/add-unit" 
                  className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                >
                  <PlusCircle size={18} />
                  <span>Tambah SPIP</span>
                </NavLink>
              </li>
            )}

            <li>
              <NavLink 
                to="/timesheet" 
                className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
              >
                <ClipboardList size={18} />
                <span>Time Sheet</span>
              </NavLink>
            </li>

            <li>
              <NavLink 
                to="/p2h" 
                className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
              >
                <ClipboardCheck size={18} />
                <span>Prestart P2H</span>
              </NavLink>
            </li>

            {canManage && (
              <>
                <li>
                  <NavLink 
                    to="/weekly-service" 
                    className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                  >
                    <Calendar size={18} />
                    <span>Weekly Service</span>
                  </NavLink>
                </li>

                <li>
                  <NavLink 
                    to="/work-order" 
                    className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                  >
                    <ClipboardList size={18} />
                    <span>Work Order (SPK)</span>
                  </NavLink>
                </li>

                <li>
                  <NavLink 
                    to="/pm-service" 
                    className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                  >
                    <Wrench size={18} />
                    <span>PM Service</span>
                  </NavLink>
                </li>

                <li>
                  <NavLink 
                    to="/report" 
                    className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                  >
                    <PenTool size={18} />
                    <span>Report Perbaikan</span>
                  </NavLink>
                </li>

                <li>
                  <NavLink 
                    to="/spare-part" 
                    className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                  >
                    <ListChecks size={18} />
                    <span>Pengelolaan Spare Part</span>
                  </NavLink>
                </li>
              </>
            )}

            {/* Menu Tambah Akun */}
            {isAdmin && (
              <li>
                <NavLink 
                  to="/add-user" 
                  className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                >
                  <UserPlus size={18} />
                  <span>Tambah Akun</span>
                </NavLink>
              </li>
            )}
          </ul>
        </div>

        {/* Tombol Logout di bagian bawah Sidebar */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, background: 'var(--color-bg-secondary)' }}>
          <button 
            type="button" 
            onClick={handleLogout}
            className="nav-item" 
            style={{ 
              width: '100%', 
              backgroundColor: 'rgba(244, 67, 54, 0.08)', 
              color: '#ff8a80', 
              border: '1px solid rgba(244, 67, 54, 0.25)',
              cursor: 'pointer',
              justifyContent: 'flex-start',
              padding: '0.55rem 0.75rem',
              fontSize: '0.85rem'
            }}
          >
            <LogOut size={17} />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* ── MOBILE BOTTOM NAVBAR (< 768px) ── */}
      <nav className="mobile-bottom-navbar">
        {/* Kiri: Home */}
        <NavLink 
          to="/dashboard" 
          className={({isActive}) => `mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <Home size={22} />
          <span>Home</span>
        </NavLink>

        {/* Tengah: Tombol Kuning Mencolok (Input P2H) */}
        <NavLink 
          to="/p2h" 
          className="mobile-bottom-nav-home-btn"
          title="Input P2H Harian"
        >
          <ClipboardCheck size={28} color="#121417" />
        </NavLink>

        {/* Kanan: Profil User */}
        <button 
          type="button" 
          onClick={() => setShowProfileModal(true)} 
          className={`mobile-bottom-nav-item ${showProfileModal ? 'active' : ''}`}
        >
          <User size={22} />
          <span>Profil</span>
        </button>
      </nav>

      {/* ── PROFILE MODAL POPUP FOR MOBILE ── */}
      {showProfileModal && (
        <div className="mobile-profile-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="mobile-profile-modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} style={{ color: 'var(--color-yellow-primary)' }} />
                <span style={{ fontWeight: 'bold', fontSize: '1rem', color: '#ffffff' }}>Profil Pengguna</span>
              </div>
              <button 
                type="button"
                onClick={() => setShowProfileModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-silver)', cursor: 'pointer', padding: '0.2rem' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.3) 0%, rgba(255, 152, 0, 0.15) 100%)',
                border: '3px solid var(--color-yellow-primary)',
                margin: '0 auto 0.75rem auto',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem', boxShadow: '0 0 15px rgba(255, 193, 7, 0.3)'
              }}>
                👤
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#ffffff', marginBottom: '0.2rem' }}>
                {userName}
              </div>
              <span style={{ padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.75rem', backgroundColor: 'rgba(255, 193, 7, 0.15)', color: 'var(--color-yellow-primary)', border: '1px solid rgba(255, 193, 7, 0.3)', fontWeight: 'bold' }}>
                {userRole}
              </span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.75rem', border: '1px solid var(--color-border)', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--color-silver)' }}>Username / ID:</span>
                <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{user?.username || userName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-silver)' }}>Akses Sistem:</span>
                <span style={{ color: '#81c784', fontWeight: 'bold' }}>{canManage ? 'Full Access (Admin/Mekanik)' : 'Standard User'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.825rem' }}
                onClick={() => setShowProfileModal(false)}
              >
                Tutup
              </button>
              <button 
                type="button" 
                className="btn" 
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.825rem', backgroundColor: 'rgba(244, 67, 54, 0.2)', color: '#ff8a80', border: '1px solid #f44336' }}
                onClick={() => { setShowProfileModal(false); handleLogout(); }}
              >
                <LogOut size={16} style={{ marginRight: '0.35rem' }} /> Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
