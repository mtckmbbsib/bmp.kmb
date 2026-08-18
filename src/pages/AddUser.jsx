import { useState, useEffect, useMemo } from 'react';
import { UserPlus, Users, Save, Trash2, Key, Shield, UserCheck, AlertCircle, CheckCircle2, Lock, MapPin, Briefcase, User, Search, Edit2, X, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AddUser() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [usersList, setUsersList] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [jabatan, setJabatan] = useState('Mechanic');
  const [site, setSite] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);

  // Fitur Edit
  const [editingUserId, setEditingUserId] = useState(null);
  
  // Fitur Pencarian & Pengurutan
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });

  const JABATAN_OPTIONS = [
    'Leading Hand Maintenance',
    'Leading Hand Field',
    'Leading Hand OSP',
    'Site Coordinator',
    'Assistant Site Coordinator',
    'Mechanic',
    'Admin',
    'Operator MMU',
    'Operator Plant',
    'SHERQ'
  ];

  const jabatanColor = (jab) => {
    if (!jab) return { bg: 'rgba(255,255,255,0.06)', border: 'var(--color-border)', text: 'var(--color-silver-light)' };
    const j = jab.toLowerCase();
    if (j.includes('admin')) return { bg: 'rgba(239,83,80,0.12)', border: 'rgba(239,83,80,0.3)', text: '#ef9a9a' };
    if (j.includes('leading') || j.includes('coordinator')) return { bg: 'rgba(255,193,7,0.12)', border: 'rgba(255,193,7,0.3)', text: 'var(--color-yellow-primary)' };
    if (j.includes('sherq')) return { bg: 'rgba(100,181,246,0.12)', border: 'rgba(100,181,246,0.3)', text: '#90caf9' };
    return { bg: 'rgba(255,255,255,0.06)', border: 'var(--color-border)', text: 'var(--color-silver-light)' };
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    fetchUsers();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchUsers = async () => {
    try {
      let query = supabase.from('users').select('*').neq('username', 'dummy').order('id', { ascending: true });
      
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
        setUsersList(data);
      }
    } catch (err) {
      console.warn('Fetch users error:', err);
    }
  };

  const processedUsers = useMemo(() => {
    let result = [...usersList];

    // Filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(u => 
        u.username?.toLowerCase().includes(q) ||
        (u.name || u.full_name || '')?.toLowerCase().includes(q) ||
        u.jabatan?.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key] || '';
        let bValue = b[sortConfig.key] || '';
        
        // Handle name fallback
        if (sortConfig.key === 'name') {
          aValue = a.name || a.full_name || a.username || '';
          bValue = b.name || b.full_name || b.username || '';
        }

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [usersList, searchTerm, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    let payload = {
      username: username.trim(),
      name: fullName.trim() || username.trim(),
      full_name: fullName.trim() || username.trim(),
      jabatan: jabatan,
      site: site.trim() || '-'
    };
    
    // Hanya tambahkan password ke payload jika tidak kosong (penting untuk mode Edit)
    if (password) {
      payload.password = password;
    } else if (!editingUserId) {
      // Jika mode tambah baru, password wajib
      setIsError(true);
      setMessage("Password wajib diisi untuk akun baru");
      setLoading(false);
      return;
    }

    try {
      if (editingUserId) {
        // Mode UPDATE
        const { error } = await supabase
          .from('users')
          .update(payload)
          .eq('id', editingUserId);
        
        if (error) throw error;
        setMessage(`Akun "${username}" berhasil diupdate!`);
      } else {
        // Mode INSERT
        let { data, error } = await supabase
          .from('users')
          .insert([payload])
          .select();

        if (error && error.code === 'PGRST204') {
          const altPayload = {
            username: username.trim(),
            password: password,
            name: fullName.trim() || username.trim(),
            jabatan: jabatan
          };
          const altRes = await supabase.from('users').insert([altPayload]).select();
          error = altRes.error;
          data = altRes.data;
        }
        if (error) throw error;
        setMessage(`Akun "${username}" (${jabatan}) berhasil ditambahkan!`);
      }

      setIsError(false);
      cancelEdit(); // Reset form
      fetchUsers(); // Refresh data
    } catch (err) {
      console.error('Add/Update user error detail:', err);
      setIsError(true);
      setMessage(`Gagal menyimpan: ${err.message || 'Cek konsol browser'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (u) => {
    setEditingUserId(u.id);
    setUsername(u.username || '');
    setFullName(u.name || u.full_name || '');
    setJabatan(u.jabatan || 'Mechanic');
    setSite(u.site || '');
    setPassword(''); // Kosongkan password saat edit, agar admin tidak bingung
    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setUsername('');
    setPassword('');
    setFullName('');
    setSite('');
    setJabatan('Mechanic');
    setMessage(null);
  };

  const handleDeleteUser = async (id, uname) => {
    if (window.confirm(`Hapus akun "${uname}"?`)) {
      try {
        await supabase.from('users').delete().eq('id', id);
      } catch (_) {}
      setUsersList(prev => prev.filter(u => u.id !== id));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ flexShrink: 0, marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Shield size={22} style={{ color: 'var(--color-yellow-primary)' }} />
          <h1 style={{ fontSize: '1.2rem', margin: 0, color: '#ffffff' }}>Manajemen Pengguna</h1>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--color-silver)', margin: 0, textAlign: 'center' }}>
          Kelola akun yang dapat mengakses sistem Bulk Maintenance & Project Engineering
        </p>
      </div>

      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0 0 90px 0' : '0 0 1.5rem 0' }}>

        {/* ── Form Tambah Akun ── */}
        <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
          
          {/* Card Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '1rem', paddingBottom: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <UserPlus size={16} style={{ color: 'var(--color-yellow-primary)' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-yellow-primary)' }}>
              {editingUserId ? 'Update Akun Pengguna' : 'Tambah Akun Baru'}
            </span>
          </div>

          {/* Alert Message */}
          {message && (
            <div style={{ 
              padding: '0.65rem 0.85rem', 
              borderRadius: '8px', 
              marginBottom: '1rem',
              backgroundColor: isError ? 'rgba(255, 82, 82, 0.1)' : 'rgba(76, 175, 80, 0.1)',
              border: `1px solid ${isError ? 'rgba(255, 82, 82, 0.3)' : 'rgba(76, 175, 80, 0.3)'}`,
              color: isError ? '#ff8a80' : '#81c784',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              fontSize: '0.82rem'
            }}>
              {isError ? <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} /> : <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '1px' }} />}
              {message}
            </div>
          )}

          <form onSubmit={handleAddUser}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '1rem' }}>

              {/* Username */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-silver)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                  <User size={13} /> Username / NIK *
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ height: '38px', fontSize: '0.875rem', width: '100%' }} 
                  placeholder="Contoh: mekanik01 / admin" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  required 
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-silver)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                  <Lock size={13} /> Kata Sandi (Password) {!editingUserId && '*'}
                </label>
                <input 
                  type="password" 
                  className="input-field" 
                  style={{ height: '38px', fontSize: '0.875rem', width: '100%' }} 
                  placeholder={editingUserId ? "Kosongkan jika tidak ingin mengubah password" : "Masukkan password..."} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required={!editingUserId} 
                />
              </div>

              {/* Nama Lengkap + Site (2 col on desktop, single col on mobile) */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.7rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-silver)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                    <UserCheck size={13} /> Nama Lengkap
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    style={{ height: '38px', fontSize: '0.875rem', width: '100%' }} 
                    placeholder="Contoh: Budi Santoso" 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-silver)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                    <MapPin size={13} /> Lokasi Site *
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    style={{ height: '38px', fontSize: '0.875rem', width: '100%' }} 
                    placeholder="Contoh: Site Melak" 
                    value={site} 
                    onChange={e => setSite(e.target.value)} 
                    required
                  />
                </div>
              </div>

              {/* Jabatan */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-silver)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                  <Briefcase size={13} /> Jabatan / Role *
                </label>
                <input 
                  list="jabatan-list"
                  className="input-field" 
                  style={{ height: '38px', fontSize: '0.875rem', width: '100%' }} 
                  value={jabatan} 
                  onChange={e => setJabatan(e.target.value)}
                  placeholder="Ketik Jabatan jika tidak ada pada list..."
                  required
                />
                <datalist id="jabatan-list">
                  {JABATAN_OPTIONS.map(j => (
                    <option key={j} value={j} />
                  ))}
                </datalist>
              </div>

            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {editingUserId && (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ width: '40%', height: '40px', fontSize: '0.875rem', fontWeight: '700' }} 
                  onClick={cancelEdit}
                  disabled={loading}
                >
                  <X size={16} /> Batal Edit
                </button>
              )}
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: editingUserId ? '60%' : '100%', height: '40px', fontSize: '0.875rem', fontWeight: '700' }} 
                disabled={loading}
              >
                <Save size={16} /> {loading ? 'Menyimpan...' : (editingUserId ? 'Update Akun' : 'Simpan Akun Baru')}
              </button>
            </div>
          </form>
        </div>

        {/* ── Daftar Pengguna ── */}
        <div className="card" style={{ padding: '1rem' }}>
          
          {/* Card Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Users size={16} style={{ color: 'var(--color-yellow-primary)' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-yellow-primary)' }}>
                  Daftar Pengguna
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-silver)', background: 'rgba(255,255,255,0.06)', padding: '0.15rem 0.5rem', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                {processedUsers.length} akun
              </span>
            </div>
            
            {/* Pencarian */}
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-silver)' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Cari Username, Nama, atau Jabatan..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', paddingLeft: '32px', height: '36px', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          {usersList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-silver-dark)' }}>
              <Users size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
              <p style={{ fontSize: '0.85rem' }}>Belum ada akun pengguna tersimpan.</p>
            </div>
          ) : isMobile ? (
            /* Mobile: Card list */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {processedUsers.map(u => {
                const jColor = jabatanColor(u.jabatan);
                return (
                  <div 
                    key={u.id} 
                    style={{ 
                      background: 'rgba(255,255,255,0.03)', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: '8px', 
                      padding: '0.75rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '0.5rem'
                    }}
                  >
                    {/* Left: user info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--color-yellow-primary)' }}>
                          {u.username}
                        </span>
                        <span style={{ 
                          fontSize: '0.68rem', fontWeight: '600', 
                          padding: '0.1rem 0.45rem', borderRadius: '4px',
                          backgroundColor: jColor.bg, border: `1px solid ${jColor.border}`, color: jColor.text
                        }}>
                          {u.jabatan || 'Pengguna'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#ffffff', marginBottom: '0.15rem' }}>
                        {u.name || u.full_name || '-'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-silver)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={10} /> {u.site || '-'}
                      </div>
                    </div>
                    {/* Right: action buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
                      <button 
                        style={{ background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.3)', cursor: 'pointer', color: 'var(--color-yellow-primary)', padding: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}
                        onClick={() => handleEditClick(u)} 
                        title="Edit Akun"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        style={{ background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.3)', cursor: 'pointer', color: '#ff8a80', padding: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}
                        onClick={() => handleDeleteUser(u.id, u.username)} 
                        title="Hapus Akun"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Desktop: Table */
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                    <th onClick={() => handleSort('username')} style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver)', fontWeight: '600', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>Username / NIK {sortConfig.key === 'username' ? (sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : null}</div>
                    </th>
                    <th onClick={() => handleSort('name')} style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver)', fontWeight: '600', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>Nama Lengkap {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : null}</div>
                    </th>
                    <th onClick={() => handleSort('site')} style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver)', fontWeight: '600', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>Lokasi Site {sortConfig.key === 'site' ? (sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : null}</div>
                    </th>
                    <th onClick={() => handleSort('jabatan')} style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver)', fontWeight: '600', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>Jabatan / Role {sortConfig.key === 'jabatan' ? (sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) : null}</div>
                    </th>
                    <th style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver)', fontWeight: '600', textAlign: 'center', width: '100px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {processedUsers.map(u => {
                    const jColor = jabatanColor(u.jabatan);
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.65rem 0.85rem', fontWeight: 'bold', color: 'var(--color-yellow-primary)' }}>
                          {u.username}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', color: '#ffffff' }}>
                          {u.name || u.full_name || u.username}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', color: 'var(--color-silver-light)' }}>
                          {u.site || '-'}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem' }}>
                          <span style={{ 
                            padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600',
                            backgroundColor: jColor.bg, color: jColor.text, border: `1px solid ${jColor.border}`
                          }}>
                            {u.jabatan || 'Pengguna'}
                          </span>
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.25rem', minWidth: '30px', color: 'var(--color-yellow-primary)', borderColor: 'rgba(255,193,7,0.3)' }} 
                              onClick={() => handleEditClick(u)} 
                              title="Edit Akun"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.25rem', minWidth: '30px', color: '#ff8a80', borderColor: 'rgba(255,138,128,0.3)' }} 
                              onClick={() => handleDeleteUser(u.id, u.username)} 
                              title="Hapus Akun"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
