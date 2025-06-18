import { getAllArticleIds, getBaseUrl } from '@/app/actions'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const helpCenterUrl = formData.get('helpCenterUrl') as string
    
    if (!helpCenterUrl) {
      return new Response('Knowledge Base URL is required', { status: 400 })
    }

    const baseUrl = getBaseUrl(helpCenterUrl)
    const articles = await getAllArticleIds(baseUrl)
    let processedCount = 0

    // Create a new ReadableStream for streaming the CSV
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        // Send initial progress
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'progress',
          total: articles.length,
          processed: 0
        })}\n\n`))

        // Write CSV header
        controller.enqueue(encoder.encode('Article Name,Article URL,Category\n'))

        // Process each article
        for (const article of articles) {
          try {
            const response = await fetch(`${baseUrl}${article.json_content_url}`)
            if (!response.ok) {
              console.error(`Failed to fetch article ${article.id}: ${response.status}`)
              continue
            }

            const articleData = await response.json()
            
            // Format the CSV row with proper escaping
            const row = [
              `"${articleData.name.replace(/"/g, '""')}"`,
              `"${baseUrl}${articleData.content_url}"`,
              `"${article.categoryPath.join(' > ').replace(/"/g, '""')}"`
            ].join(',')

            // Write the row
            controller.enqueue(encoder.encode(row + '\n'))

            // Update progress every 10 articles
            processedCount++
            if (processedCount % 10 === 0 || processedCount === articles.length) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'progress',
                total: articles.length,
                processed: processedCount
              })}\n\n`))
            }
          } catch (error) {
            console.error(`Error processing article ${article.id}:`, error)
          }
        }

        // Send completion message
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'complete',
          total: articles.length,
          processed: processedCount
        })}\n\n`))

        controller.close()
      }
    })

    // Return the streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Content-Disposition': `attachment; filename="kb-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return new Response('Failed to export knowledge base', { status: 500 })
  }
} 