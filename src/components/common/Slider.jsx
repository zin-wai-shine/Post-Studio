import React from 'react';
import { FiRotateCcw } from 'react-icons/fi';
import './Slider.css';

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '%',
  defaultValue,
  onReset,
  displayValue,
  id,
  className = ''
}) {
  const inputId = id || `slider_${(label || 'range').toLowerCase().replace(/\s+/g, '_')}`;
  const formattedValue = displayValue !== undefined ? displayValue : `${value}${unit}`;

  return (
    <div className={`slider-group ${className}`}>
      <div className="slider-header">
        <label htmlFor={inputId} className="slider-label">
          {label}
        </label>
        <div className="slider-value-wrap">
          <span className="slider-value">{formattedValue}</span>
          {onReset && defaultValue !== undefined && value !== defaultValue && (
            <button
              type="button"
              className="slider-reset-btn"
              onClick={() => onReset(defaultValue)}
              title={`Reset to default (${defaultValue}${unit})`}
              aria-label={`Reset ${label} to default`}
            >
              <FiRotateCcw size={11} />
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        id={inputId}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider-input"
      />
    </div>
  );
}
