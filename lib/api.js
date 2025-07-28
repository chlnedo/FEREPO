const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001"

// Helper function to handle API responses
async function handleResponse(response) {
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

// Get all workspace members
export async function getMembers() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/members`)
    return await handleResponse(response)
  } catch (error) {
    console.error("Error fetching members:", error)
    throw error
  }
}

// Get PRs for a member with filters
export async function getPRs({ author, from, to, repo }) {
  try {
    const params = new URLSearchParams({
      author,
      from,
      to,
      repo,
    })

    const response = await fetch(`${API_BASE_URL}/api/prs?${params}`)
    return await handleResponse(response)
  } catch (error) {
    console.error("Error fetching PRs:", error)
    throw error
  }
}
