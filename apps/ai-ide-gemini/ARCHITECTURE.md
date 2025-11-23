# AI IDE Gemini - Architecture Documentation

## Overview

AI IDE Gemini is a full-stack web-based IDE powered by Google's Gemini AI. It consists of two main parts:

1. **Client**: A modern React 18 + TypeScript SPA with Vite
2. **Server**: An Express + TypeScript API server with Gemini AI integration

## Technology Stack

### Client Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.5.2 | Type safety |
| Vite | 5.3.1 | Build tool and dev server |
| Tailwind CSS | 3.4.4 | Styling |
| Monaco Editor | 4.6.0 | Code editor (VS Code's editor) |
| xterm.js | 5.5.0 | Terminal emulator |
| Zustand | 4.5.2 | State management |
| Axios | 1.7.2 | HTTP client |
| React Router | 1.45.0 | Routing |

### Server Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Express | 4.19.2 | Web framework |
| TypeScript | 5.5.2 | Type safety |
| Google Generative AI | 0.17.1 | Gemini AI SDK |
| Zod | 3.23.8 | Runtime validation |
| dotenv | 16.4.5 | Environment config |
| ws | 8.17.1 | WebSocket support |
| cors | 2.8.5 | CORS middleware |
| morgan | 1.10.0 | HTTP logging |
| tsx | 4.15.7 | TypeScript execution with hot reload |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              React Client (Port 5173)                 │ │
│  │  ┌─────────────┐  ┌──────────┐  ┌─────────────────┐ │ │
│  │  │  Sidebar    │  │  Editor  │  │   Chat Panel    │ │ │
│  │  │ (Files)     │  │ (Monaco) │  │   (AI Chat)     │ │ │
│  │  └─────────────┘  └──────────┘  └─────────────────┘ │ │
│  │         │                              │             │ │
│  │  ┌──────▼──────────────────────────────▼──────────┐ │ │
│  │  │           Zustand State Stores                  │ │ │
│  │  │  • editorStore • fileStore • chatStore         │ │ │
│  │  └─────────────────────┬───────────────────────────┘ │ │
│  │                        │                             │ │
│  │  ┌─────────────────────▼───────────────────────────┐ │ │
│  │  │              Axios API Client                    │ │ │
│  │  └─────────────────────┬───────────────────────────┘ │ │
│  └────────────────────────┼─────────────────────────────┘ │
└─────────────────────────┬─┼─────────────────────────────────┘
                          │ │
                  ┌───────▼─▼────────┐
                  │ Vite Proxy       │
                  │ /api → :3001     │
                  └───────┬──────────┘
                          │
        ┌─────────────────▼─────────────────┐
        │  Express Server (Port 3001)       │
        │  ┌─────────────────────────────┐  │
        │  │     Middleware Stack        │  │
        │  │  • CORS • Morgan • JSON     │  │
        │  └──────────┬──────────────────┘  │
        │             │                      │
        │  ┌──────────▼──────────────────┐  │
        │  │      API Routes             │  │
        │  │  • /api/health              │  │
        │  │  • /api/files/*             │  │
        │  │  • /api/chat                │  │
        │  └──────────┬──────────────────┘  │
        │             │                      │
        │  ┌──────────▼──────────────────┐  │
        │  │      Services Layer         │  │
        │  │  ┌──────────────────────┐   │  │
        │  │  │  FileService         │   │  │
        │  │  │  • listFiles()       │   │  │
        │  │  │  • readFile()        │   │  │
        │  │  │  • writeFile()       │   │  │
        │  │  └──────────────────────┘   │  │
        │  │  ┌──────────────────────┐   │  │
        │  │  │  GeminiService       │   │  │
        │  │  │  • chat()            │   │  │
        │  │  │  • clearHistory()    │   │  │
        │  │  └──────────┬───────────┘   │  │
        │  └─────────────┼───────────────┘  │
        └────────────────┼───────────────────┘
                         │
                ┌────────▼─────────┐
                │  Google Gemini   │
                │      API         │
                └──────────────────┘
```

## Client Architecture

### Component Structure

```
src/
├── components/
│   ├── Editor.tsx       - Monaco editor wrapper
│   ├── Terminal.tsx     - xterm.js terminal
│   ├── Chat.tsx         - AI chat interface
│   └── Sidebar.tsx      - File browser
├── store/
│   ├── editorStore.ts   - Editor state (Zustand)
│   ├── fileStore.ts     - File management state
│   └── chatStore.ts     - Chat state and API calls
├── utils/
│   └── api.ts           - Axios instance with interceptors
├── types/
│   └── index.ts         - TypeScript type definitions
├── App.tsx              - Main app component
├── main.tsx             - React entry point
└── index.css            - Tailwind imports + global styles
```

### State Management

Uses Zustand for simple, type-safe state management:

1. **editorStore**: Current file, content, open/save operations
2. **fileStore**: Workspace file list, fetch operations
3. **chatStore**: Message history, send/receive operations

### Data Flow

```
User Action → Component → Zustand Store → API Call → Server
                  ↑                           ↓
                  └──────── Update State ─────┘
```

## Server Architecture

### Directory Structure

```
src/
├── routes/
│   ├── files.ts         - File operation endpoints
│   └── chat.ts          - AI chat endpoints
├── services/
│   ├── fileService.ts   - File system operations
│   └── geminiService.ts - Gemini AI integration
├── middleware/
│   └── errorHandler.ts  - Global error handling
├── utils/
│   └── env.ts           - Environment validation (Zod)
├── types/
│   └── index.ts         - TypeScript types
└── index.ts             - Express app setup
```

### Request Flow

```
HTTP Request
    ↓
CORS Middleware
    ↓
Morgan Logger
    ↓
JSON Body Parser
    ↓
Route Handler
    ↓
Service Layer
    ↓
External API / File System
    ↓
Response / Error Handler
```

### API Endpoints

#### Health Check
- `GET /api/health` - Server status and timestamp

#### File Operations
- `GET /api/files/list` - List workspace files
  - Returns: `{ files: FileItem[] }`
- `GET /api/files?path=<path>` - Read file content
  - Returns: `{ path: string, content: string }`
- `POST /api/files` - Write file content
  - Body: `{ path: string, content: string }`
  - Returns: `{ success: true, path: string }`

#### Chat
- `POST /api/chat` - Send message to AI
  - Body: `{ message: string }`
  - Returns: `{ reply: string }`
- `DELETE /api/chat/history` - Clear chat history
  - Returns: `{ success: true }`

### Security Features

1. **Path Validation**: FileService prevents directory traversal
2. **CORS**: Configured for development (can be restricted for production)
3. **Environment Validation**: Zod schema validates required env vars at startup
4. **Error Handling**: Global error handler prevents leak of internal details

## Development Workflow

### Hot Reload

Both client and server support hot reload:

- **Client**: Vite HMR (Hot Module Replacement)
  - Changes to React components, styles, etc. update instantly
  - Preserves component state where possible
  
- **Server**: tsx watch mode
  - Automatically restarts server on file changes
  - Quick restart (usually < 1 second)

### Development Mode

```bash
npm run dev
```

This runs:
```bash
concurrently "npm run dev:client" "npm run dev:server"
```

Which starts:
1. Vite dev server on port 5173
2. Express server on port 3001
3. Vite proxies `/api/*` requests to port 3001

### Type Safety

Full TypeScript coverage:
- Client: Strict mode enabled
- Server: Strict mode enabled
- Shared types can be extracted to a common package if needed

### Build Process

#### Client Build
```bash
cd client && npm run build
```
1. TypeScript compilation (type checking)
2. Vite build (bundling, minification, tree-shaking)
3. Output: `client/dist/` (static files)

#### Server Build
```bash
cd server && npm run build
```
1. TypeScript compilation to JavaScript
2. Source maps generated
3. Output: `server/dist/` (compiled JS + declaration files)

## Configuration Files

### Client

- `vite.config.ts` - Vite configuration (proxy, build options)
- `tsconfig.json` - TypeScript for src/ files
- `tsconfig.node.json` - TypeScript for Vite config
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS with Tailwind plugin
- `.eslintrc.cjs` - ESLint rules

### Server

- `tsconfig.json` - TypeScript configuration
- `.eslintrc.cjs` - ESLint rules

### Root

- `package.json` - Scripts for dev/build/start
- `.env` - Environment variables (not committed)
- `.env.example` - Environment template

## Environment Variables

Required:
- `GEMINI_API_KEY` - Google Gemini API key
- `WORKSPACE_PATH` - Absolute path to workspace directory

Optional:
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production/test)

## Deployment Considerations

### Client Deployment

The client is a static SPA that can be deployed to:
- Netlify, Vercel, GitHub Pages
- S3 + CloudFront
- Any static file server (nginx, Apache)

Steps:
1. Build: `npm run build:client`
2. Serve `client/dist/` directory
3. Configure server URL (update API base URL if not proxied)

### Server Deployment

The server is a Node.js Express app that can be deployed to:
- Heroku, Railway, Render
- AWS EC2, Google Cloud Run
- Docker container

Steps:
1. Build: `npm run build:server`
2. Run: `node server/dist/index.js`
3. Set environment variables
4. Use process manager (PM2, systemd)

### Full Stack Deployment

For full-stack on single server:
1. Build both client and server
2. Serve client static files from server (add Express static middleware)
3. Run server on production port
4. Use reverse proxy (nginx) if needed

Example nginx config:
```nginx
server {
    listen 80;
    
    # Serve client static files
    location / {
        root /path/to/client/dist;
        try_files $uri /index.html;
    }
    
    # Proxy API requests to Express
    location /api/ {
        proxy_pass http://localhost:3001;
    }
}
```

## Future Enhancements

### Planned Features

1. **WebSocket Integration**
   - Real-time terminal over WebSocket
   - Live file watching and updates
   - Collaborative editing support

2. **Authentication**
   - User accounts and workspaces
   - JWT-based authentication
   - Workspace permissions

3. **Advanced Editor Features**
   - Multi-tab support
   - Split view
   - Diff viewer
   - Code completion via AI

4. **Git Integration**
   - Clone repositories
   - Commit and push changes
   - Branch management
   - Visual diff

5. **Plugin System**
   - Custom tools and extensions
   - Language server protocol support
   - Custom themes

6. **AI Enhancements**
   - Code generation
   - Refactoring suggestions
   - Automated testing
   - Documentation generation

### Scalability Considerations

For production scale:
- Add Redis for session storage
- Implement rate limiting
- Add request queuing for AI calls
- Use WebSocket for real-time features
- Implement proper logging (Winston, Pino)
- Add monitoring (Prometheus, Datadog)
- Implement health checks and readiness probes

## Testing Strategy

### Unit Tests (Future)

Client:
- Component tests with React Testing Library
- Store tests (Zustand)
- Utility function tests

Server:
- Route handler tests (supertest)
- Service tests (mock Gemini API)
- Middleware tests

### Integration Tests (Future)

- Full API flow tests
- File operations end-to-end
- Chat integration tests

### E2E Tests (Future)

- Playwright or Cypress
- Full user workflows
- Cross-browser testing

## Performance Optimization

### Client

- Code splitting (React.lazy)
- Monaco editor lazy loading
- Virtual scrolling for large file lists
- Debounced file saves

### Server

- Response caching
- Stream large files
- Connection pooling
- Rate limiting

## Monitoring and Debugging

### Development

- Browser DevTools for client debugging
- Morgan logs HTTP requests
- tsx provides TypeScript stack traces
- Source maps for both client and server

### Production (Recommended)

- Structured logging (Winston)
- Error tracking (Sentry)
- Performance monitoring (New Relic)
- Uptime monitoring (Pingdom)

## Contributing Guidelines

When extending the application:

1. Follow existing code structure
2. Maintain TypeScript strict mode
3. Add types for all new code
4. Update documentation
5. Test in both dev and production builds
6. Follow existing naming conventions
7. Keep components small and focused
8. Use Zustand for state, not prop drilling

## Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Express Documentation](https://expressjs.com/)
- [Gemini AI Documentation](https://ai.google.dev/)
- [Monaco Editor Documentation](https://microsoft.github.io/monaco-editor/)
- [xterm.js Documentation](https://xtermjs.org/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
