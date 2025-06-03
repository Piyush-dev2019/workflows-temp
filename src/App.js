import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import CompanyOnePager from './components/workflows/CompanyOnePager';
import ScreenshotToExcel from './components/workflows/ScreenshotToExcel';
import FinancialExtraction from './components/workflows/FinancialExtraction';
import PeerSetGeneration from './components/workflows/PeerSetGeneration';

/**
 * Main application component that sets up routing and layout
 */
function App() {
  return (
    <Router>
      <div className="app">
        <Sidebar />
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