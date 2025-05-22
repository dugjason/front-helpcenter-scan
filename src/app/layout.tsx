import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Front Knowldege Base Scanner',
  description: 'Search for content across a Front Knowledge Base',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="p-4 bg-transparent fixed top-0 left-0 right-0 flex justify-end z-10">
          <HeaderLinks />
        </header>
        <main className="min-h-screen p-8">
          {children}
        </main>
      </body>
    </html>
  )
} 

const HeaderLinks = () => {
  return (
    <div className="flex items-center gap-2">
      <Link 
            href="https://front.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Front"
            className="opacity-90 hover:opacity-100 transition-opacity"
          >
            <svg width="32" height="32" viewBox="0 0 130 130" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20.0242 108.978H49.809V50.0616H109.194V20.3987H20.0242V108.978Z" fill="#A857F1"/>
<path d="M83.506 110.75C98.3453 110.75 110.375 98.7199 110.375 83.8805C110.375 69.0411 98.3453 57.0115 83.506 57.0115C68.6666 57.0115 56.637 69.0411 56.637 83.8805C56.637 98.7199 68.6666 110.75 83.506 110.75Z" fill="#A857F1"/>
</svg>

          </Link>
          <Link 
            href="https://github.com/dugjason/front-helpcenter-scan"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            className="opacity-70 hover:opacity-100 transition-opacity"
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </Link>
    </div>
  )
}