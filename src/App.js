import React, { useState, useEffect } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Home from './components/Home';
import Sidebar from './components/Sidebar';
import CompanyOnePager from './components/workflows/CompanyOnePager';
import FinancialExtraction from './components/workflows/FinancialExtraction';
import PeerSetGeneration from './components/workflows/PeerSetGeneration';
import ScreenshotToExcel from './components/workflows/ScreenshotToExcel';

/**
 * Main application component that sets up routing and layout
 */
function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when route changes on mobile
  const handleRouteChange = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <Router>
      <div className="app">
        {/* Mobile menu button */}
        <button
          className="mobile-menu-button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onRouteChange={handleRouteChange}
        />
        <main className="main-content">
          <div className="content-area">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/workflows/company-one-pager" element={<CompanyOnePager />} />
              <Route path="/workflows/screenshot-to-excel" element={<ScreenshotToExcel />} />
              <Route path="/workflows/financial-extraction" element={<FinancialExtraction />} />
              <Route path="/workflows/peer-set-generation" element={<PeerSetGeneration />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
