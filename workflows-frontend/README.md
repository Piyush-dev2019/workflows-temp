# Workflows Application

A React-based application that provides various data processing and analysis workflows including chart conversion, financial statement extraction, company analysis, and peer set generation.

## Features

- **Screenshot Chart to Excel**: Convert chart screenshots to editable Excel files
- **Financial Statement Extraction**: Extract financial data from PDFs to Excel format
- **Company One-Pagers**: Generate strategic summary profiles for companies
- **Peer Set Generation**: Create comparative analysis tables for companies

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Clone or download the project files
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

### Running the Application

Start the development server:

```bash
npm start
```

The application will open in your browser at `http://localhost:3000`.

## Project Structure

```
src/
├── components/
│   ├── Home.js                    # Main dashboard with workflow cards
│   ├── Sidebar.js                 # Navigation sidebar
│   └── workflows/
│       ├── CompanyOnePager.js     # Company profile generation workflow
│       ├── ScreenshotToExcel.js   # Chart screenshot conversion workflow
│       ├── FinancialExtraction.js # PDF financial data extraction workflow
│       └── PeerSetGeneration.js   # Peer company analysis workflow
├── App.js                         # Main application component
├── index.js                       # Application entry point
└── index.css                      # Global styles
```

## API Integration

Each workflow component is designed to make API calls to backend endpoints:

- `/api/company-one-pager` - Company profile generation
- `/api/screenshot-to-excel` - Chart conversion
- `/api/financial-extraction` - PDF data extraction
- `/api/peer-set-generation` - Peer analysis generation

The application includes fallback mock data for demonstration purposes when the backend is not available.

## Key Features

### Navigation
- Permanent sidebar with Workflows section
- Breadcrumb navigation for workflow pages
- Easy navigation back to home screen

### File Upload
- Drag and drop file upload interface
- Support for various file types (images, PDFs, Excel files)
- Visual feedback for uploaded files

### Result Display
- Clean, formatted result presentation
- Download functionality for generated files
- Refresh option to regenerate results

### Responsive Design
- Mobile-friendly interface
- Modern, clean UI matching the provided design
- Blue color scheme with professional styling

## Customization

The application can be easily customized by:

1. Modifying workflow configurations in `Home.js`
2. Updating API endpoints in individual workflow components
3. Customizing styles in `index.css`
4. Adding new workflows by creating components in the `workflows/` directory

## Browser Support

The application supports all modern browsers including Chrome, Firefox, Safari, and Edge. 