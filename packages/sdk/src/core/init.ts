import { initErrorCollector } from "../collectors/errorCollector";

interface WatchtowerConfig {
  projectKey: string;
  apiUrl?: string;
  apiKey: string;
}

export let currentConfig: WatchtowerConfig | null = null;

export const init = (config: WatchtowerConfig) => {
  const { projectKey, apiUrl = "http://localhost:3001", apiKey } = config;

  if (!projectKey) {
    console.error("Watchtower Error: projectKey is required!");
    return;
  }

  if (!apiKey) {
    console.error("Watchtower Error: apiKey is required!");
    return;
  }

  currentConfig = config;

  initErrorCollector(projectKey, apiUrl);

  console.log("🛡️ Watchtower successfully initialized.");
};
