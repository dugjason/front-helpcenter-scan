'use client'

import { useState, useEffect, useRef } from 'react'
import { SearchMatch } from './actions'
import Link from 'next/link';
import { LinkIcon, Download } from 'lucide-react';

type ProgressState = {
  processed: number;
  total: number;
}

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchMatch[]>([])
  const [progress, setProgress] = useState<ProgressState>({ processed: 0, total: 0 })
  const [searchComplete, setSearchComplete] = useState(false)
  const [urlError, setUrlError] = useState<string>('')
  const formRef = useRef<HTMLFormElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // Cleanup function to abort any in-progress fetch when component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  function exportToCsv() {
    if (results.length === 0) return

    // Create CSV headers
    const headers = ['Article Name', 'Article URL', 'Category']
    
    // Create CSV rows
    const rows = results.map(result => [
      `"${result.articleTitle.replace(/"/g, '""')}"`, // Escape quotes in article title
      `"${result.articleUrl}"`,
      `"${result.categoryHierarchy ? result.categoryHierarchy.join(' > ') : ''}"`
    ])
    
    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `search_results_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  function validateUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  function handleUrlChange(event: React.ChangeEvent<HTMLInputElement>) {
    const url = event.target.value
    if (url && !validateUrl(url)) {
      setUrlError('Please enter a valid URL')
    } else {
      setUrlError('')
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    
    // Get form data
    const formData = new FormData(event.currentTarget)
    const helpCenterUrl = formData.get('helpCenterUrl') as string
    const searchTerm = formData.get('searchTerm') as string
    
    if (!helpCenterUrl || !searchTerm) {
      alert('Both Knowledge Base URL and search term are required')
      return
    }
    
    // Validate URL
    if (!validateUrl(helpCenterUrl)) {
      setUrlError('Please enter a valid URL')
      return
    }
    
    // Reset state
    setLoading(true)
    setResults([])
    setProgress({ processed: 0, total: 0 })
    setSearchComplete(false)
    setUrlError('')
    
    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create a new abort controller
    abortControllerRef.current = new AbortController()
    
    try {
      // Make the request
      const response = await fetch('/api/search', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal
      })
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }
      
      // Handle the streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response reader')
      }
      
      const decoder = new TextDecoder()
      let buffer = ''
      
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          break
        }
        
        // Decode the chunk and add it to our buffer
        buffer += decoder.decode(value, { stream: true })
        
        // Process complete lines in the buffer
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep the last incomplete line in the buffer
        
        for (const line of lines) {
          if (line.trim() === '') continue
          
          try {
            const event = JSON.parse(line)
            
            switch (event.type) {
              case 'info':
                setProgress(prev => ({ ...prev, total: event.data.totalArticles }))
                break
                
              case 'result':
                setResults(prev => [...prev, event.data])
                break
                
              case 'progress':
                setProgress(event.data)
                break
                
              case 'complete':
                console.log('Search complete:', event.data)
                setSearchComplete(true)
                break
                
              default:
                console.warn('Unknown event type:', event.type)
            }
          } catch (e) {
            console.error('Error parsing event:', e, line)
          }
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Request was aborted')
      } else {
        console.error('Error during search:', error)
        alert('An error occurred while searching. Please check the URL and try again.')
      }
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }

  function handleCancel() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Front Knowledge Base Scanner</h1>
        <p className="text-gray-600">
          Search for content across a <Link href="https://front.com/product/knowledge-base" className="font-semibold text-[#A857F1] hover:underline" target="_blank" rel="noopener noreferrer">Front Knowledge Base</Link> using the knowledge base public API.
        </p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-lg shadow-md border border-gray-100">
        <div>
          <label htmlFor="helpCenterUrl" className="block mb-2 font-medium">
            Knowledge Base URL
          </label>
          <input
            type="url"
            id="helpCenterUrl"
            name="helpCenterUrl"
            placeholder="https://help.example.com"
            required
            className={`w-full p-3 border rounded-md ${
              urlError ? 'border-red-500 focus:border-red-500' : 'border-gray-300'
            }`}
            onChange={handleUrlChange}
          />
          <p className="mt-1 text-sm text-gray-500">
            Enter the URL of a Front Knowledge Base
          </p>
          {urlError && (
            <p className="mt-1 text-sm text-red-500">
              {urlError}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="searchTerm" className="block mb-2 font-medium">
            Search Term
          </label>
          <input
            type="text"
            id="searchTerm"
            name="searchTerm"
            required
            className="w-full p-3 border border-gray-300 rounded-md"
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 py-3 px-4 rounded-md text-white font-medium ${
              loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          
          {loading && (
            <button
              type="button"
              onClick={handleCancel}
              className="py-3 px-4 rounded-md text-gray-700 font-medium border border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading && (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span>Searching the knowledge base...</span>
            <span className="text-sm text-gray-500">
              {progress.processed} / {progress.total} articles processed
            </span>
          </div>
          
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
              style={{ 
                width: progress.total ? `${(progress.processed / progress.total) * 100}%` : '0%' 
              }}
            />
          </div>
          
          {results.length > 0 && (
            <p className="mt-2 text-sm text-green-600">
              Found matches in {results.length} article{results.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Search Results ({results.length})</h2>
            
            {searchComplete && (
              <button
                onClick={exportToCsv}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Download size={16} />
                <span>Export to CSV</span>
              </button>
            )}
          </div>
          
          {results.map((result) => (
            <div key={result.articleId} className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">
                <a 
                  href={result.articleUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {result.articleTitle}
                </a>
              </h3>
              
              {result.categoryHierarchy && result.categoryHierarchy.length > 0 && (
                <div className="text-sm text-gray-600 mb-2 flex items-center">
                  <span className="ml-2">
                    {result.categoryHierarchy.join(' > ')}
                  </span>
                </div>
              )}
              
              <div className="text-sm text-gray-500 mb-4">
                <Link href={result.articleUrl} target="_blank" rel="noopener noreferrer" className=" hover:underline">
                  <LinkIcon size={12} className="mr-1 inline-block" />
                  {result.articleUrl.replace(/^https?:\/\//, '')}
                </Link>
              </div>
              
              <div className="space-y-4">
                {result.matches.map((match, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <p className="font-medium text-gray-700 mb-1">
                      {match.heading}
                    </p>
                    <p 
                      className="text-gray-800 text-sm"
                      dangerouslySetInnerHTML={{ __html: match.highlightedContext }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="p-6 bg-white rounded-lg shadow-md text-center text-gray-500 border border-gray-100">
          No results to display. Enter a search term and URL to begin.
        </div>
      )}
    </div>
  )
} 