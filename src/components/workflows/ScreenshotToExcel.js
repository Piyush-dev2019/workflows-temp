import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, File, Database } from 'lucide-react';

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

      <div className="workflow-header-section">
        <img src="/assets/images/logo.svg" alt="Logo" className="workflow-logo" />
        <div className="welcome-message">
          <div className="welcome-text">
            Welcome to the Screenshot Chart to Excel workflow. Please upload a screenshot of any chart you'd like to convert into an editable Excel chart.
          </div>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#ffffff', 
        borderRadius: '16px', 
        padding: '32px', 
        marginTop: '24px',
        border: '1px solid #e5e7eb'
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#000000', 
          margin: '0 0 32px 0',
          textAlign: 'left'
        }}>
          Upload or Select Documents
        </h2>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '24px' 
        }}>
          {/* Upload from device box */}
          <div style={{ 
            backgroundColor: '#ffffff', 
            border: '1px solid #e5e7eb', 
            borderRadius: '12px', 
            padding: '24px' 
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '16px' 
            }}>
              <Upload size={20} style={{ marginRight: '8px', color: '#374151' }} />
              <span style={{ 
                fontSize: '16px', 
                fontWeight: '500', 
                color: '#000000' 
              }}>
                Upload from device
              </span>
            </div>

            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '32px 16px',
              textAlign: 'center',
              backgroundColor: '#fafafa',
              cursor: 'pointer'
            }}>
              <input
                type="file"
                id="screenshot"
                onChange={handleFileUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <label htmlFor="screenshot" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
                {uploadedFile ? (
                  <div>
                    <File size={32} style={{ color: '#3b82f6', margin: '0 auto 12px' }} />
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>
                      📷 {uploadedFile.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Click to change image
                    </div>
                  </div>
                ) : (
                  <div>
                    <File size={32} style={{ color: '#9ca3af', margin: '0 auto 12px' }} />
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>
                      Drag and drop or Click to Upload
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Supports PNG, JPG, JPEG files
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Select from Bynd Database box */}
          <div style={{ 
            backgroundColor: '#ffffff', 
            border: '1px solid #e5e7eb', 
            borderRadius: '12px', 
            padding: '24px' 
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '16px' 
            }}>
              <Database size={20} style={{ marginRight: '8px', color: '#374151' }} />
              <span style={{ 
                fontSize: '16px', 
                fontWeight: '500', 
                color: '#000000' 
              }}>
                Select from Bynd Database
              </span>
            </div>

            <button style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              fontSize: '14px',
              color: '#374151',
              cursor: 'pointer',
              textAlign: 'left'
            }}>
              Browse Documents
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="loading">
          <div className="spinner"></div>
          Converting screenshot to Excel...
        </div>
      )}
    </div>
  );
}

export default ScreenshotToExcel; 