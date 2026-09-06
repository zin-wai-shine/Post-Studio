import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiDroplet,
  FiGrid,
  FiLayers,
  FiLayout,
  FiImage,
  FiArrowRight
} from 'react-icons/fi';
import './Dashboard.css';

const TOOLS = [
  {
    id: 'watermark',
    title: 'Watermark Studio',
    description: 'Batch watermark property and social media images with custom logos, patterns, and full-resolution export.',
    icon: <FiDroplet />,
    path: '/watermark',
    active: true,
    badge: 'Active'
  },
  {
    id: 'grid-splitter',
    title: 'Social Grid Splitter',
    description: 'Upload 1 high-resolution photo and split it into 1, 2, 3, 4, 5, or 6 social media grid collage tiles.',
    icon: <FiGrid />,
    path: '/watermark?mode=grid&tab=crop',
    active: true,
    badge: 'Active'
  },
  {
    id: 'templates',
    title: 'Layout Templates',
    description: 'Pre-designed layouts and typographic presets for multi-platform marketing channels.',
    icon: <FiLayout />,
    path: '/templates',
    active: false,
    badge: 'Coming Soon'
  },
  {
    id: 'media',
    title: 'Media Library',
    description: 'Centralized local asset management for saved brand assets, banners, and logos.',
    icon: <FiImage />,
    path: '/media',
    active: false,
    badge: 'Coming Soon'
  }
];

export function Dashboard() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-hero">
        <h2 className="hero-title">Welcome to Post Studio</h2>
        <p className="hero-desc">
          Professional media preparation suite built for high-volume content workflows.
          Process, brand, and export social media assets completely inside your browser with zero server upload latency.
        </p>
      </div>

      <div className="tools-section">
        <h3 className="section-heading">Platform Modules</h3>
        <div className="tools-grid">
          {TOOLS.map((tool) => {
            const isClickable = tool.active;
            return (
              <Link
                key={tool.id}
                to={tool.path}
                className={`tool-card ${tool.active ? 'active' : 'disabled'}`}
              >
                <div className="tool-card-top">
                  <div className="tool-icon-wrap">{tool.icon}</div>
                  <span
                    className={`tool-status-badge ${
                      tool.active ? 'badge-active' : 'badge-soon'
                    }`}
                  >
                    {tool.badge}
                  </span>
                </div>
                <h4 className="tool-card-title">{tool.title}</h4>
                <p className="tool-card-desc">{tool.description}</p>
                <div className="tool-card-footer">
                  <span>{tool.active ? 'Open Studio' : 'Module in Development'}</span>
                  {tool.active && <FiArrowRight size={14} />}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
