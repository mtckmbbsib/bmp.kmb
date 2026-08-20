import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function GlobalToast() {
  const [toast, setToast] = useState({ show: false, message: '' });

  useEffect(() => {
    const handleShowToast = (e) => {
      setToast({ show: true, message: e.detail || 'Laporan telah terkirim!' });
      
      // Auto close after 3 seconds
      const timer = setTimeout(() => {
        setToast({ show: false, message: '' });
      }, 3000);
      
      return () => clearTimeout(timer);
    };

    window.addEventListener('show-toast', handleShowToast);
    return () => window.removeEventListener('show-toast', handleShowToast);
  }, []);

  if (!toast.show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      color: '#333',
      padding: '24px 40px',
      borderRadius: '16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      border: '1px solid rgba(0,0,0,0.05)',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        backgroundColor: '#e8f5e9',
        borderRadius: '50%',
        padding: '12px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CheckCircle2 size={40} color="#4caf50" />
      </div>
      <span style={{ 
        fontSize: '1.2rem', 
        fontWeight: 'bold',
        textAlign: 'center'
      }}>
        {toast.message}
      </span>
    </div>
  );
}
