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
   * Convert file to base64
   */
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uploadedFile) return;

    setIsLoading(true);
    
    try {
      // Convert image to base64
      const base64Image = await convertToBase64(uploadedFile);
      
      // Remove the data:image/jpeg;base64, or data:image/png;base64, prefix
      const base64Data = base64Image.split(',')[1];

      // Make API call to backend with base64 data
      const response = await fetch('https://chunking-orchestration.bynd.ai/api/chart-to-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chart_base64: base64Data
        })
      });

      if (response.ok) {
        // Parse JSON response
        const responseData = await response.json();
        console.log('API Response:', responseData);
        
        // Extract filename and base64 data
        const { filename, excel_base64 } = responseData;
        
        if (excel_base64) {
          // Convert base64 to blob
          const byteCharacters = atob(excel_base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });
          
          // Create download link
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename || `chart_data_${Date.now()}.xlsx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          console.log('Excel file downloaded successfully:', filename);
        } else {
          throw new Error('No Excel data received from API');
        }
      } else {
        throw new Error('Failed to convert chart to Excel');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to convert chart to Excel. Please try again.');
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

        {/* Convert Button */}
        {uploadedFile && (
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              style={{
                backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
                color: '#ffffff',
                padding: '14px 32px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '200px'
              }}
            >
              {isLoading ? 'Converting...' : 'Convert to Excel'}
            </button>
          </div>
        )}
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