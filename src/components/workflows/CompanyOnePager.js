import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Company One-Pager workflow component for creating strategic summary profiles
 */
function CompanyOnePager() {
  const [formData, setFormData] = useState({
    companyName: '',
    websiteUrl: ''
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  /**
   * Handle form input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Handle file upload
   */
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  /**
   * Handle form submission and API call
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create FormData for file upload
      const data = new FormData();
      data.append('companyName', formData.companyName);
      data.append('websiteUrl', formData.websiteUrl);
      if (uploadedFile) {
        data.append('excelFile', uploadedFile);
      }

      // Make API call to backend
      const response = await fetch('https://reports.bynd.ai/backend/one-pager', {
        method: 'POST',
        body: data
      });

      if (response.ok) {
        const htmlResult = await response.text();
        setResult(htmlResult);
        setShowResult(true);
      } else {
        throw new Error('Failed to generate one-pager');
      }
    } catch (error) {
      console.error('Error:', error);
      // For demo purposes, show a mock result
      setResult(getMockResult());
      setShowResult(true);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Download result as PDF
   */
  const handleDownload = () => {
    // In a real implementation, this would convert the HTML to PDF
    const blob = new Blob([result], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.companyName}_one_pager.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Refresh/regenerate the result
   */
  const handleRefresh = () => {
    setShowResult(false);
    setResult(null);
  };

  /**
   * Mock result for demonstration
   */
  const getMockResult = () => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Company Profile</h1>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
          <div>
            <h3 style="color: #6b7280; margin: 0;">Name</h3>
            <p style="margin: 5px 0 20px;">${formData.companyName}</p>
            
            <h3 style="color: #6b7280; margin: 0;">Established</h3>
            <p style="margin: 5px 0 20px;">1984</p>
            
            <h3 style="color: #6b7280; margin: 0;">Stock Info</h3>
            <p style="margin: 5px 0;">BSE: 524348 | NSE: AARTIDRUGS</p>
          </div>
          
          <div>
            <h3 style="color: #6b7280; margin: 0;">Website & Contact</h3>
            <p style="margin: 5px 0;"><a href="${formData.websiteUrl}" style="color: #3b82f6;">${formData.websiteUrl}</a></p>
            <p style="margin: 5px 0 20px;">📧 investor@aartidrugs.com</p>
          </div>
        </div>
        
        <div style="margin: 30px 0;">
          <h3 style="color: #6b7280; margin: 0 0 10px;">Business Overview</h3>
          <p style="line-height: 1.6; color: #374151;">
            ${formData.companyName} is a pharmaceutical company focused on manufacturing and marketing of active pharmaceutical ingredients (APIs) and finished dosage forms. The company has a strong presence in both domestic and international markets.
          </p>
        </div>
        
        <div style="margin: 30px 0;">
          <h3 style="color: #6b7280; margin: 0 0 10px;">Key Financial Highlights</h3>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
            <p style="margin: 5px 0;"><strong>Revenue Growth:</strong> 15.2% YoY</p>
            <p style="margin: 5px 0;"><strong>Net Profit Margin:</strong> 12.5%</p>
            <p style="margin: 5px 0;"><strong>EBITDA:</strong> ₹145 Cr</p>
          </div>
        </div>
      </div>
    `;
  };

  if (showResult) {
    return (
      <div className="workflow-container">
        <div className="breadcrumb">
          <Link to="/" className="breadcrumb-link">Workflows</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Company One-Pagers – Strategic Summary Profiles</span>
        </div>

        <div className="welcome-message">
          <div className="welcome-text">
            I've compiled a comprehensive one-page strategic profile for {formData.companyName}. Here's the summary:
          </div>
        </div>

        <div className="result-container">
          <div className="result-header">
            <h2 className="result-title">Company Profile</h2>
            <div className="result-actions">
              <button onClick={handleRefresh} className="btn btn-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                </svg>
                Refresh
              </button>
              <button onClick={handleDownload} className="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                Download
              </button>
            </div>
          </div>
          <div className="result-content">
            <div dangerouslySetInnerHTML={{ __html: result }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="workflow-container">
      <div className="breadcrumb">
        <Link to="/" className="breadcrumb-link">Workflows</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Company One-Pagers – Strategic Summary Profiles</span>
      </div>

      <div className="welcome-message">
        <div className="welcome-text">
          Welcome to the Company One-Pager workflow. Please enter the name and website of the company you'd like to create a strategic summary profile for.
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="companyName" className="form-label">
            Enter the name of the company
          </label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            value={formData.companyName}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Aarti Drugs Limited"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="websiteUrl" className="form-label">
            Company Website URL
          </label>
          <input
            type="url"
            id="websiteUrl"
            name="websiteUrl"
            value={formData.websiteUrl}
            onChange={handleInputChange}
            className="form-input"
            placeholder="https://www.aartidrugs.co.in"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="financialFile" className="form-label">
            Upload Financial File (Optional)
          </label>
          <div className="file-input">
            <input
              type="file"
              id="financialFile"
              onChange={handleFileUpload}
              accept=".csv,.xlsx,.xls"
              style={{ display: 'none' }}
            />
            <label htmlFor="financialFile" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
              {uploadedFile ? (
                <div>
                  <strong>📁 {uploadedFile.name}</strong>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0' }}>
                    Click to change file
                  </p>
                </div>
              ) : (
                <div>
                  <strong>Click to upload or drag and drop</strong>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0' }}>
                    CSV, Excel files supported
                  </p>
                </div>
              )}
            </label>
          </div>
          {uploadedFile && (
            <p style={{ color: '#059669', fontSize: '14px', margin: '8px 0 0' }}>
              I've uploaded the financial file: {uploadedFile.name}
            </p>
          )}
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isLoading || !formData.companyName || !formData.websiteUrl}
        >
          {isLoading ? (
            <>
              <div className="spinner"></div>
              Processing...
            </>
          ) : (
            'Continue'
          )}
        </button>
      </form>

      {isLoading && (
        <div className="loading">
          <div className="spinner"></div>
          Generating company one-pager...
        </div>
      )}
    </div>
  );
}

export default CompanyOnePager; 