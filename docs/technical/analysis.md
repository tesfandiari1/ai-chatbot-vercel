# AI Chatbot Technical Analysis

## Current Tech Stack Overview

This AI Chatbot is built on a modern JavaScript/TypeScript stack centered around Next.js and the Vercel AI SDK. The primary technologies include:

- **Next.js**: App Router architecture for routing and server-side rendering (using canary version 15.3.0)
- **React**: Server Components (RSCs) for optimized rendering and improved performance (using RC version)
- **TypeScript**: Type safety throughout the codebase
- **Vercel AI SDK**: Core integration layer for AI models with unified API for text generation and tool calls
- **Multiple LLM Providers**: OpenAI (default, using GPT-4o), Groq, xAI, with support for additional providers
- **PostgreSQL/Drizzle ORM**: Data persistence layer via Vercel Postgres (Neon) for storing chats, messages, and user data
- **Vercel Blob Storage**: File storage for artifacts and attachments
- **NextAuth.js**: Authentication framework for user management (version 5 beta)
- **shadcn/ui/Radix UI**: Component library and primitives for accessible UI elements
- **Tailwind CSS**: Utility-first styling approach
- **CodeMirror**: Code editor integration for code-related features
- **Playwright**: End-to-end testing framework
- **Model Context Protocol (MCP)**: Standardized context provider for LLMs
- **Storybook**: UI component development and testing

The architecture leverages modern web development patterns with a focus on server-side rendering, AI integration, and a responsive user interface.

## Directory Structure

```
├── app/                       # Next.js App Router pages and layouts
│   ├── (auth)/                # Authentication routes
│   ├── (chat)/                # Chat interface routes
│   └── layout.tsx             # Root layout component
├── components/                # React components
│   ├── ui/                    # Base UI components (shadcn/ui)
│   ├── chat.tsx               # Main chat component
│   ├── message.tsx            # Message rendering
│   └── artifact.tsx           # Artifact handling
├── lib/                       # Core functionality
│   ├── ai/                    # AI integration
│   │   ├── tools/             # Tool definitions for function calling
│   │   ├── models.ts          # AI model definitions
│   │   ├── providers.ts       # AI provider configuration
│   │   └── prompts.ts         # System prompts
│   ├── artifacts/             # Artifact implementation
│   ├── db/                    # Database operations
│   │   ├── migrations/        # Schema migrations
│   │   ├── schema.ts          # Database schema
│   │   └── queries.ts         # Database queries
│   ├── mcp/                   # MCP integration
│   └── utils.ts               # Utility functions
├── scripts/                   # Development and utility scripts
│   ├── services/              # Service management scripts
│   ├── testing/               # Test utility scripts
│   └── storybook-start.js     # Storybook startup script
├── docs/                      # Documentation
│   ├── guides/                # User and developer guides
│   ├── technical/             # Technical documentation
│   ├── maintenance/           # Maintenance documentation
│   └── integrations/          # Integration documentation
├── public/                    # Static assets
├── stories/                   # Storybook stories
└── tests/                     # Playwright tests
```

## Detailed System Architecture

The application follows a layered architecture organized around the Next.js App Router:

### Routing Layer
- **App Router Pattern**: Leverages the Next.js App Router for file-based routing
- **Server Components**: Utilizes React Server Components for improved performance and reduced client-side JavaScript
- **Page Structure**: Organized into main sections like authentication (`(auth)`) and chat interface (`(chat)`)

### AI Integration Layer
- **AI SDK Integration**: Centralizes AI model access through the Vercel AI SDK
- **Provider Abstraction**: Implementation in `lib/ai/providers.ts` offers a unified interface to multiple LLM providers
- **Model Selection**: Dynamic model selection through the `models.ts` configuration
- **Prompt Management**: Systematic prompt engineering in `prompts.ts` for different interaction types
- **MCP Integration**: Enhanced context management through Model Context Protocol

### Data Persistence Layer
- **Schema Design**: Drizzle ORM with tables for users, chats, messages, and artifacts
- **Query Handlers**: Encapsulated database operations in `queries.ts`
- **Migration Support**: Utilities for schema updates in the `migrations` directory
- **Blob Storage**: Integration with Vercel Blob for file handling

### Authentication Layer
- **NextAuth.js Integration**: User authentication and session management
- **Role-Based Access**: Permission controls for different user types
- **Secure Routes**: Protected routes using Next.js middleware

### UI Layer
- **Component Library**: Reusable UI components based on shadcn/ui
- **Responsive Design**: Mobile-friendly layouts with Tailwind CSS
- **Accessibility**: ARIA-compliant interactive elements through Radix UI primitives
- **Chat Interface**: Real-time conversation UI with message history and typing indicators

## Services Management

The application includes comprehensive service management through scripts in the `scripts/services` directory:

- **Service Manager**: Checks and manages required services (Next.js, Redis, PostgreSQL, Storybook)
- **Port Management**: Ensures critical services run on the expected ports
- **Application Starter**: Coordinates service startup for development
- **PostgreSQL Support**: Platform-aware PostgreSQL management with auto-recovery

## Development Workflow

The typical development workflow includes:

1. Environment setup with required API keys and service configurations
2. Starting required services (Redis, PostgreSQL) using service management scripts
3. Running the Next.js development server with `pnpm dev` or `pnpm dev:complete`
4. Testing UI components with Storybook
5. End-to-end testing with Playwright

## Deployment Considerations

The application is designed for deployment on Vercel with:

- Server-side rendering for improved performance
- Optimized bundle sizes
- Efficient chunk splitting and code splitting
- Static page generation where possible
- Middleware optimization for auth and routing
- Integration with Vercel Postgres and Blob Storage
