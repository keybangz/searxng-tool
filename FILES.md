# SearXNG OpenCode Tool - Complete File Reference

## Project Structure

```
searxng-tool/
├── .opencode/
│   └── tool/
│       └── searxng-search.ts           184 lines  - Main tool implementation
├── .gitignore                           34 lines  - Git configuration
├── OPENCODE_INSTALLATION.md            383 lines  - End-user OpenCode setup guide
├── package.json                         24 lines  - NPM dependencies
├── tsconfig.json                        20 lines  - TypeScript configuration
├── test-tool.ts                        113 lines  - Test script
├── README.md                           309 lines  - Main documentation
├── QUICKSTART.md                       148 lines  - 5-minute setup guide
├── INTEGRATION_GUIDE.md                333 lines  - Integration instructions
├── PROJECT_SUMMARY.md                  385 lines  - Complete overview
└── FILES.md                              -        - This file

TOTAL: 2,326 lines of code and documentation across 11 files
```

## File Descriptions

### Core Implementation

#### `.opencode/tool/searxng-search.ts` (184 lines)
**Type**: TypeScript Tool Implementation
**Purpose**: Main tool definition for OpenCode
**Key Features**:
- OpenCode tool definition using `tool()` helper
- Type-safe parameter validation with Zod
- Full TypeScript interfaces for responses
- Async fetch implementation
- Comprehensive error handling
- 10-result limiting
- Dual-format output (JSON + text)
- 10-second timeout protection

**Key Functions**:
- `tool()` - Tool definition
- `execute()` - Main execution handler
- `fetch()` - HTTP requests to SearXNG

**Configuration**:
- Service URL: `SEARXNG_URL` env var (fallback: `http://searxng.vier.services`)
- Timeout: AbortController + 10-second setTimeout
- Result Limit: 10
- Output Formats: JSON + Text

---

### Configuration Files

#### `package.json` (24 lines)
**Type**: Node.js Configuration
**Purpose**: Project dependencies and metadata
**Contents**:
- Project name: searxng-opencode-tool
- Version: 1.0.0
- ES Module configuration
- Dependencies:
  - @opencode-ai/plugin (latest)
  - TypeScript (latest)
  - Zod (latest)
  - @types/node (latest)

**Usage**: `cd .opencode && npm install` to set up the environment

---

#### `tsconfig.json` (20 lines)
**Type**: TypeScript Configuration
**Purpose**: TypeScript compiler settings
**Key Settings**:
- Target: ES2020
- Module: ESNext
- Lib: ES2020
- Strict mode: enabled
- Module resolution: bundler
- Source map generation: enabled
- Output directory: ./dist

**Usage**: Automatically used by TypeScript compiler

---

#### `.gitignore` (34 lines)
**Type**: Git Configuration
**Purpose**: Exclude files from version control
**Excludes**:
- node_modules/
- dist/ and build/
- .env files
- IDE configurations (.vscode/, .idea/)
- Coverage reports
- Temporary files

**Usage**: Automatically used by Git

---

### Documentation Files

#### `README.md` (309 lines)
**Type**: Main Documentation
**Sections**:
1. **Overview** - Features and description
2. **Installation** - Step-by-step setup
3. **Usage** - How to use the tool
4. **Parameters** - Complete parameter reference
5. **Configuration** - Service configuration options
6. **Search Tips** - Effective searching strategies
7. **API Response Details** - Response format documentation
8. **Timeout Behavior** - Timeout configuration
9. **Rate Limiting** - Limits and considerations
10. **Examples** - Real-world usage examples
11. **Troubleshooting** - Common issues and solutions
12. **Architecture** - Technical design overview
13. **Performance** - Performance characteristics
14. **Privacy** - Privacy considerations
15. **Development** - For code modifications
16. **License** - MIT License
17. **Contributing** - Contribution guidelines
18. **Support** - Getting help

**Target Audience**: Anyone using the tool

---

#### `QUICKSTART.md` (148 lines)
**Type**: Quick Start Guide
**Sections**:
1. **Installation** - 3-step setup
2. **First Search** - Getting started immediately
3. **Common Queries** - Copy-paste examples
4. **Response Format** - What to expect
5. **Troubleshooting** - Quick fixes
6. **Next Steps** - Where to go from here
7. **Parameters Reference** - Quick lookup table
8. **Enjoy!** - Final encouragement

**Target Audience**: New users wanting quick setup
**Reading Time**: 5 minutes
**Installation Time**: 2 minutes

---

#### `INTEGRATION_GUIDE.md` (333 lines)
**Type**: Integration and Configuration Guide
**Sections**:
1. **Installation Steps** - Detailed installation
2. **Usage in OpenCode** - Agent integration
3. **Configuration** - Service configuration
4. **Testing the Tool** - Testing procedures
5. **Troubleshooting** - Advanced troubleshooting
6. **Performance Optimization** - Speed improvements
7. **Advanced Configuration** - Custom enhancements
8. **Integration with OpenCode Features** - Multi-tool workflows
9. **Examples** - Practical use cases
10. **Debugging** - Debug techniques
11. **Security Considerations** - Security review

**Target Audience**: Developers and administrators
**Topics**: Installation, configuration, integration, testing

---

#### `PROJECT_SUMMARY.md` (385 lines)
**Type**: Comprehensive Project Overview
**Sections**:
1. **Project Overview** - Introduction
2. **What Was Created** - File descriptions
3. **Key Features** - Feature list
4. **Technical Specifications** - Technical details
5. **File Structure** - Directory layout
6. **Installation Summary** - Quick install
7. **Configuration Points** - Where to configure
8. **Supported SearXNG Instances** - Instance list
9. **Use Cases** - Real-world applications
10. **Architecture Highlights** - Design decisions
11. **Testing** - Testing approach
12. **Dependencies** - Dependency list
13. **Deployment** - Deployment options
14. **Maintenance** - Maintenance procedures
15. **Security Considerations** - Security review
16. **Future Enhancements** - Possible improvements
17. **Troubleshooting** - Quick reference
18. **License** - MIT License
19. **Support** - Getting help

**Target Audience**: Project leads and architects
**Purpose**: Complete project reference

---

#### `OPENCODE_INSTALLATION.md` (383 lines)
**Type**: End-User Installation Guide
**Purpose**: Complete setup and usage guide for OpenCode users
**Highlights**:
- Project and global installation paths
- Dependency installation inside `.opencode/`
- Environment setup and troubleshooting
- Upgrade and maintenance guidance

---

### Test Files

#### `test-tool.ts` (113 lines)
**Type**: TypeScript Test Script
**Purpose**: Validate tool functionality
**Features**:
- Sample search queries
- API connectivity testing
- Response parsing validation
- Result formatting verification
- Error handling demonstration

**Usage**: `npx ts-node test-tool.ts`
**Tests**:
- OpenCode custom tools
- SearXNG privacy search
- TypeScript tool development

---

#### `FILES.md` (This File)
**Type**: File Reference
**Purpose**: Document all files in the project
**Contents**: Descriptions and line counts for all files

---

## File Statistics

### By Type
- **TypeScript**: 2 files (297 lines)
- **Markdown**: 6 files (1,951 lines)
- **JSON**: 2 files (44 lines)
- **Git Config**: 1 file (34 lines)
- **Total**: 11 files (2,326 lines)

### By Category
- **Code**: 2 files (297 lines)
- **Configuration**: 3 files (78 lines)
- **Documentation**: 6 files (1,951 lines)

### By Purpose
- **Implementation**: 1 file (184 lines) - searxng-search.ts
- **Configuration**: 3 files (78 lines) - package.json, tsconfig.json, .gitignore
- **Testing**: 1 file (113 lines) - test-tool.ts
- **Documentation**: 6 files (1,951 lines) - All .md files

---

## Documentation Reading Guide

### Quick Setup (15 minutes)
1. **QUICKSTART.md** - 5-minute setup
2. **README.md** (Features section) - 5 minutes
3. **Get started!**

### Detailed Setup (1 hour)
1. **QUICKSTART.md** - Setup
2. **README.md** - Complete read
3. **INTEGRATION_GUIDE.md** - Configuration

### Full Understanding (2 hours)
1. All documentation files
2. Review code in .opencode/tool/searxng-search.ts
3. Run test-tool.ts
4. Read PROJECT_SUMMARY.md for complete overview

### Production Deployment (1 hour)
1. **INTEGRATION_GUIDE.md** - Deployment section
2. **OPENCODE_INSTALLATION.md** - Run through setup checklist
3. **PROJECT_SUMMARY.md** - Architecture review
4. **Security Considerations** sections across docs

---

## Key Configuration Locations

### Service URL
**File**: `.opencode/tool/searxng-search.ts`
**Current**: `const baseUrl = (process.env.SEARXNG_URL ?? "http://searxng.vier.services").replace(/\/$/, "")`

### Timeout Value
**File**: `.opencode/tool/searxng-search.ts`
**Current**: `setTimeout(() => controller.abort(), 10000)`

### Result Limit
**File**: `.opencode/tool/searxng-search.ts`
**Line**: ~87
**Current**: `.slice(0, 10)` (10 results max)

---

## File Dependencies

```
package.json
  ├── Defines dependencies for
  │   ├── .opencode/tool/searxng-search.ts
  │   └── test-tool.ts
  │
tsconfig.json
  └── Configures compilation for
      ├── .opencode/tool/searxng-search.ts
      └── test-tool.ts

.gitignore
  └── Excludes from Git
      ├── node_modules/
      ├── dist/
      └── Other generated files

README.md
  ├── References
  │   ├── .opencode/tool/searxng-search.ts (architecture)
  │   ├── QUICKSTART.md (link)
  │   └── INTEGRATION_GUIDE.md (link)

QUICKSTART.md
  ├── References
  │   ├── README.md (for more info)
  │   └── INTEGRATION_GUIDE.md (for advanced)

INTEGRATION_GUIDE.md
  ├── References
  │   ├── SEARXNG_URL environment configuration
  │   ├── README.md (parameter reference)
  │   └── test-tool.ts (testing)

PROJECT_SUMMARY.md
  └── References all files for complete overview
```

---

## Access Patterns

### For First-Time Users
```
START → QUICKSTART.md → README.md → Get Started
```

### For Installation
```
QUICKSTART.md (Section 1-3) → cd .opencode && npm install → Done
```

### For Configuration
```
INTEGRATION_GUIDE.md → Set SEARXNG_URL → Restart
```

### For Troubleshooting
```
README.md (Troubleshooting) → INTEGRATION_GUIDE.md → Check logs
```

### For Development
```
PROJECT_SUMMARY.md → .opencode/tool/searxng-search.ts → tsconfig.json
```

## Total Project Metrics

| Metric | Value |
|--------|-------|
| Total Files | 11 |
| Total Lines | 2,326 |
| Source Code Lines | 297 |
| Documentation Lines | 1,951 |
| Code to Doc Ratio | 1:6.6 |
| Avg Lines per File | 211 |

---

## Version Information

- **Project Version**: 1.0.0
- **Created**: December 15, 2024
- **Status**: Production Ready
- **Last Updated**: April 2025
- **License**: MIT

---

This file serves as a complete reference for all files in the SearXNG OpenCode Tool project.
