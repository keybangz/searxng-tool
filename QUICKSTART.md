# Quick Start Guide - SearXNG OpenCode Tool

Get up and running with the SearXNG search tool in 5 minutes!

## Installation

### 1. Copy the Tool

Copy the `.opencode/tool/searxng-search.ts` file to your OpenCode project:

```bash
cp -r .opencode /path/to/your/opencode-project/
```

Or globally:
```bash
cp .opencode/tool/searxng-search.ts ~/.config/opencode/tool/
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Restart OpenCode

Close and reopen OpenCode. The tool will be automatically available.

## First Search

### Using OpenCode CLI

Tell an agent to search:

```
You: "Search for information about OpenCode"
OpenCode: (uses searxng-search tool to find results)
```

### Tool Parameters

Basic usage:
```javascript
searxng-search({
  query: "Your search query"
})
```

With options:
```javascript
searxng-search({
  query: "machine learning",
  language: "en",
  safesearch: 1,
  time_range: "month"
})
```

## Common Queries

### Simple Search
```
"Search for TypeScript documentation"
→ searxng-search(query="TypeScript documentation")
```

### Search with Language
```
"Find Python tutorials in Spanish"
→ searxng-search(query="Python tutorials", language="es")
```

### Recent News
```
"Find recent news about AI"
→ searxng-search(query="AI news", time_range="week")
```

### Safe Search
```
"Find educational resources about cybersecurity"
→ searxng-search(query="cybersecurity education", safesearch=2)
```

## Response Format

You'll get results like this:

```json
{
  "query": "OpenCode",
  "resultsFound": 1500,
  "results": [
    {
      "title": "OpenCode - AI Coding Assistant",
      "url": "https://opencode.ai",
      "snippet": "OpenCode is an AI-powered coding assistant...",
      "engine": "duckduckgo"
    }
  ],
  "formattedResults": "1. OpenCode - AI Coding Assistant\n   URL: https://opencode.ai\n   OpenCode is an AI-powered..."
}
```

## Troubleshooting

### Tool Not Working?

1. Check that `.opencode/tool/searxng-search.ts` exists
2. Run `npm install`
3. Restart OpenCode
4. Check that no firewall is blocking `http://searxng.vier.services`

### Getting No Results?

- Try a simpler query
- Check the language setting
- Try without time_range filter

### Connection Error?

- Verify the SearXNG service is accessible
- Try a different query
- Check your network connection

## Next Steps

- Read the full [README.md](README.md) for complete documentation
- Check [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for advanced setup
- Learn about [OpenCode custom tools](https://opencode.ai/docs/custom-tools/)

## Parameters Reference

| Parameter | Type | Default | Example |
|-----------|------|---------|---------|
| `query` | string | required | "Python" |
| `language` | string | service default | "en", "de" |
| `categories` | string | all | "general,news" |
| `time_range` | string | none | "day", "month", "year" |
| `safesearch` | number | service default | 0, 1, or 2 |
| `pageno` | number | 1 | 2, 3, etc. |

## Enjoy!

You now have internet search capabilities in OpenCode. Let agents research information, find documentation, and discover solutions!
