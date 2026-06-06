export enum WatchtowerEventType {
  JAVASCRIPT_ERROR = "JS_ERROR",
  UNHANDLED_PROMISE = "PROMISE_ERROR",
  API_FAILURE = "API_ERROR",
  PERFORMANCE_METRIC = "PERFORMANCE",
}

export interface WatchtowerEventPayload {
  projectKey: string;
  type: WatchtowerEventType;
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}
