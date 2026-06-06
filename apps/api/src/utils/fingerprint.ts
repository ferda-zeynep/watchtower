import crypto from "crypto";

export function generateFingerprint(
  title: string,
  stackTrace?: string,
): string {
  const stackLines = stackTrace
    ? stackTrace.split("\n").slice(0, 2).join("")
    : "";
  const rawString = `${title}_${stackLines}`.replace(/\s+/g, "");
  return crypto.createHash("sha256").update(rawString).digest("hex");
}
