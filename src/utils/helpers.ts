import { createHash } from "crypto";
import { Readable } from "stream";

// Sanitize string for step function execution name
function sanitizeString(name: string) {
  // Matches disallowed characters: control characters, whitespaces, and specified special characters
  const disallowedCharsRegex =
    /[\u0000-\u001F\u007F-\u009F\s\<\>\{\}\[\]\?\*\\"\#\%\^\\\|\~\`\$\&\,\;\:\/]/g;

  // Replace disallowed characters with an empty string
  return name.replace(disallowedCharsRegex, "");
}

function hash(name: string) {
  return createHash("sha256").update(name).digest("hex");
}

export function generateExecutionName(name: string) {
  const sanitizedName = sanitizeString(name).substring(0, 73);
  const timestamp = Date.now();
  const hashValue = hash(`${timestamp}`).substring(0, 6);
  return `${hashValue}-${sanitizedName}`;
}

export function streamToString(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    stream.on("data", (chunk) => (data += chunk));
    stream.on("end", () => resolve(data));
    stream.on("error", reject);
  });
}
