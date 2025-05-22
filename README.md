# Front Knowldege Base Scanner

A Next.js application that allows you to search through a Front Knowledge Base knowldege base for specific terms and view the results in context.

## Features

- Search across all articles in a Front Knowledge Base
- Display search results with context and highlighted matches
- Stream results in real-time as they are found
- Show progress indication during search
- Responsive UI with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Run the development server:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Enter the URL of a Front Knowledge Base knowldege base (e.g., https://help.front.com)
2. Enter a search term to find in the knowledge base
3. Click "Search" to begin the search process
4. Results will appear in real-time as they are found
5. Click on article titles to open them in a new tab

## Technology Stack

- Next.js 14
- React 18
- Tailwind CSS
- Server-side Actions
- Edge Runtime
- Streaming API

## How It Works

The application uses Front's public Knowledge Base API to traverse the structure of a knowldege base, fetching all articles and searching for the specified term. When a match is found, it extracts the context around the match and highlights the search term.

The search process runs on the server using Next.js Server Actions and Edge Runtime for better performance. Results are streamed back to the client in real-time as they are found, providing a responsive user experience even with large knowledge bases.

## License

ISC 