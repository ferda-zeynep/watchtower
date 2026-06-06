export interface WatchtowerEventPayload {
  message: string;
  stack?: string;
  timestamp: number;
}

import { sendEvent } from "../core/transport";

export const initErrorCollector = (projectKey: string, apiUrl: string) => {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    const payload: WatchtowerEventPayload = {
      message: event.message,
      stack: event.error?.stack,
      timestamp: Date.now(),
    };

    (sendEvent as any)("ERROR", payload, projectKey, apiUrl);
  });
};
