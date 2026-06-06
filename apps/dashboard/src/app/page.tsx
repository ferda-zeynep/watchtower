"use client";

import React, { useEffect, useState, useMemo } from "react";
import { init } from "@watchtower/sdk";
import { io } from "socket.io-client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface TelemetryEvent {
  id: string;
  projectKey: string;
  type: string;
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
}

export default function DashboardPage() {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    init({
      projectKey: "DASHBOARD-INTERNAL-ERRORS",
      apiKey: "watchtower_secret_token_123!",
    });

    const createMockEvent = (type: string, msg: string): TelemetryEvent => ({
      id: Math.random().toString(36).substring(7),
      projectKey: "WATCHTOWER-CORE",
      type: type,
      message: msg,
      timestamp: new Date().toISOString(),
      url: "https://watchtower.vercel.app/demo",
    });

    const initialEvents: TelemetryEvent[] = [
      {
        id: "1",
        projectKey: "ECOMMERCE-APP",
        type: "JAVASCRIPT_ERROR",
        message:
          "Uncaught TypeError: Cannot read properties of undefined (reading 'map')",
        stack:
          "TypeError: Cannot read properties of undefined (reading 'map')\n    at ProductGrid (Grid.tsx:24:12)\n    at renderWithHooks (react-dom.development.js:16305:18)",
        url: "https://shop.watchtower.dev/products",
        timestamp: new Date(Date.now() - 60000 * 5).toISOString(),
      },
      {
        id: "2",
        projectKey: "AUTH-SERVICE",
        type: "UNHANDLED_PROMISE",
        message:
          "UnhandledPromiseRejection: API request timed out after 5000ms",
        stack:
          "Error: API request timed out\n    at Timeout._onTimeout (index.js:43:11)\n    at listOnTimeout (internal/timers.js:557:17)",
        url: "https://auth.watchtower.dev/v1/login",
        timestamp: new Date(Date.now() - 60000 * 12).toISOString(),
      },
      {
        id: "3",
        projectKey: "ECOMMERCE-APP",
        type: "WARNING",
        message:
          "React Detector: Duplicate keys detected in item list iteration.",
        url: "https://shop.watchtower.dev/cart",
        timestamp: new Date(Date.now() - 60000 * 20).toISOString(),
      },
    ];
    setEvents(initialEvents);

    const interval = setInterval(() => {
      const types = ["JAVASCRIPT_ERROR", "WARNING", "CRITICAL"];
      const messages = [
        "Database dynamic pool connection constraint reached.",
        "Failed to load resource: the server responded with a status of 404",
        "Performance trace threshold exceeded on dashboard compilation route",
        "WebSocket connection handshaking dropped prematurely due to internal network state",
      ];

      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      const streamEvent = createMockEvent(randomType, randomMsg);

      setEvents((prev) => [streamEvent, ...prev]);
      setToastMessage(`🚨 New ${streamEvent.type} simulated stream received!`);
      setTimeout(() => setToastMessage(null), 2500);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const triggerManualUpdate = () => {
    const manualEvent: TelemetryEvent = {
      id: Math.random().toString(36).substring(7),
      projectKey: "MANUAL-TRIGGER-APP",
      type: "CRITICAL",
      message: `Real-Time UI telemetry event dispatched successfully #${Date.now().toString().slice(-4)}`,
      stack:
        "Error: Manual telemetry test routine executed.\n    at HTMLButtonElement.onClick (page.tsx:112:34)",
      url: "https://watchtower-jt43.vercel.app/dashboard",
      timestamp: new Date().toISOString(),
    };

    setEvents((prev) => [manualEvent, ...prev]);
    setToastMessage("⚡ Manual telemetry burst broadcasted!");
    setTimeout(() => setToastMessage(null), 2500);
  };

  const getBadgeStyles = (type: string) => {
    const normalizedType = (type || "").toUpperCase();
    if (
      normalizedType === "CRITICAL" ||
      normalizedType === "ERROR" ||
      normalizedType === "JAVASCRIPT_ERROR"
    ) {
      return { color: "#ef4444", backgroundColor: "#fef2f2" };
    }
    if (
      normalizedType === "WARNING" ||
      normalizedType === "WARN" ||
      normalizedType === "UNHANDLED_PROMISE"
    ) {
      return { color: "#f59e0b", backgroundColor: "#fffbeb" };
    }
    return { color: "#3b82f6", backgroundColor: "#eff6ff" };
  };

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const currentType = (event.type || "").toUpperCase();
      const filterType = selectedType.toUpperCase();

      if (filterType !== "ALL") {
        if (filterType === "CRITICAL") {
          const isCrit =
            currentType.includes("CRIT") ||
            currentType.includes("ERR") ||
            currentType.includes("JS");
          if (!isCrit) return false;
        } else if (filterType === "WARNING") {
          const isWarn =
            currentType.includes("WARN") || currentType.includes("PROM");
          if (!isWarn) return false;
        } else if (filterType === "INFO") {
          if (!currentType.includes("INFO")) return false;
        }
      }

      const normalizedSearch = searchTerm.trim().toLowerCase();
      if (normalizedSearch !== "") {
        const matchesSearch =
          (event.message || "").toLowerCase().includes(normalizedSearch) ||
          (event.projectKey || "").toLowerCase().includes(normalizedSearch) ||
          (event.type || "").toLowerCase().includes(normalizedSearch);

        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [events, selectedType, searchTerm]);

  const totalCount = events.length;
  const jsErrorsCount = events.filter((e) => {
    const t = (e.type || "").toUpperCase();
    return t.includes("JS") || t.includes("CRIT") || t.includes("ERR");
  }).length;
  const warningsCount = events.filter((e) => {
    const t = (e.type || "").toUpperCase();
    return t.includes("WARN") || t.includes("PROM");
  }).length;
  const uniqueProjectsCount = new Set(
    events.map((e) => (e.projectKey || "").toUpperCase()),
  ).size;

  const chartData = useMemo(() => {
    const groups: {
      [key: string]: { time: string; Errors: number; Warnings: number };
    } = {};
    [...events].reverse().forEach((event) => {
      if (!event.timestamp) return;
      const date = new Date(event.timestamp);
      const timeStr = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      if (!groups[timeStr])
        groups[timeStr] = { time: timeStr, Errors: 0, Warnings: 0 };
      const t = (event.type || "").toUpperCase();
      if (t.includes("JS") || t.includes("CRIT") || t.includes("ERR"))
        groups[timeStr].Errors += 1;
      else if (t.includes("WARN") || t.includes("PROM"))
        groups[timeStr].Warnings += 1;
    });
    return Object.values(groups);
  }, [events]);

  const theme = {
    bg: isDarkMode ? "#111827" : "#f9fafb",
    cardBg: isDarkMode ? "#1f2937" : "#fff",
    text: isDarkMode ? "#f9fafb" : "#111827",
    textMuted: isDarkMode ? "#9ca3af" : "#4b5563",
    border: isDarkMode ? "#374151" : "#e5e7eb",
    inputBg: isDarkMode ? "#374151" : "#fff",
  };

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "sans-serif",
        backgroundColor: theme.bg,
        minHeight: "100vh",
        color: theme.text,
        transition: "background-color 0.2s ease",
      }}
    >
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
      `}</style>

      <header
        style={{
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <h1
              style={{
                color: theme.text,
                margin: 0,
                fontSize: "2rem",
                fontWeight: "bold",
              }}
            >
              Watchtower Telemetry
            </h1>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                backgroundColor: isDarkMode ? "#064e3b" : "#ecfdf5",
                padding: "0.25rem 0.6rem",
                borderRadius: "20px",
                border: `1px solid ${isDarkMode ? "#047857" : "#a7f3d0"}`,
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#10b981",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "pulse 2s infinite ease-in-out",
                }}
              ></span>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: isDarkMode ? "#34d399" : "#047857",
                  fontWeight: "bold",
                }}
              >
                LIVE
              </span>
            </div>
          </div>
          <p style={{ color: theme.textMuted, margin: "0.5rem 0 0 0" }}>
            Real-time incident tracking and frontend observability platform.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.cardBg,
              color: theme.text,
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "bold",
            }}
          >
            {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>

          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search message or project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.inputBg,
                color: theme.text,
                fontSize: "0.875rem",
                width: "240px",
                outline: "none",
              }}
            />
            {searchTerm.trim() !== "" && (
              <div
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "32px",
                  fontSize: "11px",
                  color: "#10b981",
                  fontWeight: "bold",
                }}
              >
                Found: {filteredEvents.length}
              </div>
            )}
          </div>

          <div>
            <select
              id="typeFilter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.cardBg,
                color: theme.text,
                fontSize: "0.875rem",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="ALL">All Types</option>
              <option value="CRITICAL">Critical / JS Errors</option>
              <option value="WARNING">Warnings / Promises</option>
              <option value="INFO">Info</option>
            </select>
          </div>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            backgroundColor: theme.cardBg,
            padding: "1.5rem",
            borderRadius: "8px",
            border: `1px solid ${theme.border}`,
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              fontSize: "0.875rem",
              color: theme.textMuted,
              fontWeight: "600",
            }}
          >
            Total Events
          </div>
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: "bold",
              color: theme.text,
              marginTop: "0.5rem",
            }}
          >
            {totalCount}
          </div>
        </div>
        <div
          style={{
            backgroundColor: theme.cardBg,
            padding: "1.5rem",
            borderRadius: "8px",
            border: `1px solid ${theme.border}`,
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              fontSize: "0.875rem",
              color: "#ef4444",
              fontWeight: "600",
            }}
          >
            ⚠️ JS Errors / Critical
          </div>
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: "bold",
              color: "#ef4444",
              marginTop: "0.5rem",
            }}
          >
            {jsErrorsCount}
          </div>
        </div>
        <div
          style={{
            backgroundColor: theme.cardBg,
            padding: "1.5rem",
            borderRadius: "8px",
            border: `1px solid ${theme.border}`,
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              fontSize: "0.875rem",
              color: "#f59e0b",
              fontWeight: "600",
            }}
          >
            🔔 Warnings / Promises
          </div>
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: "bold",
              color: "#f59e0b",
              marginTop: "0.5rem",
            }}
          >
            {warningsCount}
          </div>
        </div>
        <div
          style={{
            backgroundColor: theme.cardBg,
            padding: "1.5rem",
            borderRadius: "8px",
            border: `1px solid ${theme.border}`,
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              fontSize: "0.875rem",
              color: "#3b82f6",
              fontWeight: "600",
            }}
          >
            📁 Active Projects
          </div>
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: "bold",
              color: "#3b82f6",
              marginTop: "0.5rem",
            }}
          >
            {uniqueProjectsCount}
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: theme.cardBg,
          padding: "2rem",
          borderRadius: "8px",
          border: `1px solid ${theme.border}`,
          marginBottom: "2rem",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        <h2
          style={{
            fontSize: "1.125rem",
            fontWeight: "bold",
            color: theme.text,
            margin: "0 0 1.5rem 0",
          }}
        >
          Events Timeline Analytics
        </h2>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDarkMode ? "#374151" : "#f3f4f6"}
              />
              <XAxis
                dataKey="time"
                stroke="#9ca3af"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="#9ca3af"
                allowDecimals={false}
                style={{ fontSize: "12px" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.cardBg,
                  borderRadius: "6px",
                  border: `1px solid ${theme.border}`,
                  color: theme.text,
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Errors"
                stroke="#ef4444"
                strokeWidth={3}
                activeDot={{ r: 8 }}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Warnings"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <button
          onClick={triggerManualUpdate}
          style={{
            padding: "0.6rem 1.2rem",
            backgroundColor: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
          }}
        >
          ⚡ Test Real-Time Update
        </button>
      </div>

      {loading ? (
        <p>Loading incident logs...</p>
      ) : filteredEvents.length === 0 ? (
        <p style={{ color: theme.textMuted }}>
          No telemetry events found matching the criteria.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {filteredEvents.map((event) => {
            const badgeStyle = getBadgeStyles(event.type);
            return (
              <div
                key={event.id}
                style={{
                  backgroundColor: theme.cardBg,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "8px",
                  padding: "1.5rem",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontWeight: "bold",
                      fontSize: "0.875rem",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      ...badgeStyle,
                    }}
                  >
                    {event.type}
                  </span>
                  <span style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                    {event.timestamp
                      ? new Date(event.timestamp).toLocaleString()
                      : "N/A"}
                  </span>
                </div>

                <h3 style={{ color: theme.text, margin: "1rem 0 0.5rem 0" }}>
                  {event.message}
                </h3>

                <div style={{ fontSize: "0.875rem", color: theme.textMuted }}>
                  <strong>Project:</strong> {event.projectKey} |{" "}
                  <strong>URL:</strong> {event.url || "N/A"}
                </div>

                {event.stack && (
                  <pre
                    style={{
                      backgroundColor: isDarkMode ? "#374151" : "#f3f4f6",
                      padding: "1rem",
                      borderRadius: "6px",
                      overflowX: "auto",
                      fontSize: "0.875rem",
                      color: isDarkMode ? "#e5e7eb" : "#374151",
                      marginTop: "1rem",
                      border: `1px solid ${theme.border}`,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {String(event.stack)}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      )}

      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            backgroundColor: "#1f2937",
            color: "#fff",
            padding: "1rem 1.5rem",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            fontSize: "0.875rem",
            fontWeight: "bold",
            zIndex: 9999,
            borderLeft: "4px solid #ef4444",
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
