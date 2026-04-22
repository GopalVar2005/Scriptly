// client/src/services/api.js
// In production, VITE_API_URL points to the Render backend (e.g. https://scriptly-backend.onrender.com/api)
// In development, falls back to '/api' which is proxied by Vite to localhost:5001
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function handleResponse(response) {
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error("Please login to continue");
    throw new Error(json?.error || "Request failed");
  }
  
  if (json && typeof json.success === 'boolean') {
      if (!json.success) throw new Error(json.error || "Request failed");
      if (json.data !== undefined) return json.data;
      return json;
  }
  return json;
}

export async function login(email, password) {
  const response = await fetch(`${BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include'
  });
  return handleResponse(response);
}

export async function logout() {
  const response = await fetch(`${BASE_URL}/users/logout`, {
    method: 'POST',
    credentials: 'include'
  });
  return handleResponse(response);
}

export async function register(email, password) {
  const response = await fetch(`${BASE_URL}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include'
  });
  return handleResponse(response);
}

export async function transcribe(audioBlob) {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  const response = await fetch(`${BASE_URL}/transcribe/transcribe`, {
    method: "POST",
    body: formData,
    credentials: 'include'
  });
  return handleResponse(response);
}

export async function summarize(text, mode = 'first_pass') {
  const response = await fetch(`${BASE_URL}/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, mode }),
    credentials: 'include'
  });
  return handleResponse(response);
}

// ===== NOTES API ===== //

export async function saveNote(data) {
  const response = await fetch(`${BASE_URL}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include"
  });
  return handleResponse(response);
}

export async function getNotes() {
  const response = await fetch(`${BASE_URL}/notes`, {
    method: "GET",
    credentials: "include"
  });
  return handleResponse(response);
}

export async function getNoteById(id) {
  const response = await fetch(`${BASE_URL}/notes/${id}`, {
    method: "GET",
    credentials: "include"
  });
  return handleResponse(response);
}

export async function updateNote(id, updatedData) {
  const response = await fetch(`${BASE_URL}/notes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedData),
    credentials: "include"
  });
  return handleResponse(response);
}


export async function deleteNote(id) {
  const response = await fetch(`${BASE_URL}/notes/${id}`, {
    method: "DELETE",
    credentials: "include"
  });
  return handleResponse(response);
}

export async function explainConcept(term, context = "", level = "simple") {
  const response = await fetch(`${BASE_URL}/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ term, context, level })
  });
  return handleResponse(response);
}

export async function generateQuiz(noteId) {
  const response = await fetch(`${BASE_URL}/quiz/generate/${noteId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include"
  });
  return handleResponse(response);
}

export async function processYouTubeUrl(url) {
  const response = await fetch(`${BASE_URL}/youtube/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ url })
  });
  return handleResponse(response);
}

export async function fetchYouTubeMetadata(url, signal) {
  const response = await fetch(`${BASE_URL}/youtube/metadata`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ url }),
    signal
  });
  return handleResponse(response);
}
