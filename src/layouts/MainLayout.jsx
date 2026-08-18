import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Wrench, PenTool, WrenchIcon, PlusCircle, ClipboardCheck, UserPlus, LogOut, Home, User, ListChecks, X, ShieldCheck, List, ChevronDown, ChevronRight, ClipboardList } from 'lucide-react';

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
        setIsWoOpen(false); setIsWeeklyOpen(false); setIsPmOpen(false); setIsReportOpen(false); setIsSparePartOpen(false); 
        if (defaultPath) navigate(defaultPath);
      }
    } else if (menu === 'wo') {
      setIsWoOpen(!isWoOpen);
      if (!isWoOpen) { 
        setIsP2hOpen(false); setIsWeeklyOpen(false); setIsPmOpen(false); setIsReportOpen(false); setIsSparePartOpen(false); 
        if (defaultPath) navigate(defaultPath);
      }
    } else if (menu === 'weekly') {
      setIsWeeklyOpen(!isWeeklyOpen);
      if (!isWeeklyOpen) { 
        setIsP2hOpen(false); setIsWoOpen(false); setIsPmOpen(false); setIsReportOpen(false); setIsSparePartOpen(false); 
        if (defaultPath) navigate(defaultPath);
      }
    } else if (menu === 'pm') {
      setIsPmOpen(!isPmOpen);
      if (!isPmOpen) { 
        setIsP2hOpen(false); setIsWoOpen(false); setIsWeeklyOpen(false); setIsReportOpen(false); setIsSparePartOpen(false); 
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
  
  const canManage = 
    jabatan.includes('admin') || 
    jabatan.includes('leading hand maintenance') || 
    jabatan.includes('mechanic') || 
    jabatan.includes('mekanik');

  const isAdmin = jabatan.includes('admin');

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar dari sistem?")) {
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div className="sidebar-header">
            <WrenchIcon size={28} className="text-yellow" />
            <span className="sidebar-title">UNITMAINT</span>
          </div>

          <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-silver)', marginBottom: '0.5rem' }}>Selamat datang,</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#ffffff', marginBottom: '0.2rem', lineHeight: '1.2' }}>
              {userName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-yellow-primary)', opacity: 0.9 }}>
              {userRole}
            </div>
          </div>

          <ul className="nav-links">
            <li>
              <NavLink 
                to="/dashboard" 
                className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
              >
                <LayoutDashboard size={20} />
                Dashboard
              </NavLink>
            </li>
            
            {canManage && (
              <li>
                <NavLink 
                  to="/add-unit" 
                  className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                >
                  <PlusCircle size={20} />
                  Tambah SPIP
                </NavLink>
              </li>
            )}

            <li>
              <div 
                className="nav-item" 
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => toggleMenu('timesheet', '/timesheet/create')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <ClipboardList size={20} />
                  <span>Time Sheet Operator</span>
                </div>
                {isTimesheetOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>

              {isTimesheetOpen && (
                <ul style={{ listStyle: 'none', paddingLeft: '2.5rem', margin: '0.25rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <li>
                    <NavLink 
                      to="/timesheet/create" 
                      className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', gap: '0.5rem' }}
                    >
                      <PlusCircle size={16} /> Input Time Sheet
                    </NavLink>
                  </li>
                  <li>
                    <NavLink 
                      to="/timesheet/history" 
                      className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', gap: '0.5rem' }}
                    >
                      <List size={16} /> Riwayat Time Sheet
                    </NavLink>
                  </li>
                  {!jabatan.includes('operator') && (
                    <li>
                      <NavLink 
                        to="/timesheet/report" 
                        className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', gap: '0.5rem' }}
                      >
                        <List size={16} /> Laporan UA & Problem
                      </NavLink>
                    </li>
                  )}
                </ul>
              )}
            </li>

            <li>
              <div 
                className="nav-item" 
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => toggleMenu('p2h', '/p2h/create')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <ClipboardCheck size={20} />
                  <span>Prestart P2H</span>
                </div>
                {isP2hOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>

              {isP2hOpen && (
                <ul style={{ listStyle: 'none', paddingLeft: '2.5rem', margin: '0.25rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <li>
                    <NavLink 
                      to="/p2h/create" 
                      className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', gap: '0.5rem' }}
                    >
                      <PlusCircle size={16} /> Input P2H
                    </NavLink>
                  </li>
                  {!jabatan.includes('operator') && (
                    <li>
                      <NavLink 
                        to="/p2h/pending" 
                        className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', gap: '0.5rem' }}
                      >
                        <ListChecks size={16} /> Pending P2H
                      </NavLink>
                    </li>
                  )}
                  <li>
                    <NavLink 
                      to="/p2h/history" 
                      className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', gap: '0.5rem' }}
                    >
                      <List size={16} /> Riwayat P2H
                    </NavLink>
                  </li>
                </ul>
              )}
            </li>

            {canManage && (
              <>
                <li>
                  <div 
                    className="nav-item" 
                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onClick={() => toggleMenu('weekly', '/weekly-service/schedule')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <Calendar size={20} />
                      <span>Weekly Service</span>
                    </div>
                    {isWeeklyOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>

                  {isWeeklyOpen && (
                    <ul style={{ listStyle: 'none', paddingLeft: '2.5rem', margin: '0.25rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <li>
                        <NavLink 
                          to="/weekly-service/schedule" 
                          className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', gap: '0.5rem' }}
                        >
                          <Calendar size={16} /> Jadwal Weekly
                        </NavLink>
                      </li>
                      <li>
                        <NavLink 
                          to="/weekly-service/create" 
                          className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', gap: '0.5rem' }}
                        >
                          <PlusCircle size={16} /> Buat Laporan
                        </NavLink>
                      </li>
                      <li>
                        <NavLink 
                          to="/weekly-service/history" 
                          className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', gap: '0.5rem' }}
                        >
                          <List size={16} /> Riwayat
                        </NavLink>
                      </li>
                    </ul>
                  )}
                </li>

                <li>
                  <div 
                    className="nav-item" 
                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onClick={() => toggleMenu('wo', '/work-order/create')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <ClipboardList size={20} />
                      <span>Work Order (SPK)</span>
                    </div>
                    {isWoOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>

                  {isWoOpen && (
                    <ul style={{ listStyle: 'none', paddingLeft: '2.5rem', margin: '0.25rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <li>
                        <NavLink 
                          to="/work-order/create" 
                          className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', gap: '0.5rem' }}
                        >
                          <PlusCircle size={16} /> Buat WO Baru
                        </NavLink>
                      </li>
                      <li>
                        <NavLink 
                          to="/work-order/history" 
                          className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', gap: '0.5rem' }}
                        >
                          <List size={16} /> Riwayat WO
                        </NavLink>
                      </li>
                    </ul>
                  )}
                </li>

                <li>
                  <div 
                    className="nav-item" 
                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onClick={() => toggleMenu('pm', '/pm-service/create')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <Wrench size={20} />
                      <span>PM Service</span>
                    </div>
                    {isPmOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>

                  {isPmOpen && (
                    <ul style={{ listStyle: 'none', paddingLeft: '2.5rem', margin: '0.25rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <li>
                        <NavLink 
                          to="/pm-service/create" 
                          className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', gap: '0.5rem' }}
                        >
                          <PlusCircle size={16} /> Buat Laporan PM
                        </NavLink>
                      </li>

                      <li>
                        <NavLink 
                          to="/pm-service/history" 
                          className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', gap: '0.5rem' }}
                        >
                          <List size={16} /> Riwayat Laporan
                        </NavLink>
                      </li>
                    </ul>
                  )}
                </li>
                <li>
                  <div 
                    className="nav-item" 
                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onClick={() => toggleMenu('report', '/report/create')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <PenTool size={20} />
                      <span>Report Perbaikan</span>
                    </div>
                    {isReportOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>

                  {isReportOpen && (
                    <ul style={{ listStyle: 'none', paddingLeft: '2.5rem', margin: '0.25rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <li>
                        <NavLink 
                          to="/report/create" 
                          className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', gap: '0.5rem' }}
                        >
                          <PlusCircle size={16} /> Buat Laporan
                        </NavLink>
                      </li>
                      <li>
                        <NavLink 
                          to="/report/history" 
                          className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', gap: '0.5rem' }}
                        >
                          <List size={16} /> Riwayat
                        </NavLink>
                      </li>
                    </ul>
                  )}
                </li>
              </>
            )}

            {canManage && (
              <li>
                <div 
                  className="nav-item" 
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => toggleMenu('sparepart', '/spare-part/list')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <ListChecks size={20} />
                    <span>Pengelolaan Spare Part</span>
                  </div>
                  {isSparePartOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>

                {isSparePartOpen && (
                  <ul style={{ listStyle: 'none', paddingLeft: '2.5rem', margin: '0.25rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <li>
                      <NavLink 
                        to="/spare-part/list" 
                        className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', gap: '0.5rem' }}
                      >
                        <ListChecks size={16} /> List Spare Part
                      </NavLink>
                    </li>
                    <li>
                      <NavLink 
                        to="/spare-part/in" 
                        className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', gap: '0.5rem' }}
                      >
                        <PlusCircle size={16} /> Item Masuk
                      </NavLink>
                    </li>
                    <li>
                      <NavLink 
                        to="/spare-part/out" 
                        className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', gap: '0.5rem' }}
                      >
                        <List size={16} /> Spare Part Keluar
                      </NavLink>
                    </li>
                  </ul>
                )}
              </li>
            )}

            {/* Menu Tambah Akun */}
            {isAdmin && (
              <li>
                <NavLink 
                  to="/add-user" 
                  className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
                >
                  <UserPlus size={20} />
                  Tambah Akun
                </NavLink>
              </li>
            )}
          </ul>
        </div>

        {/* Tombol Logout di bagian bawah Sidebar */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)' }}>
          <button 
            type="button" 
            onClick={handleLogout}
            className="nav-item" 
            style={{ 
              width: '100%', 
              backgroundColor: 'rgba(244, 67, 54, 0.1)', 
              color: '#ff8a80', 
              border: '1px solid rgba(244, 67, 54, 0.3)',
              cursor: 'pointer',
              justifyContent: 'flex-start'
            }}
          >
            <LogOut size={20} />
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
