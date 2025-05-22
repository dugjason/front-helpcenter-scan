import { streamSearchResults } from '../../actions'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  return streamSearchResults(formData)
}

// Set the runtime to edge for better streaming support
export const runtime = 'edge' 