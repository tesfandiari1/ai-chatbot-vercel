# UniWise Chat App Documentation

This directory contains documentation for the UniWise Chat App. Browse through the sections below to find the information you need.

## Table of Contents

### Technical Documentation
- [Technical Analysis](./technical/analysis.md) - Detailed analysis of the codebase structure and architecture

### User and Developer Guides
- [Quick Start](./guides/quick-start.md) - Get started quickly with development
- [Models](./guides/models.md) - Information about switching between AI models
- [Artifacts](./guides/artifacts.md) - How to work with the artifacts system
- [Migration to Parts](./guides/migrate-to-parts.md) - Guide to migrating to the parts-based message structure
- [Features](./guides/features/calendar-integration.md) - Feature-specific documentation

### Integration Documentation
- **MCP Integration**
  - [Setup](./integrations/mcp/setup.md) - Setting up the Model Context Protocol
  - [SDK Documentation](./integrations/mcp/sdk.md) - MCP TypeScript SDK usage
  - [Integration Progress](./integrations/mcp/progress.md) - Progress tracking for MCP integration
- **Storybook** - Component library documentation

### Maintenance Documentation
- [Bug Tracking](./maintenance/bugs.md) - Known issues and their status
- [Service Management](../scripts/services/README.md) - Guide to managing required services

## Contributing

If you'd like to contribute to the documentation, please follow these guidelines:

1. Create documentation in the appropriate category directory
2. Use Markdown for all documentation files
3. Include code examples where appropriate
4. Update this index when adding new documentation files

## Documentation Structure

```
docs/
├── guides/                   # User and developer guides
│   ├── quick-start.md        # Getting started guide
│   ├── models.md             # Model configuration guide
│   ├── artifacts.md          # Artifacts usage guide
│   ├── migrate-to-parts.md   # Message parts migration guide
│   └── features/             # Feature-specific documentation
│       └── calendar-integration.md # Calendar integration documentation
├── technical/                # Technical documentation
│   └── analysis.md           # Codebase architecture analysis
├── maintenance/              # Maintenance documentation
│   └── bugs.md               # Bug tracking document
├── integrations/             # Integration documentation
│   ├── mcp/                  # MCP integration documentation
│   │   ├── setup.md          # MCP setup guide
│   │   ├── sdk.md            # MCP SDK documentation
│   │   └── progress.md       # Integration progress tracking
│   └── storybook/            # Storybook documentation
└── README.md                 # This index file
``` 