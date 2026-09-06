import React from 'react';
import { POSITION_PRESETS } from '../../constants/watermark';
import './PositionGrid.css';

const GRID_CELLS = [
  { key: 'top-left', label: 'Top Left' },
  { key: 'top-center', label: 'Top Center' },
  { key: 'top-right', label: 'Top Right' },
  { key: 'center-left', label: 'Center Left' },
  { key: 'center', label: 'Center' },
  { key: 'center-right', label: 'Center Right' },
  { key: 'bottom-left', label: 'Bottom Left' },
  { key: 'bottom-center', label: 'Bottom Center' },
  { key: 'bottom-right', label: 'Bottom Right' }
];

export function PositionGrid({ currentPreset, onSelectPreset }) {
  const isCustom = currentPreset === 'custom';
  const activeLabel = isCustom
    ? 'Custom (dragged)'
    : (POSITION_PRESETS[currentPreset]?.label || 'Bottom Right');

  return (
    <div className="position-grid-wrap">
      <div className="position-grid-header">
        <span className="position-grid-label">Position</span>
        <span className="position-grid-status">{activeLabel}</span>
      </div>
      <div className="position-grid" role="group" aria-label="Watermark 3x3 Position Selector">
        {GRID_CELLS.map((cell) => {
          const isActive = currentPreset === cell.key;
          return (
            <button
              key={cell.key}
              type="button"
              className={`grid-cell-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectPreset(cell.key)}
              title={cell.label}
              aria-label={cell.label}
              aria-pressed={isActive}
            >
              <span className="cell-dot" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
