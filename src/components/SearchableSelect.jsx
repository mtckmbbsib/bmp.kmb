import React, { Children, useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { Search, X } from 'lucide-react';

export default function SearchableSelect({ children, value, onChange, className, style, disabled, required, placeholder = "-- Pilih --" }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const options = [];
  
  const processChild = (child) => {
    if (!child) return;
    if (child.type === 'option') {
      options.push({ value: child.props.value, label: child.props.children });
    } else if (Array.isArray(child)) {
      child.forEach(processChild);
    } else if (child.props && child.props.children) {
      if (Array.isArray(child.props.children)) {
        child.props.children.forEach(processChild);
      } else {
        processChild(child.props.children);
      }
    }
  };

  Children.toArray(children).forEach(processChild);

  const selectedOption = options.find(o => String(o.value) === String(value)) || null;

  const handleChange = (opt) => {
    if (onChange) {
      onChange({ target: { value: opt ? opt.value : '' } });
    }
    setIsOpen(false);
  };

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(o => o.label && String(o.label).toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm]);

  const finalClassName = (className || '').replace(/\binput-field\b/g, '').trim();

  // Default Desktop Style
  const customStyles = {
    container: (base) => ({
      ...base,
      width: '100%',
      pointerEvents: 'auto'
    }),
    control: (base, state) => ({
      ...base,
      backgroundColor: state.isDisabled ? 'rgba(30, 32, 35, 0.3)' : 'rgba(30, 32, 35, 0.5)',
      borderColor: state.isFocused ? 'var(--color-yellow-primary)' : (style?.borderColor || 'var(--color-border)'),
      minHeight: style?.height || '36px',
      height: style?.height || '36px',
      fontSize: style?.fontSize || '0.85rem',
      boxShadow: 'none',
      width: '100%',
      opacity: state.isDisabled ? 0.6 : 1,
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
      '&:hover': {
        borderColor: state.isDisabled ? (style?.borderColor || 'var(--color-border)') : 'var(--color-yellow-primary)'
      }
    }),
    singleValue: (base, state) => ({ 
      ...base, 
      color: state.isDisabled ? 'var(--color-silver)' : '#fff' 
    }),
    menu: (base) => ({ ...base, backgroundColor: 'var(--color-bg-card)', zIndex: 9999, border: '1px solid var(--color-border)' }),
    menuList: (base) => ({ ...base, backgroundColor: 'var(--color-bg-card, #1E2023)' }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? 'rgba(255, 193, 7, 0.15)' : 'transparent',
      color: state.isFocused ? 'var(--color-yellow-primary, #ffc107)' : '#ffffff',
      cursor: 'pointer'
    }),
    input: (base) => ({ ...base, color: '#fff' }),
    placeholder: (base) => ({ ...base, color: 'var(--color-silver)' }),
    indicatorSeparator: (base) => ({ ...base, backgroundColor: 'var(--color-border)' })
  };

  if (!isMobile) {
    return (
      <Select 
        value={selectedOption}
        onChange={handleChange}
        options={options}
        styles={customStyles}
        isDisabled={disabled}
        className={finalClassName}
        isClearable
        placeholder={placeholder}
      />
    );
  }

  // Mobile Bottom Sheet Style
  const sheetTitle = placeholder.replace(/^-+|-+$/g, '').trim() || "Pilih Opsi";

  return (
    <>
      <div 
        className={finalClassName} 
        style={{ 
          ...style, 
          display: 'flex', 
          alignItems: 'center', 
          backgroundColor: disabled ? 'rgba(30, 32, 35, 0.3)' : 'rgba(30, 32, 35, 0.5)',
          border: '1px solid',
          borderColor: style?.borderColor || 'var(--color-border)',
          borderRadius: '4px',
          padding: '0 8px',
          minHeight: style?.height || '36px',
          width: style?.width || '100%',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: disabled ? 'var(--color-silver)' : (selectedOption ? '#fff' : 'var(--color-silver)'),
          opacity: disabled ? 0.6 : 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
        onClick={() => {
           if (!disabled) {
             setIsOpen(true);
             setSearchTerm('');
           }
        }}
      >
        {selectedOption ? selectedOption.label : placeholder}
      </div>

      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {/* Backdrop click handler */}
          <div style={{ flex: 1 }} onClick={() => setIsOpen(false)} />

          {/* Bottom Sheet */}
          <div style={{
            backgroundColor: 'var(--color-bg-card, #1E2023)',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.25rem 1rem 2rem 1rem',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#fff' }}>{sheetTitle}</h3>
              <button 
                onClick={() => setIsOpen(false)} 
                style={{ background: 'var(--color-border)', border: 'none', color: '#fff', borderRadius: '50%', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-silver)' }} />
              <input 
                type="text" 
                autoFocus
                placeholder="Ketik untuk mencari..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  color: '#fff',
                  outline: 'none',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {filteredOptions.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-silver)' }}>Tidak ada hasil</div>
              ) : (
                filteredOptions.map((opt, i) => (
                  <div 
                    key={i}
                    onClick={() => handleChange(opt)}
                    style={{
                      padding: '14px 8px',
                      borderBottom: '1px solid var(--color-border)',
                      color: selectedOption?.value === opt.value ? 'var(--color-yellow-primary)' : '#fff',
                      fontWeight: selectedOption?.value === opt.value ? '600' : '400',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{opt.label}</span>
                    {selectedOption?.value === opt.value && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-yellow-primary)' }} />}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
