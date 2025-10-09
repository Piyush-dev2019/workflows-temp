import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
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
