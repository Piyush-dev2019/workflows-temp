import { Home, LayoutDashboard } from 'lucide-react';
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
        <Link to="/" className="logo">
          <img src="https://byndpdfstorage.blob.core.windows.net/alerts-logos/bynd-main-logo.png" alt="BYND Logo" className="logo-image" />
        </Link>
      </div>

      <nav className="sidebar-nav">
        <Link
          to="/"
          className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
        >
          <Home className="nav-icon" />
          Home
        </Link>

        <Link
          to="/"
          className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
        >
          <LayoutDashboard className="nav-icon" />
          Workflows
        </Link>
      </nav>
    </aside>
  );
}

export default Sidebar;
