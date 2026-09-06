import React from 'react';
import { Link } from 'react-router-dom';
import { FiLayers, FiArrowLeft } from 'react-icons/fi';
import { Button } from '../components/common/Button';
import './ComingSoon.css';

export function ComingSoon({
  title = 'Module In Development',
  description = 'This tool is scheduled for a future release of Post Studio. Currently, the Watermark Studio is fully operational.',
  icon = <FiLayers />
}) {
  return (
    <div className="coming-soon-page">
      <div className="coming-soon-card">
        <div className="coming-soon-icon">{icon}</div>
        <span className="coming-soon-badge">Roadmap Feature</span>
        <h2 className="coming-soon-title">{title}</h2>
        <p className="coming-soon-desc">{description}</p>
        <Link to="/watermark">
          <Button
            variant="primary"
            size="md"
            iconLeft={<FiArrowLeft size={14} />}
          >
            Go to Watermark Studio
          </Button>
        </Link>
      </div>
    </div>
  );
}
