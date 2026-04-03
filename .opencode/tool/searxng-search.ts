import { tool } from "@opencode-ai/plugin"

interface SearchResult {
  title: string
  url: string
  snippet: string
  engine?: string
}

interface SearXNGResponse {
  results: Array<{
    title: string
    url: string
    content: string
    engine?: string | string[]
  }>
  number_of_results?: number
  query?: string
}

interface FormattedResponse {
  query: string
  resultsFound: number
  results: SearchResult[]
  formattedResults: string
}

export default tool({
  description:
    "Search the internet using SearXNG service. Returns up to 10 web search results with titles, URLs, and snippets. Configure the SearXNG instance via the SEARXNG_URL environment variable.",
  args: {
    query: tool.schema
      .string()
      .describe("The search query (e.g., 'OpenCode documentation', 'SearXNG API')"),
    categories: tool.schema
      .string()
      .optional()
      .describe("Comma-separated list of categories to search (e.g., 'general,social media')"),
    language: tool.schema
      .string()
      .optional()
      .describe("Language code for results (e.g., 'en', 'de', 'fr')"),
    pageno: tool.schema
      .number()
      .int()
      .positive()
      .optional()
      .describe("Page number of results (default: 1)"),
    time_range: tool.schema
      .enum(["day", "month", "year"])
      .optional()
      .describe("Filter results by time range"),
    safesearch: tool.schema
      .number()
      .int()
      .min(0)
      .max(2)
      .optional()
      .describe("Safe search level: 0 (off), 1 (moderate), 2 (strict)"),
  },
  async execute(args) {
    const {
      query,
      categories,
      language,
      pageno = 1,
      time_range,
      safesearch,
    } = args

    const baseUrl = (process.env.SEARXNG_URL ?? "http://searxng.vier.services").replace(/\/$/, "")
    const searxngUrl = baseUrl.endsWith("/search") ? baseUrl : `${baseUrl}/search`

    try {
      // Build query parameters
      const params = new URLSearchParams()
      params.append("q", query)
      params.append("format", "json")
      params.append("pageno", pageno.toString())

      if (categories) params.append("categories", categories)
      if (language) params.append("language", language)
      if (time_range) params.append("time_range", time_range)
      if (safesearch !== undefined) params.append("safesearch", safesearch.toString())

      const fullUrl = `${searxngUrl}?${params.toString()}`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      let response: Response
      try {
        // Make the API request
        response = await fetch(fullUrl, {
          method: "GET",
          headers: {
            "User-Agent": "OpenCode-SearXNG-Tool/1.0",
            Accept: "application/json",
          },
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timeoutId)
      }

      if (!response.ok) {
        throw new Error(
          `SearXNG API error: ${response.status} ${response.statusText}`
        )
      }

      const text = await response.text()
      let data: SearXNGResponse
      try {
        data = JSON.parse(text) as SearXNGResponse
      } catch {
        throw new Error(
          `SearXNG returned non-JSON response (status ${response.status}). The instance may be rate-limiting or returning a captcha page.`
        )
      }

      // Extract and limit results to 10
      const limitedResults: SearchResult[] = (data.results || [])
        .slice(0, 10)
        .map((result) => ({
          title: result.title,
          url: result.url,
          snippet: result.content,
          engine: Array.isArray(result.engine) ? result.engine[0] : result.engine,
        }))

      // Format results for human readability
      let formattedResults = ""
      if (limitedResults.length > 0) {
        formattedResults = limitedResults
          .map(
            (result, index) =>
              `${index + 1}. ${result.title}\n   URL: ${result.url}\n   ${result.snippet}`
          )
          .join("\n\n")
      } else {
        formattedResults = "No results found for the given query."
      }

      const response_data: FormattedResponse = {
        query,
        resultsFound: data.number_of_results || limitedResults.length,
        results: limitedResults,
        formattedResults,
      }

      return JSON.stringify(response_data, null, 2)
    } catch (error) {
      // Check for timeout (AbortController fires)
      if (error instanceof Error && error.name === "AbortError") {
        return JSON.stringify(
          {
            query,
            error: true,
            errorMessage: "Search request timed out after 10 seconds. The SearXNG instance may be slow or unavailable.",
            results: [],
            formattedResults: "Error: Search request timed out after 10 seconds.",
          },
          null,
          2
        )
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error)
      return JSON.stringify(
        {
          query,
          error: true,
          errorMessage: `Failed to search SearXNG: ${errorMessage}`,
          results: [],
          formattedResults: `Error: ${errorMessage}`,
        },
        null,
        2
      )
    }
  },
})
