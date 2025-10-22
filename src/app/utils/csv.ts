import type { SearchMatch } from "../actions"

const CSV_HEADERS = ["Article Name", "Article URL", "Category"]
const CSV_HEADERS_WITH_CONTEXT = ["Article Name", "Article URL", "Category", "Match Context"]

// Escape HTML entities for CSV output
function escapeHtmlForCsv(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function generateCsvContent(
  rows: Array<[string, string, string] | [string, string, string, string]>,
) {
  // Check if we have 4-column rows (with context)
  const hasContext = rows.length > 0 && rows[0].length === 4
  const headers = hasContext ? CSV_HEADERS_WITH_CONTEXT : CSV_HEADERS

  // Combine headers and rows
  return [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
  ].join("\n")
}

export function downloadCsv(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function formatSearchResultsForCsv(
  results: SearchMatch[],
  searchHtml = false,
): Array<[string, string, string] | [string, string, string, string]> {
  return results.map((result) => {
    const baseRow: [string, string, string] = [
      result.articleTitle.replace(/"/g, '""'), // Escape quotes in article title
      result.articleUrl,
      result.categoryHierarchy ? result.categoryHierarchy.join(" > ") : "",
    ]

    if (searchHtml) {
      // Include match context and escape HTML
      const matchContext = result.matches
        .map((match) => escapeHtmlForCsv(match.highlightedContext))
        .join(" | ")
      return [...baseRow, matchContext] as [string, string, string, string]
    }

    return baseRow
  })
}
