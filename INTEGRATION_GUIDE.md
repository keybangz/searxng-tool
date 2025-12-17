# SearXNG OpenCode Tool - Integration Guide

## Overview

This guide explains how to integrate the SearXNG tool into your OpenCode installation and verify it's working correctly.

## Installation Steps

### 1. Copy Tool Files to OpenCode

Choose one of the following approaches:

#### Option A: Project-Level Installation (Recommended)
Copy to your OpenCode project's `.opencode/tool/` directory:

```bash
# If your project has a .opencode directory
cp -r .opencode/tool/searxng-search.ts /path/to/your/project/.opencode/tool/

# Or copy the entire tool directory
cp -r .opencode /path/to/your/project/
```

#### Option B: Global Installation
Copy to your global OpenCode tools directory:

```bash
mkdir -p ~/.config/opencode/tool/
cp .opencode/tool/searxng-search.ts ~/.config/opencode/tool/
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
bun install
```

### 3. Verify Installation

The tool will be available as `searxng-search` in OpenCode and can be called by agents.

## Usage in OpenCode

### Direct Agent Calls

OpenCode agents can call the tool using:

```typescript
searxng-search({
  query: "Your search query",
  language: "en",
  safesearch: 1
})
```

### Agent Prompting

Agents can be instructed to use the tool:

```
You have access to a search tool called 'searxng-search'. 
Use it to find information about: [topic]
```

## Configuration

### Default SearXNG Instance

The tool is configured to use:
```
http://searxng.vier.services
```

### Changing the SearXNG Instance

To use a different SearXNG instance:

1. Open `.opencode/tool/searxng-search.ts`
2. Find the line: `const searxngUrl = "http://searxng.vier.services/search"`
3. Replace with your instance URL: `const searxngUrl = "http://your-instance.com/search"`
4. Save and restart OpenCode

### Testing Different Instances

Popular public SearXNG instances:
- https://searx.be
- https://searx.ru (may have restrictions)
- https://searx.xyz
- https://search.privacyguide.org

Note: Availability varies by region and time. Test connectivity before changing.

## Testing the Tool

### Manual Testing

Run the included test script:

```bash
npx ts-node test-tool.ts
```

This will perform sample searches and display the results.

### Testing in OpenCode

1. Start OpenCode in your project or with global tools
2. In a conversation, ask an agent to search:
   - "Search for information about TypeScript"
   - "Find recent news about AI"
   - "Look up SearXNG documentation"

3. The agent will use the `searxng-search` tool automatically

### Verifying Responses

A successful response will include:
- `query`: Your search query
- `resultsFound`: Number of total results
- `results`: Array of up to 10 results with title, URL, and snippet
- `formattedResults`: Human-readable text format

## Troubleshooting

### Tool Not Found

**Error**: `Tool 'searxng-search' not found`

**Solution**:
1. Verify the file is in `.opencode/tool/searxng-search.ts`
2. Check that package.json is present
3. Restart OpenCode
4. Verify tsconfig.json exists

### Connection Errors

**Error**: `Failed to search SearXNG: Failed to fetch`

**Solutions**:
- Verify the SearXNG instance is accessible: `curl http://searxng.vier.services/`
- Check network connectivity
- Try a different SearXNG instance
- Check firewall rules that might block outbound HTTP requests

### Empty Results

**Issue**: Searches return no results

**Solutions**:
- Try a different, simpler query
- Check if you're filtering by language that has limited results
- Verify the SearXNG instance has search engines enabled
- Try without category filters

### Timeout Errors

**Error**: Request timeout after 10 seconds

**Solutions**:
- Try again later (service may be under load)
- Use a simpler query
- Try a different SearXNG instance
- Increase timeout in the tool code (change 10000 to higher value)

## Performance Optimization

### Query Tips for Better Results

1. **Use specific terms**: "machine learning classification" instead of "machine learning"
2. **Combine filters**: Use language, time_range, and categories together
3. **Try multiple queries**: If one returns no results, try a variation
4. **Use quotes for exact phrases**: `"exact phrase"`

### Reducing Response Time

1. Use specific queries to limit the search scope
2. Specify language if not searching in all languages
3. Use time_range filters when searching for recent content
4. The tool automatically limits to 10 results for faster processing

## Advanced Configuration

### Environment Variables (Optional Enhancement)

You can enhance the tool to support environment variables:

```typescript
const searxngUrl = process.env.SEARXNG_URL || "http://searxng.vier.services/search"
const timeout = parseInt(process.env.SEARXNG_TIMEOUT || "10000")
```

### Caching Implementation (Optional Enhancement)

To add simple caching to the tool:

```typescript
const resultCache = new Map<string, CachedResult>()
const CACHE_TTL = 3600000 // 1 hour

function getCacheKey(query: string, params: any) {
  return `${query}_${JSON.stringify(params)}`
}
```

### Rate Limiting (Optional Enhancement)

Implement request queuing:

```typescript
const requestQueue: Array<() => Promise<any>> = []
const requestDelay = 500 // milliseconds between requests
```

## Integration with OpenCode Features

### Using with Other Tools

The `searxng-search` tool works seamlessly with OpenCode's built-in tools:

```
Agent: "Search for TypeScript documentation and save it to a file"
→ Uses searxng-search to find URLs
→ Uses webfetch tool to get content
→ Uses write tool to save to file
```

### Using with Different Agents

The tool works with any OpenCode agent type:
- **General Agent**: Multi-step reasoning with search
- **Explore Agent**: Quick research tasks
- **Python QA Auditor**: Finding solutions for Python issues

### Using with Rules and Permissions

If you have permission rules configured, ensure they allow:
- HTTP GET requests to the SearXNG instance
- External network access

## Examples

### Search for Documentation

```
User: Find the OpenCode custom tools documentation
Agent: Uses searxng-search(query="OpenCode custom tools")
Result: Returns link to docs.opencode.ai
```

### Research Task

```
User: Research the latest developments in quantum computing
Agent: Uses searxng-search(query="quantum computing 2024", time_range="year")
Result: Returns recent articles about quantum computing
```

### Multi-Language Search

```
User: Recherchez des ressources sur Python en français
Agent: Uses searxng-search(query="Python tutoriel", language="fr")
Result: Returns French-language Python resources
```

## Debugging

### Enable Verbose Logging

Modify the tool to log requests:

```typescript
console.log(`[SearXNG] Searching for: ${query}`)
console.log(`[SearXNG] URL: ${fullUrl}`)
console.log(`[SearXNG] Response status: ${response.status}`)
```

### Test API Directly

```bash
# Test the SearXNG API directly
curl "http://searxng.vier.services/search?q=test&format=json"

# Or using Python
python3 -c "
import urllib.request
import json
url = 'http://searxng.vier.services/search?q=test&format=json'
response = urllib.request.urlopen(url)
data = json.loads(response.read())
print(json.dumps(data, indent=2))
"
```

## Security Considerations

### Privacy
- SearXNG doesn't track searches
- Queries are sent to the specified instance
- No caching of results

### Data Safety
- Tool is read-only (doesn't modify data)
- No authentication credentials stored
- No sensitive data in requests

### Network Security
- Uses HTTP (configure to HTTPS if available)
- Validate URLs returned by SearXNG
- Consider using a private SearXNG instance for sensitive queries

## Support

For issues:
1. Check this guide's troubleshooting section
2. Review the main README.md
3. Check OpenCode documentation: https://opencode.ai/docs/
4. Report issues to OpenCode: https://github.com/sst/opencode/issues

## Next Steps

1. Install the tool following the installation steps
2. Test with sample queries
3. Integrate into your OpenCode workflow
4. Configure for your specific use case
5. Customize parameters as needed

Enjoy using the SearXNG tool with OpenCode!
