import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Home component displaying the grid of available workflows matching exact design
 */
function Home() {
  const workflows = [
    {
      id: 'company-one-pager',
      title: 'Company One-Pagers – Strategic Summary Profiles',
      description: 'Concise, standardized one-page summaries of companies covering key business details, product focus, financial performance, manufacturing footprint, and strategic transactions — for quick partner-level decision-making and opportunity assessment.',
      steps: 4,
      outputType: 'PPTX',
      path: '/workflows/company-one-pager'
    }
  ];

  const renderOutputIcon = (outputType) => {
    if (outputType === 'PDF') {
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.25 0C1.8375 0 1.5 0.3375 1.5 0.75V11.25C1.5 11.6625 1.8375 12 2.25 12H9.75C10.1625 12 10.5 11.6625 10.5 11.25V3L7.5 0H2.25Z" fill="#E8EEF9"/>
          <path d="M8.25 3H10.5L7.5 0V2.25C7.5 2.6625 7.8375 3 8.25 3Z" fill="#97ABD1"/>
          <path d="M10.5 5.25L8.25 3H10.5V5.25Z" fill="#E1E8F6"/>
          <g clipPath="url(#clip0_91_17896)">
            <path d="M5.17505 4.50012V7.20012H5.85005C6.02907 7.20012 6.20076 7.12901 6.32735 7.00242C6.45393 6.87583 6.52505 6.70414 6.52505 6.52512V5.17512C6.52505 4.9961 6.45393 4.82441 6.32735 4.69783C6.20076 4.57124 6.02907 4.50012 5.85005 4.50012H5.17505Z" stroke="#D92D20" strokeWidth="0.155396" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2.8125 5.85012H3.4875C3.66652 5.85012 3.83821 5.77901 3.9648 5.65242C4.09138 5.52583 4.1625 5.35414 4.1625 5.17512C4.1625 4.9961 4.09138 4.82441 3.9648 4.69783C3.83821 4.57124 3.66652 4.50012 3.4875 4.50012H2.8125V7.20012" stroke="#D92D20" strokeWidth="0.155396" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7.5376 5.8501H8.5501" stroke="#D92D20" strokeWidth="0.155396" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.8876 4.50012H7.5376V7.20012" stroke="#D92D20" strokeWidth="0.155396" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
          <defs>
            <clipPath id="clip0_91_17896">
              <rect width="8.1" height="8.1" fill="white" transform="translate(1.80005 1.80005)"/>
            </clipPath>
          </defs>
        </svg>
      );
    } else if (outputType === 'Excel') {
      return (
        <img 
          src="https://api.builder.io/api/v1/image/assets/TEMP/42984a6b04558fcd0fa0b1296d221fc7bc8458d5?width=26" 
          alt="" 
          className="workflow-excel-icon"
        />
      );
    } else {
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1.5 5H10.5M5 1.5V10.5M1.5 2.5C1.5 2.23478 1.60536 1.98043 1.79289 1.79289C1.98043 1.60536 2.23478 1.5 2.5 1.5H9.5C9.76522 1.5 10.0196 1.60536 10.2071 1.79289C10.3946 1.98043 10.5 2.23478 10.5 2.5V9.5C10.5 9.76522 10.3946 10.0196 10.2071 10.2071C10.0196 10.3946 9.76522 10.5 9.5 10.5H2.5C2.23478 10.5 1.98043 10.3946 1.79289 10.2071C1.60536 10.0196 1.5 9.76522 1.5 9.5V2.5Z" stroke="#001742" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
  };

  return (
    <div>
      <h1 className="your-workflows-heading">Your Workflows</h1>
      <div className="workflows-grid">
        {workflows.map((workflow) => (
          <Link
            key={workflow.id}
            to={workflow.path}
            className="workflow-card-new"
            style={{ textDecoration: 'none' }}
          >
            <div className="workflow-card-content">
              <div className="workflow-card-header">
                <h3 className="workflow-card-title">{workflow.title}</h3>
                <p className="workflow-card-description">{workflow.description}</p>
              </div>
              <div className="workflow-card-footer">
                <div className="workflow-card-output">
                  <span className="workflow-output-label">Output</span>
                  <div className="workflow-output-badge">
                    {renderOutputIcon(workflow.outputType)}
                    <span className="workflow-output-text">{workflow.outputType}</span>
                  </div>
                </div>
                <span className="workflow-steps-text">{workflow.steps} steps</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Home;
