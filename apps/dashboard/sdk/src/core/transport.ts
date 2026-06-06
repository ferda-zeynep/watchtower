import { currentConfig } from "./init";

export const sendEvent = async (
  url: string,
  payload: any,
  customHeaders?: Record<string, string>,
) => {
  const data = JSON.stringify(payload);

  const apiKey = customHeaders?.["x-api-key"] || currentConfig?.apiKey || "";

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    ...customHeaders,
  };

  try {
    await fetch(url, {
      method: "POST",
      headers: finalHeaders,
      body: data,
      keepalive: true,
    });
  } catch (err) {
    console.error("Watchtower telemetry failed:", err);
  }
};
