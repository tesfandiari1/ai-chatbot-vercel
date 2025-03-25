# UniWise Chat App

<p align="center">
  <img alt="Vetor Logo" src="https://cdn.prod.website-files.com/6661f87aaf938f614a6f0d12/66d8addb1598bd790ce48749_Vetor%20Logo.ai.png" width="600">
</p>

<p align="center">
  An AI Chatbot Built With Next.js and the AI SDK by UniWise.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#architecture"><strong>Architecture</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#installation"><strong>Installation</strong></a> ·
  <a href="#running-locally"><strong>Running Locally</strong></a> ·
  <a href="#deployment"><strong>Deployment</strong></a> ·
  <a href="#ai-integration"><strong>AI Integration</strong></a>
</p>

## Overview

A powerful, enterprise-ready AI chatbot built with Next.js and the Vercel AI SDK. This application provides a seamless conversational interface powered by multiple LLM providers and a robust data persistence layer. The architecture leverages modern web development patterns with a focus on server-side rendering, AI integration, and a responsive user interface.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Model Providers](#model-providers)
- [Installation](#installation)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [AI Integration](#ai-integration)
- [Data Persistence](#data-persistence)
- [Authentication](#authentication)
- [Testing](#testing)
- [MCP Integration](#mcp-integration)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Modern Chat Interface**: Real-time conversational UI with message history and typing indicators
- **Multi-Model Support**: Switch between different LLM providers (OpenAI, Groq, etc.)
- **Server Components**: Optimized rendering and improved performance with React Server Components
- **Advanced AI Capabilities**:
  - Text generation and chat completions
  - Structured data output
  - Tool/function calling
  - Context management
- **Authentication**: Secure user management with NextAuth.js
- **Data Persistence**: Chat history and user data storage
- **File Handling**: Upload, store, and process files through Vercel Blob
- **Code Editor**: Integrated CodeMirror for code-related features
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS and shadcn/ui
- **Accessibility**: ARIA-compliant components through Radix UI primitives

## Tech Stack

### Core Technologies
- **Next.js**: App Router architecture for routing and server-side rendering
- **React**: Utilizing Server Components (RSCs) for optimized rendering
- **TypeScript**: Full type safety throughout the codebase
- **Vercel AI SDK**: Unified API for text generation and tool calls

### AI/ML
- **Multiple LLM Providers**:
  - OpenAI (default, using GPT-4o)
  - Groq
  - xAI
  - Support for additional providers
- **Model Context Protocol (MCP)**: Standardized context provider for LLMs

### Data Layer
- **PostgreSQL**: Powered by Vercel Postgres (Neon)
- **Drizzle ORM**: Type-safe database operations
- **Vercel Blob Storage**: File storage for artifacts and attachments
- **Redis**: Used with MCP integration for session management

### Frontend
- **shadcn/ui**: Component library based on Radix UI
- **Tailwind CSS**: Utility-first styling
- **CodeMirror**: Code editor integration

### Authentication & Security
- **NextAuth.js**: Authentication framework for user management (version 5 beta)

### Testing
- **Playwright**: End-to-end testing

## Architecture

The application follows a layered architecture organized around the Next.js App Router:

### Routing Layer
- **App Router Pattern**: File-based routing with Next.js
- **Server Components**: Optimized rendering with reduced client JavaScript
- **Page Structure**: Organized into main sections like authentication `(auth)` and chat `(chat)`

### API Structure
- **App Router API**: Modern API routes implemented in the `app/api` directory
- **MCP Integration**: Model Context Protocol server for enhanced LLM capabilities
- **Redis Integration**: State management for MCP and other services
- **Simplified Structure**: Reduced redundancy and improved organization

For more details on the API structure, see [API Structure Documentation](docs/architecture/api-structure.md).

### AI Integration Layer
- **AI SDK Integration**: Centralized access to AI models
- **Provider Abstraction**: Unified interface to multiple LLM providers
- **Model Selection**: Dynamic model selection from various providers
- **Prompt Management**: Systematic prompt engineering for different interaction types
- **Tool Calling**: Implementation of AI function calling for enhanced capabilities

### Data Persistence Layer
- **Schema Design**: Drizzle ORM with tables for users, chats, messages, and artifacts
- **Query Handlers**: Encapsulated database operations
- **Migration Support**: Utilities for schema updates

### Authentication Layer
- **NextAuth.js Integration**: User authentication and session management
- **Role-Based Access**: Permission controls for different user types

### UI Layer
- **Component Library**: Reusable UI components
- **Responsive Design**: Mobile-friendly layouts
- **Accessibility**: ARIA-compliant interactive elements

## Model Providers

This application uses OpenAI as the default chat model provider. With the Vercel AI SDK, it supports multiple providers including Groq and xAI with minimal configuration changes.

### Current Configuration
The default provider setup includes:
- **Chat Model**: OpenAI's GPT-4o
- **Reasoning Model**: OpenAI's o3-mini with reasoning middleware
- **Title Model**: OpenAI's GPT-3.5-turbo
- **Image Generation**: DALL-E 3

### MCP SDK Integration
The application uses the Model Context Protocol (MCP) TypeScript SDK for enhanced context management and standardized interactions with language models. Key features include:

- **Unified Context Management**: Standardized context handling across different LLM providers
- **Type-Safe Operations**: Full TypeScript support for all MCP operations
- **Resource Templates**: Structured handling of dynamic resources with validation
- **Tool Integration**: Type-safe function calling and tool management
- **Error Handling**: Comprehensive error handling and validation patterns

Example MCP configuration:
```typescript
import { createMCPClient } from '@/lib/mcp/client';

const mcpClient = createMCPClient({
  serverUrl: process.env.MCP_SERVER_URL,
  capabilities: {
    tools: {
      // Tool definitions
    },
    resources: {
      // Resource definitions
    }
  }
});
```

## Installation

### Prerequisites
- Node.js 18.x or later
- pnpm (recommended) or npm/yarn
- PostgreSQL database
- Redis (for MCP integration)
- OpenAI API key

### Environment Setup
1. Clone the repository
2. Copy `.env.example` to `.env` and configure:
   ```bash
   OPENAI_API_KEY=your_api_key
   MCP_SERVER_URL=your_mcp_server_url
   REDIS_URL=your_redis_url  # Required for MCP
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```

## Running Locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various AI and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000/).

### Using the Local Deployment Script

For a more comprehensive local deployment that includes Redis, PostgreSQL, Next.js and Storybook all running together, use the included deployment script:

```bash
# Standard development mode
pnpm dev:complete

# Make sure port 3000 is available
pnpm predev
```

The service manager script supports checking and starting required services:

```bash
# Check services
pnpm services:check

# Start all services
pnpm services:start
```

Available options:
- `--dev`: Run in development mode
- `--skip-lint`: Skip linting checks
- `--skip-type-check`: Skip TypeScript type checking
- `--skip-redis`: Skip Redis setup
- `--skip-postgres`: Skip PostgreSQL setup
- `--skip-build`: Skip Next.js build
- `--skip-storybook`: Skip Storybook startup

## Deployment

### Pre-deployment Checks
Before deploying to Vercel, run the following checks to ensure code quality and build stability:

```bash
# 1. Run linting checks
pnpm lint

# 2. Verify type safety
npx tsc --noEmit

# 3. Test production build
pnpm build
```

If you encounter build cache issues, clean the cache and rebuild:
```bash
rm -rf .next && pnpm build
```

### Build Optimization
The application is optimized for production with:
- Server-side rendering for improved performance
- Optimized bundle sizes
- Efficient chunk splitting and code splitting
- Static page generation where possible
- Middleware optimization for auth and routing

### Required Vercel Resources
- Vercel Postgres (powered by Neon)
- Vercel Blob Storage
- Integration with AI providers

## AI Integration

### Available Models
Configuration in `lib/ai/models.ts` allows for selecting from multiple providers.

### Tools
The application includes various AI function calling tools:
- Document creation and updates
- Custom tool extensibility via MCP
- Integration with various external services

### MCP Integration

The Model Context Protocol integration provides enhanced context management:

1. **Setup Requirements**:
   - Redis URL configuration
   - MCP server configuration
   - MCP TypeScript SDK

2. **Implementation**:
   ```typescript
   import { createMcpContextProvider } from '@/lib/mcp/client';
   
   export const myProvider = customProvider({
     languageModels: {
       // existing models
     },
     contextProvider: createMcpContextProvider({
       serverUrl: process.env.MCP_SERVER_URL,
     }),
   });
   ```

## Data Persistence

### Database Schema
- Users: Authentication and profile data
- Chats: Conversation containers
- Messages: Individual chat entries
- Artifacts: Attachments and generated content

### Blob Storage
Used for file uploads, exports, and other binary content.

## Testing

End-to-end testing is implemented with Playwright. Run tests with:

```bash
pnpm test:e2e
```

## Contributing

Contributions are welcome! Please see our [Contributing Guidelines](CONTRIBUTING.md) for more information.

## License

This project is licensed under the [MIT License](LICENSE).

---

*It's mcp game time baby*
