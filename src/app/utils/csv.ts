import type { SearchMatch } from "../actions"

const CSV_HEADERS = ["Article Name", "Article URL", "Category"]

export function generateCsvContent(rows: Array<[string, string, string]>) {
  // Combine headers and rows
  return [CSV_HEADERS.join(","), ...rows.map((row) => row.join(","))].join("\n")
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

export function formatSearchResultsForCsv(results: SearchMatch[]): Array<[string, string, string]> {
  return results.map((result) => [
    `"${result.articleTitle.replace(/"/g, '""')}"`, // Escape quotes in article title
    `"${result.articleUrl}"`,
    `"${result.categoryHierarchy ? result.categoryHierarchy.join(" > ") : ""}"`,
  ])
}
