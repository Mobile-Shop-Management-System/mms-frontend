import axios from "axios";

/**
 * Convert the project's Django REST error shapes into one readable message.
 * Supports `{ message, errors }`, DRF field errors, Axios network failures,
 * and plain JavaScript errors.
 */
export function getApiErrorMessage(
  error,
  fallback = "Something went wrong. Please try again.",
) {
  if (!error) return fallback;
  if (error.userMessage) return error.userMessage;

  const payload = error.response?.data;
  const details = payload?.errors ?? payload?.detail ?? payload;
  const detailMessage = flattenErrorDetails(details);

  if (detailMessage) return detailMessage;
  if (typeof payload?.message === "string" && payload.message.trim())
    return payload.message;
  if (typeof payload?.detail === "string" && payload.detail.trim())
    return payload.detail;

  if (axios.isAxiosError(error)) {
    if (!error.response)
      return "Unable to reach the server. Check your connection and try again.";
    if (error.response.status === 401)
      return "Your session has expired. Please sign in again.";
    if (error.response.status === 403)
      return "You do not have permission to perform this action.";
    if (error.response.status >= 500)
      return "The server encountered an error. Please try again shortly.";
  }

  return error.message || fallback;
}

export function getApiSuccessMessage(
  response,
  fallback = "Saved successfully.",
) {
  const message = response?.data?.message ?? response?.message;
  return typeof message === "string" && message.trim() && message !== "Success"
    ? message
    : fallback;
}

function flattenErrorDetails(value, label = "") {
  if (!value || typeof value === "string")
    return typeof value === "string" ? value : "";
  if (Array.isArray(value)) {
    return value
      .map((item) => flattenErrorDetails(item, label))
      .filter(Boolean)
      .join(" ");
  }
  if (typeof value !== "object") return String(value);

  return Object.entries(value)
    .map(([key, item]) => {
      const message = flattenErrorDetails(item, key);
      if (!message) return "";
      return key === "non_field_errors" || key === "detail"
        ? message
        : `${humanize(key)}: ${message}`;
    })
    .filter(Boolean)
    .join(" ");
}

function humanize(value) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
