import { sendEvent } from "./packages/sdk/src/core/transport";

console.log("🚀 Launching Watchtower telemetry test suite...");

const TARGET_API_URL = "http://localhost:3001/api/events";
const SECURITY_HEADERS = {
  "x-api-key": "watchtower_secret_token_123!",
};

const mockWarningPayload = {
  projectKey: "mock-proj-123",
  type: "WARNING",
  message: "Database connection pool capacity utilization at 80%.",
  url: "http://localhost:3000/mock-test",
  userAgent: "NodeJS-Telemetry-Runner",
  timestamp: new Date().toISOString(),
};

const mockErrorPayload = {
  projectKey: "mock-proj-123",
  type: "CRITICAL",
  message: "Heap out of memory: Server instance terminated unexpectedly.",
  stack:
    "Error: Out of memory\n    at CoreServer.initialize (server.ts:42:12)\n    at processTicksAndRejections (node:internal/process/task_queues:95:5)",
  url: "http://localhost:3000/mock-test",
  userAgent: "NodeJS-Telemetry-Runner",
  timestamp: new Date().toISOString(),
};

async function executeTelemetryTest() {
  try {
    console.log(
      "📡 Dispatching warning and critical log streams to local pipeline...",
    );

    await sendEvent(TARGET_API_URL, mockWarningPayload, SECURITY_HEADERS);
    await sendEvent(TARGET_API_URL, mockErrorPayload, SECURITY_HEADERS);

    console.log("✅ Telemetry simulation successfully processed.");
  } catch (error) {
    console.error("❌ Operational failure in telemetry transport loop:", error);
  }
}

executeTelemetryTest();
