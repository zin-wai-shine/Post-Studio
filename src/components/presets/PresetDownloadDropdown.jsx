import React, { useState, useRef, useEffect } from 'react';
import {
  FiDownload,
  FiChevronDown,
  FiFolderPlus,
  FiArchive
} from 'react-icons/fi';
import { Button } from '../common/Button';
import './PresetDownloadDropdown.css';

/**
 * Clean dropdown trigger button and menu for Preset exports.
 * 
 * Offers concise options without complex small text:
 * 1. Directly to Downloads Folder
 * 2. Create Folders in Downloads
 * 3. Download ZIP with Folders
 */
export function PresetDownloadDropdown({
  selectedPresets = [],
  imagesCount = 0,
  isProcessing = false,
  onSelectMode,
  sourceFolderPath = '~/Downloads',
  customTriggerLabel = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const label = customTriggerLabel || (
    selectedPresets.length > 1
      ? `Download All (${selectedPresets.length} Styles × ${imagesCount})`
      : `Download All (${imagesCount})`
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleOptionClick = (mode) => {
    setIsOpen(false);
    if (onSelectMode) {
      onSelectMode(mode);
    }
  };

  return (
    <div className="preset-download-dropdown-wrapper" ref={dropdownRef}>
      <Button
        variant="primary"
        size="sm"
        className="preset-download-trigger-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isProcessing || imagesCount === 0 || selectedPresets.length === 0}
        icon={<FiDownload size={14} />}
        iconRight={
          <FiChevronDown
            size={14}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />
        }
      >
        {label}
      </Button>

      {isOpen && (
        <div className="preset-download-menu" role="menu">
          <div className="preset-download-menu-options">
            {/* OPTION 1: Directly to Downloads Folder */}
            <button
              type="button"
              className="preset-download-option"
              onClick={() => handleOptionClick('direct')}
              role="menuitem"
            >
              <div className="preset-download-option-icon">
                <FiDownload size={16} />
              </div>
              <span className="preset-download-option-title">Directly to Downloads Folder</span>
            </button>

            {/* OPTION 2: Create Folders in Downloads */}
            <button
              type="button"
              className="preset-download-option"
              onClick={() => handleOptionClick('folders')}
              role="menuitem"
            >
              <div className="preset-download-option-icon">
                <FiFolderPlus size={16} />
              </div>
              <span className="preset-download-option-title">Create Folders in Downloads</span>
            </button>

            {/* OPTION 3: Download ZIP with Folders */}
            <button
              type="button"
              className="preset-download-option"
              onClick={() => handleOptionClick('zip')}
              role="menuitem"
            >
              <div className="preset-download-option-icon">
                <FiArchive size={16} />
              </div>
              <span className="preset-download-option-title">Download ZIP with Folders</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
