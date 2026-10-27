import { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, HelpCircle, X } from 'lucide-react';

/**
 * Universal Dialog Helper
 * Usage anywhere in JS/React:
 * import { showDialog, showAlert, showConfirm } from '../components/UniversalDialog';
 * 
 * await showAlert({ title: 'Berhasil', message: 'Data telah disimpan!', type: 'success' });
 * const ok = await showConfirm({ title: 'Konfirmasi', message: 'Apakah Anda yakin?', type: 'warning' });
 */

let dialogTrigger = null;

export const showDialog = ({
  title = 'Pemberitahuan',
  message = '',
  type = 'info', // 'success' | 'warning' | 'danger' | 'info' | 'confirm'
  confirmText = 'OK',
  cancelText = 'Batal',
  showCancel = false,
  isConfirm = false
}) => {
  return new Promise((resolve) => {
    if (dialogTrigger) {
      dialogTrigger({
        title,
        message,
        type,
        confirmText,
        cancelText,
        showCancel: showCancel || isConfirm,
        resolve
      });
    } else {
      // Fallback
      if (isConfirm || showCancel) {
        resolve(window.confirm(message || title));
      } else {
        window.alert(message || title);
        resolve(true);
      }
    }
  });
};

export const showAlert = (message, title = 'Pemberitahuan', type = 'info') => {
  if (typeof message === 'object' && message !== null) {
    return showDialog({ ...message, showCancel: false });
  }
  return showDialog({ title, message, type, showCancel: false });
};

export const showSuccess = (message, title = 'Berhasil') => {
  return showDialog({ title, message, type: 'success', showCancel: false });
};

export const showError = (message, title = 'Terjadi Kesalahan') => {
  return showDialog({ title, message, type: 'danger', showCancel: false });
};

export const showWarning = (message, title = 'Perhatian') => {
  return showDialog({ title, message, type: 'warning', showCancel: false });
};

export const showConfirm = (message, title = 'Konfirmasi Tindakan', confirmText = 'Ya, Lanjutkan', cancelText = 'Batal') => {
  if (typeof message === 'object' && message !== null) {
    return showDialog({ ...message, isConfirm: true, showCancel: true });
  }
  return showDialog({
    title,
    message,
    type: 'warning',
    confirmText,
    cancelText,
    showCancel: true,
    isConfirm: true
  });
};

export default function UniversalDialog() {
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    dialogTrigger = (config) => {
      setDialog(config);
    };

    return () => {
      dialogTrigger = null;
    };
  }, []);

  if (!dialog) return null;

  const handleConfirm = () => {
    const res = dialog.resolve;
    setDialog(null);
    if (res) res(true);
  };

  const handleCancel = () => {
    const res = dialog.resolve;
    setDialog(null);
    if (res) res(false);
  };

  const getIconAndColors = () => {
    switch (dialog.type) {
      case 'success':
        return {
          icon: <CheckCircle2 size={32} color="#3fb950" />,
          bgIcon: 'rgba(63, 185, 80, 0.15)',
          border: 'rgba(63, 185, 80, 0.35)',
          btnColor: '#238636',
          titleColor: '#7ee787'
        };
      case 'danger':
        return {
          icon: <AlertCircle size={32} color="#f85149" />,
          bgIcon: 'rgba(248, 81, 73, 0.15)',
          border: 'rgba(248, 81, 73, 0.35)',
          btnColor: '#da3633',
          titleColor: '#ff7b72'
        };
      case 'warning':
      case 'confirm':
        return {
          icon: <AlertTriangle size={32} color="#e5a50a" />,
          bgIcon: 'rgba(229, 165, 10, 0.15)',
          border: 'rgba(229, 165, 10, 0.35)',
          btnColor: 'var(--color-yellow-primary)',
          titleColor: 'var(--color-yellow-primary)'
        };
      default:
        return {
          icon: <Info size={32} color="#58a6ff" />,
          bgIcon: 'rgba(88, 166, 255, 0.15)',
          border: 'rgba(88, 166, 255, 0.35)',
          btnColor: '#1f6feb',
          titleColor: '#58a6ff'
        };
    }
  };

  const styling = getIconAndColors();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999,
      padding: '1rem',
      animation: 'fadeIn 0.18s ease-out'
    }}>
      <div 
        className="card"
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#1c2128',
          border: `1px solid ${styling.border}`,
          borderRadius: '12px',
          padding: '1.4rem',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        {/* Close Button Top Right */}
        <button
          onClick={handleCancel}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-silver)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px'
          }}
          title="Tutup"
        >
          <X size={16} />
        </button>

        {/* Icon Circle */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: styling.bgIcon,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
          border: `1px solid ${styling.border}`
        }}>
          {styling.icon}
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '1.05rem',
          fontWeight: '700',
          color: styling.titleColor,
          marginBottom: '0.45rem',
          lineHeight: '1.3'
        }}>
          {dialog.title}
        </h3>

        {/* Message */}
        <p style={{
          fontSize: '0.825rem',
          color: 'var(--color-silver-light)',
          lineHeight: '1.5',
          marginBottom: '1.25rem',
          whiteSpace: 'pre-line'
        }}>
          {dialog.message}
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.65rem',
          width: '100%',
          justifyContent: 'center'
        }}>
          {dialog.showCancel && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
              style={{
                flex: 1,
                padding: '0.5rem 0.85rem',
                fontSize: '0.825rem',
                fontWeight: '600',
                borderRadius: '6px'
              }}
            >
              {dialog.cancelText || 'Batal'}
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: '0.5rem 0.85rem',
              fontSize: '0.825rem',
              fontWeight: '700',
              backgroundColor: styling.btnColor,
              color: dialog.type === 'warning' || dialog.type === 'confirm' ? '#0a0c10' : '#ffffff',
              borderRadius: '6px'
            }}
          >
            {dialog.confirmText || 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}
