import React from 'react';
import ReactSelect, { components } from 'react-select';
import { FiChevronDown } from 'react-icons/fi';
import './Select.css';

// Custom Dropdown Indicator with React Icons
const CustomDropdownIndicator = (props) => {
  return (
    <components.DropdownIndicator {...props}>
      <FiChevronDown size={14} style={{ color: 'var(--color-text-secondary)', strokeWidth: 2.2 }} />
    </components.DropdownIndicator>
  );
};

// Custom Option to support label + description
const CustomOption = (props) => {
  return (
    <components.Option {...props}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontWeight: props.isSelected ? 600 : 500 }}>
          {props.label}
        </span>
        {props.data.description && (
          <span
            style={{
              fontSize: '11px',
              color: props.isSelected ? 'rgba(255, 255, 255, 0.8)' : 'var(--color-text-muted)',
              lineHeight: 1.2
            }}
          >
            {props.data.description}
          </span>
        )}
      </div>
    </components.Option>
  );
};

export function Select({
  label,
  value,
  onChange,
  options = [],
  id,
  className = '',
  disabled = false,
  size = 'md', // 'sm' | 'md'
  isSearchable = false,
  menuPlacement = 'auto',
  placeholder = 'Select...'
}) {
  const selectId = id || `select_${(label || 'input').toLowerCase().replace(/\s+/g, '_')}`;

  // Format incoming options to standard { value, label, description }
  const formattedOptions = options.map((opt) => ({
    value: opt.id !== undefined ? opt.id : opt.value,
    label: opt.label || opt.name,
    description: opt.description
  }));

  const selectedOption = formattedOptions.find((opt) => opt.value === value) || null;

  const isSmall = size === 'sm';

  const customStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: '#FFFFFF',
      minHeight: isSmall ? '30px' : '36px',
      height: isSmall ? '30px' : '36px',
      borderColor: state.isFocused ? 'var(--color-main)' : 'var(--color-border)',
      borderRadius: 'var(--radius-sm)',
      boxShadow: state.isFocused ? '0 0 0 2px var(--color-focus-ring)' : 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
      fontSize: isSmall ? '12px' : '13px',
      fontWeight: 500,
      '&:hover': {
        borderColor: state.isFocused ? 'var(--color-main)' : 'var(--color-border-dark)'
      }
    }),
    valueContainer: (base) => ({
      ...base,
      padding: isSmall ? '0 8px' : '2px 10px',
      height: isSmall ? '28px' : '34px',
      display: 'flex',
      alignItems: 'center'
    }),
    singleValue: (base) => ({
      ...base,
      color: 'var(--color-text-primary)',
      fontWeight: 500,
      margin: 0
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
      color: 'var(--color-text-primary)'
    }),
    indicatorSeparator: () => ({
      display: 'none'
    }),
    dropdownIndicator: (base) => ({
      ...base,
      padding: isSmall ? '2px 6px' : '4px 8px',
      cursor: 'pointer'
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: '#FFFFFF',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--shadow-modal)',
      zIndex: 9999,
      marginTop: '4px',
      overflow: 'hidden'
    }),
    menuList: (base) => ({
      ...base,
      padding: '4px',
      maxHeight: '220px'
    }),
    option: (base, state) => ({
      ...base,
      padding: isSmall ? '6px 8px' : '8px 10px',
      borderRadius: '4px',
      cursor: 'pointer',
      backgroundColor: state.isSelected
        ? 'var(--color-main)'
        : state.isFocused
        ? 'var(--color-hover)'
        : 'transparent',
      color: state.isSelected ? '#FFFFFF' : 'var(--color-text-primary)',
      fontSize: isSmall ? '12px' : '13px',
      transition: 'background-color 0.1s ease',
      '&:active': {
        backgroundColor: state.isSelected ? 'var(--color-main)' : 'var(--color-active)'
      }
    }),
    placeholder: (base) => ({
      ...base,
      color: 'var(--color-text-muted)',
      fontSize: isSmall ? '12px' : '13px'
    })
  };

  return (
    <div className={`select-group ${className}`}>
      {label && (
        <label htmlFor={selectId} className="select-label">
          {label}
        </label>
      )}
      <div className="select-wrapper">
        <ReactSelect
          inputId={selectId}
          value={selectedOption}
          onChange={(opt) => onChange(opt ? opt.value : '')}
          options={formattedOptions}
          isDisabled={disabled}
          isSearchable={isSearchable}
          menuPlacement={menuPlacement}
          placeholder={placeholder}
          styles={customStyles}
          components={{
            DropdownIndicator: CustomDropdownIndicator,
            Option: CustomOption
          }}
          classNamePrefix="post-studio-select"
        />
      </div>
    </div>
  );
}
