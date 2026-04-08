import { tool } from "@opencode-ai/plugin"

interface SearchResult {
  title: string
  url: string
  snippet: string
  engine?: string
  publishedDate?: string
}

interface SearXNGResponse {
  results: Array<{
    title: string
    url: string
    content: string
    engine?: string | string[]
    engines?: string[]
    publishedDate?: string
  }>
  number_of_results?: number
  query?: string
  answers?: string[]
  infoboxes?: Array<{ content: string; id?: string }>
}

interface FormattedResponse {
  query: string
  resultsFound: number
  results: SearchResult[]
  formattedResults: string
  answers?: string[]
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function doSearch(
  url: string,
  attempt: number
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "OpenCode-SearXNG-MCP/2.0 (local agent search)",
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

export default tool({
  description:
    "Search the internet using a local self-hosted SearXNG instance. Returns structured web search results with titles, URLs, snippets, engines, and publish dates. Aggregates multiple search engines (Google, Bing, DuckDuckGo, Brave, GitHub, StackOverflow, arXiv, Wikipedia, and more). Use `time_range` or `freshness_bias` to get recent/up-to-date results. Set `categories` to target specific result types (e.g., 'it' for code/tech, 'science' for research papers, 'news' for current events). Configure the SearXNG instance via the SEARXNG_URL environment variable (defaults to http://localhost:7790).",
  args: {
    query: tool.schema
      .string()
      .describe("The search query. Be specific and descriptive for best results."),
    num_results: tool.schema
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("Number of results to return (default: 20, max: 50). Use higher values for comprehensive research."),
    categories: tool.schema
      .string()
      .optional()
      .describe("Comma-separated search categories to target: 'general' (default), 'it' (code/tech/GitHub/npm/PyPI/StackOverflow), 'science' (arXiv/PubMed/Scholar), 'news' (current events), 'social media' (Reddit/communities), 'map'. Can combine: 'it,science'."),
    engines: tool.schema
      .string()
      .optional()
      .describe("Comma-separated list of specific engines to query (e.g., 'google,bing,duckduckgo'). Leave empty to use all engines for the selected category."),
    language: tool.schema
      .string()
      .optional()
      .describe("Language code for results (e.g., 'en', 'de', 'fr'). Default: en."),
    pageno: tool.schema
      .number()
      .int()
      .positive()
      .optional()
      .describe("Page number (default: 1). Use pageno=2 or higher to get more unique results beyond the first page."),
    time_range: tool.schema
      .enum(["day", "week", "month", "year"])
      .optional()
      .describe("Filter results by recency: 'day' (last 24h), 'week' (last 7 days), 'month' (last 30 days), 'year' (last 12 months). Use for up-to-date research."),
    freshness_bias: tool.schema
      .boolean()
      .optional()
      .describe("When true and no time_range is specified, automatically filters to the last month to prioritize recent results. Useful for research on fast-moving topics."),
    safesearch: tool.schema
      .number()
      .int()
      .min(0)
      .max(2)
      .optional()
      .describe("Safe search level: 0 (off, default), 1 (moderate), 2 (strict)."),
  },
  async execute(args) {
    const {
      query,
      num_results = 20,
      categories,
      engines,
      language = "en",
      pageno = 1,
      time_range,
      freshness_bias = false,
      safesearch = 0,
    } = args

    // Default to local instance — never fall back to a public instance which rate-limits
    const baseUrl = (process.env.SEARXNG_URL ?? "http://localhost:7790").replace(/\/$/, "")
    const searxngUrl = baseUrl.endsWith("/search") ? baseUrl : `${baseUrl}/search`

    // Build query parameters
    const params = new URLSearchParams()
    params.append("q", query)
    params.append("format", "json")
    params.append("pageno", pageno.toString())
    params.append("language", language)
    params.append("safesearch", safesearch.toString())

    if (categories) params.append("categories", categories)
    if (engines) params.append("engines", engines)

    // Apply time_range or freshness_bias
    const effectiveTimeRange = time_range ?? (freshness_bias ? "month" : undefined)
    if (effectiveTimeRange) params.append("time_range", effectiveTimeRange)

    const fullUrl = `${searxngUrl}?${params.toString()}`

    let lastError: string = ""
    let response: Response | null = null

    // Try up to 2 attempts (1 retry on failure)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        if (attempt > 1) await sleep(1000)
        response = await doSearch(fullUrl, attempt)
        if (response.ok) break
        // Non-2xx: check for rate limiting specifically
        if (response.status === 429) {
          lastError = `Rate limited by SearXNG (HTTP 429). If this persists, verify the local instance is running and limiter is disabled in settings.yml.`
          break
        }
        lastError = `SearXNG HTTP error: ${response.status} ${response.statusText}`
        if (attempt < 2) continue
      } catch (error) {
        const isTimeout = error instanceof Error && error.name === "AbortError"
        if (isTimeout) {
          lastError = `Search request timed out (15s). The SearXNG instance may be slow or starting up. Check: docker compose ps`
        } else {
          lastError = error instanceof Error ? error.message : String(error)
        }
        if (attempt < 2) continue
        break
      }
    }

    if (!response?.ok) {
      return JSON.stringify({
        query,
        error: true,
        errorMessage: lastError || "Search failed after 2 attempts.",
        hint: "Verify SearXNG is running: docker compose ps — and SEARXNG_URL is set to http://localhost:7790",
        results: [],
        formattedResults: `Error: ${lastError}`,
      }, null, 2)
    }

    const text = await response.text()
    let data: SearXNGResponse
    try {
      data = JSON.parse(text) as SearXNGResponse
    } catch {
      return JSON.stringify({
        query,
        error: true,
        errorMessage: `SearXNG returned non-JSON response (HTTP ${response.status}). The instance may be starting up, returning a captcha page, or rate-limiting. Try again in a moment.`,
        results: [],
        formattedResults: "Error: Non-JSON response from SearXNG.",
      }, null, 2)
    }

    // Extract and limit results
    const limitedResults: SearchResult[] = (data.results || [])
      .slice(0, num_results)
      .map((result) => {
        const engineVal = Array.isArray(result.engines)
          ? result.engines[0]
          : Array.isArray(result.engine)
          ? (result.engine as string[])[0]
          : result.engine
        return {
          title: result.title,
          url: result.url,
          snippet: result.content,
          engine: engineVal,
          ...(result.publishedDate ? { publishedDate: result.publishedDate } : {}),
        }
      })

    // Format results for readability
    let formattedResults = ""
    if (limitedResults.length > 0) {
      formattedResults = limitedResults
        .map((result, index) => {
          const dateStr = result.publishedDate ? ` [${result.publishedDate}]` : ""
          const engineStr = result.engine ? ` (via ${result.engine})` : ""
          return `${index + 1}. ${result.title}${dateStr}${engineStr}\n   URL: ${result.url}\n   ${result.snippet}`
        })
        .join("\n\n")
    } else {
      formattedResults = "No results found. Try broadening the query, removing time_range, or checking different categories."
    }

    // Include direct answers if SearXNG returned any
    const answers = data.answers?.filter(Boolean) ?? []

    const response_data: FormattedResponse = {
      query,
      resultsFound: data.number_of_results || limitedResults.length,
      results: limitedResults,
      formattedResults,
      ...(answers.length > 0 ? { answers } : {}),
    }

    return JSON.stringify(response_data, null, 2)
  },
})
