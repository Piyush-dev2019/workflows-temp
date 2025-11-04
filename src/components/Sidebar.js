import { X } from 'lucide-react';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Sidebar component matching the exact design
 */
function Sidebar({ isOpen, onClose, onRouteChange }) {
  const location = useLocation();

  const handleLinkClick = () => {
    if (onRouteChange) {
      onRouteChange();
    }
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Logo tile + label */}
        <div className="sidebar-logo-section">
          <div className="sidebar-logo-container">
            <div className="sidebar-logo">
              <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 1.68445C0 1.09484 0 0.80003 0.114746 0.574828C0.21568 0.376735 0.376735 0.21568 0.574828 0.114746C0.80003 0 1.09484 0 1.68445 0H13.4737C19.0547 0 23.5789 4.52428 23.5789 10.1053C23.5789 15.6862 19.0547 20.2105 13.4737 20.2105H0V1.68445Z" fill="#D6E1FB"/>
                <path d="M0 13.4701C0 12.8805 0 12.5857 0.114746 12.3605C0.21568 12.1624 0.376735 12.0013 0.574828 11.9004C0.80003 11.7856 1.09484 11.7856 1.68445 11.7856H13.4737C19.0547 11.7856 23.5789 16.3099 23.5789 21.8909C23.5789 27.4719 19.0547 31.9962 13.4737 31.9962H1.68445C1.09484 31.9962 0.80003 31.9962 0.574828 31.8814C0.376735 31.7805 0.21568 31.6194 0.114746 31.4213C0 31.1961 0 30.9013 0 30.3117V13.4701Z" fill="#D6E1FB"/>
                <path d="M13.4736 11.7991C16.8536 11.7991 19.8432 13.4605 21.6777 16.009C19.8432 18.5577 16.8537 20.219 13.4736 20.219H0V11.7991H13.4736Z" fill="#1A5BE7"/>
              </svg>
            </div>
            <span className="sidebar-logo-text">Workflows</span>
          </div>
        </div>

        {/* Home button */}
        <nav className="sidebar-nav">
          <Link
            to="/"
            className={`nav-item ${location.pathname === '/' && !location.pathname.includes('/workflows') ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            <div className="nav-icon-wrapper">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <path d="M10.5 24.5V17.5C10.5 16.8812 10.7458 16.2877 11.1834 15.8501C11.621 15.4125 12.2145 15.1667 12.8333 15.1667H15.1667C15.7855 15.1667 16.379 15.4125 16.8166 15.8501C17.2542 16.2877 17.5 16.8812 17.5 17.5V24.5M5.83333 14H3.5L14 3.5L24.5 14H22.1667V22.1667C22.1667 22.7855 21.9208 23.379 21.4832 23.8166C21.0457 24.2542 20.4522 24.5 19.8333 24.5H8.16667C7.54783 24.5 6.95434 24.2542 6.51675 23.8166C6.07917 23.379 5.83333 22.7855 5.83333 22.1667V14Z" stroke="#001742" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="nav-text">Home</span>
          </Link>
        </nav>

        {/* Bottom Section - Divider and Profile */}
        <div className="sidebar-bottom">
          <div className="sidebar-divider"></div>
          <div className="sidebar-profile">
            <div className="profile-picture"></div>
          </div>
        </div>
        
        {/* Mobile close button */}
        <button
          className="sidebar-close-button"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </aside>
    </>
  );
}

export default Sidebar;
