import React, { Children } from 'react';
import Select from 'react-select';

export default function SearchableSelect({ children, value, onChange, className, style, disabled, required }) {
  const options = [];
  
  const processChild = (child) => {
    if (!child) return;
    if (child.type === 'option') {
      options.push({ value: child.props.value, label: child.props.children });
    } else if (Array.isArray(child)) {
      child.forEach(processChild);
    } else if (child.props && child.props.children) {
      // Sometimes react fragments or maps return nested structures
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
  };

  const customStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: 'rgba(30, 32, 35, 0.5)',
      borderColor: state.isFocused ? 'var(--color-yellow-primary)' : 'var(--color-border)',
      minHeight: style?.height || '36px',
      height: style?.height || '36px',
      fontSize: style?.fontSize || '0.85rem',
      boxShadow: 'none',
      '&:hover': {
        borderColor: 'var(--color-yellow-primary)'
      }
    }),
    singleValue: (base) => ({ ...base, color: '#fff' }),
    menu: (base) => ({ ...base, backgroundColor: 'var(--color-bg-card)', zIndex: 9999, border: '1px solid var(--color-border)' }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? 'rgba(255, 193, 7, 0.1)' : 'transparent',
      color: state.isFocused ? 'var(--color-yellow-primary)' : '#fff',
      cursor: 'pointer'
    }),
    input: (base) => ({ ...base, color: '#fff' }),
    placeholder: (base) => ({ ...base, color: 'var(--color-silver)' }),
    indicatorSeparator: (base) => ({ ...base, backgroundColor: 'var(--color-border)' })
  };

  return (
    <Select 
      value={selectedOption}
      onChange={handleChange}
      options={options}
      styles={customStyles}
      isDisabled={disabled}
      className={className}
      isClearable
      placeholder="-- Pilih --"
    />
  );
}
