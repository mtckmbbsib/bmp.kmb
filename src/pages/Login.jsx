import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WrenchIcon, User, Lock, ArrowRight, AlertCircle, Activity, ClipboardCheck, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    // Query manual ke tabel users (Arsitektur Mandiri)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .maybeSingle();

    if (error) {
      console.error("Supabase Error:", error);
    }

    if (error || !data) {
      setErrorMsg('Username atau kata sandi salah!');
      setLoading(false);
    } else {
      // Simpan sesi user ke localStorage
      localStorage.setItem('user', JSON.stringify(data));
      navigate('/dashboard');
    }
  };

  return (
    <div className="login-container">
      {/* Animated Background Accents */}
      <div className="login-background-accents">
        <div className="accent-circle accent-1"></div>
        <div className="accent-circle accent-2"></div>
      </div>

      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <div className="brand-icon-container">
              <WrenchIcon size={36} strokeWidth={2.5} />
            </div>
            <h1 className="login-title">UnitMaint</h1>
            <p className="login-subtitle">Sistem Manajemen Perawatan Unit</p>
          </div>
          
          {errorMsg && (
            <div className="error-alert">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Username / NIK</label>
              <div className="input-wrapper">
                <User size={20} className="input-icon" />
                <input 
                  type="text" 
                  className="login-input" 
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label>Kata Sandi</label>
              <div className="input-wrapper">
                <Lock size={20} className="input-icon" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="login-input" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ 
                    position: 'absolute', 
                    right: '1rem', 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--color-silver-dark)', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="loader"></div>
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="info-footer">
          &copy; {new Date().getFullYear()} UnitMaint. Seluruh hak cipta dilindungi.
        </div>
      </div>

      {/* Showcase area for desktop */}
      <div className="login-showcase">
        <div className="showcase-content">
          <h2 className="showcase-title">Efisiensi & Keandalan Terjaga</h2>
          <p className="showcase-subtitle">
            Platform terpadu untuk memonitor, menjadwalkan, dan mencatat seluruh aktivitas perawatan alat berat dan unit kendaraan Anda.
          </p>
          
          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon">
                <Activity size={24} />
              </div>
              <div className="feature-text">
                <h4>Pemantauan Real-time</h4>
                <p>Pantau status kesiapan unit dan jadwal PM (Preventive Maintenance) secara langsung.</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <ClipboardCheck size={24} />
              </div>
              <div className="feature-text">
                <h4>Pelaporan Terstruktur</h4>
                <p>Dokumentasi laporan perbaikan harian, mingguan, dan bulanan dengan rapi.</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <ShieldCheck size={24} />
              </div>
              <div className="feature-text">
                <h4>Keamanan Data</h4>
                <p>Data inventaris dan riwayat servis tersimpan aman dan terpusat.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
