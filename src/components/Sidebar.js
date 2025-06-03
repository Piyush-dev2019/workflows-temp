import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Sidebar component with permanent navigation containing only the Workflows section
 */
function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to="/" className="logo">ynd</Link>
      </div>
      
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Workflows</div>
          <Link 
            to="/" 
            className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
            Home
          </Link>
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar; 