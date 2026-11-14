export const COFRE_API = "/api/cofre";
let cached = null,
  inflight = null,
  at = 0;
export function currentWorkspace() {
  return cached;
}
export function clearWorkspace() {
  cached = null;
  at = 0;
}
function publish(view) {
  if (cached && view.state.revision < cached.state.revision)
    return { ...cached, ...(view.result ? { result: view.result, replayed: view.replayed } : {}) };
  cached = view;
  at = Date.now();
  window.dispatchEvent(new CustomEvent("cofre-cloud-update", { detail: view }));
  return view;
}
async function request(body) {
  let response;
  try {
    response = await fetch(COFRE_API, {
      method: body ? "POST" : "GET",
      credentials: "same-origin",
      headers: { ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(body ? 75000 : 20000),
      cache: "no-store",
    });
  } catch {
    const e = new Error(
      "Falha de conexão. Confira o status antes de repetir a operação; o identificador será preservado.",
    );
    e.code = "NETWORK";
    throw e;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const e = new Error(data.error || "Não foi possível concluir a operação.");
    e.code = data.code;
    e.status = response.status;
    e.response = { data };
    throw e;
  }
  return publish(data);
}
export async function loadWorkspace(force = false) {
  if (!force && cached && Date.now() - at < 2500) return cached;
  if (!force && inflight) return inflight;
  const promise = request();
  if (!force) inflight = promise;
  try {
    return await promise;
  } finally {
    if (!force) inflight = null;
  }
}
async function pendingKey(action, payload) {
  const raw = new TextEncoder().encode(JSON.stringify({ action, payload }));
  const digest = await crypto.subtle.digest("SHA-256", raw);
  return (
    "cofre-direct-pending-" +
    Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}
export async function perform(action, payload = {}, idempotencyKey) {
  const storageKey = await pendingKey(action, payload);
  let prior;
  try {
    prior = sessionStorage.getItem(storageKey);
  } catch {}
  const key = idempotencyKey || prior || crypto.randomUUID();
  try {
    sessionStorage.setItem(storageKey, key);
  } catch {}
  try {
    const result = await request({ action, payload, idempotencyKey: key });
    try {
      sessionStorage.removeItem(storageKey);
    } catch {}
    return result;
  } catch (e) {
    if (e.code !== "NETWORK") {
      try {
        sessionStorage.removeItem(storageKey);
      } catch {}
      await loadWorkspace(true).catch(() => {});
    }
    throw e;
  }
}
