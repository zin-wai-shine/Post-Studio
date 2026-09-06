import React, { useRef, useState } from 'react';
import { FiUploadCloud, FiImage } from 'react-icons/fi';
import { Button } from '../common/Button';
import './ImageUploader.css';

export function ImageUploader({ onFilesSelected, loading = false, compact = false, onLoadSample }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      // Reset value so identical files can be uploaded again if needed
      e.target.value = '';
    }
  };

  return (
    <div
      className={`uploader-dropzone ${isDragging ? 'dragging' : ''} ${compact ? 'compact' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleInputChange}
      />
      <div className="uploader-icon-wrap">
        <FiUploadCloud size={24} />
      </div>
      <h3 className="uploader-title">
        {compact ? 'Add More Images' : 'Upload Images'}
      </h3>
      <p className="uploader-subtitle">
        Drag and drop images here, or click to browse files from your computer.
      </p>
      <div className="uploader-actions">
        <Button
          variant="primary"
          size="sm"
          iconLeft={<FiImage size={14} />}
          loading={loading}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          Choose Images
        </Button>
        {onLoadSample && !compact && (
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onLoadSample();
            }}
          >
            Load Sample Photos
          </Button>
        )}
      </div>
      <span className="uploader-formats">
        Supported formats: JPG, PNG, WEBP. No batch limit.
      </span>
    </div>
  );
}
