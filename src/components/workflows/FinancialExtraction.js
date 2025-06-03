import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Financial Statement Extraction workflow component for extracting financial data from PDFs to Excel
 */
function FinancialExtraction() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle file upload
   */
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uploadedFile) return;

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('financialPdf', uploadedFile);

      // Make API call to backend
      const response = await fetch('/api/financial-extraction', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'financial_statements.xlsx';
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
        <span className="breadcrumb-current">Financial Statement Extraction from PDF to Excel</span>
      </div>

      <div className="welcome-message">
        <div className="welcome-text">
          Detect and extract the three key financial statements (Income Statement, Balance Sheet, Cash Flow) from an uploaded PDF and convert them into Excel format for further analysis.
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="financialPdf" className="form-label">
            Upload Financial Statement PDF
          </label>
          <div className="file-input">
            <input
              type="file"
              id="financialPdf"
              onChange={handleFileUpload}
              accept=".pdf"
              style={{ display: 'none' }}
              required
            />
            <label htmlFor="financialPdf" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
              {uploadedFile ? (
                <div>
                  <strong>📄 {uploadedFile.name}</strong>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0' }}>
                    Click to change file
                  </p>
                </div>
              ) : (
                <div>
                  <strong>Click to upload or drag and drop</strong>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0' }}>
                    PDF files only
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isLoading || !uploadedFile}
        >
          {isLoading ? (
            <>
              <div className="spinner"></div>
              Extracting...
            </>
          ) : (
            'Extract to Excel'
          )}
        </button>
      </form>
    </div>
  );
}

export default FinancialExtraction; 