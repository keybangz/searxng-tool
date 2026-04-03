# SearXNG OpenCode Tool - Complete Project Index

## Quick Navigation

### 🚀 Getting Started (Pick One)
- **Fastest Path** → [QUICKSTART.md](QUICKSTART.md) (5 minutes)
- **Complete Path** → [README.md](README.md) (15 minutes)
- **Installation Focus** → [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) (20 minutes)

### 📚 Documentation
| Document | Purpose | Read Time |
|----------|---------|-----------|
| [QUICKSTART.md](QUICKSTART.md) | 5-minute setup guide | 5 min |
| [README.md](README.md) | Complete documentation | 15 min |
| [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) | Advanced integration | 20 min |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | Technical overview | 20 min |
| [OPENCODE_INSTALLATION.md](OPENCODE_INSTALLATION.md) | End-user OpenCode setup guide | 15 min |
| [FILES.md](FILES.md) | File reference guide | 10 min |
| [INDEX.md](INDEX.md) | This file | 5 min |

### 💻 Code Files
| File | Purpose | Lines |
|------|---------|-------|
| [.opencode/tool/searxng-search.ts](.opencode/tool/searxng-search.ts) | Main tool implementation | 152 |
| [test-tool.ts](test-tool.ts) | Test script | 104 |

### ⚙️ Configuration Files
| File | Purpose |
|------|---------|
| [package.json](package.json) | Dependencies |
| [tsconfig.json](tsconfig.json) | TypeScript config |
| [.gitignore](.gitignore) | Git exclusions |

---

## By Use Case

### "I want to install it now"
1. Read: [QUICKSTART.md](QUICKSTART.md) (Step 1-3)
2. Run: `cd .opencode && npm install`
3. Copy `.opencode/` to your project
4. Restart OpenCode
5. Done!

### "I want to understand what it does"
1. Read: [README.md](README.md) (Features section)
2. Check: Example queries in [QUICKSTART.md](QUICKSTART.md)
3. Review: Response format in [README.md](README.md)

### "I need to configure it for my environment"
1. Read: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
2. Find: Configuration points in [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
3. Edit: [.opencode/tool/searxng-search.ts](.opencode/tool/searxng-search.ts)
4. Restart OpenCode

### "I'm deploying to production"
1. Check: [OPENCODE_INSTALLATION.md](OPENCODE_INSTALLATION.md) setup checklist
2. Review: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) (Deployment section)
3. Test: Using [test-tool.ts](test-tool.ts)
4. Security: Review [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) security section

### "I'm having problems"
1. Check: [README.md](README.md) troubleshooting section
2. Advanced: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) troubleshooting
3. Debug: Check [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) debugging section

### "I want to modify the code"
1. Start: [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) architecture section
2. Find: Configuration locations in [FILES.md](FILES.md)
3. Read: Code comments in [.opencode/tool/searxng-search.ts](.opencode/tool/searxng-search.ts)
4. Reference: [README.md](README.md) development section

---

## Feature Overview

### Core Features
- ✨ Search the internet using SearXNG
- ✨ Privacy-focused (no tracking)
- ✨ Structured JSON output for LLMs
- ✨ Human-readable formatting
- ✨ 10 results per query
- ✨ Configurable parameters
- ✨ 10-second timeout
- ✨ Comprehensive error handling

### Supported Parameters
- `query` (required) - Search query
- `categories` (optional) - Comma-separated categories
- `language` (optional) - Language code
- `pageno` (optional) - Page number
- `time_range` (optional) - day, month, or year
- `safesearch` (optional) - 0, 1, or 2

### Search Capabilities
- Full text web search
- Category filtering
- Language-specific results
- Time range filtering
- Safe search levels
- Pagination support

---

## Architecture at a Glance

```
OpenCode Agent
     ↓
searxng-search Tool
     ↓
SearXNG API
($SEARXNG_URL (default: http://searxng.vier.services))
     ↓
Returns Results
(JSON + Text Format)
```

### Data Flow
1. Agent sends search query
2. Tool validates parameters
3. Tool calls SearXNG API
4. SearXNG returns results
5. Tool formats results (JSON + text)
6. Agent receives structured data

---

## Technology Stack

- **Language**: TypeScript
- **Framework**: @opencode-ai/plugin
- **Runtime**: Node.js
- **Validation**: Zod
- **HTTP**: Fetch API
- **Service**: SearXNG (Privacy-focused search engine)

---

## Quick Reference Tables

### Search Parameters
```javascript
searxng-search({
  query: "required string",
  categories: "optional string",
  language: "optional en/de/fr/etc",
  pageno: "optional number",
  time_range: "optional day/month/year",
  safesearch: "optional 0/1/2"
})
```

### Response Structure
```json
{
  "query": "string",
  "resultsFound": 5000,
  "results": [
    {
      "title": "string",
      "url": "string",
      "snippet": "string",
      "engine": "string"
    }
  ],
  "formattedResults": "string"
}
```

### Error Response
```json
{
  "query": "string",
  "error": true,
  "errorMessage": "string",
  "results": [],
  "formattedResults": "string"
}
```

---

## Common Tasks

### Install the Tool
See: [QUICKSTART.md](QUICKSTART.md) Steps 1-3

### Use in OpenCode
See: [README.md](README.md) Usage section

### Configure Service
See: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) Configuration section

### Test Functionality
See: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) Testing section

### Troubleshoot Issues
See: [README.md](README.md) Troubleshooting section

### Modify Code
See: [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) Architecture section

### Deploy to Production
See: [OPENCODE_INSTALLATION.md](OPENCODE_INSTALLATION.md) setup checklist

---

## File Organization

### By Audience
**New Users** → QUICKSTART.md, README.md
**Developers** → PROJECT_SUMMARY.md, .opencode/tool/searxng-search.ts
**Administrators** → INTEGRATION_GUIDE.md, OPENCODE_INSTALLATION.md
**Architects** → PROJECT_SUMMARY.md, FILES.md

### By Purpose
**Installation** → QUICKSTART.md, INTEGRATION_GUIDE.md
**Reference** → README.md, FILES.md
**Verification** → OPENCODE_INSTALLATION.md, PROJECT_SUMMARY.md
**Development** → .opencode/tool/searxng-search.ts, tsconfig.json

### By Topic
**Features** → README.md
**Setup** → QUICKSTART.md, INTEGRATION_GUIDE.md
**Configuration** → INTEGRATION_GUIDE.md, PROJECT_SUMMARY.md
**Troubleshooting** → README.md, INTEGRATION_GUIDE.md
**Code Details** → .opencode/tool/searxng-search.ts, PROJECT_SUMMARY.md

---

## Installation Paths

### Express Install (2 minutes)
```bash
cp -r .opencode /your/project/
cd .opencode && npm install
# Restart OpenCode
```

### Full Install (5 minutes)
1. Read QUICKSTART.md
2. Copy .opencode directory
3. Run cd .opencode && npm install
4. Restart OpenCode
5. Test with sample query

### Production Install (30 minutes)
1. Run through OPENCODE_INSTALLATION.md checklist
2. Read INTEGRATION_GUIDE.md
3. Configure service URL if needed
4. Run test-tool.ts
5. Deploy and monitor

---

## Support & Help

### For Questions About...
- **Installation** → QUICKSTART.md or INTEGRATION_GUIDE.md
- **Features** → README.md or QUICKSTART.md
- **Configuration** → INTEGRATION_GUIDE.md or PROJECT_SUMMARY.md
- **Troubleshooting** → README.md or INTEGRATION_GUIDE.md
- **Code** → PROJECT_SUMMARY.md or .opencode/tool/searxng-search.ts
- **Deployment** → OPENCODE_INSTALLATION.md or INTEGRATION_GUIDE.md

### External Resources
- **OpenCode Docs**: https://opencode.ai/docs/
- **SearXNG Docs**: https://docs.searxng.org/
- **OpenCode Discord**: https://opencode.ai/discord
- **Issues**: https://github.com/anomalyco/opencode/issues

---

## Project Statistics

| Metric | Value |
|--------|-------|
| Total Files | 12 |
| Total Lines | ~1,900 |
| Documentation | 6 files, 1,500+ lines |
| Code | 2 files, 256 lines |
| Configuration | 3 files, 78 lines |
| Code-to-Doc Ratio | 1:5.9 |

---

## Version & Status

- **Version**: 1.0.0
- **Status**: Production Ready ✅
- **Created**: December 15, 2024
- **License**: MIT

---

## Next Steps

1. **Quick Start**: Read [QUICKSTART.md](QUICKSTART.md)
2. **Install**: Copy `.opencode/` and run `cd .opencode && npm install`
3. **Restart**: Restart OpenCode
4. **Use**: Ask an agent to search!

---

## Project Overview

This is a **production-ready OpenCode custom tool** that integrates with the **SearXNG privacy-focused search engine**. It enables OpenCode agents to search the internet without tracking or data collection.

The project includes:
- Complete TypeScript implementation
- Comprehensive documentation (6 guides)
- Test scripts
- Configuration files
- Security and privacy focused
- Fully documented and verified

**Get started in 5 minutes with [QUICKSTART.md](QUICKSTART.md)!**

---

*Last Updated: April 2025*
*For complete information, see the individual documentation files.*
