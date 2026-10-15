// One place that talks to the backend.
// - always sends the login cookie
// - never assumes the answer is JSON (an HTML error page is handled safely)
// - turns every failure into an ApiError with a readable message
// - tells the app when the session has expired (401)

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const unauthorizedListeners = new Set();

export function onUnauthorized(listener) {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

const DEFAULT_MESSAGES = {
  400: "Please check the information you entered.",
  401: "Please log in to continue.",
  403: "You do not have permission to do that.",
  404: "We could not find what you were looking for.",
  409: "That already exists.",
  500: "Something went wrong on the server. Please try again."
};

const looksLikeHtml = (text) => /^\s*</.test(text);

function pickMessage(status, data, text) {
  if (data && typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }
  if (data && typeof data.error === "string" && data.error.trim()) {
    return data.error;
  }
  if (text && !looksLikeHtml(text) && text.length <= 200) {
    return text.trim();
  }
  return (
    DEFAULT_MESSAGES[status] ||
    (status >= 500
      ? DEFAULT_MESSAGES[500]
      : "The request could not be completed.")
  );
}

export async function request(
  path,
  { method = "GET", body, handleUnauthorized = true } = {}
) {
  let response;

  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {})
      },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError(
      "Cannot reach the server. Make sure the backend is running on port 8080.",
      0
    );
  }

  const isJson = (response.headers.get("content-type") || "").includes(
    "json"
  );

  let text = "";
  let data = null;

  if (response.status !== 204) {
    text = await response.text();
    if (isJson && text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }
  }

  // If the backend answered with a redirect to its own login page,
  // fetch silently follows it. Treat that as "not logged in".
  const redirectedToLogin =
    response.redirected && /login/i.test(response.url);
  const status = redirectedToLogin ? 401 : response.status;

  if (status === 401 && handleUnauthorized) {
    unauthorizedListeners.forEach((listener) => listener());
  }

  if (redirectedToLogin || !response.ok) {
    throw new ApiError(pickMessage(status, data, text), status, data);
  }

  if (!isJson && looksLikeHtml(text)) {
    throw new ApiError(
      "The server sent a web page instead of data. Check the backend.",
      response.status
    );
  }

  return data;
}
