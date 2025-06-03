import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Screenshot to Excel workflow component for converting chart screenshots to editable Excel files
 */
function ScreenshotToExcel() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle file upload
   */
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
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
      formData.append('screenshot', uploadedFile);

      // Make API call to backend
      const response = await fetch('/api/screenshot-to-excel', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chart_data.xlsx';
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
        <span className="breadcrumb-current">Screenshot Chart to Excel</span>
      </div>

      <div className="welcome-message">
        <div className="welcome-text">
          Upload a screenshot of any chart and convert it into an editable Excel chart, allowing you to edit it in the browser and integrate it into your reports.
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="screenshot" className="form-label">
            Upload Chart Screenshot
          </label>
          <div className="file-input">
            <input
              type="file"
              id="screenshot"
              onChange={handleFileUpload}
              accept="image/*"
              style={{ display: 'none' }}
              required
            />
            <label htmlFor="screenshot" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
              {uploadedFile ? (
                <div>
                  <strong>📷 {uploadedFile.name}</strong>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0' }}>
                    Click to change image
                  </p>
                </div>
              ) : (
                <div>
                  <strong>Click to upload or drag and drop</strong>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0' }}>
                    PNG, JPG, JPEG files supported
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
              Converting...
            </>
          ) : (
            'Convert to Excel'
          )}
        </button>
      </form>
    </div>
  );
}

export default ScreenshotToExcel; 