/* eslint-disable */
import { Download, File, Loader2, Pencil, Search, Upload } from 'lucide-react';
import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FullLogo from '../../assets/images/FullLogo.png';

/**
 * Company One-Pager workflow component for creating strategic summary profiles
 */
function CompanyOnePager() {
  const ORIGIN = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : '';
  const DEFAULT_PROD_BACKEND = ORIGIN ? `${ORIGIN}/backend` : '';
  const BACKEND_BASE_URL = (process.env.REACT_APP_BACKEND_BASE_URL || DEFAULT_PROD_BACKEND || 'http://localhost:5005');
  const LOGO_DEV_KEY = (
    process.env.REACT_APP_LOGO_DEV_KEY ||
    (typeof window !== 'undefined' ? (window.LOGO_DEV_KEY || '') : '') ||
    ''
  ).toString().trim();

  // Check API key availability (don't log the key itself)
  const hasLogoDevKey = !!LOGO_DEV_KEY && LOGO_DEV_KEY.length > 0;
  const isSecretKey = hasLogoDevKey && LOGO_DEV_KEY.startsWith('sk_');

  if (hasLogoDevKey && !isSecretKey && LOGO_DEV_KEY.startsWith('pk_')) {
    console.warn('[CompanyOnePager] WARNING: Using publishable key (pk_) with REST API endpoint.');
    console.warn('The api.logo.dev/search endpoint requires a SECRET KEY (sk_) not a publishable key.');
    console.warn('Publishable keys (pk_) are only for the img.logo.dev CDN endpoint.');
    console.warn('Please get your secret key from: https://logo.dev/dashboard/api-keys');
  }

  const [formData, setFormData] = useState({
    companyName: '',
    websiteUrl: '',
    companyLogo: ''
  });
  const [aboutPreferences, setAboutPreferences] = useState({
    founding_year: true,
    founder_name: false,
    headquarter_city: true,
    shareholding_pattern: false
  });
  const [operationsPrompt, setOperationsPrompt] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedGeneration, setHasStartedGeneration] = useState(false); // Track if generation has been started
  const [, setPptxUrl] = useState('');
  const [, setPptxName] = useState('one_pager.pptx');
  const [excelErrorMessage, setExcelErrorMessage] = useState('');
  const [excelWarningMessage, setExcelWarningMessage] = useState(null);
  const [excelValidationMessage, setExcelValidationMessage] = useState(null);

  // NEW: Operations generation state
  const [isGeneratingOperations, setIsGeneratingOperations] = useState(false);
  const [operationsOptions, setOperationsOptions] = useState([]); // [{ key, value, selected, editedValue, editedKey }]
  const [operationsError, setOperationsError] = useState('');
  const [operationsSelectionError, setOperationsSelectionError] = useState('');
  const [continueError, setContinueError] = useState('');
  const [createError, setCreateError] = useState('');
  const [editingKeyIndex, setEditingKeyIndex] = useState(null); // Track which key is being edited
  // UI state for creating a new operation (matches provided UI)
  const [showCreateOperation, setShowCreateOperation] = useState(false);
  const [newOperationName, setNewOperationName] = useState('');
  const [newOperationDesc, setNewOperationDesc] = useState('');

  // Ensure operation description areas auto-size initially and after updates
  useEffect(() => {
    if (operationsOptions.length === 0) return;
    
    // Use multiple timeouts to ensure DOM is fully rendered
    const resizeTextareas = () => {
      try {
        const areas = document.querySelectorAll('.op-desc');
        areas.forEach((el) => {
          if (el) {
            el.style.height = 'auto';
            // Remove max height limit - allow full content to be visible
            const newHeight = el.scrollHeight;
            el.style.height = newHeight + 'px';
          }
        });
      } catch (err) {
        console.error('Error resizing textareas:', err);
      }
    };

    // Try immediately
    resizeTextareas();
    
    // Try after a short delay
    const timeout1 = setTimeout(resizeTextareas, 0);
    
    // Try after a longer delay to catch any delayed renders
    const timeout2 = setTimeout(resizeTextareas, 50);
    const timeout3 = setTimeout(resizeTextareas, 150);
    const timeout4 = setTimeout(resizeTextareas, 300);
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearTimeout(timeout4);
    };
  }, [operationsOptions]);

  // Also resize when operations are first loaded (when length changes from 0 to >0)
  useEffect(() => {
    if (operationsOptions.length > 0) {
      // Wait for DOM to fully render
      const timeoutId = setTimeout(() => {
        try {
          const areas = document.querySelectorAll('.op-desc');
          areas.forEach((el) => {
            if (el) {
              el.style.height = 'auto';
              el.style.height = el.scrollHeight + 'px';
            }
          });
        } catch (err) {
          console.error('Error resizing textareas on load:', err);
        }
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [operationsOptions.length]);

  // Debug: Log when excelErrorMessage changes
  React.useEffect(() => {
    if (excelErrorMessage) {
      console.log('[DEBUG] Excel error message set:', excelErrorMessage);
    }
  }, [excelErrorMessage]);
  const [excelSuccessMessage, setExcelSuccessMessage] = useState('');
  const [requestErrorMessage, setRequestErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Automatically show suggestions when they're loaded and user is typing
  React.useEffect(() => {
    if (suggestions.length > 0 && formData.companyName.trim().length > 0) {
      setShowSuggestions(true);
      console.log('[Suggestions] Auto-showing', suggestions.length, 'suggestions');
    }
  }, [suggestions, formData.companyName]);
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
  const [step, setStep] = useState(1);
  const [showOperations, setShowOperations] = useState(false);
  const [aboutComplete, setAboutComplete] = useState(false);

  function goNext() { setStep(s => Math.min(s + 1, 4)); }
  function goBack() { setStep(s => Math.max(s - 1, 1)); }

  useEffect(() => { if(step === 3) generateOperations(); }, [step]);
  
  // Cleanup: Cancel all ongoing requests when component unmounts
  useEffect(() => {
    return () => {
      cancelAllOngoingRequests();
    };
  }, []);


  const fetchLogoDevSuggestions = async (query) => {
    try {
      if (!LOGO_DEV_KEY) {
        console.log('[Logo.dev] No LOGO_DEV_KEY available');
        return [];
      }

      // Try direct API call first
      try {
        console.log('[Logo.dev] Calling logo.dev API for:', query);
        const authHeader = `Bearer ${LOGO_DEV_KEY}`;
        // Note: Don't log auth header to avoid exposing API key

        const res = await fetch(`https://api.logo.dev/search?q=${encodeURIComponent(query)}`, {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          mode: 'cors'
        });
        console.log('[Logo.dev] API response status:', res.status);

        if (res.ok) {
          const data = await res.json();
          console.log('[Logo.dev] Raw data received:', data?.length || 0, 'items');

          if (Array.isArray(data) && data.length > 0) {
            console.log('[Logo.dev] First item:', data[0]);
            console.log('[Logo.dev] First item logo_url:', data[0]?.logo_url);

            const mapped = data.map((d) => {
              return {
                name: d.name || d.domain,
                domain: d.domain,
                logo: d.logo_url,
                websiteUrl: d.domain ? (String(d.domain).startsWith('http') ? d.domain : `https://${d.domain}`) : ''
              };
            });
            console.log('[Logo.dev] ✅ Mapped results:', mapped.length, 'companies');
            return mapped;
          } else {
            console.log('[Logo.dev] Empty array or invalid data format');
          }
        } else {
          const errorText = await res.text();
          console.error('[Logo.dev] API error:', res.status, errorText);

          // Check if it's an authentication error and provide helpful message
          if (res.status === 401) {
            console.error('❌ Logo.dev API authentication failed (401 Unauthorized)');
            if (LOGO_DEV_KEY && LOGO_DEV_KEY.startsWith('pk_')) {
              console.error('⚠️  You are currently using a PUBLISHABLE KEY (pk_).');
              console.error('📝 To fix: Get your SECRET KEY from https://logo.dev/dashboard/api-keys');
            } else if (LOGO_DEV_KEY && LOGO_DEV_KEY.startsWith('sk_')) {
              console.error('⚠️  You are using a secret key, but it may be invalid or expired.');
            }
          }
        }
      } catch (directError) {
        console.error('[Logo.dev] Direct API failed (likely CORS or network):', directError.message);
        // This is expected in browser - CORS will block direct API calls, so we'll use backend proxy
      }

      // Fallback: try through backend proxy (try multiple backend URLs like generateProfile does)
      const origin = (typeof window !== 'undefined' ? window.location.origin : '');
      const guessPortSwap = origin.replace(/:(\d+)$/, ':3001');
      const backendCandidates = [
        '', '/',
        BACKEND_BASE_URL,
        `${origin}/backend`,
        `${guessPortSwap}/backend`,
        'http://localhost:3001/backend',
        'http://127.0.0.1:3001/backend',
        'http://localhost:5005',
        'http://127.0.0.1:5005',
      ].filter(Boolean);

      console.log('[Logo.dev] Trying backend proxy with', backendCandidates.length, 'candidates');

      for (const base of backendCandidates) {
        try {
          const urlBase = (base === '' || base === '/')
            ? '/api/logo-dev-search'
            : (base.endsWith('/api/logo-dev-search') || base.endsWith('/api/logo-dev-search/')
              ? base
              : `${base}${base.endsWith('/') ? '' : '/'}api/logo-dev-search`);

          console.log('[Logo.dev] Trying backend:', urlBase);

          // Backend proxy should have API key configured server-side
          // Only send query, not the API key (more secure)
          const res = await fetch(urlBase, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }), // Backend should use its own API key
            mode: 'cors'
          });

          if (res.ok) {
            const data = await res.json();
            console.log('[Logo.dev] ✅ Backend proxy success:', data?.length || 0, 'results');
            if (Array.isArray(data) && data.length > 0) {
              return data;
            }
          } else {
            console.log('[Logo.dev] Backend proxy returned status:', res.status);
          }
        } catch (proxyError) {
          console.log('[Logo.dev] Backend proxy failed for', base, ':', proxyError.message);
          // Continue to next candidate
        }
      }

      console.log('[Logo.dev] ❌ All attempts failed, returning empty array');
      return [];
    } catch (e) {
      console.error('[Logo.dev] Fetch error:', e.message);
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
        console.log('Fetching company suggestions for:', v);

        // Show logo.dev results immediately (don't wait for BYND which may hang)
        const logoDevResults = await fetchLogoDevSuggestions(v);

        // Set suggestions immediately with logo.dev results
        if (logoDevResults && logoDevResults.length > 0) {
          console.log('[Suggestions] Setting logo.dev results immediately:', logoDevResults.length);
          setSuggestions(logoDevResults);
          setShowSuggestions(true);
        }

        // Try BYND API separately with timeout (non-blocking)
        // If it succeeds, merge results later
        Promise.race([
          fetchByndCompanySuggestions(v, false),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ])
        .then((byndResults) => {
          if (byndResults && byndResults.length > 0) {
            console.log('[Suggestions] BYND results received, merging:', byndResults.length);
            // Merge with existing logo.dev results using functional update
            setSuggestions(currentSuggestions => {
              const allResults = [...(currentSuggestions || []), ...(byndResults || [])];
              const seen = new Set();
              const uniqueResults = allResults.filter(item => {
                const key = (item.name || item.domain || '').toLowerCase();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });
              return uniqueResults;
            });
          }
        })
        .catch((error) => {
          if (error.message === 'Timeout') {
            console.log('[Suggestions] BYND API timeout (3s) - using logo.dev results only');
          } else {
            console.log('[Suggestions] BYND API failed - using logo.dev results only:', error.message);
          }
          // Keep logo.dev results as-is (they're already set)
        });
      }, 300);
    }
  };

  /**
   * Handle about preferences checkbox changes
   */
  const handleAboutPreferenceChange = (preference) => {
    setAboutPreferences(prev => ({
      ...prev,
      [preference]: !prev[preference]
    }));
  };



  /**
   * Direct logo.dev API call (for Find Company fallback - doesn't try backend proxies)
   */
  const fetchLogoDevDirect = async (query) => {
    if (!LOGO_DEV_KEY) {
      console.log('[Find Company] No LOGO_DEV_KEY for direct logo.dev call');
      return [];
    }

    try {
      console.log('[Find Company] Calling logo.dev API directly for:', query);
      const authHeader = `Bearer ${LOGO_DEV_KEY}`;

      const res = await fetch(`https://api.logo.dev/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((d) => ({
            name: d.name || d.domain,
            domain: d.domain,
            logo: d.logo_url,
            websiteUrl: d.domain ? (String(d.domain).startsWith('http') ? d.domain : `https://${d.domain}`) : ''
          }));
          console.log('[Find Company] ✅ Logo.dev direct API success:', mapped.length, 'results');
          return mapped;
        }
      } else {
        const errorText = await res.text();
        console.log('[Find Company] Logo.dev direct API error:', res.status, errorText);
      }
    } catch (error) {
      console.log('[Find Company] Logo.dev direct API failed (likely CORS):', error.message);
    }

    return [];
  };

  /**
   * Handle Find Company button click
   */
  const handleFindCompany = async () => {
    if (!formData.websiteUrl) return;

    setIsFindingCompany(true);
    setRequestErrorMessage(''); // Clear any previous errors
    console.log('[Find Company] Starting search for URL:', formData.websiteUrl);

    try {
      // Extract domain from URL for logo.dev fallback
      const domain = formData.websiteUrl
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .replace(/\/.*$/, '')
        .toLowerCase();

      console.log('[Find Company] Extracted domain:', domain);

      // Strategy: Try BYND and logo.dev in parallel, use whichever responds first
      let results = null;

      // Create timeout wrapper for BYND
      const byndWithTimeout = Promise.race([
        fetchByndCompanySuggestions(formData.websiteUrl, true),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('BYND timeout (4s)')), 4000)
        )
      ]).catch(err => {
        console.warn('[Find Company] BYND API failed/timeout:', err.message);
        return null;
      });

      // Try logo.dev directly (fast, doesn't use backend proxies)
      const logoDevDirect = fetchLogoDevDirect(domain).catch(err => {
        console.warn('[Find Company] Logo.dev direct failed:', err.message);
        return [];
      });

      // Wait for both, use whichever succeeds first or combine
      const [byndResults, logoDevResults] = await Promise.allSettled([
        byndWithTimeout,
        logoDevDirect
      ]);

      const byndData = byndResults.status === 'fulfilled' ? byndResults.value : null;
      const logoDevData = logoDevResults.status === 'fulfilled' ? logoDevResults.value : [];

      console.log('[Find Company] BYND results:', byndData?.length || 0);
      console.log('[Find Company] Logo.dev results:', logoDevData?.length || 0);

      // Prefer BYND if available, otherwise use logo.dev
      if (byndData && byndData.length > 0) {
        results = byndData;
        console.log('[Find Company] ✅ Using BYND results');
      } else if (logoDevData && logoDevData.length > 0) {
        // Filter logo.dev results to match domain if possible
        const matching = logoDevData.filter(r =>
          r.domain?.toLowerCase() === domain ||
          r.websiteUrl?.toLowerCase().includes(domain) ||
          r.name?.toLowerCase().includes(domain.split('.')[0])
        );
        results = matching.length > 0 ? matching : logoDevData.slice(0, 1);
        console.log('[Find Company] ✅ Using logo.dev results');
      }

      console.log('[Find Company] Final results:', results?.length || 0, 'results:', results);

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
              companyLogo: company.logo || ''
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
        console.error('[Find Company] ❌ No results found');
        setSuggestions([]);
        setShowSuggestions(false);
        // Show error message to user
        setRequestErrorMessage(`No company found for "${formData.websiteUrl}". Please enter the company name manually.`);
        setTimeout(() => setRequestErrorMessage(''), 5000);
      }
    } catch (error) {
      console.error('[Find Company] Unexpected error:', error);
      setRequestErrorMessage(`Error searching for company: ${error.message}`);
      setTimeout(() => setRequestErrorMessage(''), 5000);
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
      setExcelWarningMessage(null);
      setExcelValidationMessage(null);

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

      // Immediately validate Excel file with backend
      try {
        const formData = new FormData();
        formData.append('excelFile', file);

        // Try multiple backend URLs (same as generateProfile)
        const origin = (typeof window !== 'undefined' ? window.location.origin : '');
        const guessPortSwap = origin.replace(/:(\d+)$/, ':3001');
        const candidates = [
          '', '/',
          BACKEND_BASE_URL,
          `${origin}/backend`,
          `${guessPortSwap}/backend`,
          'http://localhost:3001/backend',
          'http://127.0.0.1:3001/backend',
          'http://localhost:5005',
          'http://127.0.0.1:5005',
        ].filter(Boolean);

        let validationResult = null;
        for (const base of candidates) {
          try {
            const urlBase = (base === '' || base === '/') ? '/one-pager/validate-excel' : (base.endsWith('/one-pager/validate-excel') || base.endsWith('/one-pager/validate-excel/') ? base : `${base}${base.endsWith('/') ? '' : '/'}one-pager/validate-excel`);
            console.log('[Validate Excel] Trying backend:', urlBase);

            const response = await fetch(urlBase, {
              method: 'POST',
              body: formData,
              mode: 'cors',
            });

            if (response.ok) {
              validationResult = await response.json();
              console.log('[Validate Excel] Validation result:', validationResult);

              // Check for partial warning in response headers
              const excelValidationHeader = response.headers.get('x-excel-validation-message');
              if (excelValidationHeader) {
                try {
                  const headerMsg = JSON.parse(excelValidationHeader);
                  console.log('[Validate Excel] Header message:', headerMsg);
                  validationResult.headerMessage = headerMsg;
                } catch (err) {
                  console.warn('[Validate Excel] Could not parse header message:', err);
                }
              }
              break;
            }
          } catch (err) {
            console.warn('[Validate Excel] Failed to validate:', err);
            continue;
          }
        }

        // Handle validation result
        if (validationResult) {
          console.log('[Validate Excel] Full validation result:', JSON.stringify(validationResult, null, 2));
          console.log('[Validate Excel] All validation result keys:', Object.keys(validationResult || {}));

          // Check for partial warning (from header or body)
          const headerMsg = validationResult.headerMessage;

          // Check all possible ways the backend might send partial warning
          const hasPartialWarning = (
            validationResult.partialWarning ||
            validationResult.PartialWarning ||
            validationResult.partial_warning ||
            validationResult.partialData === true ||
            validationResult.partialData === 'true' ||
            headerMsg?.partialWarning ||
            headerMsg?.PartialWarning ||
            headerMsg?.partial_warning ||
            headerMsg?.partialData === true ||
            headerMsg?.partialData === 'true' ||
            // Check if valid=true but one of the data flags is false (partial data)
            (validationResult.valid === true &&
             ((validationResult.hasFinancialData === false && validationResult.hasShareholdingData === true) ||
              (validationResult.hasFinancialData === true && validationResult.hasShareholdingData === false)))
          );

          const partialWarningValue = validationResult.partialWarning ||
                                     validationResult.PartialWarning ||
                                     validationResult.partial_warning ||
                                     headerMsg?.partialWarning ||
                                     headerMsg?.PartialWarning ||
                                     headerMsg?.partial_warning ||
                                     (validationResult.hasFinancialData === false && validationResult.hasShareholdingData === true ? 'missing_financial' : null) ||
                                     (validationResult.hasFinancialData === true && validationResult.hasShareholdingData === false ? 'missing_shareholding' : null);

          console.log('[Validate Excel] Has partial warning:', hasPartialWarning);
          console.log('[Validate Excel] Partial warning value:', partialWarningValue);
          console.log('[Validate Excel] Financial data:', validationResult.hasFinancialData);
          console.log('[Validate Excel] Shareholding data:', validationResult.hasShareholdingData);
          console.log('[Validate Excel] Valid:', validationResult.valid);

          if (hasPartialWarning) {
            // This is a partial warning - show warning message
            const warningMsg = headerMsg || validationResult;
            setExcelWarningMessage({
              message: warningMsg.message || `Warning: ${String(partialWarningValue || 'partial').replace(/_/g, ' ').replace(/missing /i, '')} data is missing`,
              partialWarning: partialWarningValue,
              error: warningMsg.error,
              options: warningMsg.options || [
                "Upload the correct detailed file, or",
                "Continue without it (those sections will be left blank in your one-pager)"
              ]
            });
            console.log('[Validate Excel] ✅ Setting partial warning message:', warningMsg);
            // Clear validation message since we're showing warning
            setExcelValidationMessage(null);
          } else if (!validationResult.valid) {
            // Show validation message - user-friendly message with options
            setExcelValidationMessage({
              message: validationResult.message || "We couldn't find the needed financial or shareholding data.",
              options: [
                "Upload the correct detailed file, or",
                "Continue without it (those sections will be left blank in your one-pager)"
              ],
              hasData: false
            });
            console.log('[Validate Excel] Validation failed:', validationResult.message);
            // Clear warning since we're showing error
            setExcelWarningMessage(null);
          } else {
            // Validation passed with all data
            setExcelValidationMessage({
              message: validationResult.message || "Excel file validated successfully.",
              hasData: validationResult.hasFinancialData || validationResult.hasShareholdingData
            });
            console.log('[Validate Excel] Validation passed');
            // Clear warning
            setExcelWarningMessage(null);
          }
        }
      } catch (err) {
        console.error('[Validate Excel] Error validating file:', err);
        // Don't block user from continuing - validation will happen again during generation
      }
    }
  };

  /**
   * Cancel all ongoing API calls
   */
  const cancelAllOngoingRequests = () => {
    // Cancel operations generation
    if (operationsAbortControllerRef.current) {
      operationsAbortControllerRef.current.abort();
      operationsAbortControllerRef.current = null;
    }
    
    // Cancel profile generation
    if (profileGenerateAbortControllerRef.current) {
      profileGenerateAbortControllerRef.current.abort();
      profileGenerateAbortControllerRef.current = null;
    }
    
    // Clear loading states
    setIsGeneratingOperations(false);
    setIsLoading(false);
    
    // Clear the promise reference
    operationsGeneratePromiseRef.current = null;
  };

  /**
   * Handle editing a user message - restore form and allow re-entry
   */
  const handleEditUserMessage = (message) => {
    // Detect which section this message belongs to
    const isCompanyMessage = message.content.match(/I'd like to generate a one-pager for (.+?) \((.+?)\)/);
    const isAboutMessage = message.content.includes("I've configured my about section preferences");
    const isOperationsMessage = message.content.includes("I've configured operations preferences");
    const isFileUploadMessage = message.content.includes("I've uploaded the financial file");
    
    if (isCompanyMessage) {
      // Cancel all ongoing API calls when editing company details (operations generation was started here)
      cancelAllOngoingRequests();
      // Company name/URL input screen (message id 1)
      const match = message.content.match(/I'd like to generate a one-pager for (.+?) \((.+?)\)/);
      const companyName = match[1].trim();
      const websiteUrl = match[2].trim();
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        companyName: companyName,
        websiteUrl: websiteUrl
      }));
      
      // Remove all messages after message id 1, keep only the company input form
      setMessages(prev => {
        // Keep only messages up to and including message id 1 (the welcome message with company form)
        const filtered = prev.filter(msg => msg.id <= 1);
        // Re-show customization on first message
        return filtered.map(msg => 
          msg.id === 1 ? { ...msg, showCustomization: true } : msg
        );
      });
      
      setActiveCustomizationId(1);
      setStep(1);
      setShowOperations(false);
      setAboutComplete(false);
      
      // Clear all subsequent state
      setOperationsOptions([]);
      setOperationsError('');
      setOperationsSelectionError('');
      setOperationsGenerateResult(null);
      setOperationsPrompt('');
      setIsGeneratingOperations(false);
      setEditingKeyIndex(null);
      setShowCreateOperation(false);
      setNewOperationName('');
      setNewOperationDesc('');
      setContinueError('');
      setCreateError('');
      setUploadedFile(null);
      setExcelErrorMessage('');
      setExcelWarningMessage(null);
      setExcelValidationMessage(null);
      setExcelSuccessMessage('');
      setRequestErrorMessage('');
      setSuccessMessage('');
      
      // Scroll to form
      setTimeout(() => {
        const formElement = document.getElementById('companyName');
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          formElement.focus();
        }
      }, 100);
      
    } else if (isAboutMessage) {
      // About Section Preferences screen (message id 2)
      // Don't cancel operations generation - it was started from company submission, not from about preferences
      // Only cancel profile generation if it was running
      if (profileGenerateAbortControllerRef.current) {
        profileGenerateAbortControllerRef.current.abort();
        profileGenerateAbortControllerRef.current = null;
        setIsLoading(false);
      }
      
      // Remove the user message and everything after it, keep only up to message id 2
      setMessages(prev => {
        // Keep only messages up to and including message id 2 (the system message with about preferences)
        const filtered = prev.filter(msg => msg.id <= 2);
        // Re-show customization on message id 2
        return filtered.map(msg => 
          msg.id === 2 ? { ...msg, showCustomization: true } : msg
        );
      });
      
      setActiveCustomizationId(2);
      setShowOperations(false);
      setAboutComplete(false);
      
      // Clear state for subsequent steps only (but keep operations generation running)
      // Don't clear operationsOptions, operationsError etc. - let the operations generation continue
      setOperationsSelectionError('');
      setContinueError('');
      setCreateError('');
      setUploadedFile(null);
      setExcelErrorMessage('');
      setExcelWarningMessage(null);
      setExcelValidationMessage(null);
      setExcelSuccessMessage('');
      setRequestErrorMessage('');
      setSuccessMessage('');
      setEditingKeyIndex(null);
      setShowCreateOperation(false);
      setNewOperationName('');
      setNewOperationDesc('');
      
      // Scroll to about section
      setTimeout(() => {
        const aboutSection = document.querySelector('[data-message-id="2"]');
        if (aboutSection) {
          aboutSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
    } else if (isOperationsMessage) {
      // Operations Preferences screen (message id 21)
      // Remove the user message and everything after it, keep only up to message id 21
      // This removes file upload section (id 3) and any subsequent messages
      setMessages(prev => {
        // Keep only messages up to and including message id 21 (the system message with operations preferences)
        // Remove message id 3 (file upload) and any other messages after id 21
        const filtered = prev.filter(msg => {
          // Keep messages with id <= 21, but exclude message id 3 (file upload) since it comes after operations
          if (msg.id === 3) return false; // Remove file upload section
          return msg.id <= 21;
        });
        // Re-show customization on message id 21
        return filtered.map(msg => 
          msg.id === 21 ? { ...msg, showCustomization: true } : msg
        );
      });
      
      setActiveCustomizationId(21);
      setShowOperations(false);
      setAboutComplete(true); // About is already complete
      
      // Clear state for subsequent steps only
      setUploadedFile(null);
      setExcelErrorMessage('');
      setExcelWarningMessage(null);
      setExcelValidationMessage(null);
      setExcelSuccessMessage('');
      setRequestErrorMessage('');
      setSuccessMessage('');
      
      // Keep operations state as is (user might want to see their previous selections)
      // But clear errors
      setOperationsError('');
      setOperationsSelectionError('');
      setContinueError('');
      setCreateError('');
      setEditingKeyIndex(null);
      setShowCreateOperation(false);
      setNewOperationName('');
      setNewOperationDesc('');
      
      // If operations haven't been generated yet, trigger generation
      if (operationsOptions.length === 0 && formData.companyName && formData.websiteUrl) {
        kickOffOperationsGenerate(formData.companyName, formData.websiteUrl);
      }
      
      // Scroll to operations section
      setTimeout(() => {
        const operationsSection = document.querySelector('[data-message-id="21"]');
        if (operationsSection) {
          operationsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
    } else if (isFileUploadMessage) {
      // File Upload screen (message id 3)
      // Remove the user message and everything after it, keep only up to message id 3
      setMessages(prev => {
        // Keep only messages up to and including message id 3 (the system message with file upload)
        const filtered = prev.filter(msg => msg.id <= 3);
        // Re-show customization on message id 3
        return filtered.map(msg => 
          msg.id === 3 ? { ...msg, showCustomization: true } : msg
        );
      });
      
      setActiveCustomizationId(3);
      setShowOperations(false);
      setAboutComplete(true); // About is complete
      
      // Clear file upload state to allow re-upload
      setUploadedFile(null);
      setExcelErrorMessage('');
      setExcelWarningMessage(null);
      setExcelValidationMessage(null);
      setExcelSuccessMessage('');
      setRequestErrorMessage('');
      setSuccessMessage('');
      
      // Scroll to file upload section
      setTimeout(() => {
        const fileUploadSection = document.querySelector('[data-message-id="3"]');
        if (fileUploadSection) {
          fileUploadSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  /**
   * Handle company details submission
   */
  const handleCompanySubmit = (e) => {
    e.preventDefault();
    if (formData.companyName && formData.websiteUrl) {
      // Remove customization from first message
      setMessages(prev => {
        // Keep all existing messages, just update message id 1
        const updated = prev.map(msg =>
          msg.id === 1 ? { ...msg, showCustomization: false } : msg
        );
        
        // Check if user message already exists (in case of re-submission)
        const existingUserMsg = updated.find(msg => 
          msg.type === 'user' && 
          typeof msg.content === 'string' &&
          msg.content.match(/I'd like to generate a one-pager for .+? \(.+?\)/)
        );
        
        // If user message exists, remove it and the system message id 2 that follows
        const filtered = existingUserMsg 
          ? updated.filter(msg => 
              msg.id !== existingUserMsg.id && 
              !(msg.id === 2 && msg.type === 'system')
            )
          : updated;
        
        // Add user message
        const userMessage = {
          id: Date.now(),
          type: 'user',
          content: `I'd like to generate a one-pager for ${formData.companyName} (${formData.websiteUrl})`,
          timestamp: new Date()
        };

        // Add system response with about preferences customization
        const systemMessage = {
          id: 2,
          type: 'system',
          content: 'Great! Now let\'s customize what information you\'d like to include in the about section of your one-pager.',
          showCustomization: true,
          timestamp: new Date()
        };

        const result = [...filtered, userMessage, systemMessage];
        console.log('[CompanySubmit] Adding messages:', { userMessage, systemMessage, totalMessages: result.length });
        return result;
      });
      
      setActiveCustomizationId(2);

      // NEW: Trigger operations generation immediately (do not await)
      kickOffOperationsGenerate(formData.companyName, formData.websiteUrl);
    }
  };

  // NEW: Generate operations options from backend
  const generateOperations = async () => {
    // Cancel any existing operations generation
    if (operationsAbortControllerRef.current) {
      operationsAbortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    operationsAbortControllerRef.current = abortController;
    
    try {
      setOperationsError('');
      setIsGeneratingOperations(true);
      const origin = (typeof window !== 'undefined' ? window.location.origin : '');
      const guessPortSwap = origin.replace(/:(\d+)$/, ':3001');
      const candidates = [
        '', '/',
        BACKEND_BASE_URL,
        `${origin}/backend`,
        `${guessPortSwap}/backend`,
        'http://localhost:3001/backend',
        'http://127.0.0.1:3001/backend',
        'http://localhost:5005',
        'http://127.0.0.1:5005',
      ].filter(Boolean);

      let data = null;
      for (const base of candidates) {
        // Check if request was aborted
        if (abortController.signal.aborted) {
          setIsGeneratingOperations(false);
          return;
        }
        
        try {
          const urlBase = (base === '' || base === '/')
            ? '/one-pager/operations/generate'
            : (base.endsWith('/one-pager/operations/generate') || base.endsWith('/one-pager/operations/generate/')
              ? base
              : `${base}${base.endsWith('/') ? '' : '/'}one-pager/operations/generate`);

          const resp = await fetch(urlBase, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyName: formData.companyName, websiteUrl: formData.websiteUrl }),
            signal: abortController.signal
          });
          
          // Check again if aborted after fetch
          if (abortController.signal.aborted) {
            setIsGeneratingOperations(false);
            return;
          }
          
          if (resp.ok) {
            data = await resp.json();
            break;
          }
        } catch (err) {
          // If aborted, don't try next candidate
          if (err.name === 'AbortError' || abortController.signal.aborted) {
            setIsGeneratingOperations(false);
            return;
          }
          // try next candidate
        }
      }
      
      // Check if aborted before processing results
      if (abortController.signal.aborted) {
        setIsGeneratingOperations(false);
        return;
      }
      
      if (!data) {
        throw new Error('Failed to generate operations');
      }
      // Expecting data like: [{ key, value }]
      const raw = Array.isArray(data)
        ? data.map(item => ({
            key: item.key,
            value: item.value,
            editedValue: item.value,
            editedKey: item.key // Initialize editedKey with original key
          }))
        : [];
      // Do not preselect any option; user must choose exactly 3
      const normalized = raw.map((item) => ({
        ...item,
        selected: false
      }));
      
      // Only update state if not aborted
      if (!abortController.signal.aborted) {
        setOperationsSelectionError('');
        setOperationsOptions(normalized);
      }
    } catch (err) {
      // Only update error state if not aborted
      if (err.name !== 'AbortError' && !operationsAbortControllerRef.current?.signal.aborted) {
        console.error('[Operations Generate] Error:', err);
        setOperationsError('Could not load operations options. You can continue without them.');
        setOperationsOptions([]);
      }
    } finally {
      // Always clear loading state
      setIsGeneratingOperations(false);
    }
  };

  // NEW: Save selected operations to backend
  const saveSelectedOperations = async () => {
    const selectedOptions = operationsOptions
      .filter(o => o.selected)
      .map(({ key, editedKey, editedValue }) => ({ key: editedKey || key, value: editedValue }));

    try {
      const origin = (typeof window !== 'undefined' ? window.location.origin : '');
      const guessPortSwap = origin.replace(/:(\d+)$/, ':3001');
      const candidates = [
        '', '/',
        BACKEND_BASE_URL,
        `${origin}/backend`,
        `${guessPortSwap}/backend`,
        'http://localhost:3001/backend',
        'http://127.0.0.1:3001/backend',
        'http://localhost:5005',
        'http://127.0.0.1:5005',
      ].filter(Boolean);

      let saved = false;
      for (const base of candidates) {
        try {
          const urlBase = (base === '' || base === '/')
            ? '/operations/save'
            : (base.endsWith('/operations/save') || base.endsWith('/operations/save/')
              ? base
              : `${base}${base.endsWith('/') ? '' : '/'}operations/save`);

          const resp = await fetch(urlBase, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companyName: formData.companyName,
              websiteUrl: formData.websiteUrl,
              selectedOptions
            })
          });
          if (resp.ok) {
            saved = true;
            break;
          }
        } catch (err) {
          // try next candidate
        }
      }
      if (!saved) {
        throw new Error('Failed to save operations');
      }
      // No-op on success
    } catch (err) {
      console.error('[Operations Save] Error:', err);
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

    // Mark that generation has started - disable edit buttons permanently
    setHasStartedGeneration(true);

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
    // Cancel any existing profile generation
    if (profileGenerateAbortControllerRef.current) {
      profileGenerateAbortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    profileGenerateAbortControllerRef.current = abortController;
    
    setIsLoading(true);
    // Clear previous warnings/errors when starting new generation
    setExcelWarningMessage(null);
    setExcelErrorMessage('');

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
      data.append('aboutPreferences', JSON.stringify(aboutPreferences));
      // Add selected operations as JSON string per new contract
      const operationsSelected = (operationsOptions || [])
        .filter(o => o.selected)
        .map(o => ({ key: o.editedKey || o.key, value: o.editedValue }));
      data.append('operationsSelected', JSON.stringify(operationsSelected));
      // Ensure operationsQuery is always sent to backend (even if empty)
      const operationsQueryValue = operationsPrompt || '';
      console.log('Setting operationsQuery to:', operationsQueryValue);

      // Add operationsQuery to FormData
      data.append('operationsQuery', operationsQueryValue);

      // Verify it was added
      console.log('operationsQuery added successfully:', data.has('operationsQuery'));
      console.log('operationsQuery value after adding:', data.get('operationsQuery'));

      // Double-check: Ensure operationsQuery is present in FormData
      if (!data.has('operationsQuery')) {
        console.error('ERROR: operationsQuery not found in FormData! Adding fallback...');
        data.append('operationsQuery', ''); // Add empty string as fallback
      }

      // Verify operationsQuery was added
      console.log('operationsQuery added to FormData:', data.has('operationsQuery'));
      console.log('operationsQuery value in FormData:', data.get('operationsQuery'));
      data.append('excelFile', uploadedFile); // Always append Excel file (mandatory)

      // Debug: Log FormData contents
      console.log('=== FORM SUBMISSION DEBUG ===');
      console.log('operationsPrompt value:', operationsPrompt);
      console.log('operationsPrompt type:', typeof operationsPrompt);
      console.log('operationsPrompt length:', operationsPrompt?.length || 0);
      console.log('operationsQueryValue:', operationsQueryValue);
      console.log('aboutPreferences:', aboutPreferences);
      console.log('FormData entries:');
      for (let [key, value] of data.entries()) {
        console.log(`  ${key}:`, value, `(type: ${typeof value})`);
      }

      // Test FormData with different methods
      console.log('FormData.has("operationsQuery"):', data.has('operationsQuery'));
      console.log('FormData.get("operationsQuery"):', data.get('operationsQuery'));
      console.log('FormData.getAll("operationsQuery"):', data.getAll('operationsQuery'));

      // Test if we can iterate through FormData
      console.log('FormData iteration test:');
      const formDataEntries = [];
      for (let [key, value] of data.entries()) {
        formDataEntries.push({ key, value });
      }
      console.log('All FormData entries:', formDataEntries);

      console.log('=== END DEBUG ===');

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
        // Check if request was aborted
        if (abortController.signal.aborted) {
          setIsLoading(false);
          return;
        }
        
        try {
          console.log('[OnePager] Trying backend:', `${base}/one-pager/pptx`);
          const urlBase = (base === '' || base === '/') ? '/one-pager/pptx' : (base.endsWith('/one-pager/pptx') || base.endsWith('/one-pager/pptx/') ? base : `${base}${base.endsWith('/') ? '' : '/'}one-pager/pptx`);

          console.log('[OnePager] Sending request to:', urlBase);
          console.log('[OnePager] Request body (FormData):', data);

          // Log the actual request being sent
          console.log('[OnePager] Request details:');
          console.log('  Method: POST');
          console.log('  URL:', urlBase);
          console.log('  Content-Type: multipart/form-data (automatic)');
          console.log('  Body type: FormData');

          // Test FormData before sending
          console.log('[OnePager] Pre-send FormData test:');
          console.log('  operationsQuery exists:', data.has('operationsQuery'));
          console.log('  operationsQuery value:', data.get('operationsQuery'));
          console.log('  All keys:', Array.from(data.keys()));

          const respP = await fetch(urlBase, {
            method: 'POST',
            body: data,
            mode: 'cors',
            signal: abortController.signal
          });
          
          // Check again if aborted after fetch
          if (abortController.signal.aborted) {
            setIsLoading(false);
            return;
          }

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

            // Check if aborted before processing error
            if (abortController.signal.aborted) {
              setIsLoading(false);
              return;
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

          // Check if aborted before processing blob
          if (abortController.signal.aborted) {
            setIsLoading(false);
            return;
          }

          const blob = await respP.blob();
          
          // Check again after blob is loaded
          if (abortController.signal.aborted) {
            setIsLoading(false);
            return;
          }
          const disp = respP.headers.get('Content-Disposition') || '';
          const match = /filename\s*=\s*"?([^";]+)"?/i.exec(disp);
          const fname = match?.[1] || `${formData.companyName.replace(/[^a-z0-9]+/gi,'_')}_one_pager.pptx`;
          const url = URL.createObjectURL(blob);
          setPptxUrl(url);
          setPptxName(fname);
          setRequestErrorMessage('');
          setExcelErrorMessage('');

          // Check for Excel validation message in response headers (for partial data warnings)
          const excelValidationHeader = respP.headers.get('x-excel-validation-message');
          if (excelValidationHeader) {
            try {
              const validationMsg = JSON.parse(excelValidationHeader);
              console.log('[DEBUG] Excel validation message from headers:', validationMsg);
              console.log('[DEBUG] Validation message keys:', Object.keys(validationMsg || {}));
              console.log('[DEBUG] partialData:', validationMsg?.partialData);
              console.log('[DEBUG] partialWarning:', validationMsg?.partialWarning);
              console.log('[DEBUG] PartialWarning:', validationMsg?.PartialWarning);

              // Check for partial data warning (multiple ways the backend might send it)
              const hasPartialWarning = validationMsg && (
                validationMsg.partialData === true ||
                validationMsg.partialData === 'true' ||
                validationMsg.partialWarning ||
                validationMsg.PartialWarning ||
                (validationMsg.valid === true && validationMsg.message && !validationMsg.hasData)
              );

              if (hasPartialWarning) {
                // This is a warning (partial data), not an error - show warning message
                setExcelWarningMessage(validationMsg);
                console.log('[DEBUG] ✅ Setting Excel warning message for partial data:', validationMsg.message);
                console.log('[DEBUG] Warning details:', {
                  message: validationMsg.message,
                  partialWarning: validationMsg.partialWarning || validationMsg.PartialWarning,
                  error: validationMsg.error,
                  options: validationMsg.options
                });
              } else if (validationMsg && !validationMsg.hasData) {
                setExcelValidationMessage(validationMsg);
                console.log('[DEBUG] Setting Excel validation message (no data):', validationMsg);
              } else {
                console.log('[DEBUG] Validation message received but not a warning:', validationMsg);
              }
            } catch (err) {
              console.warn('Could not parse Excel validation message from headers:', err);
              console.warn('Raw header value:', excelValidationHeader);
            }
          } else {
            console.log('[DEBUG] No x-excel-validation-message header found');
          }

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
          // If aborted, don't try next candidate
          if (err.name === 'AbortError' || abortController.signal.aborted) {
            setIsLoading(false);
            return;
          }
          // lastError = err;
          attempts.push(`${base} → ${String((err && err.message) || 'network error')}`);
          continue;
        }
      }
      
      // Check if aborted at the end
      if (abortController.signal.aborted) {
        setIsLoading(false);
        return;
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

  const operationsGeneratePromiseRef = useRef(null); // Hold the pending Promise
  // eslint-disable-next-line
  const [operationsGenerateResult, setOperationsGenerateResult] = useState(null);
  
  // AbortControllers for canceling ongoing API calls
  const operationsAbortControllerRef = useRef(null);
  const profileGenerateAbortControllerRef = useRef(null);

  async function kickOffOperationsGenerate(companyName, websiteUrl) {
    // Cancel any existing operations generation
    if (operationsAbortControllerRef.current) {
      operationsAbortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    operationsAbortControllerRef.current = abortController;
    
    setIsGeneratingOperations(true);
    setOperationsError('');
    setOperationsOptions([]);
    operationsGeneratePromiseRef.current = (async () => {
      const origin = (typeof window !== 'undefined' ? window.location.origin : '');
      const guessPortSwap = origin.replace(/:(\d+)$/, ':3001');
      const candidates = [
        '', '/',
        BACKEND_BASE_URL,
        `${origin}/backend`,
        `${guessPortSwap}/backend`,
        'http://localhost:3001/backend',
        'http://127.0.0.1:3001/backend',
        'http://localhost:5005',
        'http://127.0.0.1:5005',
      ].filter(Boolean);

      let data = null;
      for (const base of candidates) {
        // Check if request was aborted
        if (abortController.signal.aborted) {
          throw new Error('Request aborted');
        }
        
        try {
          const urlBase = (base === '' || base === '/')
            ? '/one-pager/operations/generate'
            : (base.endsWith('/one-pager/operations/generate') || base.endsWith('/one-pager/operations/generate/')
              ? base
              : `${base}${base.endsWith('/') ? '' : '/'}one-pager/operations/generate`);

          const resp = await fetch(urlBase, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyName, websiteUrl }),
            signal: abortController.signal
          });
          
          // Check again if aborted after fetch
          if (abortController.signal.aborted) {
            throw new Error('Request aborted');
          }
          
          if (resp.ok) {
            data = await resp.json();
            break;
          }
        } catch (err) {
          // If aborted, don't try next candidate
          if (err.name === 'AbortError' || abortController.signal.aborted) {
            throw err;
          }
          // try next candidate
        }
      }

      // Check if aborted before processing results
      if (abortController.signal.aborted) {
        throw new Error('Request aborted');
      }

      if (!data) {
        throw new Error('Failed to generate operations');
      }

      const raw = Array.isArray(data)
        ? data.map(item => ({
            key: item.key,
            value: item.value,
            editedValue: item.value,
            editedKey: item.key
          }))
        : [];
      const normalized = raw.map((item) => ({
        ...item,
        selected: false
      }));
      
      // Only update state if not aborted
      if (!abortController.signal.aborted) {
        setOperationsSelectionError('');
        setOperationsGenerateResult(normalized);
        setOperationsOptions(normalized);
        setIsGeneratingOperations(false);
      }
      
      return normalized;
    })().catch(err => {
      // Only update error state if not aborted (aborted is expected)
      if (err.name !== 'AbortError' && !abortController.signal.aborted) {
        setOperationsGenerateResult(null);
        setIsGeneratingOperations(false);
        setOperationsError('Could not load operations options. You can continue without them.');
        setOperationsOptions([]);
      } else {
        // Request was aborted, just clear loading state
        setIsGeneratingOperations(false);
      }
      return null;
    });
  }

  // -- Step 1 (companyName+websiteUrl) Continue Button:
  // Instead of previous behavior:
  // <button onClick={() => setShowOperations(true)}>Continue</button>
  // Do this:
  // 1. Kick off operations fetch but don't wait for it
  // 2. Go directly to About preferences screen

  // About step (after company step):
  // On its Continue:
  // 1. Await the operations generate promise if not done:
  const handleAboutContinue = async () => {
    // No-op fetch here; operations are already being generated from step 1
    setShowOperations(true);
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
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Company logo display */}
                {formData.companyLogo && (
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: '#ffffff',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    flexShrink: 0,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <img
                      src={formData.companyLogo}
                      alt={formData.companyName}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        // If logo fails to load, show first letter
                        const parent = e.target.parentElement;
                        parent.style.background = '#f3f4f6';
                        parent.textContent = (formData.companyName || '?').charAt(0).toUpperCase();
                      }}
                    />
                  </div>
                )}

                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    onFocus={() => {
                      // Show suggestions if they exist, or wait for them to load
                      if (suggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
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
                          setFormData(prev => ({
                            ...prev,
                            companyName: s.name || s.domain,
                            websiteUrl: website || prev.websiteUrl,
                            companyLogo: s.logo || ''
                          }));
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
    } else if (messageId === 2) {
      // About preferences form
      return (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '32px',
          marginTop: '16px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#001742', margin: '0 0 16px 0' }}>
            About Section Preferences
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px 0', lineHeight: '1.5' }}>
            Your About section starts with a brief company description. Select any additional details you'd like to include:
          </p>
          {/* checkboxes for about prefs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            {/* Founding Year */}
            <label
              className="preference-option"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundColor: aboutPreferences.founding_year ? '#eff6ff' : '#f8fafc',
                border: aboutPreferences.founding_year ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                type="checkbox"
                checked={aboutPreferences.founding_year}
                onChange={() => handleAboutPreferenceChange('founding_year')}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#3b82f6',
                  cursor: 'pointer'
                }}
              />
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#001742'
                }}>
                  Founding Year
                </div>
              </div>
            </label>

            {/* Founder Name */}
            <label
              className="preference-option"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundColor: aboutPreferences.founder_name ? '#eff6ff' : '#f8fafc',
                border: aboutPreferences.founder_name ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                type="checkbox"
                checked={aboutPreferences.founder_name}
                onChange={() => handleAboutPreferenceChange('founder_name')}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#3b82f6',
                  cursor: 'pointer'
                }}
              />
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#001742'
                }}>
                  Founder Name
                </div>
              </div>
            </label>

            {/* Headquarter City */}
            <label
              className="preference-option"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundColor: aboutPreferences.headquarter_city ? '#eff6ff' : '#f8fafc',
                border: aboutPreferences.headquarter_city ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                type="checkbox"
                checked={aboutPreferences.headquarter_city}
                onChange={() => handleAboutPreferenceChange('headquarter_city')}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#3b82f6',
                  cursor: 'pointer'
                }}
              />
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#001742'
                }}>
                  Headquarter City
                </div>
              </div>
            </label>

            {/* Shareholding Pattern */}
            <label
              className="preference-option"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundColor: aboutPreferences.shareholding_pattern ? '#eff6ff' : '#f8fafc',
                border: aboutPreferences.shareholding_pattern ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                type="checkbox"
                checked={aboutPreferences.shareholding_pattern}
                onChange={() => handleAboutPreferenceChange('shareholding_pattern')}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#3b82f6',
                  cursor: 'pointer'
                }}
              />
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#001742'
                }}>
                  Shareholding Pattern
                </div>
              </div>
            </label>
          </div>
          {/* NEW: Only a continue button (no operations UI here) */}
          <button
            style={{
              backgroundColor: '#3b82f6', color: '#fff', padding: '14px 28px', borderRadius: '8px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer', minWidth: '140px'
            }}
            onClick={async () => {
              // Remove customization from this message (about step complete)
              setMessages(prev => {
                const updated = prev.map(msg => msg.id === activeCustomizationId ? { ...msg, showCustomization: false } : msg);
                
                // Ensure company user message exists (should always be present)
                const hasCompanyUserMsg = updated.some(msg => 
                  msg.type === 'user' && 
                  typeof msg.content === 'string' &&
                  msg.content.match(/I'd like to generate a one-pager for .+? \(.+?\)/)
                );
                
                if (!hasCompanyUserMsg && formData.companyName && formData.websiteUrl) {
                  // Restore company user message if it's missing
                  const companyUserMsg = {
                    id: Date.now() - 1000, // Ensure it appears before new messages
                    type: 'user',
                    content: `I'd like to generate a one-pager for ${formData.companyName} (${formData.websiteUrl})`,
                    timestamp: new Date()
                  };
                  updated.push(companyUserMsg);
                }
                
                // Add user message for about preferences
                const userMessage = { id: Date.now(), type: 'user', content: "I've configured my about section preferences", timestamp: new Date() };
                // Add system message for operations preferences (fixed id 21)
                const systemMessage = { id: 21, type: 'system', content: 'Now choose which operations to include in your one-pager.', showCustomization: true, timestamp: new Date() };
                
                return [...updated, userMessage, systemMessage];
              });
              setActiveCustomizationId(21);
            }}
          >
            Continue
          </button>
        </div>
      );
    } else if (messageId === 21) {
      // Operations Preferences Screen as a separate step
      return (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '32px',
          marginTop: '16px',
          border: '1px solid #e5e7eb'
        }}>
          <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#001742', margin: '0 0 12px 0' }}>
            Operations Section
          </h4>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px 0', lineHeight: '1.5' }}>
            We're fetching suggested operations highlights. Select the ones to include and edit their descriptions.
          </p>
          {/* Loader if generating */}
          {isGeneratingOperations && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '14px', marginBottom: '12px' }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
              Loading operation options...
            </div>
          )}
          {/* fetch error */}
          {operationsError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>
              {operationsError}
            </div>
          )}
          {/* selection validation error removed from top-level to avoid off-screen messages */}
          {/* Checkboxes for operations */}
          {!isGeneratingOperations && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              {operationsOptions.length > 0 ? (
                operationsOptions.map((opt, idx) => (
                  <div key={opt.key || idx} style={{ padding: '16px', backgroundColor: opt.selected ? '#eff6ff' : '#f8fafc', border: opt.selected ? '1px solid #3b82f6' : '1px solid #e2e8f0', borderRadius: '8px', transition: 'all 0.2s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={!!opt.selected}
                        onChange={() => {
                          setOperationsOptions(prev => {
                            const next = prev.map((o, i) => i === idx ? { ...o, selected: !o.selected } : o);
                            const newCount = next.filter(o => o.selected).length;
                            if (newCount > 0) setContinueError('');
                            return next;
                          });
                        }}
                        style={{ width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }}
                      />
                      {/* Two-column LTR layout */}
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', width: '100%' }}>
                        <div style={{ flex: '0 0 300px', minWidth: '300px', maxWidth: '300px', color: '#001742', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {editingKeyIndex === idx ? (
                            <input
                              type="text"
                              value={opt.editedKey || opt.key}
                              maxLength={80}
                              autoFocus
                              onBlur={() => {
                                // Save when losing focus
                                setOperationsOptions(prev => prev.map((o, i) =>
                                  i === idx ? { ...o, editedKey: (o.editedKey || o.key).trim() || o.key } : o
                                ));
                                setEditingKeyIndex(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.target.blur(); // Triggers onBlur to save
                                } else if (e.key === 'Escape') {
                                  // Cancel editing
                                  setOperationsOptions(prev => prev.map((o, i) =>
                                    i === idx ? { ...o, editedKey: o.key } : o
                                  ));
                                  setEditingKeyIndex(null);
                                }
                              }}
                              onChange={(e) => {
                                const v = (e.target.value || '').slice(0, 80);
                                setOperationsOptions(prev => prev.map((o, i) =>
                                  i === idx ? { ...o, editedKey: v } : o
                                ));
                              }}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                flex: 1,
                                padding: '6px 10px',
                                fontSize: '14px',
                                fontWeight: 700,
                                border: '1px solid #3b82f6',
                                borderRadius: '6px',
                                backgroundColor: '#ffffff',
                                color: '#001742',
                                outline: 'none'
                              }}
                            />
                          ) : (
                            <>
                              <span>{opt.editedKey || opt.key}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingKeyIndex(idx);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  color: '#6b7280',
                                  transition: 'color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = '#3b82f6';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = '#6b7280';
                                }}
                                title="Edit operation name"
                              >
                                <Pencil size={14} />
                              </button>
                            </>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <textarea
                            className="op-desc"
                            value={opt.editedValue || ''}
                            maxLength={300}
                            ref={(textarea) => {
                              // Auto-resize on mount and when value changes
                              if (textarea) {
                                textarea.style.height = 'auto';
                                textarea.style.height = textarea.scrollHeight + 'px';
                              }
                            }}
                            onChange={e => {
                              const v = (e.target.value || '').slice(0, 300);
                              setOperationsOptions(prev => prev.map((o, i) => i === idx ? { ...o, editedValue: v } : o));
                              // auto-resize to fit ALL content without any limits or scrolling
                              try {
                                e.target.style.height = 'auto';
                                // Allow full content to be visible - no max height limit
                                e.target.style.height = e.target.scrollHeight + 'px';
                              } catch {}
                            }}
                            onInput={e => {
                              // Also handle input event for better real-time resizing
                              try {
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                              } catch {}
                            }}
                            placeholder="One-line description"
                            rows={2}
                            style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: '1px solid #e5e7eb', borderRadius: '10px', backgroundColor: '#f9fafb', color: '#001742', boxSizing: 'border-box', minHeight: '56px', lineHeight: '1.4', resize: 'none', overflow: 'hidden', wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}
                          />
                          {(opt.editedValue || '').length >= 240 && (
                            <div style={{ marginTop: '6px', fontSize: '12px', color: (opt.editedValue || '').length > 300 ? '#ef4444' : '#6b7280' }}>
                              {(opt.editedValue || '').length}/300 {(opt.editedValue || '').length > 300 ? '(over limit)' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '13px', color: '#6b7280' }}>No operation options available yet.</div>
              )}
              {/* Create UI */}
              {showCreateOperation ? (
                <div style={{ marginTop: '16px', background: '#ffffff', border: '1px dashed #e5e7eb', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: '#001742' }}>Create</div>
                    <button
                      type="button"
                      onClick={() => {
                        // Count manually added operations (operations not in the original backend results)
                        const backendKeys = new Set((operationsGenerateResult || []).map(op => op.key));
                        const manuallyAddedCount = (operationsOptions || []).filter(op => !backendKeys.has(op.key)).length;
                        
                        if (manuallyAddedCount >= 2) {
                          setCreateError('You have reached the max limit of 2 manually added operations. If you want to add more, please edit from the options above.');
                          return;
                        }
                        
                        const name = (newOperationName || '').trim();
                        const desc = (newOperationDesc || '').trim();
                        const maxName = 80;
                        const maxDesc = 300;
                        if (!name || !desc) {
                          setCreateError('Heading and Description are required to add an operation.');
                          return;
                        }
                        if (name.length > maxName || desc.length > maxDesc) {
                          setCreateError('One or more fields exceed their maximum length (80 for heading, 300 for description).');
                          return;
                        }
                        setCreateError('');
                        setOperationsOptions(prev => [
                          ...prev,
                          { key: name, value: desc, editedValue: desc, editedKey: name, selected: true }
                        ]);
                        // Clear continue error since we now have a selected operation
                        setContinueError('');
                        setNewOperationName('');
                        setNewOperationDesc('');
                        setShowCreateOperation(false);
                      }}
                      disabled={!((newOperationName || '').trim() && (newOperationDesc || '').trim())}
                      style={{ backgroundColor: ((newOperationName || '').trim() && (newOperationDesc || '').trim()) ? '#3b82f6' : '#e5e7eb', color: ((newOperationName || '').trim() && (newOperationDesc || '').trim()) ? '#ffffff' : '#9ca3af', padding: '8px 14px', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '13px', fontWeight: 600, cursor: ((newOperationName || '').trim() && (newOperationDesc || '').trim()) ? 'pointer' : 'not-allowed', boxShadow: 'none' }}
                    >
                      Add +
                    </button>
                  </div>
                  {/* LTR inputs: name, description, Add */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="text"
                      value={newOperationName}
                      maxLength={80}
                      onChange={(e) => setNewOperationName((e.target.value || '').slice(0, 80))}
                      placeholder="New category name *"
                      style={{ flex: '0 0 320px', minWidth: '220px', padding: '12px 14px', fontSize: '14px', border: '1px solid #e5e7eb', borderRadius: '10px', backgroundColor: '#f9fafb', color: '#001742', boxSizing: 'border-box' }}
                    />
                    <input
                      type="text"
                      value={newOperationDesc}
                      maxLength={300}
                      onChange={(e) => setNewOperationDesc((e.target.value || '').slice(0, 300))}
                      placeholder="New category description *"
                      style={{ flex: 1, padding: '12px 14px', fontSize: '14px', border: '1px solid #e5e7eb', borderRadius: '10px', backgroundColor: '#f9fafb', color: '#001742', boxSizing: 'border-box' }}
                    />
                    <button type="button" onClick={() => { /* handled by top Add button */ }} disabled style={{ visibility: 'hidden' }}>.</button>
                  </div>
                  {(newOperationName.length >= 64 || newOperationDesc.length >= 240) && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '12px' }}>
                      <div style={{ flex: '0 0 320px', minWidth: '220px', color: newOperationName.length > 80 ? '#ef4444' : '#6b7280' }}>
                        {newOperationName.length}/80 {newOperationName.length > 80 ? '(over limit)' : ''}
                      </div>
                      <div style={{ flex: 1, color: newOperationDesc.length > 300 ? '#ef4444' : '#6b7280' }}>
                        {newOperationDesc.length}/300 {newOperationDesc.length > 300 ? '(over limit)' : ''}
                      </div>
                    </div>
                  )}
                  {createError && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#991B1B' }}>{createError}</div>
                  )}
                </div>
              ) : (
                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      // Count manually added operations (operations not in the original backend results)
                      const backendKeys = new Set((operationsGenerateResult || []).map(op => op.key));
                      const manuallyAddedCount = (operationsOptions || []).filter(op => !backendKeys.has(op.key)).length;
                      
                      if (manuallyAddedCount >= 2) {
                        setCreateError('You have reached the max limit of 2 manually added operations. If you want to add more, please edit from the options above.');
                        return;
                      }
                      
                      setCreateError('');
                      setShowCreateOperation(true);
                    }}
                    style={{ width: '100%', backgroundColor: '#f3f4f6', color: '#111827', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: 'none' }}
                  >
                    + Add
                  </button>
                  {createError && !showCreateOperation && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#991B1B' }}>{createError}</div>
                  )}
                </div>
              )}
            </div>
          )}
          {/* Only render choices and action when options loaded */}
          {!isGeneratingOperations && operationsOptions.length > 0 && (
            <>
              {/* EXISTING: OPTIONS LIST AND CREATE UI HERE, UNCHANGED */}
              {/* ...options and create code... */}
              <button
                onClick={async () => {
                  // Only validation: if none selected, show message and block
                  const selectedCount = (operationsOptions || []).filter(o => o.selected).length;
                  if (selectedCount === 0) {
                    setContinueError('Please select at least one operation.');
                    return;
                  }
                  setContinueError('');
                  await saveSelectedOperations();
                  // Remove customization from this message
                  setMessages(prev => prev.map(msg => msg.id === activeCustomizationId ? { ...msg, showCustomization: false } : msg));
                  setActiveCustomizationId(null);
                  const userMessage = { id: Date.now(), type: 'user', content: "I've configured operations preferences", timestamp: new Date() };
                  // Next system message for upload
                  const systemMessage = { id: 3, type: 'system', content: "Please upload the detailed version of the company’s financials (Excel from PrivateCircle) that includes shareholding and financial data. We use this file to accurately fill out your output one-pager.", showCustomization: true, timestamp: new Date() };
                  setMessages(prev => [...prev, userMessage, systemMessage]);
                  setActiveCustomizationId(systemMessage.id);
                }}
                style={{ backgroundColor: '#3b82f6', color: '#fff', padding: '14px 28px', borderRadius: '8px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer', minWidth: '140px' }}
              >
                Continue
              </button>
              {continueError && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#991B1B' }}>{continueError}</div>
              )}
            </>
          )}
        </div>
      );
    } else if (messageId === 3) {
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

          {/* Excel validation warning message - for partial data */}
          {excelWarningMessage && (
            <div style={{
              background: '#FEF3C7',
              border: '1px solid #FCD34D',
              color: '#92400E',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: '1.6'
            }}>
              <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                ⚠️ {excelWarningMessage.message ||
                     (excelWarningMessage.partialWarning || excelWarningMessage.PartialWarning
                       ? `Warning: ${String(excelWarningMessage.partialWarning || excelWarningMessage.PartialWarning).replace(/_/g, ' ')} data is missing`
                       : "Warning: Partial data detected")}
              </div>
              {(excelWarningMessage.partialWarning || excelWarningMessage.PartialWarning) && !excelWarningMessage.message && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#78350F' }}>
                  Missing: {String(excelWarningMessage.partialWarning || excelWarningMessage.PartialWarning).replace(/_/g, ' ').replace(/missing /i, '')}
                </div>
              )}
              {excelWarningMessage.error && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#78350F' }}>
                  {excelWarningMessage.error}
                </div>
              )}
              {excelWarningMessage.options && excelWarningMessage.options.length > 0 && (
                <div style={{ marginTop: '12px', fontSize: '13px', color: '#78350F' }}>
                  <div style={{ marginBottom: '4px', fontWeight: 500 }}>You can:</div>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {excelWarningMessage.options.map((option, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{option}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Excel validation message */}
          {excelValidationMessage && !excelValidationMessage.hasData && (
            <div style={{
              background: '#FEF3C7',
              border: '1px solid #FCD34D',
              color: '#92400E',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
              fontWeight: 500
            }}>
              <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                {excelValidationMessage.message}
              </div>
              {excelValidationMessage.options && (
                <div style={{ marginTop: '12px', fontSize: '13px', color: '#78350F' }}>
                  <div style={{ marginBottom: '4px' }}>You can either:</div>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {excelValidationMessage.options.map((option, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{option}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Excel error message (for other errors) */}
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
          <div key={message.id} style={{ marginBottom: '24px' }} data-message-id={message.id}>
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', gap: '8px', marginBottom: '16px' }}>
                <div style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  padding: '16px 20px',
                  borderRadius: '20px 20px 4px 20px',
                  maxWidth: '70%',
                  fontSize: '16px',
                  lineHeight: '1.5',
                  position: 'relative'
                }}>
                  {message.content}
                </div>
                {/* Show edit button for all editable user messages */}
                {(message.content && typeof message.content === 'string' && (
                  message.content.match(/I'd like to generate a one-pager for .+? \(.+?\)/) ||
                  message.content.includes("I've configured my about section preferences") ||
                  message.content.includes("I've configured operations preferences") ||
                  message.content.includes("I've uploaded the financial file")
                )) && (
                  <button
                    onClick={() => !hasStartedGeneration && handleEditUserMessage(message)}
                    disabled={hasStartedGeneration}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: hasStartedGeneration ? 'not-allowed' : 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: hasStartedGeneration ? '#d1d5db' : '#6b7280',
                      borderRadius: '4px',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                      marginTop: '4px',
                      opacity: hasStartedGeneration ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!hasStartedGeneration) {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                        e.currentTarget.style.color = '#374151';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!hasStartedGeneration) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#6b7280';
                      }
                    }}
                    title={hasStartedGeneration ? "Cannot edit after generation has started" : "Edit message"}
                  >
                    <Pencil size={16} />
                  </button>
                )}
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

        {/* Request error message - Shows errors from Find Company or API failures */}
        {requestErrorMessage && (
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
            {requestErrorMessage}
          </div>
        )}

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

      {/* Add CSS for spinner animation and preference options */}
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
        .preference-option:hover {
          background-color: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .preference-option:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}

export default CompanyOnePager;
