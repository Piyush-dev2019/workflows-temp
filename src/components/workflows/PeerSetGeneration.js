import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Peer Set Generation workflow component for creating comparative analysis tables
 */
function PeerSetGeneration() {
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyName) return;

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('companyName', companyName);

      // Make API call to backend
      const response = await fetch('/api/peer-set-generation', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${companyName}_peer_analysis.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="workflow-container">
      <div className="breadcrumb">
        <Link to="/" className="breadcrumb-link">Workflows</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Peer Set Generation & Comparative Table Creation</span>
      </div>

      <div className="welcome-message">
        <div className="welcome-text">
          Enter a company name and automatically generate a peer set with a custom comparative table showing key financial metrics, valuations, and performance indicators.
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#ffffff', 
        borderRadius: '16px', 
        padding: '32px', 
        marginTop: '24px',
        border: '1px solid #e5e7eb'
      }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="companyName" className="form-label">
              Company Name
            </label>
            <input
              type="text"
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="form-input"
              placeholder="Enter company name"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading || !companyName}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Generating...
              </>
            ) : (
              'Generate Peer Set'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PeerSetGeneration; 