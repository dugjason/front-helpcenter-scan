# Front Knowledge Base Scanner

A Next.js application that allows you to search through a Front Knowledge Base knowledge base for specific terms and view the results in context.

## Features

- Search across all articles in a Front Knowledge Base
- Display search results with context and highlighted matches
- Stream results in real-time as they are found
- Show progress indication during search
- Responsive UI with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 20.9 or later
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

4. Open [https://localhost:3000](https://localhost:3000) in your browser

## Deploy on Vercel

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. In the [Vercel dashboard](https://vercel.com/new), import the repository as a new project.
3. Keep the detected Next.js settings and click **Deploy**.
4. Open the deployment URL when the build completes.

### Deploy with the Vercel CLI

Use this procedure from the repository root. It also works for coding agents such as Codex and Claude Code. `vc` is an alias for the Vercel CLI.

1. Install the [Vercel CLI](https://vercel.com/docs/cli) and sign in:

   ```bash
   npm install --global vercel@latest
   vc --version
   vc login
   vc whoami
   ```

   If sign-in needs a browser, ask the user to complete it. Do not ask the user to paste a token into the chat.

2. Link the directory to a project:

   ```bash
   vc link
   ```

   Select the intended team and project. To use the default team and directory name without prompts, use `vc link --yes`. This can create a new project. For a specific project, use `vc link --yes --project <project-name>`.

3. Deploy a preview and open the URL printed by the CLI:

   ```bash
   vc deploy --yes
   ```

4. To deploy to the production domain, run:

   ```bash
   vc deploy --prod --yes
   ```

   The production command updates the project's production deployment. Run it only when a production deployment is intended.

## Usage

1. Enter the URL of a Front Knowledge Base knowledge base (e.g., https://help.front.com)
2. Enter a search term to find in the knowledge base
3. Click "Search" to begin the search process
4. Results will appear in real-time as they are found
5. Click on article titles to open them in a new tab

## Technology Stack

- Next.js 16
- React 19
- Tailwind CSS
- Server-side Actions
- Edge Runtime
- Streaming API

## How It Works

The application uses Front's public Knowledge Base API to traverse the structure of a knowledge base, fetching all articles and searching for the specified term. When a match is found, it extracts the context around the match and highlights the search term.

The search process runs on the server using Next.js Server Actions and Edge Runtime for better performance. Results are streamed back to the client in real-time as they are found, providing a responsive user experience even with large knowledge bases.
