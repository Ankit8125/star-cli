import { getStoredToken } from "../../lib/token.js";

const BASE_URL = process.env.STAR_BACKEND_URL || process.env.BETTER_AUTH_URL || "http://localhost:5000";

export async function apiClient(endpoint, options = {}) {
  const token = await getStoredToken();
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token?.access_token) {
    headers["Authorization"] = `Bearer ${token.access_token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}
