# AI IDE - Gemini

A full-stack web-based IDE powered by Google Gemini AI, featuring a React client with Monaco editor and xterm terminal, and an Express/TypeScript server with AI-powered assistance.

## Features

- 🎨 **Modern React UI**: Built with React 18, TypeScript, and Tailwind CSS
- 📝 **Monaco Editor**: Full-featured code editor with syntax highlighting
- 💻 **Integrated Terminal**: xterm.js terminal for command execution
- 🤖 **AI Assistant**: Gemini-powered chat for code assistance
- 📁 **File Management**: Browse, open, edit, and save files
- 🔄 **Hot Reload**: Vite + tsx watch for instant development feedback

## Tech Stack

### Client
- **Framework**: React 18 with TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS with PostCSS
- **State Management**: Zustand
- **Editor**: Monaco Editor (VS Code editor)
- **Terminal**: xterm.js
- **HTTP Client**: Axios

### Server
- **Runtime**: Node.js with TypeScript
- **Framework**: Express
- **AI**: Google Generative AI SDK
- **Validation**: Zod
- **WebSocket**: ws for real-time communication
- **Development**: tsx for hot reload

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Google Gemini API key ([Get one here](https://ai.google.dev/))

## Installation

### 1. Clone and Navigate

```bash
cd apps/ai-ide-gemini
```

### 2. Install Dependencies

Install all dependencies for root, client, and server:

```bash
npm run install:all
```

Or manually:

```bash
# Install root dependencies (concurrently)
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `apps/ai-ide-gemini` directory:

```bash
cp .env.example .env
```

Edit the `.env` file and configure:

```env
# Your Google Gemini API Key
GEMINI_API_KEY=your-actual-api-key-here

# Path to the workspace you want to edit
WORKSPACE_PATH=/path/to/your/workspace

# Server port (default: 3001)
PORT=3001

# Environment
NODE_ENV=development
```

**Important**: 
- Replace `your-actual-api-key-here` with your actual Gemini API key
- Set `WORKSPACE_PATH` to an absolute path of the directory you want to edit
- Make sure the workspace path exists and is readable/writable

## Development

### Start Both Client and Server

Run the entire application with hot reload:

```bash
npm run dev
```

This will start:
- **Client**: http://localhost:5173 (Vite dev server)
- **Server**: http://localhost:3001 (Express API)

### Start Individually

Run client only:
```bash
npm run dev:client
```

Run server only:
```bash
npm run dev:server
```

### Development Workflow

1. Open http://localhost:5173 in your browser
2. The client will proxy API requests to the server
3. Edit code and see changes instantly with hot reload
4. Check terminal for TypeScript errors and logs

## Building for Production

### Build Everything

```bash
npm run build
```

This builds both client and server:
- Client output: `client/dist/`
- Server output: `server/dist/`

### Build Individually

```bash
# Build client only
npm run build:client

# Build server only
npm run build:server
```

## Running Production Build

After building:

```bash
npm start
```

This will:
- Serve the client build with Vite preview (port 5173)
- Run the compiled server (port 3001)

## Project Structure

```
apps/ai-ide-gemini/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Editor.tsx     # Monaco editor component
│   │   │   ├── Terminal.tsx   # xterm terminal component
│   │   │   ├── Chat.tsx       # AI chat interface
│   │   │   └── Sidebar.tsx    # File browser
│   │   ├── store/             # Zustand state management
│   │   │   ├── editorStore.ts # Editor state
│   │   │   ├── fileStore.ts   # File management state
│   │   │   └── chatStore.ts   # Chat state
│   │   ├── utils/             # Utilities
│   │   │   └── api.ts         # Axios API client
│   │   ├── types/             # TypeScript types
│   │   ├── App.tsx            # Main app component
│   │   ├── main.tsx           # App entry point
│   │   └── index.css          # Global styles
│   ├── public/                # Static assets
│   ├── index.html             # HTML template
│   ├── vite.config.ts         # Vite configuration
│   ├── tailwind.config.js     # Tailwind configuration
│   ├── postcss.config.js      # PostCSS configuration
│   ├── tsconfig.json          # TypeScript config
│   └── package.json           # Client dependencies
├── server/                     # Express backend
│   ├── src/
│   │   ├── routes/            # API routes
│   │   │   ├── files.ts       # File operations
│   │   │   └── chat.ts        # AI chat endpoints
│   │   ├── services/          # Business logic
│   │   │   ├── fileService.ts # File system operations
│   │   │   └── geminiService.ts # Gemini AI integration
│   │   ├── middleware/        # Express middleware
│   │   │   └── errorHandler.ts
│   │   ├── utils/             # Utilities
│   │   │   └── env.ts         # Environment validation
│   │   ├── types/             # TypeScript types
│   │   └── index.ts           # Server entry point
│   ├── tsconfig.json          # TypeScript config
│   └── package.json           # Server dependencies
├── .env.example               # Environment template
├── package.json               # Root package (scripts)
└── README.md                  # This file
```

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### File Operations
- `GET /api/files/list` - List workspace files
- `GET /api/files?path=<path>` - Read file content
- `POST /api/files` - Write file content
  ```json
  {
    "path": "relative/path/to/file.ts",
    "content": "file content"
  }
  ```

### Chat
- `POST /api/chat` - Send message to AI
  ```json
  {
    "message": "Your question or request"
  }
  ```
- `DELETE /api/chat/history` - Clear chat history

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both client and server in development mode |
| `npm run dev:client` | Start only the Vite dev server |
| `npm run dev:server` | Start only the Express server with watch mode |
| `npm run build` | Build both client and server for production |
| `npm run build:client` | Build only the client |
| `npm run build:server` | Build only the server |
| `npm run start` | Run production builds |
| `npm run install:all` | Install all dependencies (root, client, server) |
| `npm run clean` | Remove all node_modules and build artifacts |

## Troubleshooting

### Port Already in Use

If port 3001 or 5173 is already in use:

1. Change the port in `.env`:
   ```env
   PORT=3002
   ```

2. Update the proxy in `client/vite.config.ts`:
   ```ts
   proxy: {
     '/api': {
       target: 'http://localhost:3002',
       // ...
     }
   }
   ```

### Environment Variables Not Loading

Make sure:
1. `.env` file is in `apps/ai-ide-gemini/` directory
2. Variable names are correct (no typos)
3. Server is restarted after changing `.env`

### Workspace Path Issues

Ensure:
1. `WORKSPACE_PATH` is an absolute path
2. Path exists and is readable/writable
3. No trailing slash in the path

### TypeScript Errors

Run type checking:
```bash
# Check client
cd client && npm run type-check

# Check server
cd server && npm run type-check
```

### Build Errors

Clean and reinstall:
```bash
npm run clean
npm run install:all
npm run build
```

## Development Tips

1. **Hot Reload**: Both client and server support hot reload during development
2. **Type Safety**: Use TypeScript for full type safety across the stack
3. **API Proxy**: Vite proxies `/api` requests to the Express server
4. **State Management**: Zustand stores are in `client/src/store/`
5. **Styling**: Use Tailwind utility classes for styling

## Security Notes

- The file service restricts access to paths outside the workspace
- Never commit `.env` files with real API keys
- Use environment variables for all sensitive data
- Validate all user inputs on the server side

## Future Enhancements

- [ ] WebSocket support for real-time terminal
- [ ] Multi-tab editor support
- [ ] Git integration
- [ ] Collaborative editing
- [ ] Plugin system
- [ ] File search and replace
- [ ] Debugging support

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new code
3. Test changes in both development and production builds
4. Update documentation for new features

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- Check this README first
- Review the main project README at the root
- Check server logs for API errors
- Check browser console for client errors
