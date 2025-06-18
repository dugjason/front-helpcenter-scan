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
    
    // Create a stream for CSV data
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()
    const encoder = new TextEncoder()

    // Process articles and write CSV data
    void (async () => {
      try {
        // Write header with total count as a comment
        await writer.write(encoder.encode(`# total: ${articles.length}\n`))
        await writer.write(encoder.encode('Article Name,Article URL,Category\n'))

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

            await writer.write(encoder.encode(row + '\n'))
          } catch (error) {
            console.error(`Error processing article ${article.id}:`, error)
          }
        }
      } catch (error) {
        console.error('Error processing articles:', error)
      } finally {
        await writer.close()
      }
    })()

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="kb-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return new Response('Failed to export knowledge base', { status: 500 })
  }
} 