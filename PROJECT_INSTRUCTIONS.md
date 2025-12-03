# SpecMate - Final Project Instructions

## Project Overview

SpecMate is a web-based material feasibility analyzer for architects. It analyzes early stage architectural visualizations (AI-generated or rendered building images) using Claude Vision API to identify construction materials and classify them by feasibility into three tiers:

- **Tier 1 (Green)**: Readily available, standard products from multiple manufacturers
- **Tier 2 (Yellow)**: Requires customization, special fabrication, or unusual application
- **Tier 3 (Red)**: Needs custom development, R&D, or doesn't currently exist as a buildable product

## Product Concept

Architects often create conceptual designs with materials that may not be readily available or feasible. SpecMate bridges this gap by:

1. Analyzing architectural images to identify materials
2. Classifying materials by buildability/feasibility
3. Providing CSI MasterFormat classification
4. Offering sustainability insights (optional)
5. Suggesting alternative materials (optional)
6. Providing building code compliance notes (when location is provided)
7. Generating comprehensive reports with consultant and supplier recommendations

## MVP Scope

### Core Features (Implemented)

1. **Image Upload & Analysis**
   - Drag-and-drop or click to upload multiple images (JPEG, PNG)
   - Support for analyzing multiple images in a single analysis
   - Image preview grid with individual image removal
   - Clear all images functionality
   - Claude Vision API integration for material identification across all images

2. **Project Brief Input**
   - Text input for project requirements, constraints, or design intent
   - Document upload support (TXT, PDF, DOCX)
   - Automatic project intent extraction using Claude API
   - Brief constraints applied to material analysis

3. **Location Input**
   - Address or coordinate input (decimal degrees or DMS format)
   - Automatic geocoding and jurisdiction detection
   - Building code identification
   - Code compliance notes for materials

4. **Analysis Options**
   - Toggle for sustainability notes
   - Toggle for alternative materials
   - Options applied to analysis prompt

5. **Material Analysis Results**
   - Summary statistics frame with tier counts and "Generate Report" button in top right corner
   - Materials organized by CSI MasterFormat Division
   - Tier classification (1, 2, 3) with color coding
   - Detailed material cards with:
     - CSI Division and number
     - Description
     - Properties list
     - Feasibility reasoning
     - Sustainability notes (if enabled)
     - Code compliance notes (if location provided)
     - Alternative materials (if enabled)

6. **Report Generation**
   - "Generate Report" button located in top right corner of Summary frame
   - Markdown report preview
   - PDF report download with rich text formatting
   - Reports include:
     - Project overview with image thumbnail
     - Location and building code information
     - Notes from the brief (formatted)
     - Summary statistics by tier
     - Materials organized by CSI Division and tier
     - Building code compliance summary
     - Recommendations
     - Elite consultants appendix (by tier)
     - Material suppliers appendix (Tier 1 & 2 only, by location)

7. **Holiday Theme**
   - December holiday theme with animated snowflakes
   - Green background and "Happy Holidays!" message

8. **Contact Form**
   - Contact button at bottom of page (👋 Contact)
   - Modal form with Name, Subject, and Message fields
   - Form validation and submission
   - Contact submissions logged to backend
   - Success/error feedback

9. **Usage Logging & Analytics**
   - Automatic logging of analysis usage
   - Tracks: image count, analysis options, location, brief, material counts, tier distribution, CSI divisions
   - API token usage tracking (input/output tokens)
   - Analysis duration metrics
   - Report generation logging (PDF downloads)
   - Contact form submission logging
   - Anonymous session tracking
   - Backend storage of all logs

## Technical Architecture

### Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (CDN)
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514) with vision
- **PDF Generation**: jsPDF
- **Storage**: Browser localStorage for API key persistence (development)
- **Format**: Single-page application, client-side only

### Environment Variables

- `VITE_ANTHROPIC_API_KEY`: Anthropic API key (required)
- Stored in `.env` file (never committed to git)
- Development: Vite proxy handles API key server-side
- Production: Requires backend proxy for security

### Project Structure

```
src/
├── components/
│   ├── ImageUpload.tsx          # Image upload with drag-and-drop
│   ├── AnalysisOptions.tsx      # Sustainability and alternatives toggles
│   ├── LocationInput.tsx        # Location input with geocoding
│   ├── BriefInput.tsx           # Brief text/document input
│   ├── ResultsDisplay.tsx       # Material results display
│   ├── SummaryStats.tsx         # Summary statistics with Generate Report button
│   ├── MaterialCard.tsx         # Individual material card component
│   ├── ReportModal.tsx          # Report preview and download
│   ├── ContactModal.tsx         # Contact form modal
│   └── Snowflakes.tsx           # Holiday animation component
├── types/
│   ├── index.ts                 # TypeScript interfaces
│   └── logging.ts               # Usage logging type definitions
├── utils/
│   ├── api.ts                   # API key management
│   ├── analyze.ts               # Main analysis function
│   ├── prompt.ts                # Prompt generation
│   ├── brief.ts                 # Brief intent extraction
│   ├── report.ts                # Report generation (Markdown & PDF)
│   ├── geocode.ts               # Geocoding utilities
│   ├── logging.ts               # Usage and contact logging utilities
│   └── testVision.ts           # API testing utilities
└── App.tsx                      # Main application component
```

## User Flow

1. **Upload Images**: User uploads one or more architectural visualizations
2. **Enter Location** (Optional): User enters project location for code compliance
3. **Enter Brief** (Optional): User provides project brief or uploads document
4. **Set Options**: User toggles sustainability notes and/or alternatives
5. **Analyze**: System analyzes all images with Claude Vision API
   - If brief provided: Extracts project intent first
   - Constrains material analysis based on brief requirements
   - Usage automatically logged to backend
6. **View Results**: Materials displayed by CSI Division and tier with Summary statistics frame
7. **Generate Report**: User clicks "Generate Report" button in top right corner of Summary frame to preview and download Markdown or PDF report
   - Report generation automatically logged
8. **Contact** (Optional): User can click "👋 Contact" button at bottom of page to submit questions or feedback

## Feature Specifications

### Image Upload

- Accepts multiple JPEG and PNG files
- Drag-and-drop interface
- Grid display of uploaded images with thumbnails
- Individual image removal
- Clear all images functionality
- Image preview before analysis
- File validation (type and size)
- Base64 conversion for API
- All images analyzed together in a single analysis

### Material Analysis

- Identifies 5-15 materials across all uploaded images
- Analyzes multiple images together for comprehensive material identification
- Classifies by CSI MasterFormat Division
- Assigns tier based on feasibility
- Provides detailed reasoning for each material
- Includes sustainability notes (optional)
- Suggests alternatives (optional)
- Provides code compliance notes (if location provided)
- Usage automatically logged with API token tracking

### Report Generation

**Markdown Report**:
- Project summary with statistics
- Materials organized by CSI Division and tier
- Building code compliance summary
- Recommendations
- Consultants appendix (by tier)
- Suppliers appendix (Tier 1 & 2, by location)

**PDF Report**:
- Rich text formatting with bold labels
- Project overview with image thumbnail
- Location and building code information
- Notes from brief (formatted)
- Summary statistics
- Material cards with full details
- Consultants and suppliers appendices
- Professional typography and page breaks

### Brief Processing

- Text input or document upload
- Automatic intent extraction using Claude API
- Extracted intent includes:
  - Project type and purpose
  - Design requirements/constraints
  - Performance requirements
  - Material preferences/restrictions
  - Special considerations
- Intent constrains material analysis

### Location Processing

- Supports addresses and coordinates (decimal or DMS)
- Automatic geocoding
- Jurisdiction detection
- Building code identification
- Code compliance notes for materials

### Contact Form

- Modal form accessible via "👋 Contact" button at bottom of page
- Required fields: Name, Subject, Message
- Form validation with error messages
- Success feedback on submission
- Contact submissions logged to backend
- Anonymous session tracking

### Usage Logging

- **Analysis Logging**: Automatically logs each analysis with:
  - Number of images analyzed
  - Analysis options (sustainability, alternatives)
  - Project location (jurisdiction, building code)
  - Project brief (length, intent presence)
  - Material count and tier distribution
  - CSI divisions identified
  - API token usage (input/output)
  - Analysis duration
  - Anonymous session ID

- **Report Logging**: Tracks report generation:
  - Log ID linking to analysis
  - Report format (PDF)
  - Timestamp

- **Contact Logging**: Tracks contact form submissions:
  - Name, subject, message
  - Session ID
  - Timestamp

- **Backend Storage**: All logs stored in backend:
  - File-based storage (development)
  - Organized by date and type
  - Ready for database integration (production)

## Data Structures

### Material

```typescript
interface Material {
  name: string;                    // Brief descriptive name
  description: string;             // 2-3 sentence description
  properties: string[];            // Visual/performance characteristics
  tier: 1 | 2 | 3;               // Feasibility classification
  reasoning: string;              // Why this tier
  csiDivision: string;            // CSI MasterFormat division name
  csiNumber: string;              // 2-digit division number
  sustainabilityNotes?: string;   // Optional: environmental performance
  alternatives?: Alternative[];    // Optional: alternative materials
  codeCompliance?: string;        // Optional: building code notes
}
```

### Project Location

```typescript
interface ProjectLocation {
  input: string;                   // User's input (address or coordinates)
  coordinates: {
    lat: number;
    lng: number;
  };
  jurisdiction?: string;          // Detected jurisdiction
  buildingCode?: string;          // Primary building code
}
```

### Project Brief

```typescript
interface ProjectBrief {
  text: string;                    // Brief text content
  intent?: string;                 // Extracted project intent/constraints
}
```

### Analysis

```typescript
interface Analysis {
  imageUrls: string[];            // Data URLs of uploaded images (supports multiple)
  materials: Material[];           // Array of identified materials
  timestamp: string;               // ISO 8601 timestamp
  includeSustainability: boolean;  // Whether sustainability was enabled
  includeAlternatives: boolean;    // Whether alternatives was enabled
  location?: ProjectLocation;      // Optional: project location
  brief?: ProjectBrief;            // Optional: project brief
}
```

### Usage Log

```typescript
interface UsageLog {
  id: string;                      // Unique log ID
  timestamp: string;               // ISO 8601 timestamp
  sessionId: string;               // Anonymous session identifier
  imageCount: number;              // Number of images analyzed
  analysisOptions: {
    includeSustainability: boolean;
    includeAlternatives: boolean;
  };
  location?: {
    hasLocation: boolean;
    jurisdiction?: string;
    buildingCode?: string;
  };
  brief?: {
    hasBrief: boolean;
    briefLength?: number;
    hasIntent: boolean;
  };
  materialCount: number;           // Total materials identified
  tierDistribution: {
    tier1: number;
    tier2: number;
    tier3: number;
  };
  csiDivisions: string[];          // List of CSI divisions found
  reportGenerated: boolean;       // Whether report was generated
  analysisDuration?: number;       // Analysis time in milliseconds
  apiTokensUsed?: {
    input: number;
    output: number;
  };
}
```

## Design Guidelines

### Color Scheme

- **Tier 1 (Green)**: RGB(34, 139, 34) - `bg-green-100`, `text-green-800`, `border-green-300`
- **Tier 2 (Yellow)**: RGB(255, 193, 7) - `bg-yellow-100`, `text-yellow-800`, `border-yellow-300`
- **Tier 3 (Red)**: RGB(220, 53, 69) - `bg-red-100`, `text-red-800`, `border-red-300`
- **Holiday Theme**: Green background (`bg-green-700`) with red text for December

### Typography

- Clean, minimal, professional aesthetic
- Mobile-first responsive design
- Clear visual hierarchy

### UI Components

- Summary statistics frame with tier counts and integrated "Generate Report" button (top right)
- Card-based layout for materials
- Expandable sections for details
- Modal for report preview
- Contact form modal with validation
- Contact button at bottom of page (👋 Contact)
- Image grid display for multiple uploads
- Loading states for async operations
- Error messages with clear guidance

## API Integration

### Claude Vision API

- Model: `claude-sonnet-4-20250514`
- Endpoint: `/v1/messages`
- Development: Uses Vite proxy to handle CORS and API key
- Production: Requires backend proxy for security

### Prompt Structure

- Includes multiple images (base64 encoded)
- Includes project brief constraints (if provided)
- Requests JSON-only response
- Specifies exact JSON structure
- Includes conditional fields based on options
- Analyzes all images together for comprehensive material identification

### Error Handling

- Network errors with retry logic
- API key validation
- Malformed responses
- Rate limiting
- Timeout handling for API calls
- User-friendly error messages
- Graceful degradation for optional features

## Report Features

### Consultants Appendix

- Organized by tier (Green, Yellow, Red)
- Based on CSI divisions of identified materials
- Includes: name, firm, specialty, contact info, disciplines

### Suppliers Appendix

- Only for Tier 1 and Tier 2 materials
- Prioritizes local suppliers (based on project location)
- Includes national suppliers when local options limited
- Includes: name, company, location, material types, specialties, contact info

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Anthropic API key

### Installation

1. Clone repository
2. Install dependencies: `npm install`
3. Create `.env` file with `VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here`
4. Start dev server: `npm run dev`
5. Open `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Output in `dist/` directory.

### Environment Configuration

- Development: Vite dev server with proxy
- Production: Requires backend proxy for API key security
- Environment variables: `VITE_ANTHROPIC_API_KEY`
- Backend endpoints:
  - `/api/anthropic/messages` - Claude API proxy
  - `/api/logs/usage` - Usage analytics logging
  - `/api/logs/report` - Report generation logging
  - `/api/logs/contact` - Contact form logging

## Security Considerations

### API Key Management

- **Development**: Stored in `.env` file, loaded by Vite proxy server-side
- **Production**: Must use backend proxy - never expose API key in client code
- `.env` file must be in `.gitignore`
- Never commit API keys to version control

### Best Practices

- Validate all user inputs
- Sanitize file uploads
- Use HTTPS for all API calls
- Check API key presence before making calls
- Handle errors gracefully without exposing sensitive info

## Testing Checklist

- [x] Image upload (various formats)
- [x] Invalid file type handling
- [x] API failures
- [x] Report generation (Markdown and PDF)
- [x] Report download
- [x] Mobile responsiveness
- [x] Keyboard navigation
- [x] API key validation
- [x] Location geocoding
- [x] Brief intent extraction
- [x] Holiday theme (December)
- [x] Multiple image upload
- [x] Contact form
- [x] Usage logging
- [x] Report generation logging

## Known Limitations

1. **PDF/DOCX Parsing**: Full text extraction from PDF/DOCX files requires additional libraries. Currently shows placeholder message - users can paste content directly.

2. **API Key Security**: In production, requires backend proxy to keep API key server-side. Current implementation exposes key in development (acceptable for dev only).

3. **Geocoding**: Uses simplified geocoding service. For production, consider using Google Maps Geocoding API or similar.

4. **No Data Persistence**: Analysis results are not saved - only available during session. Usage logs are stored in backend for analytics.

5. **Rate Limiting**: Subject to Anthropic API rate limits.

## Future Enhancements

1. **Backend Integration**: Server-side API key management ✅ (Implemented)
2. **Database**: Save analysis history (logs currently file-based, ready for DB migration)
3. **User Accounts**: Multi-user support
4. **Advanced PDF Parsing**: Full document text extraction
5. **Material Database**: Expand material knowledge base
6. **Cost Estimation**: Add material cost estimates
7. **Timeline Estimates**: Add procurement timeline estimates
8. **3D Model Support**: Analyze 3D models in addition to images
9. **Analytics Dashboard**: View usage statistics and contact submissions
10. **Email Notifications**: Send email confirmations for contact submissions

## Deployment

### Recommended Platforms

1. **Vercel** (Recommended)
   - Free tier available
   - Automatic deployments from Git
   - Environment variables support
   - Requires backend proxy for API key

2. **Netlify**
   - Similar to Vercel
   - Free tier available
   - Easy Git integration

3. **Cloudflare Pages**
   - Free tier available
   - Fast CDN
   - Environment variables support

### Deployment Steps

1. Build the application: `npm run build`
2. Deploy `dist/` directory to hosting platform
3. Configure environment variables
4. Set up backend proxy for API key (production)
5. Configure custom domain (optional)

## Support

For issues or questions:
- Check API key configuration
- Verify `.env` file exists and is properly formatted
- Check browser console for errors
- Verify Anthropic API key is valid and has credits

## License

[Specify license here]

## Version History

- **v1.2.0** (Current): Multi-image support, contact form, and logging
  - Multiple image upload support with grid display
  - Individual image removal and clear all functionality
  - Contact form with modal interface
  - Usage logging system for analytics
  - API token usage tracking
  - Report generation logging
  - Contact form submission logging
  - Backend logging endpoints (usage, report, contact)
  - Improved error handling with timeouts

- **v1.0.1**: UI improvements
  - Moved "Generate Report" button to top right corner of Summary frame
  - Improved Summary statistics layout with integrated report generation
  - Enhanced user experience with more intuitive report access

- **v1.0.0**: Initial release with all MVP features
  - Image analysis with Claude Vision
  - Material tier classification
  - CSI MasterFormat integration
  - Location-based code compliance
  - Brief-based analysis constraints
  - Report generation (Markdown & PDF)
  - Consultants and suppliers appendices
  - Holiday theme

---

**Report generated by SpecMate**


