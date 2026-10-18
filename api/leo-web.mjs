// POST { code, name, business } -> settings for a browser call (public key is meant to be public).
import { cfg, hooks, clean, codeOk, send } from "./_leo-lib.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { code: "method", error: "Use POST." });
  if (!cfg.publicKey) return send(res, 500, { code: "not_configured", error: "Server is not configured yet." });
  const { code, name, business } = req.body || {};
  if (!codeOk(code)) return send(res, 401, { code: "wrong_code", error: "Wrong access code." });
  return send(res, 200, {
    publicKey: cfg.publicKey,
    assistantId: cfg.assistantId,
    overrides: { variableValues: { name: clean(name, 60), business_context: clean(business, 200) }, hooks },
  });
}
