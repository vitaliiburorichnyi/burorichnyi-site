// Shared helpers for the Leo test page. Secrets come only from Vercel environment variables.
const VAPI = "https://api.vapi.ai";

export const cfg = {
  privateKey: process.env.VAPI_PRIVATE_KEY,
  publicKey: process.env.VAPI_PUBLIC_KEY,
  accessCode: (process.env.ACCESS_CODE || "").trim(),
  assistantId: process.env.ASSISTANT_ID || "11ee37b9-3545-41a2-9ce8-4a054bf73d51",
  phoneNumberId: process.env.PHONE_NUMBER_ID || "aebdf1aa-a5b1-4761-ba89-5ac064d258b2",
  dailyCap: Number(process.env.DAILY_CAP || 30),
  perNumberDaily: Number(process.env.PER_NUMBER_DAILY || 3),
};

// Silence handling, sent with every call so it works even if the dashboard drops the hooks.
export const hooks = [
  { on: "customer.speech.timeout", options: { timeoutSeconds: 20, triggerMaxCount: 3, triggerResetMode: "onUserSpeech" },
    do: [{ type: "say", exact: "Are you still there?" }] },
  { on: "customer.speech.timeout", options: { timeoutSeconds: 35, triggerMaxCount: 3, triggerResetMode: "onUserSpeech" },
    do: [{ type: "say", exact: "Sorry, I haven't heard you for a moment. Take your time." }] },
  { on: "customer.speech.timeout", options: { timeoutSeconds: 50, triggerMaxCount: 3, triggerResetMode: "onUserSpeech" },
    do: [{ type: "say", exact: "I think the line may have dropped. I'll try you again later." }, { type: "tool", tool: { type: "endCall" } }] },
];

export function clean(text, max) {
  return String(text || "").replace(/[{}<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function codeOk(code) {
  return cfg.accessCode.length > 0 && String(code || "").trim() === cfg.accessCode;
}

export async function vapi(path, options = {}) {
  const res = await fetch(VAPI + path, {
    ...options,
    headers: { Authorization: `Bearer ${cfg.privateKey}`, "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export function send(res, status, data) {
  res.status(status).setHeader("Cache-Control", "no-store").json(data);
}
