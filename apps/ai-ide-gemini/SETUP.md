# AI IDE Gemini - Setup Guide

This guide will walk you through setting up and running the AI IDE Gemini application.

## Quick Start (TL;DR)

```bash
cd apps/ai-ide-gemini
npm run install:all
cp .env.example .env
# Edit .env with your GEMINI_API_KEY and WORKSPACE_PATH
npm run dev
# Visit http://localhost:5173
```

## Detailed Setup

### 1. Prerequisites

Ensure you have the following installed:

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Google Gemini API Key**: Get one at https://ai.google.dev/

Verify your installation:

```bash
node -v  # Should show v18.0.0 or higher
npm -v   # Should show v9.0.0 or higher
```

### 2. Install Dependencies

From the `apps/ai-ide-gemini` directory:

```bash
# Option 1: Install everything at once (recommended)
npm run install:all

# Option 2: Install manually
npm install               # Root dependencies (concurrently)
cd client && npm install  # Client dependencies
cd ../server && npm install # Server dependencies
```

This will install:
- **Root**: `concurrently` for running client + server together
- **Client**: React, Vite, Monaco Editor, xterm, Tailwind, Zustand, and more
- **Server**: Express, Gemini AI SDK, TypeScript, and more

### 3. Configure Environment Variables

Create a `.env` file in the `apps/ai-ide-gemini` directory:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Required: Your Google Gemini API Key
GEMINI_API_KEY=AIza...your-actual-key-here

# Required: Absolute path to the workspace you want to edit
WORKSPACE_PATH=/absolute/path/to/your/workspace

# Optional: Server port (default: 3001)
PORT=3001

# Optional: Environment (default: development)
NODE_ENV=development
```

**Important Notes:**
- `GEMINI_API_KEY`: Get your API key from https://ai.google.dev/
- `WORKSPACE_PATH`: Must be an absolute path (not relative)
- The workspace path should exist and be readable/writable
- Never commit the `.env` file to git (it's already in `.gitignore`)

### 4. Verify Setup

Run the verification script:

```bash
chmod +x test-setup.sh
./test-setup.sh
```

This will check:
- ✓ Node.js and npm versions
- ✓ Dependencies installation
- ✓ TypeScript compilation
- ✓ Environment configuration
- ✓ Build outputs (if built)

All checks should pass before proceeding.

### 5. Start Development

#### Option A: Start Both Client and Server (Recommended)

```bash
npm run dev
```

This starts:
- **Client**: http://localhost:5173 (Vite dev server with HMR)
- **Server**: http://localhost:3001 (Express API with hot reload)

You should see output like:

```
[0] > @ai-ide/client@0.1.0 dev
[0] > vite
[1] > @ai-ide/server@0.1.0 dev
[1] > tsx watch src/index.ts
[0] VITE v5.4.21  ready in 324 ms
[0] ➜  Local:   http://localhost:5173/
[1] ✅ Environment variables validated
[1] 🚀 Server running on http://localhost:3001
[1] 📁 Workspace: /your/workspace/path
[1] 🤖 Gemini API: Configured
```

#### Option B: Start Individually

Start client only:
```bash
npm run dev:client
# or
cd client && npm run dev
```

Start server only:
```bash
npm run dev:server
# or
cd server && npm run dev
```

### 6. Access the Application

Open your browser and navigate to:

```
http://localhost:5173
```

You should see the AI IDE interface with:
- **Left**: File browser sidebar
- **Center**: Monaco code editor and terminal
- **Right**: AI chat assistant

## Development Workflow

### Making Changes

- **Client code** (`client/src/*`): Changes hot-reload instantly
- **Server code** (`server/src/*`): Server restarts automatically via `tsx watch`
- **Styles**: Tailwind classes update immediately

### Type Checking

Check TypeScript types without building:

```bash
# Check both
npm run type-check

# Check client only
cd client && npm run type-check

# Check server only
cd server && npm run type-check
```

### Linting

Run ESLint:

```bash
# Lint client
cd client && npm run lint

# Lint server
cd server && npm run lint
```

### Building

Build for production:

```bash
# Build both
npm run build

# Build client only
npm run build:client

# Build server only
npm run build:server
```

Build outputs:
- Client: `client/dist/` (static files ready to serve)
- Server: `server/dist/` (compiled JavaScript)

## Running Production Build

After building:

```bash
npm start
```

This runs:
- Client: Vite preview server (serves `client/dist/`)
- Server: Node.js running compiled code (`server/dist/`)

For actual production deployment, you'd typically:
1. Build both client and server
2. Serve `client/dist/` with nginx/Apache
3. Run server with PM2 or similar process manager

## Troubleshooting

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3001`

**Solution**: Change the port in `.env`:
```env
PORT=3002
```

And update `client/vite.config.ts` proxy target to match.

### Environment Variables Not Loading

**Symptoms**: Server errors about missing GEMINI_API_KEY or WORKSPACE_PATH

**Solutions**:
1. Ensure `.env` file is in `apps/ai-ide-gemini/` directory
2. Check that variables don't have extra spaces or quotes
3. Restart the server after changing `.env`
4. Verify the file is not named `.env.txt` or similar

### Workspace Path Errors

**Error**: `Access denied: Path outside workspace`

**Solutions**:
1. Ensure `WORKSPACE_PATH` is an absolute path (starts with `/` on Unix)
2. Check that the path exists: `ls -la /your/workspace/path`
3. Verify read/write permissions
4. Don't use `~` or relative paths - use full absolute paths

### TypeScript Compilation Errors

Run type checking:
```bash
cd client && npm run type-check
cd ../server && npm run type-check
```

Common fixes:
- Ensure all dependencies are installed
- Delete `node_modules` and reinstall
- Check for syntax errors in your code

### Build Errors

Clean and rebuild:
```bash
npm run clean
npm run install:all
npm run build
```

### Server Won't Start

Check the logs for specific errors:

1. **Missing API Key**: Configure `GEMINI_API_KEY` in `.env`
2. **Invalid Workspace**: Verify `WORKSPACE_PATH` exists and is accessible
3. **Port Conflict**: Change `PORT` in `.env`

### Client Won't Connect to Server

1. Ensure server is running (check http://localhost:3001/api/health)
2. Check Vite proxy configuration in `client/vite.config.ts`
3. Look for CORS errors in browser console
4. Verify firewall isn't blocking connections

### API Errors

Check API key:
```bash
curl -H "Content-Type: application/json" \
     -d '{"message":"Hello"}' \
     http://localhost:3001/api/chat
```

If you get errors:
- Verify `GEMINI_API_KEY` is correct
- Check your API key hasn't expired or hit quota limits
- Ensure you have internet connectivity

## Common Commands Reference

```bash
# Setup
npm run install:all          # Install all dependencies
./test-setup.sh              # Verify setup

# Development
npm run dev                  # Start both client and server
npm run dev:client           # Start only client
npm run dev:server           # Start only server

# Type Checking
npm run type-check           # Check types (both)
cd client && npm run type-check
cd server && npm run type-check

# Building
npm run build                # Build both
npm run build:client         # Build client
npm run build:server         # Build server

# Production
npm start                    # Run production builds

# Maintenance
npm run clean                # Clean all builds and node_modules
```

## Project Structure Overview

```
apps/ai-ide-gemini/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── store/       # Zustand stores
│   │   ├── utils/       # Helper functions
│   │   └── types/       # TypeScript types
│   ├── dist/            # Build output (gitignored)
│   └── package.json
├── server/              # Express backend
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Express middleware
│   │   └── utils/       # Helper functions
│   ├── dist/            # Build output (gitignored)
│   └── package.json
├── .env                 # Environment config (gitignored)
├── .env.example         # Environment template
├── package.json         # Root package with scripts
└── README.md            # Full documentation
```

## Next Steps

After setup is complete:

1. **Explore the UI**: Open http://localhost:5173
2. **Browse Files**: Use the sidebar to navigate your workspace
3. **Edit Code**: Click a file to open it in the Monaco editor
4. **Chat with AI**: Use the chat panel to ask questions about your code
5. **Use Terminal**: Execute commands in the integrated terminal

For more detailed information:
- API documentation: See `README.md`
- Client architecture: See `client/src/`
- Server architecture: See `server/src/`

## Getting Help

If you encounter issues:

1. Run `./test-setup.sh` to verify your setup
2. Check the troubleshooting section above
3. Review the full `README.md` for detailed documentation
4. Check server logs for API errors
5. Check browser console for client errors

## Contributing

When making changes:
1. Follow existing code style
2. Add TypeScript types for new code
3. Test in both development and production builds
4. Update documentation if adding features
