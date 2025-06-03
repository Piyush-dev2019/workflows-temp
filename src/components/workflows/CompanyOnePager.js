import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, File, Database } from 'lucide-react';

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
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'system',
      content: 'Welcome to the Company One-Pager workflow. Please enter the name and website of the company you\'d like to create a strategic summary profile for.',
      showCustomization: true,
      timestamp: new Date()
    }
  ]);
  const [activeCustomizationId, setActiveCustomizationId] = useState(1);

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
   * Handle company details submission
   */
  const handleCompanySubmit = (e) => {
    e.preventDefault();
    if (formData.companyName && formData.websiteUrl) {
      // Remove customization from first message
      setMessages(prev => prev.map(msg => 
        msg.id === 1 ? { ...msg, showCustomization: false } : msg
      ));
      setActiveCustomizationId(null);

      // Add user message
      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: `I'd like to generate a one-pager for ${formData.companyName} (${formData.websiteUrl})`,
        timestamp: new Date()
      };

      // Add system response with file upload customization
      const systemMessage = {
        id: Date.now() + 1,
        type: 'system',
        content: 'Great! Now you can optionally upload financial data to enhance the company profile with additional insights.',
        showCustomization: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage, systemMessage]);
      setActiveCustomizationId(systemMessage.id);
    }
  };

  /**
   * Handle file upload submission
   */
  const handleFileSubmit = () => {
    // Remove customization from current message
    setMessages(prev => prev.map(msg => 
      msg.id === activeCustomizationId ? { ...msg, showCustomization: false } : msg
    ));
    setActiveCustomizationId(null);

    // Add user message for file upload
    let userMessage;
    if (uploadedFile) {
      userMessage = {
        id: Date.now(),
        type: 'user',
        content: `I've uploaded the financial file: ${uploadedFile.name}`,
        timestamp: new Date()
      };
    } else {
      userMessage = {
        id: Date.now(),
        type: 'user',
        content: 'I\'ll skip the file upload and proceed with the basic analysis.',
        timestamp: new Date()
      };
    }

    setMessages(prev => [...prev, userMessage]);

    // Start generating the profile
    setTimeout(() => {
      generateProfile();
    }, 1000);
  };

  /**
   * Generate the company profile
   */
  const generateProfile = async () => {
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
      console.error('Error generating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Restart the workflow
   */
  const handleRestart = () => {
    setFormData({ companyName: '', websiteUrl: '' });
    setUploadedFile(null);
    setResult(null);
    setShowResult(false);
    setIsLoading(false);
    setMessages([
      {
        id: 1,
        type: 'system',
        content: 'Welcome to the Company One-Pager workflow. Please enter the name and website of the company you\'d like to create a strategic summary profile for.',
        showCustomization: true,
        timestamp: new Date()
      }
    ]);
    setActiveCustomizationId(1);
  };

  /**
   * Download result as PDF
   */
  const handleDownload = () => {
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
   * Mock result for demonstration
   */
  const getMockResult = () => {
    return `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb;">
        <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 32px;">
          <h1 style="color: #001742; font-size: 32px; font-weight: 700; margin: 0 0 8px 0;">${formData.companyName}</h1>
          <div style="display: flex; gap: 24px; margin-top: 16px;">
            <div>
              <p style="color: #6b7280; font-size: 14px; font-weight: 500; margin: 0 0 4px 0;">ESTABLISHED</p>
              <p style="color: #001742; font-size: 16px; font-weight: 600; margin: 0;">1984</p>
            </div>
            <div>
              <p style="color: #6b7280; font-size: 14px; font-weight: 500; margin: 0 0 4px 0;">STOCK INFO</p>
              <p style="color: #001742; font-size: 16px; font-weight: 600; margin: 0;">BSE: 524348 | NSE: AARTIDRUGS</p>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 32px;">
          <h2 style="color: #001742; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">Business Overview</h2>
          <p style="line-height: 1.6; color: #374151; font-size: 16px; margin: 0;">
            ${formData.companyName} is a pharmaceutical company focused on manufacturing and marketing of active pharmaceutical ingredients (APIs) and finished dosage forms. The company has a strong presence in both domestic and international markets with advanced manufacturing capabilities and regulatory compliance.
          </p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px;">
          <div>
            <h3 style="color: #001742; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Key Metrics</h3>
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e1e8f6;">
              <div style="margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Market Cap:</span>
                <span style="color: #001742; font-size: 16px; font-weight: 600; margin-left: 8px;">₹4,650 Cr</span>
              </div>
              <div style="margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Employees:</span>
                <span style="color: #001742; font-size: 16px; font-weight: 600; margin-left: 8px;">1,200+</span>
              </div>
              <div style="margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Export Presence:</span>
                <span style="color: #001742; font-size: 16px; font-weight: 600; margin-left: 8px;">60+ Countries</span>
              </div>
              <div>
                <span style="color: #6b7280; font-size: 14px; font-weight: 500;">R&D Investment:</span>
                <span style="color: #001742; font-size: 16px; font-weight: 600; margin-left: 8px;">3.5% of Revenue</span>
              </div>
            </div>
          </div>

          <div>
            <h3 style="color: #001742; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Financial Highlights</h3>
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e1e8f6;">
              <div style="margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Revenue Growth:</span>
                <span style="color: #059669; font-size: 16px; font-weight: 600; margin-left: 8px;">+15.2% YoY</span>
              </div>
              <div style="margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Net Profit Margin:</span>
                <span style="color: #001742; font-size: 16px; font-weight: 600; margin-left: 8px;">12.5%</span>
              </div>
              <div style="margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 14px; font-weight: 500;">EBITDA:</span>
                <span style="color: #001742; font-size: 16px; font-weight: 600; margin-left: 8px;">₹145 Cr</span>
              </div>
              <div>
                <span style="color: #6b7280; font-size: 14px; font-weight: 500;">P/E Ratio:</span>
                <span style="color: #001742; font-size: 16px; font-weight: 600; margin-left: 8px;">24.8</span>
              </div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 32px;">
          <h3 style="color: #001742; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Manufacturing & Facilities</h3>
          <p style="line-height: 1.6; color: #374151; font-size: 16px; margin: 0;">
            The company operates several manufacturing plants located in Tarapur (Maharashtra), Sarigam (Gujarat), and Baddi (Himachal Pradesh). These facilities comply with global regulatory standards including USFDA, WHO-GMP, and European health authorities.
          </p>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <p style="color: #6b7280; font-size: 14px; font-weight: 500; margin: 0 0 4px 0;">WEBSITE</p>
              <a href="${formData.websiteUrl}" style="color: #3b82f6; font-size: 16px; font-weight: 500; text-decoration: none;">${formData.websiteUrl}</a>
            </div>
            <div style="text-align: right;">
              <p style="color: #6b7280; font-size: 14px; font-weight: 500; margin: 0 0 4px 0;">CONTACT</p>
              <p style="color: #001742; font-size: 16px; font-weight: 500; margin: 0;">investor@company.com</p>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  /**
   * Render customization content based on active message
   */
  const renderCustomizationContent = (messageId) => {
    if (messageId === 1) {
      // Company details form
      return (
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '16px', 
          padding: '32px', 
          marginTop: '16px',
          border: '1px solid #e5e7eb'
        }}>
          <form onSubmit={handleCompanySubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label 
                htmlFor="companyName" 
                style={{ 
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#001742',
                  marginBottom: '8px'
                }}
              >
                Enter the name of the company
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#001742',
                  boxSizing: 'border-box'
                }}
                placeholder="Aarti Drugs Limited"
                required
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label 
                htmlFor="websiteUrl" 
                style={{ 
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#001742',
                  marginBottom: '8px'
                }}
              >
                Company Website URL
              </label>
              <input
                type="url"
                id="websiteUrl"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#001742',
                  boxSizing: 'border-box'
                }}
                placeholder="https://www.aartidrugs.co.in"
                required
              />
            </div>

            <button 
              type="submit" 
              style={{
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                padding: '14px 28px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '140px'
              }}
            >
              Continue
            </button>
          </form>
        </div>
      );
    } else {
      // File upload form
      return (
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '16px', 
          padding: '32px', 
          marginTop: '16px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#001742', 
            margin: '0 0 24px 0'
          }}>
            Upload Financial Data (Optional)
          </h3>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '24px',
            marginBottom: '32px'
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
                  fontWeight: '600', 
                  color: '#001742' 
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
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>
                <input
                  type="file"
                  id="financialFile"
                  onChange={handleFileUpload}
                  accept=".xlsx,.xls,.csv"
                  style={{ display: 'none' }}
                />
                <label htmlFor="financialFile" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
                  {uploadedFile ? (
                    <div>
                      <File size={32} style={{ color: '#3b82f6', margin: '0 auto 12px' }} />
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#001742', marginBottom: '4px' }}>
                        📄 {uploadedFile.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Click to change file
                      </div>
                    </div>
                  ) : (
                    <div>
                      <File size={32} style={{ color: '#9ca3af', margin: '0 auto 12px' }} />
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#001742', marginBottom: '4px' }}>
                        Drag and drop or Click to Upload
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Supports Excel and CSV files
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
                  fontWeight: '600', 
                  color: '#001742' 
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
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}>
                Browse Documents
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={handleFileSubmit}
              style={{
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                padding: '14px 28px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '140px'
              }}
            >
              Generate Profile
            </button>

            <button 
              onClick={handleFileSubmit}
              style={{
                backgroundColor: 'transparent',
                color: '#6b7280',
                padding: '14px 20px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Skip and Generate
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="workflow-container">
      <div className="breadcrumb">
        <Link to="/" className="breadcrumb-link">Workflows</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Company One-Pagers – Strategic Summary Profiles</span>
      </div>

      {/* Chat Interface */}
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '24px 0',
        minHeight: '60vh'
      }}>
        {messages.map((message, index) => (
          <div key={message.id} style={{ marginBottom: '24px' }}>
            {/* System Message */}
            {message.type === 'system' && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <img 
                  src="/assets/images/logo.svg" 
                  alt="Bynd Logo" 
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    flexShrink: 0,
                    marginTop: '4px'
                  }} 
                />
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    color: '#001742',
                    fontSize: '16px',
                    lineHeight: '1.6',
                    marginBottom: message.showCustomization ? '0' : '16px'
                  }}>
                    {typeof message.content === 'string' ? message.content : message.content}
                  </div>
                  
                  {/* Customization Box */}
                  {message.showCustomization && renderCustomizationContent(message.id)}
                </div>
              </div>
            )}

            {/* User Message */}
            {message.type === 'user' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <div style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  padding: '16px 20px',
                  borderRadius: '20px 20px 4px 20px',
                  maxWidth: '70%',
                  fontSize: '16px',
                  lineHeight: '1.5'
                }}>
                  {message.content}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading State */}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
            <img 
              src="/assets/images/logo.svg" 
              alt="Bynd Logo" 
              style={{ 
                width: '32px', 
                height: '32px', 
                flexShrink: 0,
                marginTop: '4px'
              }} 
            />
            <div style={{ flex: 1 }}>
              <div style={{ 
                color: '#6b7280',
                fontSize: '16px',
                lineHeight: '1.6',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #e5e7eb',
                  borderTop: '2px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Generating company one-pager...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add CSS for spinner animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default CompanyOnePager; 