import { FileSpreadsheet, FileText } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Home component displaying the grid of available workflows
 */
function Home() {
  const workflows = [
    {
      id: 'company-one-pager',
      title: 'Company One-Pagers – Strategic Summary Profiles',
      description: 'Concise, standardized one-page summaries of companies covering key business details, product focus, financial performance, manufacturing footprint, and strategic transactions — for quick partner-level decision-making and opportunity assessment.',
      steps: 1,
      output: 'PPTX',
      path: '/workflows/company-one-pager'
    }
  ];

  const getFileIcon = (output) => {
    if (output === 'Excel') {
      return <FileSpreadsheet className="file-icon" />;
    } else if (output === 'PDF' || output === 'PPTX') {
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
