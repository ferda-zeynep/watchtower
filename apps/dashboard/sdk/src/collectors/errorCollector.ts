import {
  WatchtowerEventType,
  WatchtowerEventPayload,
} from "@watchtower/shared";
import { sendEvent } from "../core/transport";

export const initErrorCollector = (projectKey: string, apiUrl: string) => {
  if (typeof window === "undefined") {
    console.log(
      "ℹ️ Watchtower SDK running in Node.js environment. Skipping browser listeners.",
    );
    return;
  }

  window.onerror = (message, url, line, col, error) => {
    const payload: WatchtowerEventPayload = {
      projectKey,
      type: WatchtowerEventType.JAVASCRIPT_ERROR,
      message: error?.message || String(message),
      stack: error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    sendEvent(`${apiUrl}/api/events`, payload);
  };

  window.addEventListener("unhandledrejection", (event) => {
    const payload: WatchtowerEventPayload = {
      projectKey,
      type: WatchtowerEventType.UNHANDLED_PROMISE,
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    sendEvent(`${apiUrl}/api/events`, payload);
  });
};
