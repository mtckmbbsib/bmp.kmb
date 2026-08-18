import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, Trash2, CheckCircle, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SparePartManager() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = tab || 'list';

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const jabatan = user?.jabatan?.toLowerCase() || '';
  const canEditMaster = jabatan.includes('admin') || jabatan.includes('leading hand maintenance');

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [masterParts, setMasterParts] = useState([]);
  const [inItems, setInItems] = useState([]);
  const [outItems, setOutItems] = useState([]);

  // Single Item In Form
  const [showInForm, setShowInForm] = useState(false);
  const [inFormData, setInFormData] = useState({ 
    jenis_unit: '', 
    merk: '', 
    part_name: '', 
    part_number: '', 
    qty: 1, 
    date: new Date().toISOString().split('T')[0], 
    note: '',
    po_number: '',
    isNewCategory: false,
    site: '',
    min_stock: 0,
    is_critical: false
  });

  // Edit Master Catalog
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: null,
    min_stock: 0,
    is_critical: false,
    site: ''
  });

  // Bulk Upload
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [bulkPreview, setBulkPreview] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);

  // Filter state for Item Masuk
  const [inSearchPO, setInSearchPO] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    fetchData();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    // Fetch Master
    const { data: mData } = await supabase.from('spare_parts_catalog').select('*').order('jenis_unit').order('merk').order('part_name');
    if (mData) setMasterParts(mData);

    // Fetch Out Items (from PM and Repair)
    try {
      const START_DATE = '2026-08-13'; // Tanggal mulai sistem baru
      const { data: pmData } = await supabase.from('pm_reports').select('report_date, no_lambung, spare_parts').gte('report_date', START_DATE);
      const { data: repData } = await supabase.from('repair_reports').select('report_date, no_lambung, spare_parts').gte('report_date', START_DATE);
      
      let outList = [];
      if (pmData) {
        pmData.forEach(p => {
          if (p.spare_parts && Array.isArray(p.spare_parts)) {
            p.spare_parts.forEach(sp => {
              if (sp.partName) outList.push({ date: p.report_date, source: 'PM Service', unit: p.no_lambung, part: sp.partName, part_number: sp.partNumber, qty: sp.qty, note: sp.keterangan });
            });
          }
        });
      }
      if (repData) {
        repData.forEach(r => {
          if (r.spare_parts && Array.isArray(r.spare_parts)) {
            r.spare_parts.forEach(sp => {
              if (sp.partName) outList.push({ date: r.report_date, source: 'Perbaikan', unit: r.no_lambung, part: sp.partName, part_number: sp.partNumber, qty: sp.qty, note: sp.keterangan });
            });
          }
        });
      }
      outList.sort((a,b) => new Date(b.date) - new Date(a.date));
      setOutItems(outList);
    } catch(e) { console.error(e); }

    // Fetch In Items
    try {
      const { data: inData } = await supabase.from('spare_parts_in').select('*').order('created_at', {ascending: false});
      if (inData) setInItems(inData);
    } catch(e) {
      console.log('spare_parts_in table might not exist yet');
    }
  };

  // Kalkulasi Stok untuk tiap part_id
  const getStock = (part) => {
    if (!part) return 0;
    // Total Masuk (berdasarkan part_id)
    const totalIn = inItems.filter(i => i.part_id === part.id).reduce((sum, item) => sum + (item.qty || 0), 0);
    // Total Keluar (berdasarkan pencocokan nama part / part number karena dari PM/Repair disave berupa teks)
    const totalOut = outItems.filter(o => {
      const nameMatch = o.part.trim().toLowerCase() === (part.part_name || '').trim().toLowerCase();
      const numMatch = (!o.part_number && !part.part_number) || (o.part_number || '').trim().toLowerCase() === (part.part_number || '').trim().toLowerCase();
      return nameMatch && numMatch;
    }).reduce((sum, item) => sum + (item.qty || 0), 0);
    
    return totalIn - totalOut;
  };

  // Pengelompokan Data List
  const groupedParts = useMemo(() => {
    const groups = {};
    masterParts.forEach(p => {
      const jenis = p.jenis_unit || 'Lain-lain';
      const merk = p.merk || 'Umum';
      if (!groups[jenis]) groups[jenis] = {};
      if (!groups[jenis][merk]) groups[jenis][merk] = [];
      groups[jenis][merk].push(p);
    });
    return groups;
  }, [masterParts]);

  const unitMerkList = useMemo(() => {
    const list = [];
    masterParts.forEach(p => {
      if (p.jenis_unit && p.merk) {
        const label = `${p.jenis_unit} - ${p.merk}`;
        if (!list.find(x => x.label === label)) {
          list.push({ label, jenis: p.jenis_unit, merk: p.merk });
        }
      }
    });
    // Urutkan berdasarkan abjad
    return list.sort((a, b) => a.label.localeCompare(b.label));
  }, [masterParts]);

  const handleDeleteMaster = async (id) => {
    if (window.confirm('Hapus spare part ini dari katalog? Perhatian: Stok historis akan menjadi yatim/terputus.')) {
      await supabase.from('spare_parts_catalog').delete().eq('id', id);
      fetchData();
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('spare_parts_catalog').update({
        jenis_unit: editFormData.jenis_unit,
        merk: editFormData.merk,
        part_name: editFormData.part_name,
        part_number: editFormData.part_number,
        min_stock: parseInt(editFormData.min_stock) || 0,
        is_critical: editFormData.is_critical,
        site: editFormData.site || 'Semua Site'
      }).eq('id', editFormData.id);

      if (error) throw error;
      setShowEditForm(false);
      fetchData();
    } catch (err) {
      alert('Gagal menyimpan perubahan.');
      console.error(err);
    }
  };

  const handleSaveIn = async (e) => {
    e.preventDefault();
    try {
      let partId = null;
      let existingPart = null;

      const inputPartNumber = inFormData.part_number.trim();
      const normalizePN = (num) => (num || '').replace(/[^A-Z0-9]/ig, '').toUpperCase();
      const inputPartNumberNormalized = normalizePN(inputPartNumber);

      // Prioritize searching by part_number if provided
      if (inputPartNumber !== '') {
        // Exact match
        existingPart = masterParts.find(p => (p.part_number || '').trim().toUpperCase() === inputPartNumber.toUpperCase());
        
        // Similar match (ignore spaces, dashes, etc.)
        if (!existingPart) {
          const similarPart = masterParts.find(p => normalizePN(p.part_number) === inputPartNumberNormalized);
          if (similarPart) {
            const confirm = window.confirm(`Part number yang Anda masukkan ("${inputPartNumber}") mirip dengan part "${similarPart.part_number}" yang sudah ada di katalog.\n\nApakah Anda ingin menggunakan part yang sudah ada tersebut?\n(Klik OK untuk YA menggunakan yang lama, klik Cancel untuk TETAP BUAT BARU)`);
            if (confirm) {
              existingPart = similarPart;
              inFormData.part_number = similarPart.part_number; // Update data so it saves correctly
              inFormData.part_name = similarPart.part_name;
              inFormData.merk = similarPart.merk;
              inFormData.jenis_unit = similarPart.jenis_unit;
            }
          }
        }
      }
      
      // Fallback search by part_name, merk, and jenis_unit
      if (!existingPart && inFormData.part_name) {
        existingPart = masterParts.find(p => 
          (p.part_name || '').trim().toLowerCase() === inFormData.part_name.trim().toLowerCase() &&
          (p.merk || '').trim().toLowerCase() === (inFormData.merk || '').trim().toLowerCase() &&
          (p.jenis_unit || '').trim().toLowerCase() === (inFormData.jenis_unit || '').trim().toLowerCase()
        );
      }

      if (existingPart) {
        partId = existingPart.id;
      } else {
        // Create new part in catalog
        const { data, error } = await supabase.from('spare_parts_catalog').insert([{
          jenis_unit: inFormData.jenis_unit,
          merk: inFormData.merk,
          part_name: inFormData.part_name,
          part_number: inFormData.part_number,
          site: inFormData.site || 'Semua Site',
          min_stock: parseInt(inFormData.min_stock) || 0,
          is_critical: inFormData.is_critical
        }]).select();
        
        if (error) throw error;
        if (data && data.length > 0) {
          partId = data[0].id;
        }
      }

      if (partId) {
        await supabase.from('spare_parts_in').insert([{
          part_id: partId,
          qty: parseInt(inFormData.qty),
          receive_date: inFormData.date,
          note: inFormData.note,
          po_number: inFormData.po_number || ''
        }]);
        
        setShowInForm(false);
        fetchData();
        setInFormData({ jenis_unit: '', merk: '', part_name: '', part_number: '', qty: 1, date: new Date().toISOString().split('T')[0], note: '', po_number: '', isNewCategory: false, site: '', min_stock: 0, is_critical: false });
      }
    } catch (err) {
      alert('Gagal menyimpan.');
      console.error(err);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = "Jenis Unit;Merk;Nama Sparepart;Part Number;Jumlah;Site;No PO\n";
    const example = "Genset;Perkins;Oil Filter;26560145;10;Merdeka Camp;PO-2023-001\nCompressor;Airman;Air Filter;11223344;5;Semua Site;\n";
    const content = "\uFEFF" + headers + example;
    
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Template_Upload_Sparepart.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      try {
        const rows = text.trim().split('\n');
        let parsed = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i].trim();
          if (!row) continue;
          
          const separator = row.includes(';') ? ';' : ',';
          const cols = row.split(separator).map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length < 5) continue; 
          
          const [jenisUnit, merk, namaPart, partNumber, strJumlah, site, poNumber] = cols;
          parsed.push({ jenisUnit, merk, namaPart, partNumber, jumlah: parseInt(strJumlah) || 0, site: site || 'Semua Site', poNumber: poNumber || '' });
        }
        setBulkPreview(parsed);
      } catch (err) {
        alert('Terjadi kesalahan saat membaca file CSV.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e) => {
    processFile(e.target.files[0]);
    e.target.value = null;
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragActive(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragActive(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmBulkUpload = async () => {
    setIsUploading(true);
    let successCount = 0;
    try {
      for (const item of bulkPreview) {
        let partId = null;
        const existing = masterParts.find(p => 
          (p.part_name || '').toLowerCase() === item.namaPart.toLowerCase() &&
          (p.part_number || '').toLowerCase() === item.partNumber.toLowerCase()
        );
        
        if (existing) {
          partId = existing.id;
        } else {
          const { data: newPart, error: errInsert } = await supabase.from('spare_parts_catalog').insert([{
            jenis_unit: item.jenisUnit,
            merk: item.merk,
            part_name: item.namaPart,
            part_number: item.partNumber,
            site: item.site || 'Semua Site'
          }]).select();
          
          if (errInsert) {
            console.error("Insert catalog error:", errInsert);
            throw new Error(`Gagal menyimpan part ${item.namaPart}: ${errInsert.message}`);
          }
          
          if (!errInsert && newPart && newPart.length > 0) {
            partId = newPart[0].id;
            masterParts.push(newPart[0]); 
          }
        }
        
        if (partId && item.jumlah > 0) {
          const { error: errIn } = await supabase.from('spare_parts_in').insert([{
            part_id: partId,
            qty: item.jumlah,
            receive_date: new Date().toISOString().split('T')[0],
            note: 'Bulk Upload',
            po_number: item.poNumber || ''
          }]);
          if (errIn) {
             console.error("Insert in error:", errIn);
             throw new Error(`Gagal menyimpan stok untuk part ${item.namaPart}: ${errIn.message}`);
          }
        }
        successCount++;
      }
      
      alert(`Berhasil menyimpan ${successCount} data ke database!`);
      setShowBulkForm(false);
      setBulkPreview([]);
      fetchData();
    } catch (err) {
      alert(`Terjadi kesalahan: ${err.message}`);
      console.error(err);
    }
    setIsUploading(false);
  };

  // Modals Styling
  const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)'
  };
  const modalStyle = {
    background: '#1e1e1e', padding: '1.5rem', borderRadius: '12px', 
    width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto',
    border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="no-print" style={{ flexShrink: 0, marginBottom: '1rem' }}>
        <h1 style={{ textAlign: 'center', fontSize: '1.2rem', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <Package size={22} style={{ color: 'var(--color-yellow-primary)' }} />
          Pengelolaan Spare Part
        </h1>
      </div>

      <div className="card hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        
        {/* --- TAB LIST SPARE PART --- */}
        {activeTab === 'list' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', color: 'var(--color-yellow-primary)', marginBottom: '0.2rem' }}>Katalog Spare Part</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-silver)', margin: 0 }}>Daftar terkelompok sesuai Jenis Unit dan Merk.</p>
              </div>
            </div>
            
            {masterParts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-silver-light)' }}>
                <Package size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>Katalog masih kosong.</p>
                <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Buka tab <b>Item Masuk</b> untuk meng-upload atau menambahkan data baru.</p>
              </div>
            ) : (
              <div>
                {Object.keys(groupedParts).map((jenisUnit, idx) => (
                  <div key={idx} style={{ marginBottom: '2rem' }}>
                    <div style={{ padding: '0.4rem 0.8rem', background: 'var(--color-yellow-primary)', color: '#000', fontWeight: 'bold', borderRadius: '4px', display: 'inline-block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      {jenisUnit}
                    </div>
                    
                    {Object.keys(groupedParts[jenisUnit]).map((merk, mIdx) => (
                      <div key={mIdx} style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-silver-light)', fontWeight: '600', marginBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.2rem' }}>
                          Merk: {merk}
                        </div>
                        
                        <div className="table-responsive">
                          <table className="table" style={{ width: '100%', color: 'var(--color-silver)', fontSize: '0.85rem' }}>
                            <thead>
                              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <th style={{ padding: '0.5rem', textAlign: 'left', width: '25%' }}>Nama Part</th>
                                <th style={{ padding: '0.5rem', textAlign: 'left', width: '20%' }}>Part Number</th>
                                <th style={{ padding: '0.5rem', textAlign: 'left', width: '15%' }}>Site</th>
                                <th style={{ padding: '0.5rem', textAlign: 'center', width: '10%' }}>Stok</th>
                                <th style={{ padding: '0.5rem', textAlign: 'center', width: '15%' }}>Min Stok</th>
                                {canEditMaster && <th style={{ padding: '0.5rem', textAlign: 'center', width: '15%' }}>Aksi</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {groupedParts[jenisUnit][merk].map(p => {
                                const stock = getStock(p);
                                const isWarning = p.min_stock > 0 && stock <= p.min_stock;
                                return (
                                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '0.5rem', color: '#fff' }}>
                                      {p.part_name}
                                      {p.is_critical && (
                                        <span style={{ marginLeft: '6px', fontSize: '0.65rem', background: '#ff5252', color: '#fff', padding: '2px 4px', borderRadius: '4px', fontWeight: 'bold' }}>KRITIKAL</span>
                                      )}
                                    </td>
                                    <td style={{ padding: '0.5rem' }}>{p.part_number || '-'}</td>
                                    <td style={{ padding: '0.5rem' }}>{p.site || 'Semua Site'}</td>
                                    <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', color: stock > 0 ? '#4caf50' : '#f44336' }}>
                                      {stock}
                                    </td>
                                    <td style={{ padding: '0.5rem', textAlign: 'center', color: isWarning ? '#ff9800' : 'inherit', fontWeight: isWarning ? 'bold' : 'normal' }}>
                                      {p.min_stock || 0}
                                    </td>
                                    {canEditMaster && (
                                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                        <button 
                                          onClick={() => {
                                            setEditFormData({ 
                                              id: p.id, 
                                              jenis_unit: p.jenis_unit || '',
                                              merk: p.merk || '',
                                              part_name: p.part_name || '',
                                              part_number: p.part_number || '',
                                              min_stock: p.min_stock || 0, 
                                              is_critical: p.is_critical || false, 
                                              site: p.site || 'Semua Site' 
                                            });
                                            setShowEditForm(true);
                                          }} 
                                          style={{ background: 'transparent', border: 'none', color: '#ffb300', cursor: 'pointer', padding: '4px' }} 
                                          title="Edit Master Part"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                        </button>
                                        <button onClick={() => handleDeleteMaster(p.id)} style={{ background: 'transparent', border: 'none', color: '#ff8a80', cursor: 'pointer', padding: '4px' }} title="Hapus Part">
                                          <Trash2 size={15} />
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB ITEM MASUK --- */}
        {activeTab === 'in' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', color: 'var(--color-yellow-primary)' }}>Registrasi Item Masuk</h2>
              {canEditMaster && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" onClick={() => setShowBulkForm(true)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    <Upload size={14} style={{ display: 'inline', marginRight: '4px' }} /> Upload Bulk
                  </button>
                  <button className="btn btn-primary" onClick={() => setShowInForm(true)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    + Tambah Item / Stok
                  </button>
                </div>
              )}
            </div>

            {/* MODAL: Upload Bulk */}
            {showBulkForm && (
              <div style={modalOverlayStyle}>
                <div style={modalStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ color: '#64b5f6', margin: 0, fontSize: '1.2rem' }}>Upload Bulk CSV</h2>
                    <button onClick={() => { setShowBulkForm(false); setBulkPreview([]); }} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
                  </div>
                  
                  {bulkPreview.length === 0 ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-silver)', margin: 0 }}>Format kolom: Jenis Unit, Merk, Nama Sparepart, Part Number, Jumlah, Site, No PO</p>
                        <button onClick={handleDownloadTemplate} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>⬇ Download Template</button>
                      </div>
                      
                      <div 
                        onDragOver={handleDragOver} 
                        onDragLeave={handleDragLeave} 
                        onDrop={handleDrop}
                        style={{ 
                          border: `2px dashed ${isDragActive ? '#64b5f6' : 'rgba(255,255,255,0.2)'}`, 
                          background: isDragActive ? 'rgba(33,150,243,0.1)' : 'rgba(255,255,255,0.02)',
                          padding: '3rem 1rem', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                          marginBottom: '1rem'
                        }}
                        onClick={() => document.getElementById('file-upload').click()}
                      >
                        <Upload size={40} style={{ color: isDragActive ? '#64b5f6' : 'rgba(255,255,255,0.3)', marginBottom: '1rem' }} />
                        <h3 style={{ color: '#fff', margin: '0 0 0.5rem 0' }}>Drag & Drop file CSV ke sini</h3>
                        <p style={{ color: 'var(--color-silver)', fontSize: '0.85rem', margin: 0 }}>Atau klik untuk memilih file</p>
                        <input id="file-upload" type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-yellow-primary)' }}>Preview Data ({bulkPreview.length} baris)</h3>
                        <button onClick={() => setBulkPreview([])} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Batal / Ganti File</button>
                      </div>
                      
                      <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                        <table className="table" style={{ width: '100%', fontSize: '0.8rem' }}>
                          <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                              <th style={{ padding: '0.5rem' }}>Jenis Unit</th>
                              <th style={{ padding: '0.5rem' }}>Merk</th>
                              <th style={{ padding: '0.5rem' }}>Nama Part</th>
                              <th style={{ padding: '0.5rem' }}>Part Number</th>
                              <th style={{ padding: '0.5rem' }}>Jumlah</th>
                              <th style={{ padding: '0.5rem' }}>Site</th>
                              <th style={{ padding: '0.5rem' }}>No PO</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bulkPreview.map((item, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.5rem' }}>{item.jenisUnit}</td>
                                <td style={{ padding: '0.5rem' }}>{item.merk}</td>
                                <td style={{ padding: '0.5rem' }}>{item.namaPart}</td>
                                <td style={{ padding: '0.5rem' }}>{item.partNumber}</td>
                                <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>{item.jumlah}</td>
                                <td style={{ padding: '0.5rem' }}>{item.site}</td>
                                <td style={{ padding: '0.5rem', color: 'var(--color-silver-light)' }}>{item.poNumber || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <button 
                        onClick={handleConfirmBulkUpload} 
                        disabled={isUploading} 
                        className="btn btn-primary" 
                        style={{ width: '100%', background: '#4caf50', borderColor: '#4caf50' }}
                      >
                        {isUploading ? 'Menyimpan ke Database...' : 'Konfirmasi & Simpan Semua Data'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}


            {/* MODAL: Input Stok / Part Baru */}
            {showInForm && (
              <div style={modalOverlayStyle}>
                <div style={modalStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ color: '#81c784', margin: 0, fontSize: '1.2rem' }}>Input Item / Stok Masuk</h2>
                    <button onClick={() => setShowInForm(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
                  </div>
                  
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-silver-light)', marginBottom: '1.5rem' }}>
                    Jika Part Number (atau kombinasi Nama/Merk/Jenis) sudah ada di katalog, stok akan otomatis ditambahkan. Jika belum, part baru akan diregistrasi.
                  </p>
                  
                  <form onSubmit={handleSaveIn}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                      {/* Datalist untuk autocomplete dari master parts */}
                      <datalist id="jenis-unit-list">
                        {[...new Set(masterParts.map(p => p.jenis_unit).filter(Boolean))].map((val, i) => <option key={i} value={val} />)}
                      </datalist>
                      <datalist id="merk-list">
                        {[...new Set(masterParts.map(p => p.merk).filter(Boolean))].map((val, i) => <option key={i} value={val} />)}
                      </datalist>
                      <datalist id="part-name-list">
                        {[...new Set(masterParts.map(p => p.part_name).filter(Boolean))].map((val, i) => <option key={i} value={val} />)}
                      </datalist>
                      <datalist id="part-number-list">
                        {[...new Set(masterParts.map(p => p.part_number).filter(Boolean))].map((val, i) => <option key={i} value={val} />)}
                      </datalist>

                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginBottom: '0.3rem', display: 'block' }}>Part Number</label>
                        <input className="input-field" placeholder="Ketik Part Number" list="part-number-list" value={inFormData.part_number} onChange={e => {
                          const num = e.target.value.toUpperCase();
                          let updates = { part_number: num };
                          // Auto-fill jika part number ditemukan
                          const found = masterParts.find(p => (p.part_number||'').toUpperCase() === num);
                          if (found && num) {
                            updates.part_name = found.part_name || '';
                            updates.merk = found.merk || '';
                            updates.jenis_unit = found.jenis_unit || '';
                            updates.isNewCategory = false;
                          }
                          setInFormData(prev => ({...prev, ...updates}));
                        }} />
                      </div>
                      
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginBottom: '0.3rem', display: 'block' }}>Nama Part *</label>
                        <input className="input-field" placeholder="Ketik Nama Part" required list="part-name-list" value={inFormData.part_name} onChange={e => setInFormData({...inFormData, part_name: e.target.value})} />
                      </div>
                      
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginBottom: '0.3rem', display: 'block' }}>Kategori (Jenis Unit - Merk) *</label>
                        <select 
                          className="input-field" 
                          required 
                          value={inFormData.isNewCategory ? 'NEW' : (inFormData.jenis_unit && inFormData.merk ? `${inFormData.jenis_unit} - ${inFormData.merk}` : '')}
                          onChange={e => {
                            if (e.target.value === 'NEW') {
                              setInFormData(prev => ({...prev, isNewCategory: true, jenis_unit: '', merk: ''}));
                            } else {
                              const selected = unitMerkList.find(x => x.label === e.target.value);
                              if (selected) {
                                setInFormData(prev => ({...prev, isNewCategory: false, jenis_unit: selected.jenis, merk: selected.merk}));
                              } else {
                                setInFormData(prev => ({...prev, isNewCategory: false, jenis_unit: '', merk: ''}));
                              }
                            }
                          }}
                        >
                          <option value="">-- Pilih Jenis Unit & Merk --</option>
                          {unitMerkList.map((u, i) => (
                            <option key={i} value={u.label}>{u.label}</option>
                          ))}
                          <option value="NEW" style={{ fontWeight: 'bold', color: 'var(--color-yellow-primary)' }}>+ Tambah Jenis/Merk Baru</option>
                        </select>
                      </div>

                      {inFormData.isNewCategory && (
                        <div style={{ display: 'flex', gap: '0.8rem', gridColumn: '1 / -1' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginBottom: '0.3rem', display: 'block' }}>Jenis Unit Baru *</label>
                            <input className="input-field" placeholder="Misal: Genset" required value={inFormData.jenis_unit} onChange={e => setInFormData({...inFormData, jenis_unit: e.target.value})} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginBottom: '0.3rem', display: 'block' }}>Merk Baru *</label>
                            <input className="input-field" placeholder="Misal: Perkins" required value={inFormData.merk} onChange={e => setInFormData({...inFormData, merk: e.target.value})} />
                          </div>
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', gap: '0.8rem', gridColumn: '1 / -1' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginBottom: '0.3rem', display: 'block' }}>Qty Masuk *</label>
                          <input type="number" className="input-field" placeholder="Jumlah" required min="1" value={inFormData.qty} onChange={e => setInFormData({...inFormData, qty: e.target.value})} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginBottom: '0.3rem', display: 'block' }}>Tanggal Masuk *</label>
                          <input type="date" className="input-field" required value={inFormData.date} onChange={e => setInFormData({...inFormData, date: e.target.value})} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginBottom: '0.3rem', display: 'block' }}>Site / Lokasi Tambang</label>
                          <input type="text" className="input-field" placeholder="Misal: Kaltim" value={inFormData.site} onChange={e => setInFormData({...inFormData, site: e.target.value})} />
                        </div>
                      </div>

                      {canEditMaster && (
                        <div style={{ display: 'flex', gap: '1rem', gridColumn: '1 / -1', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginBottom: '0.3rem', display: 'block' }}>Minimum Stok (Batas Peringatan)</label>
                            <input type="number" className="input-field" min="0" value={inFormData.min_stock} onChange={e => setInFormData({...inFormData, min_stock: e.target.value})} />
                          </div>
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', marginTop: '1.2rem' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--color-silver)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={inFormData.is_critical} 
                                onChange={e => setInFormData({...inFormData, is_critical: e.target.checked})}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                              />
                              Tandai sebagai Item Kritikal
                            </label>
                          </div>
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', gap: '0.8rem', gridColumn: '1 / -1' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginBottom: '0.3rem', display: 'block' }}>Nomor PO (Opsional)</label>
                          <input type="text" className="input-field" placeholder="Misal: PO-2023-001" value={inFormData.po_number} onChange={e => setInFormData({...inFormData, po_number: e.target.value})} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginBottom: '0.3rem', display: 'block' }}>Catatan</label>
                          <input type="text" className="input-field" placeholder="Nama Supplier, Nama Kurir, dll" value={inFormData.note} onChange={e => setInFormData({...inFormData, note: e.target.value})} />
                        </div>
                      </div>
                      
                      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowInForm(false)}>Batal</button>
                        <button type="submit" className="btn btn-primary" style={{ background: '#4caf50', borderColor: '#4caf50', padding: '0.5rem 1.5rem' }}>Simpan Data</button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="table-responsive" style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--color-silver-light)', margin: 0 }}>Riwayat Pemasukan Stok</h3>
                <div>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Cari No PO..." 
                    value={inSearchPO} 
                    onChange={(e) => setInSearchPO(e.target.value)}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', minWidth: '200px' }}
                  />
                </div>
              </div>
              <table className="table" style={{ width: '100%', color: 'var(--color-silver)', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Tanggal</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Part</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>No PO</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {inItems
                    .filter(item => {
                      if (!inSearchPO) return true;
                      const po = item.po_number || '';
                      return po.toLowerCase().includes(inSearchPO.toLowerCase());
                    })
                    .map(item => {
                      const part = masterParts.find(p => p.id === item.part_id);
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.5rem' }}>{item.receive_date}</td>
                          <td style={{ padding: '0.5rem' }}>{part ? `${part.part_name} (${part.jenis_unit})` : 'Part Tidak Dikenal'}</td>
                          <td style={{ padding: '0.5rem', color: 'var(--color-yellow-primary)' }}>{item.po_number || '-'}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'center', color: '#81c784', fontWeight: 'bold' }}>+{item.qty}</td>
                          <td style={{ padding: '0.5rem' }}>{item.note || '-'}</td>
                        </tr>
                      );
                    })}
                  {inItems.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem' }}>Belum ada data masuk.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB SPARE PART KELUAR --- */}
        {activeTab === 'out' && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', color: 'var(--color-yellow-primary)' }}>Spare Part Keluar</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-silver)' }}>Riwayat penggunaan spare part otomatis ditarik dari Laporan PM Service & Perbaikan.</p>
            </div>

            <div className="table-responsive">
              <table className="table" style={{ width: '100%', color: 'var(--color-silver)', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Tanggal</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Sumber Laporan</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Unit / No Lambung</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Part</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {outItems.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.5rem' }}>{item.date}</td>
                      <td style={{ padding: '0.5rem' }}><span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: item.source === 'PM Service' ? 'rgba(33,150,243,0.1)' : 'rgba(255,152,0,0.1)', color: item.source === 'PM Service' ? '#64b5f6' : '#ffb74d', fontSize: '0.75rem', fontWeight: 'bold' }}>{item.source}</span></td>
                      <td style={{ padding: '0.5rem' }}>{item.unit}</td>
                      <td style={{ padding: '0.5rem', fontWeight: 'bold', color: '#fff' }}>{item.part} {item.part_number && <span style={{ opacity: 0.6, fontSize: '0.75rem', fontWeight: 'normal' }}>({item.part_number})</span>}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'center', color: '#e57373', fontWeight: 'bold' }}>-{item.qty}</td>
                      <td style={{ padding: '0.5rem' }}>{item.note || '-'}</td>
                    </tr>
                  ))}
                  {outItems.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem' }}>Belum ada data pengeluaran</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL: Edit Master Part (Moved outside tabs) */}
        {showEditForm && (
          <div style={modalOverlayStyle}>
            <div style={modalStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ color: '#ffb300', margin: 0, fontSize: '1.2rem' }}>Edit Part Katalog</h2>
                <button onClick={() => setShowEditForm(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
              </div>
              <form onSubmit={handleSaveEdit}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                  
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginBottom: '0.3rem', display: 'block' }}>Jenis Unit (Grup)</label>
                    <input type="text" className="input-field" placeholder="Misal: EXCAVATOR, FORKLIFT" value={editFormData.jenis_unit} onChange={e => setEditFormData({...editFormData, jenis_unit: e.target.value})} required />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginBottom: '0.3rem', display: 'block' }}>Merk</label>
                    <input type="text" className="input-field" placeholder="Misal: CATERPILLAR" value={editFormData.merk} onChange={e => setEditFormData({...editFormData, merk: e.target.value})} required />
                  </div>
                  <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginBottom: '0.3rem', display: 'block' }}>Nama Part</label>
                    <input type="text" className="input-field" placeholder="Misal: OIL FILTER" value={editFormData.part_name} onChange={e => setEditFormData({...editFormData, part_name: e.target.value})} required />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginBottom: '0.3rem', display: 'block' }}>Part Number</label>
                    <input type="text" className="input-field" placeholder="Misal: 1R-0716" value={editFormData.part_number} onChange={e => setEditFormData({...editFormData, part_number: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginBottom: '0.3rem', display: 'block' }}>Site / Lokasi</label>
                    <input type="text" className="input-field" placeholder="Misal: BSIB" value={editFormData.site} onChange={e => setEditFormData({...editFormData, site: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginBottom: '0.3rem', display: 'block' }}>Minimum Stok (Batas Peringatan)</label>
                    <input type="number" className="input-field" min="0" value={editFormData.min_stock} onChange={e => setEditFormData({...editFormData, min_stock: e.target.value})} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--color-silver)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={editFormData.is_critical} 
                        onChange={e => setEditFormData({...editFormData, is_critical: e.target.checked})}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      Tandai sebagai Item Kritikal
                    </label>
                  </div>
                  <div style={{ gridColumn: isMobile ? '1' : '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditForm(false)}>Batal</button>
                    <button type="submit" className="btn btn-primary" style={{ background: '#ffb300', borderColor: '#ffb300', color: '#000', padding: '0.5rem 1.5rem', fontWeight: 'bold' }}>Simpan Perubahan</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
