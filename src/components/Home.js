import React from 'react';
import { Link } from 'react-router-dom';
import { FileSpreadsheet, FileText } from 'lucide-react';

/**
 * Home component displaying the grid of available workflows
 */
function Home() {
  const workflows = [
    {
      id: 'screenshot-to-excel',
      title: 'Screenshot Chart to Excel',
      description: 'Upload a screenshot of any chart and convert it into an editable Excel chart, allowing you to edit it in the browser and integrate it into your reports.',
      steps: 3,
      output: 'Excel',
      path: '/workflows/screenshot-to-excel'
    },
    {
      id: 'financial-extraction',
      title: 'Financial Statement Extraction from PDF to Excel',
      description: 'Detect and extract the three key financial statements (Income Statement, Balance Sheet, Cash Flow) from an uploaded PDF and convert them into Excel format for further analysis.',
      steps: 4,
      output: 'Excel',
      path: '/workflows/financial-extraction'
    },
    {
      id: 'company-one-pager',
      title: 'Company One-Pagers – Strategic Summary Profiles',
      description: 'Concise, standardized one-page summaries of companies covering key business details, product focus, financial performance, manufacturing footprint, and strategic transactions — for quick partner-level decision-making and opportunity assessment.',
      steps: 1,
      output: 'PDF',
      path: '/workflows/company-one-pager'
    },
    {
      id: 'peer-set-generation',
      title: 'Peer Set Generation & Comparative Table Creation',
      description: 'Enter a company name and automatically generate a peer set with a custom comparative table showing key financial metrics, valuations, and performance indicators.',
      steps: 3,
      output: 'Excel',
      path: '/workflows/peer-set-generation'
    }
  ];

  const getFileIcon = (output) => {
    if (output === 'Excel') {
      return <FileSpreadsheet className="file-icon" />;
    } else if (output === 'PDF') {
      return <FileText className="file-icon" />;
    }
    return null;
  };

  return (
    <div>
      <div className="workflows-grid">
        {workflows.map((workflow) => (
          <Link 
            key={workflow.id}
            to={workflow.path}
            className="workflow-card"
            style={{ textDecoration: 'none' }}
          >
            <h3 className="workflow-title">{workflow.title}</h3>
            <p className="workflow-description">{workflow.description}</p>
            <div className="workflow-meta">
              <div className="workflow-steps">
                <span>{workflow.steps} steps</span>
                <span>→</span>
                <div className="workflow-output">
                  {getFileIcon(workflow.output)}
                  {workflow.output}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Home; 