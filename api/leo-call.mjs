// POST { phone, name, business, code } -> Leo calls the phone number.
import { cfg, hooks, clean, codeOk, vapi, send } from "./_leo-lib.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Use POST." });
  if (!cfg.privateKey) return send(res, 500, { error: "Server is not configured yet." });

  const { phone, name, business, code } = req.body || {};
  if (!codeOk(code)) return send(res, 401, { error: "Wrong access code." });

  const number = String(phone || "").replace(/[\s()\-.]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(number)) {
    return send(res, 400, { error: "Please enter the number in international format, for example +34 612 345 678." });
  }

  // Limits: counted from Vapi's own call list, so no database is needed.
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const list = await vapi(`/call?phoneNumberId=${cfg.phoneNumberId}&createdAtGt=${encodeURIComponent(since)}&limit=100`);
  if (list.ok && Array.isArray(list.body)) {
    if (list.body.length >= cfg.dailyCap) {
      return send(res, 429, { error: "Daily call limit reached. Please try again tomorrow, or use Talk in browser." });
    }
    const mine = list.body.filter((c) => c.customer && c.customer.number === number).length;
    if (mine >= cfg.perNumberDaily) {
      return send(res, 429, { error: `This number already got ${mine} calls today. Please try again tomorrow, or use Talk in browser.` });
    }
  }

  const overrides = {
    variableValues: { name: clean(name, 60), business_context: clean(business, 200) },
    hooks,
  };
  const payload = { assistantId: cfg.assistantId, phoneNumberId: cfg.phoneNumberId, customer: { number } };

  let call = await vapi("/call", { method: "POST", body: JSON.stringify({ ...payload, assistantOverrides: overrides }) });
  if (!call.ok && call.status === 400) {
    // Fallback without hooks, in case the API rejects them as an override.
    const { hooks: _drop, ...rest } = overrides;
    call = await vapi("/call", { method: "POST", body: JSON.stringify({ ...payload, assistantOverrides: rest }) });
  }
  if (!call.ok) {
    console.error("Vapi call failed", call.status, JSON.stringify(call.body).slice(0, 500));
    return send(res, 502, { error: "The call could not be started. Please try again in a minute." });
  }
  return send(res, 200, { ok: true });
}
