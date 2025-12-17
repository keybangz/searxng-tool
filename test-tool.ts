/**
 * Simple test script to validate the SearXNG tool
 * Run with: npx ts-node test-tool.ts
 */

// Mock the tool execution for testing
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
    engine?: string[]
  }>
  number_of_results?: number
  query?: string
}

async function testSearch(query: string) {
  const searxngUrl = "http://searxng.vier.services/search"

  try {
    console.log(`\n🔍 Testing search query: "${query}"`)
    console.log("=" .repeat(60))

    const params = new URLSearchParams()
    params.append("q", query)
    params.append("format", "json")
    params.append("results_on_new_tab", "0")
    params.append("pageno", "1")

    const fullUrl = `${searxngUrl}?${params.toString()}`

    console.log(`Fetching from: ${searxngUrl}`)
    console.log(`Query: ${query}\n`)

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "User-Agent": "OpenCode-SearXNG-Tool-Test/1.0",
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`)
      return
    }

    const data = (await response.json()) as SearXNGResponse

    const limitedResults: SearchResult[] = (data.results || [])
      .slice(0, 10)
      .map((result) => ({
        title: result.title,
        url: result.url,
        snippet: result.content,
        engine: result.engine?.[0],
      }))

    console.log(`✅ Success! Found ${data.number_of_results || limitedResults.length} results`)
    console.log(`Showing ${limitedResults.length} results:\n`)

    limitedResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`)
      console.log(`   📍 ${result.url}`)
      console.log(`   ${result.snippet}`)
      if (result.engine) console.log(`   🔧 Engine: ${result.engine}`)
      console.log()
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`❌ Error: ${errorMessage}`)
  }
}

async function runTests() {
  console.log("🚀 SearXNG Tool Test Suite")
  console.log("=" .repeat(60))

  // Test queries
  const testQueries = [
    "OpenCode custom tools",
    "SearXNG privacy search",
    "TypeScript tool development",
  ]

  for (const query of testQueries) {
    await testSearch(query)
    // Add a small delay between requests to avoid overwhelming the service
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  console.log("\n" + "=" .repeat(60))
  console.log("✅ Test suite complete!")
}

runTests()
