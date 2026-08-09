import "server-only";

import axios from "axios";
import { createHmac, randomUUID } from "node:crypto";

const apiUrl = process.env.NEXT_PUBLIC_URL_API;

export const loginWithProvider = async (
  email: string,
  provider: string
) => {
  const secret = process.env.AUTH_BRIDGE_SECRET;

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_URL_API is not configured");
  }

  if (!secret) {
    throw new Error("AUTH_BRIDGE_SECRET is not configured");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedProvider = provider.trim().toLowerCase();
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = randomUUID();

  const payload = [
    normalizedProvider,
    normalizedEmail,
    timestamp.toString(),
    nonce,
  ].join("|");

  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const response = await axios.post(`${apiUrl}/login-provider`, {
    email: normalizedEmail,
    provider: normalizedProvider,
    timestamp,
    nonce,
    signature,
  });

  return response.data;
};
