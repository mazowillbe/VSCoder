#!/bin/bash

echo "================================================"
echo "AI IDE Gemini - Setup Verification Script"
echo "================================================"
echo ""

# Check Node.js version
echo "✓ Checking Node.js version..."
node_version=$(node -v)
echo "  Node.js: $node_version"

# Check npm version
npm_version=$(npm -v)
echo "  npm: $npm_version"
echo ""

# Check if dependencies are installed
echo "✓ Checking dependencies..."

if [ -d "node_modules" ]; then
  echo "  Root dependencies: ✓ installed"
else
  echo "  Root dependencies: ✗ missing - run 'npm install'"
fi

if [ -d "client/node_modules" ]; then
  echo "  Client dependencies: ✓ installed"
else
  echo "  Client dependencies: ✗ missing - run 'cd client && npm install'"
fi

if [ -d "server/node_modules" ]; then
  echo "  Server dependencies: ✓ installed"
else
  echo "  Server dependencies: ✗ missing - run 'cd server && npm install'"
fi
echo ""

# Check TypeScript compilation
echo "✓ Checking TypeScript compilation..."

cd client
if npm run type-check > /dev/null 2>&1; then
  echo "  Client TypeScript: ✓ compiles without errors"
else
  echo "  Client TypeScript: ✗ has errors"
fi
cd ..

cd server
if npm run type-check > /dev/null 2>&1; then
  echo "  Server TypeScript: ✓ compiles without errors"
else
  echo "  Server TypeScript: ✗ has errors"
fi
cd ..
echo ""

# Check environment configuration
echo "✓ Checking environment configuration..."

if [ -f ".env" ]; then
  echo "  .env file: ✓ exists"
  
  if grep -q "GEMINI_API_KEY=" .env && ! grep -q "GEMINI_API_KEY=your-gemini-api-key-here" .env; then
    echo "  GEMINI_API_KEY: ✓ configured"
  else
    echo "  GEMINI_API_KEY: ✗ not configured (edit .env file)"
  fi
  
  if grep -q "WORKSPACE_PATH=" .env && ! grep -q "WORKSPACE_PATH=/path/to/your/workspace" .env; then
    echo "  WORKSPACE_PATH: ✓ configured"
  else
    echo "  WORKSPACE_PATH: ✗ not configured (edit .env file)"
  fi
else
  echo "  .env file: ✗ missing - copy from .env.example"
fi
echo ""

# Check build outputs
echo "✓ Checking build outputs..."

if [ -d "client/dist" ]; then
  echo "  Client build: ✓ exists (built)"
else
  echo "  Client build: - not built yet (run 'npm run build:client')"
fi

if [ -d "server/dist" ]; then
  echo "  Server build: ✓ exists (built)"
else
  echo "  Server build: - not built yet (run 'npm run build:server')"
fi
echo ""

echo "================================================"
echo "Setup verification complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. If dependencies are missing, run: npm run install:all"
echo "2. Copy .env.example to .env and configure your API key"
echo "3. Start development: npm run dev"
echo "4. Visit: http://localhost:5173"
echo ""
