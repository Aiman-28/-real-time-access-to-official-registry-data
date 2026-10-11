const API_BASE = "https://api.thekyb.com/v2";

function headers(token) {
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    token: token || "",
  };
}

async function handle(res) {
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.message || `Request failed (${res.status})`);
  }
  return json;
}

/** 1) Supported Countries Listing — GET /v2/countries */
export async function getCountries(token) {
  const res = await fetch(`${API_BASE}/countries`, {
    method: "GET",
    headers: headers(token),
  });
  const json = await handle(res);
  return json.data || [];
}

/** 2) Company Search — POST /v2/kyb */
export async function searchCompanies(token, payload) {
  const res = await fetch(`${API_BASE}/kyb`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(payload),
  });
  const json = await handle(res);
  return json.data;
}

/** 3) Company Search Results — GET /v2/kyb?kyb_request_id=&page=&limit= */
export async function getSearchResults(token, kybRequestId, page, limit) {
  const url = `${API_BASE}/kyb?kyb_request_id=${encodeURIComponent(kybRequestId)}&page=${page}&limit=${limit}`;
  const res = await fetch(url, {
    method: "GET",
    headers: headers(token),
  });
  const json = await handle(res);
  return json.data;
}

/** 4) Detailed Company Insights — GET /v2/kyb/{kyb_response_id} */
export async function getCompanyDetail(token, kybResponseId) {
  const res = await fetch(`${API_BASE}/kyb/${encodeURIComponent(kybResponseId)}`, {
    method: "GET",
    headers: headers(token),
  });
  const json = await handle(res);
  return json.data;
}
