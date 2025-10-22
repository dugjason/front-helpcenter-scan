import type { NextRequest } from "next/server"
import { streamSearchResults } from "../../actions"

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  return streamSearchResults(formData)
}

// Set the runtime to edge for better streaming support
export const runtime = "edge"
