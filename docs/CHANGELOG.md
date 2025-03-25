# Changelog

## [Unreleased]

### Added
- New API structure documentation in `docs/architecture/api-structure.md`
- Improved troubleshooting guides for API routes
- Performance benefits documentation for App Router

### Changed
- **BREAKING**: Migrated all API routes from Pages Router (`pages/api/*`) to App Router (`app/api/*`)
- Updated MCP client to use the new API paths
- Consolidated environment variables to use `.env.local` as the single source of truth
- Streamlined package.json scripts for better developer experience

### Removed
- Redundant `.next 2/` build directory
- Duplicate Redis client implementations
- Unnecessary symlinks and duplicate configuration files
- Legacy API implementation files

### Fixed
- Environment variable loading in development mode
- Redis connectivity testing
- MCP server implementation to use proper App Router patterns
- Documentation examples to reflect the new API structure

## [Previous Versions]

<!-- Add previous changelog entries here --> 