import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard } from 'lucide-react';

/**
 * Sidebar component with permanent navigation containing only the Workflows section
 */
function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to="/" className="logo">
          <img src="/assets/images/bynd-logo.png" alt="YND Logo" className="logo-image" />
        </Link>
      </div>
      
      <nav className="sidebar-nav">
        <Link 
          to="/home" 
          className={`nav-item ${location.pathname === '/home' ? 'active' : ''}`}
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