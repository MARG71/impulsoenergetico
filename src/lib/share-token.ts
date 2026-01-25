import crypto from "crypto";
export function makeShareToken() {
  return crypto.randomBytes(32).toString("hex");
}
