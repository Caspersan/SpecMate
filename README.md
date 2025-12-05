# SpecMate

Material Feasibility Analyzer for Architects

## 🚨 Important: Before You Start

**This project uses a backend proxy to keep your API key secure.** The application includes:
- ✅ Frontend React application (TypeScript + Vite)
- ✅ Vercel serverless functions (production - recommended)
- ✅ Express server option (local development/self-hosted)
- ✅ Usage analytics logging system
- ✅ Contact form with backend logging

**For production deployment on Vercel**: Everything is configured and ready to deploy. Just set your `ANTHROPIC_API_KEY` environment variable in Vercel dashboard and deploy!

**For local development**: Use the Vite dev server (API key in `.env` file) or run both frontend + backend server for full functionality.

## Setup Instructions

### Prerequisites
- 🔧 Node.js 18+ installed
- 📦 npm or yarn package manager
- 🔑 Anthropic API key ([Get one here](https://console.anthropic.com/))
- 🌐 For production: Vercel account (recommended) or similar hosting platform

### Installation

1. 📥 Install frontend dependencies:
```bash
npm install
```

2. 📥 Install backend dependencies (if using Express server):
```bash
npm install --prefix . express cors
```
Or if you have a separate `server-package.json`:
```bash
cd server && npm install
```

3. ⚙️ Create a `.env` file from the example template:
```bash
# Copy the example file
cp .env.example .env

# On Windows (PowerShell)
Copy-Item .env.example .env

# On Windows (CMD)
copy .env.example .env
```

Then edit `.env` and replace `sk-ant-your-key-here` with your actual API key.

**Important**: 
- 📋 See `.env.example` for the template and detailed instructions
- 🔗 Get your API key from [Anthropic Console](https://console.anthropic.com/)
- ✅ Your API key must start with `sk-ant-`
- 🔒 The `.env` file is already in `.gitignore` and will not be committed
- ⚠️ **Never commit your API key to version control**
- ✅ The `.env.example` file is safe to commit (contains no real keys)

4. 🚀 Start the development server:
```bash
npm run dev
```

5. 🌐 Open the URL shown in the terminal (usually `http://localhost:5173`)

### Backend Server Setup (Development)

For local development with full backend features (logging, contact form):

1. ⚙️ Set backend environment variable (different from frontend):
```bash
# On Windows (PowerShell)
$env:ANTHROPIC_API_KEY="sk-ant-your-key-here"

# On Windows (CMD)
set ANTHROPIC_API_KEY=sk-ant-your-key-here

# On Mac/Linux
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

2. 🚀 Start the backend server:
```bash
node server.js
```

The backend server will:
- Run on `http://localhost:3000` (or PORT environment variable)
- Proxy API requests to Anthropic (keeps API key secure)
- Handle logging endpoints (`/api/logs/usage`, `/api/logs/report`, `/api/logs/contact`)
- Serve the built frontend from `dist/` directory

3. 🔄 Update frontend to use backend proxy:
   - The Vite dev server proxy is configured for development
   - For production, build the frontend and serve via backend server

### Building for Production

1. 🔨 Build the frontend:
```bash
npm run build
```

2. 📦 The built files will be in the `dist/` directory

3. 🚀 For production deployment:

**Option A: Express Server (Self-hosted)**
```bash
# Set environment variable
export ANTHROPIC_API_KEY=sk-ant-your-key-here

# Start server
node server.js
```

**Option B: Vercel (Recommended)**
- Deploy to Vercel (supports serverless functions automatically)
- Set `ANTHROPIC_API_KEY` in Vercel environment variables
- The `api/` directory contains serverless functions
- `vercel.json` configures routing

## Project Structure

- 📁 `src/` - Frontend source code
  - 📝 `types/` - TypeScript interfaces (including logging types)
  - 🧩 `components/` - React components
    - `ImageUpload.tsx` - Multiple image upload with grid display
    - `ContactModal.tsx` - Contact form modal
    - `ReportModal.tsx` - Report preview and download
    - And more...
  - 🔧 `utils/` - Utility functions
    - `analyze.ts` - Material analysis with Claude API
    - `logging.ts` - Usage and contact logging
    - `report.ts` - PDF and Markdown report generation
    - And more...
- 📁 `api/` - Backend serverless functions (for Vercel)
  - `anthropic/messages.js` - Claude API proxy
  - `logs/usage.js` - Usage analytics logging
  - `logs/report.js` - Report generation logging
  - `logs/contact.js` - Contact form logging
- 📁 `logs/` - Log storage directory (created automatically, gitignored)
  - `usage/` - Usage analytics logs
  - `contact/` - Contact form submissions
- 🌐 `index.html` - Main HTML file with Tailwind CSS CDN
- 🔐 `.env` - Environment variables (create from `.env.example`, not committed to git)
- 📋 `.env.example` - Example environment variables template (safe to commit)
- 🖥️ `server.js` - Express backend server (for development/production)
- ⚙️ `vercel.json` - Vercel deployment configuration

## Tech Stack

### Frontend
- ⚛️ React 18+ with TypeScript
- ⚡ Vite for build tooling
- 🎨 Tailwind CSS (via CDN)
- 📄 jsPDF for PDF report generation

### Backend
- 🖥️ Express.js (for self-hosted option)
- ☁️ Vercel Serverless Functions (for Vercel deployment)
- 📝 File-based logging (ready for database migration)

### AI & APIs
- 🤖 Anthropic Claude API (claude-sonnet-4-20250514) with Vision
- 🌍 Geocoding for location detection

## Key Features

- 🖼️ **Multiple Image Upload**: Upload and analyze multiple architectural images simultaneously
- 📊 **Material Analysis**: Identifies construction materials and classifies by feasibility (Tier 1, 2, 3)
- 📋 **CSI MasterFormat**: Automatic classification by CSI divisions
- 🌍 **Location-Based Analysis**: Building code compliance based on project location
- 📝 **Project Brief Integration**: Constrain analysis based on project requirements
- 📄 **Report Generation**: Generate comprehensive PDF and Markdown reports
- 📧 **Contact Form**: Submit questions and feedback (logged to backend)
- 📈 **Usage Analytics**: Automatic logging of usage patterns and API token consumption
- 🎄 **Holiday Theme**: Special December theme with animated snowflakes

## CORS and API Access

**Important**: The Anthropic API does not support direct browser requests due to CORS restrictions.

### Development
The Vite dev server includes a proxy configuration that handles CORS automatically. Just run `npm run dev` and the proxy will forward requests to the Anthropic API.

**Note**: For full functionality (logging, contact form), you should also run the backend server:
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
node server.js
```

### Production
**You must use a backend proxy** - the API key must never be exposed in client-side code.

**Recommended Options:**

1. ✅ **Vercel Deployment** (Easiest)
   - Deploy to Vercel (supports serverless functions automatically)
   - Set `ANTHROPIC_API_KEY` in Vercel environment variables
   - Serverless functions in `api/` directory handle all backend logic
   - No additional server setup needed

2. ✅ **Express Server** (Self-hosted)
   - Use the included `server.js` file
   - Set `ANTHROPIC_API_KEY` environment variable
   - Build frontend: `npm run build`
   - Start server: `node server.js`
   - Server serves frontend and handles all API requests

3. ⚠️ **Other Platforms**
   - Must set up backend proxy for API key security
   - Configure environment variables
   - Ensure logging endpoints are accessible

## Backend Endpoints

The application uses the following backend endpoints:

- `POST /api/anthropic/messages` - Claude API proxy (keeps API key secure)
- `POST /api/logs/usage` - Usage analytics logging
- `POST /api/logs/report` - Report generation tracking
- `POST /api/logs/contact` - Contact form submissions

All endpoints are implemented as:
- **Vercel serverless functions** in `api/` directory (production - CommonJS format)
- **Express routes** in `server.js` (local development/self-hosted option)

### Recent Updates (Dec 2024)
- ✅ All API endpoints converted to CommonJS format for Vercel compatibility
- ✅ CORS headers added to all endpoints
- ✅ OPTIONS method handling for CORS preflight requests
- ✅ Logging uses Vercel's console logging (viewable in Functions > Logs)

## Logging System

The application automatically logs:
- ✅ Analysis usage (image count, options, location, brief, materials, API tokens)
- ✅ Report generation (PDF downloads)
- ✅ Contact form submissions

**Log Storage:**
- **Production (Vercel)**: Console logging to Vercel's Functions > Logs (view in Vercel dashboard)
- **Development (Express server)**: Files in `logs/` directory (gitignored)
- **Ready for migration**: Log structure supports database integration

**Privacy:**
- All logging is anonymous (session IDs, no personal data)
- Contact form submissions include name/subject/message (user-provided only)
- No sensitive data (API keys, full addresses) stored in logs

## Environment Variables

### Frontend (`.env` file)

Copy `.env.example` to `.env` and add your API key:
```bash
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
```

See `.env.example` for detailed instructions and comments.

### Backend (Environment variable, not in `.env`)
```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Important**: 
- Frontend uses `VITE_` prefix (Vite requirement)
- Backend uses `ANTHROPIC_API_KEY` (no prefix)
- Never commit API keys to version control
- `.env` is already in `.gitignore`

## Troubleshooting

### API Key Issues
- ✅ Verify key starts with `sk-ant-`
- ✅ Check key is set in correct location (`.env` for frontend, environment variable for backend)
- ✅ Ensure key has credits in Anthropic Console
- ✅ For production, verify environment variables are set in hosting platform

### CORS Errors
- ✅ Ensure backend proxy is running (development or production)
- ✅ Check that API requests go through `/api/anthropic/messages` endpoint
- ✅ Verify backend server is accessible

### Logging Not Working
- ✅ Ensure backend is deployed/running (Vercel serverless or Express server)
- ✅ Check browser console for network errors
- ✅ Verify backend endpoints return 200 status (not 404)
- ✅ For Vercel: Check Functions > Logs in Vercel dashboard
- ✅ For Express: Check `logs/` directory is writable
- ⚠️ Note: Logging fails silently to not interrupt user experience

### Build Errors
- ✅ Run `npm install` to ensure all dependencies are installed
- ✅ Check Node.js version (18+ required)
- ✅ Run `npx tsc --noEmit` to check for TypeScript errors
- ✅ Clear `node_modules` and reinstall if issues persist

## Production Deployment Checklist

### Vercel Deployment (Recommended)

- [ ] Connect GitHub repository to Vercel
- [ ] Set `ANTHROPIC_API_KEY` in Vercel environment variables (Settings → Environment Variables)
- [ ] Deploy (automatic on git push to main branch)
- [ ] Test backend endpoints are accessible (should return 200, not 404)
- [ ] Test contact form submission
- [ ] Test material analysis
- [ ] Test report generation (PDF download)
- [ ] Verify API key is NOT exposed in client-side code
- [ ] Check Functions > Logs in Vercel dashboard for logging output

### Self-Hosted Deployment

- [ ] Set `ANTHROPIC_API_KEY` environment variable on server
- [ ] Build frontend: `npm run build`
- [ ] Start backend server: `node server.js`
- [ ] Verify logging directory is writable
- [ ] Test all backend endpoints
- [ ] Configure log rotation/cleanup
- [ ] Set up monitoring for backend endpoints

## Support

For issues or questions:
- 📖 Check `PROJECT_INSTRUCTIONS.md` for detailed feature documentation
- 🔍 Check browser console for errors
- 🔑 Verify API key configuration
- 📝 Review environment variable setup
- 🌐 Verify backend server is running (for full functionality)

## License

This project is licensed under the MIT License. See [LICENSE.md](LICENSE.md) for the full license text.

---

**Built by Casper Clausen**

2025

