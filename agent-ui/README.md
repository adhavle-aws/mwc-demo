# Agent UI

A Palantir-grade user interface for the MWC Multi-Agent Infrastructure Provisioning System. This application provides an intuitive interface for interacting with multiple AI agents (OnboardingAgent, ProvisioningAgent, MWCAgent) and visualizing their outputs in a structured, professional manner.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Salesforce Migration](#salesforce-migration)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Multi-Agent Interface**: Interact with three specialized AI agents through a unified interface
- **Real-Time Streaming**: See agent responses stream in real-time with incremental updates
- **Tabbed Response Organization**: Agent responses automatically organized into logical tabs (Architecture, Cost Optimization, Templates, Progress, etc.)
- **CloudFormation Template Display**: Syntax-highlighted YAML/JSON templates with copy and download functionality
- **Deployment Progress Tracking**: Real-time visualization of CloudFormation stack deployments with resource status
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark Theme**: Modern, professional Palantir-inspired dark theme
- **Keyboard Shortcuts**: Power user features for efficient navigation
- **Session Persistence**: Conversation history preserved across browser sessions
- **Salesforce-Ready**: Component-based architecture designed for easy migration to Lightning Web Components

## Tech Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite 5+
- **Styling**: Tailwind CSS 3+
- **Code Highlighting**: Prism.js
- **Markdown Rendering**: react-markdown
- **State Management**: React Context API + Hooks
- **HTTP Client**: Fetch API with streaming support
- **Linting**: ESLint
- **Formatting**: Prettier
- **Testing**: Vitest + React Testing Library

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or 20.x (LTS recommended)
- **npm**: Version 9.x or higher (comes with Node.js)
- **Backend API**: The Agent UI requires the backend API to be running (see [Backend Setup](#backend-setup))
- **AWS Credentials**: Required for the backend API to communicate with AWS Bedrock AgentCore

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd agent-ui
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create a `.env` file in the `agent-ui` directory:

```bash
cp .env.example .env
```

Edit `.env` and configure the API endpoint:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 5. Backend Setup

The frontend requires the backend API to be running. In a separate terminal:

```bash
cd ../api
npm install
cp .env.example .env
# Edit .env with your AWS agent ARNs
npm run dev
```

See the [Backend API README](../api/README.md) for detailed backend setup instructions.

## Configuration

### Environment Variables

The application uses environment variables for configuration. All variables must be prefixed with `VITE_` to be accessible in the browser.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | No | `/api` | Base URL for the backend API |

**Development Example** (`.env.development`):
```env
VITE_API_BASE_URL=http://localhost:3001
```

**Production Example** (`.env.production`):
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Vite Configuration

The Vite configuration is in `vite.config.ts`. Key settings:

- **Port**: Development server runs on port 5173
- **Proxy**: Can be configured for API proxying
- **Build Output**: Outputs to `dist/` directory
- **Base Path**: Can be configured for subdirectory deployments

## Development

### Start Development Server

```bash
npm run dev
```

Features:
- Hot Module Replacement (HMR) for instant updates
- Fast refresh for React components
- TypeScript type checking
- Automatic browser opening

### Code Quality

**Linting**:
```bash
npm run lint          # Check for linting errors
npm run lint:fix      # Auto-fix linting errors
```

**Formatting**:
```bash
npm run format        # Format all files
npm run format:check  # Check formatting without changes
```

**Type Checking**:
```bash
npx tsc --noEmit      # Check TypeScript types
```

### Development Workflow

1. **Create Feature Branch**: `git checkout -b feature/your-feature`
2. **Make Changes**: Edit files in `src/`
3. **Test Locally**: Verify in browser at `http://localhost:5173`
4. **Lint & Format**: Run `npm run lint:fix && npm run format`
5. **Commit Changes**: `git commit -m "Description"`
6. **Push & Create PR**: `git push origin feature/your-feature`

## Building for Production

### Build the Application

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory:
- Minified JavaScript and CSS
- Tree-shaken dependencies
- Optimized assets
- Source maps for debugging

### Preview Production Build

```bash
npm run preview
```

Serves the production build locally at `http://localhost:4173` for testing.

### Build Output

```
dist/
├── assets/
│   ├── index-[hash].js      # Main JavaScript bundle
│   ├── index-[hash].css     # Main CSS bundle
│   └── [other-assets]       # Images, fonts, etc.
├── index.html               # Entry HTML file
└── vite.svg                 # Favicon
```

## Testing

### Run Tests

```bash
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Run tests with coverage report
```

### Test Structure

```
src/
├── components/
│   ├── Component.tsx
│   └── Component.test.tsx    # Component tests
├── services/
│   ├── service.ts
│   └── service.test.ts       # Service tests
└── utils/
    ├── util.ts
    └── util.test.ts          # Utility tests
```

### Writing Tests

Example component test:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Deployment

The Agent UI can be deployed to various platforms. Below are instructions for the recommended deployment target (AWS Amplify) and alternatives.

### Backend Integration (Required First)

Before deploying the frontend, you must connect it to the deployed backend API.

**📖 See [BACKEND-INTEGRATION.md](./BACKEND-INTEGRATION.md) for comprehensive integration instructions.**

**Quick Integration**:

```bash
# 1. Deploy backend API (if not already deployed)
cd ../api
./deploy.sh

# 2. Configure frontend with API URL
cd ../agent-ui
./configure-api.sh

# 3. Test the integration
./test-api-connection.sh

# 4. Build for production
npm run build:prod
```

### AWS Amplify Hosting (Recommended)

AWS Amplify provides automatic CI/CD, global CDN, and easy integration with AWS services.

**📖 See [AMPLIFY-DEPLOYMENT.md](./AMPLIFY-DEPLOYMENT.md) for comprehensive Amplify deployment instructions.**

**📖 See [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) for all deployment platform options.**

Quick overview:

1. **Deploy Backend**: Deploy the backend API first (see above)
2. **Configure API URL**: Run `./configure-api.sh` to set production API URL
3. **Test Integration**: Run `./test-api-connection.sh` to verify connectivity
4. **Connect Repository**: Link your Git repository to AWS Amplify
5. **Configure Build**: Amplify auto-detects `amplify.yml` configuration
6. **Set Environment Variables**: Configure `VITE_API_BASE_URL` in Amplify Console
7. **Deploy**: Automatic deployment on every commit
8. **Custom Domain** (optional): Configure custom domain with automatic SSL

**Key Files**:
- `amplify.yml` - Build configuration for AWS Amplify
- `.env.production` - Production environment configuration
- `configure-api.sh` - Script to configure API URL
- `test-api-connection.sh` - Script to test API integration

### Alternative Deployment Options

- **Vercel**: Zero-config deployment for Vite apps
- **Netlify**: Simple drag-and-drop or Git-based deployment
- **AWS S3 + CloudFront**: Manual deployment with full control
- **Docker**: Containerized deployment for any platform

See [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) for detailed instructions for each platform.

## Project Structure

```
agent-ui/
├── .kiro/
│   └── specs/
│       └── agent-ui/          # Specification documents
│           ├── requirements.md
│           ├── design.md
│           └── tasks.md
├── public/                    # Static assets
│   └── vite.svg
├── src/
│   ├── components/            # React components
│   │   ├── AgentStatusIndicator.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChatWindow.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── MainContent.tsx
│   │   ├── MarkdownRenderer.tsx
│   │   ├── Message.tsx
│   │   ├── ProgressTab.tsx
│   │   ├── ResponseViewer.tsx
│   │   ├── SideNavigation.tsx
│   │   ├── TabBar.tsx
│   │   ├── TemplateTab.tsx
│   │   └── [other tabs]
│   ├── context/               # React Context for state management
│   │   ├── AppContext.tsx
│   │   ├── appReducer.ts
│   │   ├── hooks.ts
│   │   └── statePersistence.ts
│   ├── services/              # API and business logic
│   │   ├── agentService.ts
│   │   ├── deploymentPollingService.ts
│   │   └── storageService.ts
│   ├── types/                 # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/                 # Utility functions
│   │   ├── errorLogger.ts
│   │   ├── markdownRenderer.ts
│   │   └── responseParser.ts
│   ├── App.tsx                # Main application component
│   ├── main.tsx               # Application entry point
│   ├── index.css              # Global styles with Tailwind
│   └── test-setup.ts          # Test configuration
├── .env.example               # Environment variable template
├── .eslintrc.cjs              # ESLint configuration
├── .prettierrc                # Prettier configuration
├── index.html                 # HTML template
├── package.json               # Dependencies and scripts
├── postcss.config.js          # PostCSS configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
├── DEPLOYMENT-GUIDE.md        # Detailed deployment instructions
├── ENVIRONMENT-VARIABLES.md   # Environment variable documentation
└── README.md                  # This file
```

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    React Application                        │ │
│  │  ┌──────────────┐  ┌──────────────────────────────────┐   │ │
│  │  │ Side Nav     │  │  Main Content Area               │   │ │
│  │  │              │  │  ┌────────────────────────────┐  │   │ │
│  │  │ • Onboarding │  │  │  Chat Window               │  │   │ │
│  │  │ • Provisioning│  │  │  • Message History         │  │   │ │
│  │  │ • MWC        │  │  │  • Input Field             │  │   │ │
│  │  │              │  │  └────────────────────────────┘  │   │ │
│  │  │              │  │  ┌────────────────────────────┐  │   │ │
│  │  │              │  │  │  Tabbed Response View      │  │   │ │
│  │  │              │  │  │  • Architecture            │  │   │ │
│  │  │              │  │  │  • Cost Optimization       │  │   │ │
│  │  │              │  │  │  • CFN Template            │  │   │ │
│  │  │              │  │  │  • Progress/Resources      │  │   │ │
│  │  └──────────────┘  │  └────────────────────────────┘  │   │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTP/SSE
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API Layer                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Agent Communication Service                    │ │
│  │  • Routes requests to appropriate agents                   │ │
│  │  • Handles streaming responses                             │ │
│  │  • Manages session state                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────────┘
                           │ AWS SDK
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  AWS Bedrock AgentCore                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Onboarding   │  │ Provisioning │  │   MWCAgent   │          │
│  │    Agent     │  │    Agent     │  │ (Orchestrator)│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Component Architecture

The application follows a component-based architecture with clear separation of concerns:

- **Presentation Components**: Pure UI components (Message, TabBar, LoadingSpinner)
- **Container Components**: Components with business logic (ChatWindow, ResponseViewer)
- **Context Providers**: Global state management (AppContext)
- **Services**: API communication and business logic (agentService, storageService)
- **Utils**: Pure utility functions (responseParser, errorLogger)

### State Management

- **React Context**: Global application state (selected agent, conversations)
- **Local State**: Component-specific state (input values, UI toggles)
- **localStorage**: Persistent state across sessions (conversation history)

### Data Flow

1. User interacts with UI component
2. Component dispatches action to Context
3. Context updates state via reducer
4. Service layer makes API calls
5. Response updates Context state
6. Components re-render with new state

## Salesforce Migration

The Agent UI is designed with Salesforce deployment in mind, using web standards and component patterns compatible with Lightning Web Components (LWC).

**See [SALESFORCE-MIGRATION-GUIDE.md](./SALESFORCE-MIGRATION-GUIDE.md) for comprehensive migration documentation.**

Key migration features:

- **Component-Based Architecture**: Each React component maps to a potential LWC
- **SLDS-Compatible Styling**: Tailwind classes documented with SLDS equivalents
- **Service Layer Abstraction**: API calls abstracted for easy Apex integration
- **Web Standards**: Uses standard web APIs compatible with Salesforce
- **Migration Guide**: Step-by-step instructions for converting to LWC

## Troubleshooting

### Common Issues

#### Port Already in Use

**Error**: `Port 5173 is already in use`

**Solution**:
```bash
# Kill process using port 5173
lsof -ti:5173 | xargs kill
# Or use a different port
npm run dev -- --port 3000
```

#### API Connection Errors

**Error**: `Failed to fetch` or `Network error`

**Solutions**:
1. Verify backend API is running: `curl http://localhost:3001/health`
2. Check `VITE_API_BASE_URL` in `.env` matches backend URL
3. Verify CORS configuration in backend API
4. Check browser console for detailed error messages

#### Build Errors

**Error**: `TypeScript errors` or `Module not found`

**Solutions**:
1. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
2. Clear Vite cache: `rm -rf node_modules/.vite`
3. Check TypeScript configuration: `npx tsc --noEmit`
4. Verify all imports use correct paths

#### Styling Issues

**Error**: Tailwind classes not applying

**Solutions**:
1. Verify Tailwind is configured in `tailwind.config.js`
2. Check `index.css` imports Tailwind directives
3. Clear browser cache and hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
4. Rebuild: `npm run build`

#### Environment Variables Not Loading

**Error**: `undefined` when accessing `import.meta.env.VITE_*`

**Solutions**:
1. Ensure variable is prefixed with `VITE_`
2. Restart development server after changing `.env`
3. Check `.env` file is in the correct directory (`agent-ui/`)
4. Verify no syntax errors in `.env` file

### Debug Mode

Enable verbose logging:

```typescript
// In src/main.tsx, add:
if (import.meta.env.DEV) {
  console.log('Environment:', import.meta.env);
  console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
}
```

### Getting Help

1. **Check Documentation**: Review this README and linked guides
2. **Search Issues**: Check existing GitHub issues
3. **Create Issue**: Open a new issue with:
   - Description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, browser)
   - Error messages and logs

## Contributing

We welcome contributions! Please follow these guidelines:

### Development Process

1. **Fork the Repository**: Create your own fork
2. **Create Feature Branch**: `git checkout -b feature/your-feature`
3. **Follow Code Style**: Run linting and formatting
4. **Write Tests**: Add tests for new functionality
5. **Update Documentation**: Update README and comments
6. **Submit Pull Request**: Describe your changes

### Code Style

- **TypeScript**: Use strict typing, avoid `any`
- **Components**: Functional components with hooks
- **Naming**: PascalCase for components, camelCase for functions
- **Files**: One component per file, co-locate tests
- **Imports**: Group and sort imports (React, libraries, local)

### Commit Messages

Follow conventional commits format:

```
feat: Add new feature
fix: Fix bug in component
docs: Update README
style: Format code
refactor: Refactor service layer
test: Add tests for utility
chore: Update dependencies
```

## License

MIT License - see LICENSE file for details

---

**Project**: MWC Multi-Agent Infrastructure Provisioning System  
**Component**: Agent UI  
**Version**: 1.0.0  
**Last Updated**: January 2026  
**Maintained By**: Agent UI Development Team
