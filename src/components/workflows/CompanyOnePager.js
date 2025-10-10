import { Download, File, Loader2, Search, Upload } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import FullLogo from '../../assets/images/FullLogo.png';

/**
 * Company One-Pager workflow component for creating strategic summary profiles
 */
function CompanyOnePager() {
  const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL || 'http://localhost:5005';
  const LOGO_DEV_KEY = (
    process.env.REACT_APP_LOGO_DEV_KEY ||
    process.env.LOGO_DEV_KEY ||
    (typeof window !== 'undefined' ? (window.LOGO_DEV_KEY || '') : '') ||
    ''
  ).toString();

  // Log which API key is being used (show first 10 chars for security)
  console.log('[CompanyOnePager] Using LOGO_DEV_KEY:', LOGO_DEV_KEY?.substring(0, 10) + '...');

  const [formData, setFormData] = useState({
    companyName: '',
    websiteUrl: ''
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, setPptxUrl] = useState('');
  const [, setPptxName] = useState('one_pager.pptx');
  const [excelErrorMessage, setExcelErrorMessage] = useState('');

  // Debug: Log when excelErrorMessage changes
  React.useEffect(() => {
    if (excelErrorMessage) {
      console.log('[DEBUG] Excel error message set:', excelErrorMessage);
    }
  }, [excelErrorMessage]);
  const [excelSuccessMessage, setExcelSuccessMessage] = useState('');
  const [, setRequestErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFindingCompany, setIsFindingCompany] = useState(false);
  const debounceRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'system',
      content: 'Welcome to the Company One-Pager workflow. You can either enter the company name directly or find the company using its website URL. You will also need to upload a financial Excel file with the required data.',
      showCustomization: true,
      timestamp: new Date()
    }
  ]);
  const [activeCustomizationId, setActiveCustomizationId] = useState(1);


  const fetchLogoDevSuggestions = async (query) => {
    try {
      if (!LOGO_DEV_KEY) {
        console.log('No LOGO_DEV_KEY available');
        return [];
      }

      // Try direct API call first
      try {
        console.log('Calling logo.dev API for:', query);
        const authHeader = `Bearer: ${LOGO_DEV_KEY}`;
        console.log('Authorization header:', authHeader.substring(0, 20) + '...');
        const res = await fetch(`https://api.logo.dev/search?q=${encodeURIComponent(query)}`, {
          headers: {
            'Authorization': authHeader
          }
        });
        console.log('Logo.dev API response status:', res.status);
        if (res.ok) {
          const data = await res.json();
          console.log('Logo.dev raw data:', data);
          console.log('Logo.dev first item:', data[0]);
          console.log('Logo.dev first item logo_url:', data[0]?.logo_url);

          const mapped = Array.isArray(data)
            ? data.map((d) => {
                console.log('Mapping company:', d.name, 'Logo URL:', d.logo_url);
                return {
                  name: d.name || d.domain,
                  domain: d.domain,
                  logo: d.logo_url,
                  websiteUrl: d.domain ? (String(d.domain).startsWith('http') ? d.domain : `https://${d.domain}`) : ''
                };
              })
            : [];
          console.log('Logo.dev mapped results with logos:', mapped.map(m => ({ name: m.name, logo: m.logo })));
          return mapped;
        } else {
          const errorText = await res.text();
          console.error('Logo.dev API error:', res.status, errorText);
        }
      } catch (directError) {
        console.error('Logo.dev direct API failed:', directError);
      }

      // Fallback: try through backend proxy
      try {
        const res = await fetch('/api/logo-dev-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, apiKey: LOGO_DEV_KEY })
        });
        if (res.ok) {
          const data = await res.json();
          console.log('Logo.dev backend proxy success:', data.length, 'results');
          return data;
        }
      } catch (proxyError) {
        console.log('Logo.dev backend proxy failed:', proxyError.message);
      }

      return [];
    } catch (e) {
      console.log('Logo.dev fetch error:', e.message);
      return [];
    }
  };

  const fetchByndCompanySuggestions = async (query, isUrl = false) => {
    try {
      const endpoint = 'https://alerts-staging.bynd.ai/processingScripts/companySpecificAlerts/findCompany';

      // If it's a URL, extract clean domain
      let cleanDomain = query;
      if (isUrl) {
        cleanDomain = query
          .replace(/^https?:\/\//i, '')
          .replace(/^www\./i, '')
          .replace(/\/.*$/, '')
          .toLowerCase();
        console.log('[BYND API] Extracted clean domain:', cleanDomain, 'from URL:', query);
      }

      // Try direct API call first
      try {

        // Try several payload shapes for maximum compatibility
        const postBodies = isUrl ? [
          { website: query },
          { url: query },
          { domain: cleanDomain },
          { website: cleanDomain },
          { query: cleanDomain },
          { company: cleanDomain },
          { q: cleanDomain },
        ] : [
          { query },
          { company: query },
          { companyName: query },
          { name: query },
          { q: query },
        ];

        let data = null;
        let lastError = null;
        for (const body of postBodies) {
          try {
            console.log('[BYND API] Trying POST with payload:', JSON.stringify(body));
            const res = await fetch(endpoint, {
              method: 'POST',
              mode: 'cors',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify(body),
            });
            console.log('[BYND API] Response status:', res.status);
            if (res.ok) {
              data = await res.json();
              console.log('[BYND API] Success with payload:', JSON.stringify(body));
              console.log('[BYND API] Full response data:', JSON.stringify(data, null, 2));
              break;
            } else {
              const errorText = await res.text();
              console.log('[BYND API] Error response:', res.status, errorText);
              lastError = { status: res.status, body: errorText };
            }
          } catch (err) {
            console.log('[BYND API] Fetch error:', err.message);
          }
        }

        if (!data && lastError) {
          console.error('[BYND API] All POST attempts failed. Last error:', lastError);
        }

        // Fallback: GET with multiple param names
        if (!data) {
          const params = isUrl ? ['website', 'url', 'domain', 'q'] : ['q', 'company', 'companyName', 'name'];
          const searchValue = isUrl ? cleanDomain : query;

          for (const p of params) {
            try {
              console.log(`[BYND API] Trying GET with ?${p}=${searchValue}`);
              const res = await fetch(`${endpoint}?${p}=${encodeURIComponent(searchValue)}`, {
                method: 'GET',
                mode: 'cors',
                headers: { Accept: 'application/json' },
              });
              console.log('[BYND API] GET response status:', res.status);
              if (res.ok) {
                data = await res.json();
                console.log('[BYND API] Success with GET param:', p);
                console.log('[BYND API] Full GET response data:', JSON.stringify(data, null, 2));
                break;
              }
            } catch (err) {
              console.log(`[BYND API] GET error with ${p}:`, err.message);
            }
          }
        }

        if (data) {
          console.log('[BYND API] Processing response data:', data);

          // Handle different response formats
          let companies = [];
          if (Array.isArray(data)) {
            companies = data;
          } else if (Array.isArray(data?.companies)) {
            companies = data.companies;
          } else if (Array.isArray(data?.data)) {
            companies = data.data;
          } else if (Array.isArray(data?.results)) {
            companies = data.results;
          } else if (data?.company) {
            // Single company object
            companies = [data.company];
          } else if (data?.data && typeof data.data === 'object') {
            // Single company in data field
            companies = [data.data];
          } else if (typeof data === 'object' && (data.name || data.companyName || data.website || data.domain)) {
            // Response IS the company object
            companies = [data];
          }

          console.log('[BYND API] Extracted companies array:', companies);

          const mapped = companies
            .map((c) => {
              // Try multiple field name variations
              const name = c?.name || c?.companyName || c?.company_name || c?.title || '';
              const website = c?.profiles?.website || c?.website || c?.domain || c?.url || '';
              const normalized = website ? (String(website).startsWith('http') ? website : `https://${website}`) : '';
              const domain = normalized ? normalized.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/.*$/, '') : '';
              const logo = c?.logo || c?.logo_url || '';

              // If no name but has domain, extract name from domain
              let finalName = name;
              if (!finalName && domain) {
                // Extract company name from domain: "zomato.com" -> "Zomato"
                finalName = domain.split('.')[0];
                finalName = finalName.charAt(0).toUpperCase() + finalName.slice(1);
              }

              return { name: finalName, domain, logo, websiteUrl: normalized };
            })
            .filter((x) => x.name || x.domain || x.websiteUrl);

          console.log('[BYND API] Mapped results:', mapped);
          return mapped;
        }
      } catch (directError) {
        console.log('BYND direct API failed:', directError.message);
      }

      // Fallback: try through backend proxy
      try {
        // Use clean domain for proxy call if it's a URL
        const proxyQuery = isUrl ? cleanDomain : query;
        console.log('[BYND API] Calling backend proxy with:', proxyQuery);

        const res = await fetch('/api/bynd-company-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: proxyQuery })
        });

        console.log('[BYND API] Proxy response status:', res.status);

        if (res.ok) {
          const data = await res.json();
          console.log('[BYND API] Proxy response data:', JSON.stringify(data, null, 2));
          console.log('BYND backend proxy success:', data.length, 'results');
          return data;
        } else {
          const errorText = await res.text();
          console.error('[BYND API] Proxy error:', res.status, errorText);
        }
      } catch (proxyError) {
        console.error('BYND backend proxy failed:', proxyError);
      }

      return [];
    } catch (e) {
      console.log('BYND fetch error:', e.message);
      return [];
    }
  };


  /**
   * Handle form input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'companyName') {
      // Debounced suggestions fetch
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const v = value.trim();
      console.log('Company name input changed:', v);
      if (!v) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        console.log('Fetching logo.dev suggestions for:', v);
        const results = await fetchLogoDevSuggestions(v);
        console.log('Logo.dev results:', results);
        setSuggestions(results || []);
        setShowSuggestions((results || []).length > 0);
      }, 300);
    }
  };

  /**
   * Handle Find Company button click
   */
  const handleFindCompany = async () => {
    if (!formData.websiteUrl) return;

    setIsFindingCompany(true);
    console.log('[Find Company] Starting search for URL:', formData.websiteUrl);

    try {
      const results = await fetchByndCompanySuggestions(formData.websiteUrl, true);
      console.log('[Find Company] Found', results?.length || 0, 'results:', results);

      if (results && results.length > 0) {
        console.log('[Find Company] Processing results:', JSON.stringify(results, null, 2));

        // If exactly 1 result, auto-fill the company name
        if (results.length === 1) {
          const company = results[0];
          const nameToFill = company.name || company.domain || '';
          console.log('[Find Company] Auto-filling company name with:', nameToFill);

          if (nameToFill) {
            setFormData(prev => ({
              ...prev,
              companyName: nameToFill,
            }));
            setShowSuggestions(false);
            setSuggestions([]);
            console.log('[Find Company] ✅ Successfully auto-filled company name');

            // Show success message
            setSuccessMessage(`✅ Successfully found: ${nameToFill}`);
            setTimeout(() => setSuccessMessage(''), 4000);
          } else {
            console.error('[Find Company] ❌ No valid name to fill from result:', company);
            setRequestErrorMessage(`Company found but no name available. Please enter manually.`);
            setTimeout(() => setRequestErrorMessage(''), 5000);
          }
        } else {
          // Multiple results - show dropdown for user to pick
          console.log('[Find Company] Multiple results found, showing dropdown');
          setSuggestions(results);
          setShowSuggestions(true);
        }
      } else {
        console.error('[Find Company] ❌ No results found or empty array');
        console.log('[Find Company] Results value:', results);
        setSuggestions([]);
        setShowSuggestions(false);
        // Show error message to user
        setRequestErrorMessage(`No company found for "${formData.websiteUrl}". Please enter the company name manually.`);
        setTimeout(() => setRequestErrorMessage(''), 5000); // Clear after 5 seconds
      }
    } catch (error) {
      console.error('[Find Company] Error:', error);
    } finally {
      setIsFindingCompany(false);
    }
  };

  /**
   * DEPRECATED: Frontend Excel validation has been disabled
   *
   * Reason: Frontend XLSX library had issues correctly parsing some Excel files,
   * causing false negatives (showing "Sheet1" when correct sheets existed).
   *
   * The backend (mapExcel.ts) already validates Excel structure and will return
   * appropriate errors if sheets are missing or invalid. This is the single
   * source of truth for validation.
   *
   * Kept here for reference in case we need to re-enable with a better approach.
   */
  /*
  const validateExcelFile = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new ArrayBuffer(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          // Check for specific required sheet names that backend actually uses
          const availableSheets = workbook.SheetNames;
          console.log('📊 Excel validation starting...');
          console.log(`📋 Available sheets (${availableSheets.length}):`, availableSheets.map(s => `"${s}"`).join(', '));

          // Backend specifically requires these two sheets (see backend/src/onePager/mapExcel.ts)
          const requiredSheets = [
            'MCA Income Statement',
            'MCA Balance Sheet'
          ];

          console.log('🔍 Looking for required sheets:', requiredSheets.map(s => `"${s}"`).join(', '));

          // Check for exact matches (case-sensitive first)
          let foundSheets = requiredSheets.filter(required =>
            availableSheets.includes(required)
          );

          console.log(`✓ Exact matches found: ${foundSheets.length}/2:`, foundSheets.map(s => `"${s}"`).join(', ') || 'None');

          // If not all found, try case-insensitive matching
          if (foundSheets.length < requiredSheets.length) {
            console.log('🔄 Trying case-insensitive matching...');
            const caseInsensitiveMatches = [];
            for (const required of requiredSheets) {
              const match = availableSheets.find(sheet =>
                sheet.trim().toLowerCase() === required.toLowerCase()
              );
              if (match) {
                console.log(`  ✓ Found "${required}" as "${match}"`);
                caseInsensitiveMatches.push(required);
              } else {
                console.log(`  ✗ Missing "${required}"`);
              }
            }
            foundSheets = caseInsensitiveMatches;
          }

          console.log(`📊 Total sheets found: ${foundSheets.length}/2`);
          const missingSheets = requiredSheets.filter(sheet => !foundSheets.includes(sheet));
          if (missingSheets.length > 0) {
            console.error('❌ Missing sheets:', missingSheets.map(s => `"${s}"`).join(', '));
          }

          // Both required sheets must be present
          if (foundSheets.length < requiredSheets.length) {
            const missingSheets = requiredSheets.filter(sheet => !foundSheets.includes(sheet));
            const foundText = foundSheets.length > 0 ? `Found: ${foundSheets.join(', ')}` : 'Found: None';
            const availableText = availableSheets.length > 0 ? `Available sheets: ${availableSheets.join(', ')}` : 'No sheets found';

            resolve({
              isValid: false,
              error: `The Excel file is missing required financial sheets: ${missingSheets.join(', ')}. ${foundText}. ${availableText}. Please upload an Excel file with correct financials from Private Circle.`
            });
            return;
          }

          // Check if sheets have data
          let hasData = false;
          for (const sheetName of foundSheets) {
            // Try exact match first, then case-insensitive
            let worksheet = workbook.Sheets[sheetName];
            if (!worksheet) {
              const matchingSheet = availableSheets.find(sheet =>
                sheet.trim().toLowerCase() === sheetName.toLowerCase()
              );
              if (matchingSheet) {
                worksheet = workbook.Sheets[matchingSheet];
              }
            }
            if (worksheet && XLSX.utils.sheet_to_json(worksheet).length > 0) {
              hasData = true;
              break;
            }
          }

          if (!hasData) {
            resolve({
              isValid: false,
              error: 'The Excel file appears to be empty or corrupt. Please upload an Excel file with correct financials from Private Circle.'
            });
            return;
          }

          resolve({ isValid: true });
        } catch (error) {
          resolve({
            isValid: false,
            error: 'The Excel file is corrupt or invalid. Please upload an Excel file with correct financials from Private Circle.'
          });
        }
      };

      reader.onerror = () => {
        resolve({
          isValid: false,
          error: 'Failed to read the Excel file. Please upload an Excel file with correct financials from Private Circle.'
        });
      };

      reader.readAsArrayBuffer(file);
    });
  };
  */

  /**
   * Handle file upload
   */
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Clear previous messages
      setExcelErrorMessage('');
      setExcelSuccessMessage('');

      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ];

      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
        setExcelErrorMessage('Please upload a valid Excel file (.xlsx, .xls) or CSV file.');
        return;
      }

      // Show success message and upload the file
      setUploadedFile(file);
      setExcelSuccessMessage(`Successfully uploaded: ${file.name}`);
      console.log('✅ File uploaded successfully:', file.name, 'Size:', file.size, 'bytes');

      // Note: Frontend validation removed - backend will validate the Excel structure
      // and return appropriate errors if sheets are missing or data is invalid.
      // This prevents false negatives from frontend XLSX parsing issues.
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
        content: 'Great! Now please upload the financial Excel file with the company\'s data. This is required to generate the one-pager.',
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
    // Check if Excel file is uploaded (now mandatory)
    if (!uploadedFile) {
      setExcelErrorMessage('Excel file upload is required. Please upload a financial Excel file with the required data.');
      return;
    }

    // Clear success message when submitting
    setExcelSuccessMessage('');

    // Remove customization from current message
    setMessages(prev => prev.map(msg =>
      msg.id === activeCustomizationId ? { ...msg, showCustomization: false } : msg
    ));
    setActiveCustomizationId(null);

    // Add user message for file upload
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: `I've uploaded the financial file: ${uploadedFile.name}`,
      timestamp: new Date()
    };

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
      // Validate that Excel file is uploaded (mandatory)
      if (!uploadedFile) {
        setExcelErrorMessage('Excel file upload is required. Please upload a financial Excel file with the required data.');
        setIsLoading(false);
        return;
      }

      // Create FormData for file upload
      const data = new FormData();
      data.append('companyName', formData.companyName);
      data.append('websiteUrl', formData.websiteUrl);
      data.append('excelFile', uploadedFile); // Always append Excel file (mandatory)

      // Try multiple backend base URLs for local/dev/prod
      const origin = (typeof window !== 'undefined' ? window.location.origin : '');
      const guessPortSwap = origin.replace(/:(\d+)$/, ':3001');
      const candidates = [
        // Same-origin proxy (works with CRA proxy)
        '', '/',
        BACKEND_BASE_URL,
        `${origin}/backend`,
        `${guessPortSwap}/backend`,
        'http://localhost:3001/backend',
        'http://127.0.0.1:3001/backend',
        // Direct Nest defaults
        'http://localhost:5005',
        'http://127.0.0.1:5005',
      ].filter(Boolean);

      // Only call PPTX endpoint (no duplicate HTML call)
      let success = false;
      //       let lastError;
      const attempts = [];
      setPptxUrl('');
      setPptxName(`${formData.companyName.replace(/[^a-z0-9]+/gi,'_')}_one_pager.pptx`);

      for (const base of candidates) {
        try {
          console.log('[OnePager] Trying backend:', `${base}/one-pager/pptx`);
          const urlBase = (base === '' || base === '/') ? '/one-pager/pptx' : (base.endsWith('/one-pager/pptx') || base.endsWith('/one-pager/pptx/') ? base : `${base}${base.endsWith('/') ? '' : '/'}one-pager/pptx`);
          const respP = await fetch(urlBase, {
            method: 'POST',
            body: data,
            mode: 'cors',
          });

          console.log('[DEBUG] Response received:', {
            status: respP.status,
            statusText: respP.statusText,
            ok: respP.ok,
            headers: Object.fromEntries(respP.headers.entries())
          });

          if (!respP.ok) {
            // Try to extract error message from response body
            let errorMessage = `HTTP ${respP.status}`;
            let isValidationError = false;
            try {
              const contentType = respP.headers.get('content-type');
              console.log('[DEBUG] Response content-type:', contentType);
              console.log('[DEBUG] Response status:', respP.status);

              if (contentType && contentType.includes('application/json')) {
                const errorData = await respP.json();
                console.log('[DEBUG] Error data:', errorData);
                errorMessage = errorData.message || errorData.error || errorMessage;
                // Check if this is a validation error from our backend
                isValidationError = errorData.validationError === true;
                console.log('[DEBUG] Is validation error:', isValidationError);
              } else {
                const errorText = await respP.text();
                console.log('[DEBUG] Error text:', errorText);
                if (errorText && errorText.length < 500) {
                  errorMessage = errorText;
                }
              }
            } catch (e) {
              console.warn('Could not parse error response:', e);
            }

            console.error(`Backend error (${respP.status}):`, errorMessage);
            console.log('[DEBUG] Will show error to user:', respP.status === 400 || isValidationError);

            // If this looks like a validation error (400 Bad Request, marked as validation error, or contains validation keywords), show it to user
            const isValidationErrorByMessage = errorMessage && (
              errorMessage.includes('missing required financial sheets') ||
              errorMessage.includes('Excel validation failed') ||
              errorMessage.includes('The Excel file is missing required financial sheets')
            );

            if (respP.status === 400 || isValidationError || isValidationErrorByMessage) {
              console.log('[DEBUG] Setting Excel error message:', errorMessage);
              // Use simplified error message for Excel validation failures
              setExcelErrorMessage('The Excel file is missing required financial data in the sheets. Please upload an Excel file with correct financials from Private Circle.');
              setIsLoading(false);
              return; // Don't try other backends for validation errors
            } else {
              console.log('[DEBUG] Not a validation error, continuing to next backend');
              console.log('[DEBUG] Status:', respP.status, 'isValidationError:', isValidationError, 'isValidationErrorByMessage:', isValidationErrorByMessage);
            }

            //             lastError = new Error(errorMessage);
            attempts.push(`${base} → ${respP.status}: ${errorMessage}`);
            continue;
          }

          const blob = await respP.blob();
          const disp = respP.headers.get('Content-Disposition') || '';
          const match = /filename\s*=\s*"?([^";]+)"?/i.exec(disp);
          const fname = match?.[1] || `${formData.companyName.replace(/[^a-z0-9]+/gi,'_')}_one_pager.pptx`;
          const url = URL.createObjectURL(blob);
          setPptxUrl(url);
          setPptxName(fname);
          setRequestErrorMessage('');
          setExcelErrorMessage('');

          // Add success message with download section
          const successMessage = {
            id: Date.now(),
            type: 'system',
            content: '✅ One-pager generated successfully! You can download the PowerPoint file below.',
            timestamp: new Date(),
            showDownload: true,
            downloadUrl: url,
            downloadName: fname
          };
          setMessages(prev => [...prev, successMessage]);

          success = true;
          break;
        } catch (err) {
          // lastError = err;
          attempts.push(`${base} → ${String((err && err.message) || 'network error')}`);
          continue;
        }
      }

      if (!success) {
        // Backend error message commented out for demo
        // setRequestErrorMessage(`Unable to reach the backend. Tried: ${attempts.join(' | ')}. Ensure backend is running and set REACT_APP_BACKEND_BASE_URL (e.g., http://localhost:5005).`);
        console.error('Backend connection failed. Attempts:', attempts.join(' | '));
        // throw lastError || new Error('Network error');
      }
    } catch (error) {
      console.error('Error generating profile:', error);
    } finally {
      setIsLoading(false);
    }
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
            {/* Option 1: Enter company name directly */}
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
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  onFocus={() => setShowSuggestions(suggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
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
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    marginTop: '6px',
                    zIndex: 50,
                    maxHeight: '220px',
                    overflowY: 'auto'
                  }}>
                    {suggestions.map((s, idx) => (
                      <div
                        key={`${s.domain}_${idx}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          const website = s.websiteUrl || (s.domain ? (String(s.domain).startsWith('http') ? s.domain : `https://${s.domain}`) : '');
                          setFormData(prev => ({ ...prev, companyName: s.name || s.domain, websiteUrl: website || prev.websiteUrl }));
                          setShowSuggestions(false);
                        }}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                      >
                        {/* Company logo or first letter */}
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            background: s.logo ? '#ffffff' : '#f3f4f6',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#6b7280',
                            border: '1px solid #e5e7eb',
                            overflow: 'hidden',
                            flexShrink: 0
                          }}
                        >
                          {s.logo ? (
                            <img
                              src={s.logo}
                              alt={s.name || s.domain}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                              }}
                              onError={(e) => {
                                // If logo fails to load, show first letter
                                const parent = e.target.parentElement;
                                parent.style.background = '#f3f4f6';
                                parent.textContent = (s.name || s.domain || '?').charAt(0).toUpperCase();
                              }}
                            />
                          ) : (
                            (s.name || s.domain || '?').charAt(0).toUpperCase()
                          )}
                        </div>

                        {/* Company info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', color: '#111827', fontWeight: 600 }}>{s.name || s.domain}</div>
                          {s.domain && (
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{s.domain}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* OR Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                flex: 1,
                height: '1px',
                backgroundColor: '#d1d5db'
              }}></div>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                OR
              </span>
              <div style={{
                flex: 1,
                height: '1px',
                backgroundColor: '#d1d5db'
              }}></div>
            </div>

            {/* Option 2: Find company using website URL */}
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
                Find company using its website URL
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="url"
                  id="websiteUrl"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleInputChange}
                  style={{
                    flex: 1,
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
                <button
                  type="button"
                  onClick={handleFindCompany}
                  disabled={!formData.websiteUrl || isFindingCompany}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: (formData.websiteUrl && !isFindingCompany) ? '#3b82f6' : '#e5e7eb',
                    color: (formData.websiteUrl && !isFindingCompany) ? '#ffffff' : '#9ca3af',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: (formData.websiteUrl && !isFindingCompany) ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    opacity: isFindingCompany ? 0.7 : 1
                  }}
                  title="Find company details from website URL"
                >
                  {isFindingCompany ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search size={16} />
                      Find Company
                    </>
                  )}
                </button>
              </div>
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
            Upload Financial Data (Required)
          </h3>

          {/* Upload from device box */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px'
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
                      Supports Excel and CSV files (Required)
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Excel success message */}
          {excelSuccessMessage && (
            <div style={{
              background: '#F0FDF4',
              border: '1px solid #86EFAC',
              color: '#166534',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
              fontWeight: 500
            }}>
              {excelSuccessMessage}
            </div>
          )}

          {/* Excel error message */}
          {excelErrorMessage && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#991B1B',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
              fontWeight: 500
            }}>
              {excelErrorMessage}
            </div>
          )}

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
              Generate One Pager
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
                  src={FullLogo}
                  alt="Bynd Logo"
                  style={{
                    width: '48px',
                    height: '48px',
                    objectFit: 'contain',
                    flexShrink: 0,
                    marginTop: '4px'
                  }}
                />
                <div style={{ flex: 1 }}>
                  {/* Only show message content if not showing download section */}
                  {!message.showDownload && (
                    <div style={{
                      color: '#001742',
                      fontSize: '16px',
                      lineHeight: '1.6',
                      marginBottom: message.showCustomization ? '0' : '16px'
                    }}>
                      {typeof message.content === 'string' ? message.content : message.content}
                    </div>
                  )}

                  {/* Customization Box */}
                  {message.showCustomization && renderCustomizationContent(message.id)}

                  {/* Success Message with Download Button - Horizontal Layout */}
                  {message.showDownload && message.downloadUrl && (
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      padding: '20px 24px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      gap: '20px',
                      flexWrap: 'wrap'
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{
                          width: '40px',
                          height: '40px',
                          background: '#3b82f6',
                          borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                          justifyContent: 'center'
                          }}>
                          <div style={{ fontSize: '20px', color: '#ffffff' }}>✓</div>
                          </div>
                          <div>
                            <div style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#3b82f6',
                            marginBottom: '2px'
                            }}>
                              One-Pager Generated Successfully!
                            </div>
                            <div style={{
                            fontSize: '12px',
                            color: '#6b7280'
                            }}>
                              {message.downloadName || 'one_pager.pptx'}
                            </div>
                          </div>
                        </div>
                        <a
                          href={message.downloadUrl}
                          download={message.downloadName}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                          background: '#3b82f6',
                          color: '#ffffff',
                          padding: '10px 20px',
                          borderRadius: '6px',
                            textDecoration: 'none',
                          fontSize: '14px',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            border: 'none',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#2563eb';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#3b82f6';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                          }}
                        >
                        <Download size={16} />
                          Download PPTX
                        </a>
                      </div>
                  )}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <img
              src={FullLogo}
              alt="Bynd Logo"
              style={{
                width: '48px',
                height: '48px',
                objectFit: 'contain',
                flexShrink: 0
              }}
            />
              <div style={{
                color: '#6b7280',
                fontSize: '16px',
                lineHeight: '1.6',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div 
                  className="custom-loader"
                  style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #e5e7eb',
                    borderTopColor: '#3b82f6',
                    borderTopWidth: '2px',
                    borderTopStyle: 'solid',
                  borderRadius: '50%',
                    animation: 'loaderSpin 1s linear infinite',
                    boxSizing: 'border-box',
                    display: 'inline-block'
                  }}
                ></div>
                Generating company one-pager...
            </div>
          </div>
        )}


        {/* Success message */}
        {successMessage && (
          <div style={{
            background: '#F0FDF4',
            border: '1px solid #86EFAC',
            color: '#166534',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            fontWeight: 500
          }}>
            {successMessage}
          </div>
        )}

        {/* Backend error message - COMMENTED OUT FOR DEMO */}
        {/*
        {requestErrorMessage && (
          <div style={{
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            color: '#1D4ED8',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            fontWeight: 500
          }}>
            {requestErrorMessage}
          </div>
        )}
        */}

        {/* Excel validation error message - Always visible */}
        {excelErrorMessage && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#991B1B',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            fontWeight: 500,
            lineHeight: '1.6'
          }}>
            {excelErrorMessage}
          </div>
        )}
      </div>

      {/* Add CSS for spinner animation */}
      <style>{`
        @keyframes loaderSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .custom-loader {
          border-top-color: #3b82f6 !important;
        }
      `}</style>
    </div>
  );
}

export default CompanyOnePager;
