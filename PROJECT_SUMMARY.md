# SearXNG OpenCode Tool - Project Summary

## Project Overview

This project provides a complete, production-ready OpenCode custom tool that integrates with the SearXNG privacy-focused search engine. The tool enables OpenCode agents to search the internet without tracking or data collection.

## What Was Created

### Core Tool Files

1. **`.opencode/tool/searxng-search.ts`** (Main Implementation)
   - TypeScript implementation of the search tool
   - Configurable parameters for flexible searching
   - Structured JSON output for LLM processing
   - Human-readable formatting for debugging
   - Comprehensive error handling
   - 10-second timeout for reliability

2. **`package.json`** (Dependencies)
   - Defines project metadata
   - Declares required dependencies (@opencode-ai/plugin, TypeScript, Zod)
   - Configured for ES modules

3. **`tsconfig.json`** (TypeScript Configuration)
   - Strict type checking enabled
   - ES2020 target for modern JavaScript
   - Proper module resolution

### Documentation Files

1. **`README.md`** (Main Documentation)
   - Complete feature overview
   - Installation instructions
   - Usage guide with examples
   - Configuration options
   - Troubleshooting guide
   - Architecture description
   - Privacy considerations

2. **`INTEGRATION_GUIDE.md`** (Integration Instructions)
   - Step-by-step installation guide
   - Configuration procedures
   - Testing instructions
   - Performance optimization tips
   - Advanced features and enhancements
   - Security considerations

3. **`QUICKSTART.md`** (Get Started Quickly)
   - 5-minute setup guide
   - Basic usage examples
   - Common queries
   - Quick reference table
   - Troubleshooting checklist

4. **`PROJECT_SUMMARY.md`** (This File)
   - Project overview
   - File structure
   - Feature summary
   - Specifications

### Additional Files

1. **`.gitignore`**
   - Standard Node.js ignores
   - IDE configuration ignores
   - Build output exclusions

2. **`test-tool.ts`**
   - Sample test script
   - Can be used to validate tool functionality
   - Demonstrates proper API usage

## Key Features

### Search Capabilities
- Full text web search
- Category filtering (general, news, images, etc.)
- Language-specific results
- Time range filtering (day, month, year)
- Safe search levels (0-2)
- Pagination support
- Multiple output formats

### LLM Integration
- Structured JSON responses
- Human-readable formatting
- Error responses with detailed messages
- Optimized for agent consumption
- 10-result limit for concise responses

### Reliability
- Comprehensive error handling
- 10-second request timeout
- Graceful failure messages
- Network error detection
- Service unavailability handling

### Privacy & Security
- Uses privacy-focused SearXNG engine
- No tracking or data collection
- No authentication credentials stored
- No sensitive data in requests
- Read-only operations

## Technical Specifications

### Tool Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Search query |
| categories | string | No | all | Comma-separated categories |
| language | string | No | service | Language code (e.g., en, de) |
| pageno | number | No | 1 | Result page number |
| time_range | enum | No | none | day, month, or year |
| safesearch | number | No | service | 0 (off), 1 (moderate), 2 (strict) |

### Response Structure

**Success Response:**
```typescript
{
  query: string              // The search query executed
  resultsFound: number       // Total results available
  results: [                 // Array of up to 10 results
    {
      title: string          // Page title
      url: string            // Direct URL
      snippet: string        // Text snippet
      engine?: string        // Source search engine
    }
  ]
  formattedResults: string   // Human-readable text
}
```

**Error Response:**
```typescript
{
  query: string              // The attempted query
  error: true                // Error flag
  errorMessage: string       // Detailed error message
  results: []                // Empty array
  formattedResults: string   // Error as text
}
```

### Performance Metrics

- **Response Time**: 1-3 seconds typical
- **Result Limit**: 10 per query
- **Request Timeout**: 10 seconds
- **Memory Usage**: Minimal (stateless)
- **Caching**: None (fresh results each time)

## File Structure

```
searxng-tool/
├── .opencode/
│   └── tool/
│       └── searxng-search.ts          # Main tool implementation
├── OPENCODE_INSTALLATION.md            # End-user OpenCode setup guide
├── .gitignore                         # Git configuration
├── package.json                       # Node.js dependencies
├── tsconfig.json                      # TypeScript config
├── test-tool.ts                       # Test script
├── README.md                          # Full documentation
├── QUICKSTART.md                      # 5-minute setup guide
├── INTEGRATION_GUIDE.md               # Integration instructions
└── PROJECT_SUMMARY.md                 # This file
```

## Installation Summary

### Quick Install
```bash
# Copy to project
cp -r .opencode /path/to/your/opencode-project/

# Install dependencies
cd .opencode && npm install

# Restart OpenCode
```

### Usage
```javascript
// In OpenCode agent
searxng-search({ query: "your search query" })
```

## Configuration Points

### Service URL
Set `SEARXNG_URL` environment variable before launching OpenCode.

Default fallback: `http://searxng.vier.services`

### Timeout Value
Implemented in `.opencode/tool/searxng-search.ts` using AbortController:
```typescript
setTimeout(() => controller.abort(), 10000)
```

### Result Limit
Located in `.opencode/tool/searxng-search.ts` line ~87:
```typescript
.slice(0, 10)   // 10 results max
```

## Supported SearXNG Instances

Default: `http://searxng.vier.services`

Others (may vary in availability):
- https://searx.be
- https://searx.xyz
- https://search.privacyguide.org
- https://searx.github.io/instances/

## Use Cases

### For Agents
- **Research**: Find information on any topic
- **Documentation**: Locate official docs and tutorials
- **Problem Solving**: Search for solutions to technical issues
- **News**: Find recent articles on specific topics
- **Learning**: Discover educational resources

### For Users
- **Multi-step workflows**: Search + fetch + analyze
- **Information gathering**: Combine searches with other tools
- **Verification**: Find authoritative sources
- **Language support**: Search in any language

## Architecture Highlights

### Type Safety
- Full TypeScript implementation
- Zod schema validation for arguments
- Interface definitions for responses
- Strict type checking enabled

### Error Handling
- Try-catch blocks for network errors
- Proper HTTP status code checking
- User-friendly error messages
- Structured error responses

### Agent Optimization
- JSON output format for parsing
- Structured data format
- Limited result set for brevity
- Formatted text for readability

### Extensibility
- Service URL configurable via `SEARXNG_URL`
- Configurable timeout
- Adjustable result limit
- Support for additional parameters

## Testing

### Included Test Script
```bash
npx ts-node test-tool.ts
```

Performs sample searches and validates:
- Service connectivity
- API response parsing
- Result formatting
- Multiple query handling

### Manual Testing
1. Install the tool
2. Ask agent to search
3. Verify JSON response structure
4. Check formatted results

## Dependencies

### Runtime
- `@opencode-ai/plugin`: OpenCode tool framework
- Node.js runtime

### Development
- `typescript`: TypeScript compiler
- `zod`: Schema validation
- `@types/node`: Node.js type definitions

## Deployment

### Project-Level
Copy to `.opencode/tool/` in your project directory

### Global
Copy to `~/.config/opencode/tool/`

### No Server Required
The tool connects to an external SearXNG instance. No local server deployment needed.

## Maintenance

### Monitoring
- Check SearXNG instance availability
- Monitor error rates in agent logs
- Track timeout occurrences

### Updates
- Keep package dependencies updated
- Monitor SearXNG API changes
- Update configuration as needed

### Support
- OpenCode Docs: https://opencode.ai/docs/
- SearXNG Docs: https://docs.searxng.org/
- OpenCode Discord: https://opencode.ai/discord
- Issues: https://github.com/sst/opencode/issues

## Security Considerations

### Privacy
- Queries sent to SearXNG instance
- No local storage of queries
- No tracking mechanisms
- Respects user privacy

### Data Safety
- Read-only operations
- No modification of data
- No credential storage
- No sensitive information in requests

### Network
- HTTP by default (consider HTTPS instances)
- Timeout protection via AbortController
- Error handling for failures

## Future Enhancements

### Possible Additions
- Caching for frequently searched queries
- Rate limiting to respect service
- Support for multiple SearXNG instances
- Result deduplication
- Ranking/relevance sorting
- Image/video/news specific endpoints
- Advanced filtering options

### Optimization Ideas
- Parallel searches across categories
- Result summarization
- Entity extraction from results
- Sentiment analysis
- Source credibility scoring

## Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| Tool not found | Check `.opencode/tool/` directory, restart OpenCode |
| Connection refused | Verify SearXNG instance is accessible |
| Empty results | Try simpler query, check language setting |
| Timeout error | Service may be slow, try again or use different instance |
| HTTP error | Check SearXNG instance status |

## License

MIT License - Feel free to use, modify, and distribute.

## Support & Feedback

- Documentation: See README.md and INTEGRATION_GUIDE.md
- Testing: Use test-tool.ts script
- Issues: Report to OpenCode or SearXNG projects
- Feedback: Welcome on OpenCode Discord

---

**Version**: 1.0.0  
**Created**: December 2024  
**Status**: Production Ready  
**Last Updated**: April 2025
