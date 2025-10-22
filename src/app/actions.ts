// Types based on the Front Knowledge Base API
type HomeResponse = {
  type: "home"
  name: string
  content_url: string
  json_content_url: string
  content: ContentItem[]
}

type CategoryResponse = {
  id: number
  name: string
  content_url: string
  json_content_url: string
  content: ContentItem[]
}

type ArticleContent = {
  type: "article"
  id: number
  name: string
  content_url: string
  json_content_url: string
  slim_content_url: string
}

type CategoryContent = {
  type: "category"
  id: number
  name: string
  content_url: string
  json_content_url: string
}

type SectionContent = {
  type: "section"
  id: number
  name: string
  content: ContentItem[]
}

type ResourceLinkContent = {
  type: "resource_link"
  id: number
  name: string
  link: string
}

type ContentItem = ArticleContent | CategoryContent | SectionContent | ResourceLinkContent

type ArticleResponse = {
  id: number
  name: string
  content_url: string
  html_content: string
  text_content: string
  parent_category_id?: number
}

// New type to store article paths
type ArticlePathInfo = ArticleContent & {
  categoryPath: string[]
}

export type SearchMatch = {
  articleId: number
  articleTitle: string
  articleUrl: string
  categoryHierarchy: string[]
  matches: {
    heading: string
    context: string
    highlightedContext: string
  }[]
}

// Helper function to get base URL from knowledge base URL
export function getBaseUrl(url: string): string {
  try {
    const parsedUrl = new URL(url)
    return `${parsedUrl.protocol}//${parsedUrl.host}`
  } catch (error) {
    throw new Error("Invalid URL provided")
  }
}

// Function to fetch all article IDs by traversing the knowledge base structure
export async function getAllArticleIds(baseUrlParam: string): Promise<ArticlePathInfo[]> {
  const articles: ArticlePathInfo[] = []

  // Strip the URL to just the domain+subdomain
  const baseUrl = new URL(baseUrlParam).origin

  // Start with the home page
  const response = await fetch(`${baseUrl}/en/home.json`)
  if (!response.ok) {
    throw new Error(`Failed to fetch home page: ${response.status}`)
  }
  const homeResponse: HomeResponse = await response.json()

  // Process content recursively, starting with "Home" as the root of the path
  await processContent(homeResponse.content, articles, baseUrl, [homeResponse.name])

  return articles
}

async function processContent(
  content: ContentItem[],
  articles: ArticlePathInfo[],
  baseUrl: string,
  categoryPath: string[] = [],
): Promise<void> {
  for (const item of content) {
    if (item.type === "article") {
      articles.push({
        ...item,
        categoryPath: [...categoryPath],
      })
    } else if (item.type === "category") {
      const response = await fetch(`${baseUrl}${item.json_content_url}`)
      if (!response.ok) {
        console.error(`Failed to fetch category: ${response.status}`)
        continue
      }
      const categoryResponse: CategoryResponse = await response.json()
      // Add the category name to the path and continue processing
      await processContent(categoryResponse.content, articles, baseUrl, [
        ...categoryPath,
        categoryResponse.name,
      ])
    } else if (item.type === "section") {
      // For sections, we include the section name in the path
      await processContent(item.content, articles, baseUrl, [...categoryPath, item.name])
    }
    // Skip resource_link type as it doesn't contain articles
  }
}

// Server-side HTML parsing function
function findMatchesInHtml(
  html: string,
  searchTerm: string,
): { heading: string; context: string; highlightedContext: string }[] {
  const matches: { heading: string; context: string; highlightedContext: string }[] = []
  const searchTermLower = searchTerm.toLowerCase()

  // Extract headings and their content
  const headingRegex = /<h([1-6]).*?>(.*?)<\/h\1>/gi
  let lastHeading = ""
  let lastIndex = 0
  let match
  let foundHeadings = false

  while ((match = headingRegex.exec(html)) !== null) {
    foundHeadings = true
    const headingText = match[2].replace(/<.*?>/g, "") // Remove any HTML tags inside heading
    const headingIndex = match.index

    // Check if the heading itself contains the search term
    if (headingText.toLowerCase().includes(searchTermLower)) {
      matches.push({
        heading: lastHeading,
        context: headingText.trim(),
        highlightedContext: headingText
          .trim()
          .replace(new RegExp(`(${searchTerm})`, "gi"), "<mark>$1</mark>"),
      })
    }

    // Get content between this heading and the next one
    if (lastIndex > 0) {
      const sectionHtml = html.substring(lastIndex, headingIndex)
      const sectionText = sectionHtml.replace(/<.*?>/g, " ").replace(/\s+/g, " ")

      // Find sentences containing the search term
      const sentences = sectionText.split(/(?<=[.!?])\s+/)

      for (const sentence of sentences) {
        if (sentence.toLowerCase().includes(searchTermLower)) {
          // Create highlighted version
          const highlightedSentence = sentence.replace(
            new RegExp(`(${searchTerm})`, "gi"),
            "<mark>$1</mark>",
          )

          matches.push({
            heading: lastHeading,
            context: sentence.trim(),
            highlightedContext: highlightedSentence.trim(),
          })
        }
      }
    }

    lastHeading = headingText
    lastIndex = headingIndex + match[0].length
  }

  // Process the final section after the last heading or the entire content if no headings
  if ((foundHeadings && lastIndex > 0 && lastIndex < html.length) || !foundHeadings) {
    const sectionHtml = foundHeadings ? html.substring(lastIndex) : html
    const sectionText = sectionHtml.replace(/<.*?>/g, " ").replace(/\s+/g, " ")

    const sentences = sectionText.split(/(?<=[.!?])\s+/)

    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(searchTermLower)) {
        const highlightedSentence = sentence.replace(
          new RegExp(`(${searchTerm})`, "gi"),
          "<mark>$1</mark>",
        )

        matches.push({
          heading: lastHeading,
          context: sentence.trim(),
          highlightedContext: highlightedSentence.trim(),
        })
      }
    }
  }

  return matches
}

// Main search function
export async function searchHelpCenter(
  helpCenterUrl: string,
  searchTerm: string,
): Promise<SearchMatch[]> {
  try {
    const baseUrl = getBaseUrl(helpCenterUrl)
    const articles = await getAllArticleIds(baseUrl)
    const results: SearchMatch[] = []

    // Process each article
    for (const article of articles) {
      try {
        const response = await fetch(`${baseUrl}${article.json_content_url}`)
        if (!response.ok) {
          console.error(`Failed to fetch article ${article.id}: ${response.status}`)
          continue
        }
        const articleResponse: ArticleResponse = await response.json()
        const { html_content, name, content_url } = articleResponse

        // Use regex-based approach for server-side
        const matches = findMatchesInHtml(html_content, searchTerm)

        if (matches.length > 0) {
          const searchMatch: SearchMatch = {
            articleId: article.id,
            articleTitle: name,
            articleUrl: `${baseUrl}${content_url}`,
            categoryHierarchy: article.categoryPath,
            matches,
          }

          results.push(searchMatch)
        }
      } catch (error) {
        console.error(`Error processing article ${article.id}:`, error)
      }
    }

    return results
  } catch (error) {
    console.error("Error searching knowledge base:", error)
    throw new Error("Failed to search the knowledge base")
  }
}

// Function that streams the results to the client
export async function streamSearchResults(formData: FormData) {
  const helpCenterUrl = formData.get("helpCenterUrl") as string
  const searchTerm = formData.get("searchTerm") as string

  if (!helpCenterUrl || !searchTerm) {
    throw new Error("Knowledge Base URL and search term are required")
  }

  // Create a new ReadableStream
  const stream = new ReadableStream({
    start: async (controller) => {
      try {
        const encoder = new TextEncoder()

        // Get base URL and article IDs
        const baseUrl = getBaseUrl(helpCenterUrl)
        const articles = await getAllArticleIds(baseUrl)

        // Send total count to the client
        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({
              type: "info",
              data: { totalArticles: articles.length },
            })}\n`,
          ),
        )

        // Process each article
        let foundCount = 0
        let processedCount = 0

        for (const article of articles) {
          try {
            const response = await fetch(`${baseUrl}${article.json_content_url}`)
            if (!response.ok) {
              console.error(`Failed to fetch article ${article.id}: ${response.status}`)
              processedCount++
              continue
            }

            const articleResponse: ArticleResponse = await response.json()
            const { html_content, name, content_url } = articleResponse

            // Find matches in the article
            const matches = findMatchesInHtml(html_content, searchTerm)
            if (matches.length > 0) {
              foundCount++

              // Send the result to the client
              const searchMatch: SearchMatch = {
                articleId: article.id,
                articleTitle: name,
                articleUrl: `${baseUrl}${content_url}`,
                categoryHierarchy: article.categoryPath,
                matches,
              }

              controller.enqueue(
                encoder.encode(
                  `${JSON.stringify({
                    type: "result",
                    data: searchMatch,
                  })}\n`,
                ),
              )
            }

            processedCount++

            // Send progress update every 25 articles to avoid overwhelming the client
            if (processedCount % 25 === 0 || processedCount === articles.length) {
              controller.enqueue(
                encoder.encode(
                  `${JSON.stringify({
                    type: "progress",
                    data: {
                      processed: processedCount,
                      found: foundCount,
                      total: articles.length,
                    },
                  })}\n`,
                ),
              )
            }
          } catch (error) {
            console.error(`Error processing article ${article.id}:`, error)
            processedCount++
          }
        }

        // Signal that processing is complete
        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({
              type: "complete",
              data: {
                totalFound: foundCount,
                totalProcessed: processedCount,
              },
            })}\n`,
          ),
        )
      } catch (error) {
        console.error("Stream error:", error)
        controller.error(error)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
