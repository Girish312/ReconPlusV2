const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:5000";

async function buildAuthHeaders(currentUser) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.warn("Could not get Firebase token:", error);
    }
  }

  return headers;
}

async function parseResponse(response) {
  let data = null;

  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    const message = data?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export async function runScan(domain, currentUser) {
  const headers = await buildAuthHeaders(currentUser);

  const response = await fetch(`${API_BASE_URL}/api/scan`, {
    method: "POST",
    headers,
    body: JSON.stringify({ domain }),
  });

  return parseResponse(response);
}

export async function fetchReconReport(currentUser) {
  const headers = await buildAuthHeaders(currentUser);

  const response = await fetch(`${API_BASE_URL}/api/report/json`, {
    method: "GET",
    headers,
  });

  return parseResponse(response);
}

export function getPdfReportUrl() {
  return `${API_BASE_URL}/api/report/pdf`;
}
