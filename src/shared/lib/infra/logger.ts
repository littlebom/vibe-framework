/**
 * Lightweight structured logger (no external dependency).
 *
 * - Production: one JSON object per line → ready for log aggregators
 *   (CloudWatch / Loki / Datadog) and trivial to ship to Sentry later.
 * - Development: compact, readable lines.
 * - `logger.child({ requestId })` attaches context (e.g. a correlation id)
 *   to every line.
 * - `setErrorReporter(fn)` registers an optional sink that receives every
 *   `logger.error(...)` call — the env-gated seam for an error tracker
 *   (Sentry/etc.). It is a NO-OP until something registers a reporter, so
 *   there is no external dependency or DSN required by default. A real
 *   integration would call `setErrorReporter` at startup only when its DSN
 *   env var is present.
 *
 * Level is controlled by LOG_LEVEL (debug|info|warn|error); defaults to
 * "info" in production, "debug" otherwise.
 */
type Level = "debug" | "info" | "warn" | "error";

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const isProd = process.env.NODE_ENV === "production";
const minLevel =
  LEVELS[(process.env.LOG_LEVEL as Level) ?? (isProd ? "info" : "debug")] ?? LEVELS.info;

type Ctx = Record<string, unknown>;

/** Optional error sink (e.g. Sentry). Null = no-op until registered. */
type ErrorReporter = (msg: string, ctx?: Ctx) => void;
let errorReporter: ErrorReporter | null = null;

/**
 * Register (or clear, with `null`) the error reporter. Intended to be wired
 * once at app startup by an integration that has a DSN configured; otherwise
 * `logger.error` just writes to stdout as before.
 */
export function setErrorReporter(fn: ErrorReporter | null): void {
  errorReporter = fn;
}

// ── PII / secret redaction ──────────────────────────────────────────────────
// A default guard so a careless `logger.info("...", { user })` can never spill
// a password, token, or national id into the log stream (compliance). Keys are
// matched case-insensitively by substring; matched values become "[redacted]".
// Recurses into nested objects/arrays (depth-capped to stay cheap).
const SENSITIVE = [
  "password", "passwordhash", "token", "secret", "apikey", "apisecret",
  "authorization", "cookie", "sessiontoken", "csrf", "nationalid",
  "creditcard", "cardnumber", "cvv", "webhooksecret", "privatekey",
];
const REDACTED = "[redacted]";

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const key = k.toLowerCase();
    out[k] = SENSITIVE.some((s) => key.includes(s)) ? REDACTED : redact(v, depth + 1);
  }
  return out;
}

function write(level: Level, fn: (...a: unknown[]) => void, msg: string, ctx?: Ctx) {
  if (LEVELS[level] < minLevel) return;
  const safe = ctx ? (redact(ctx) as Ctx) : ctx;
  if (isProd) {
    fn(JSON.stringify({ level, time: new Date().toISOString(), msg, ...(safe ?? {}) }));
  } else {
    const tag = { debug: "·", info: "ℹ", warn: "⚠", error: "✖" }[level];
    if (safe && Object.keys(safe).length) fn(`${tag} ${msg}`, safe);
    else fn(`${tag} ${msg}`);
  }
}

function make(base?: Ctx) {
  const merge = (ctx?: Ctx) => (base ? { ...base, ...(ctx ?? {}) } : ctx);
  return {
    debug: (msg: string, ctx?: Ctx) => write("debug", console.log, msg, merge(ctx)),
    info: (msg: string, ctx?: Ctx) => write("info", console.log, msg, merge(ctx)),
    warn: (msg: string, ctx?: Ctx) => write("warn", console.warn, msg, merge(ctx)),
    error: (msg: string, ctx?: Ctx) => {
      const merged = merge(ctx);
      write("error", console.error, msg, merged);
      if (errorReporter) {
        // Redact before the external sink too (same guard as stdout output),
        // and never let a failing reporter break the calling code path.
        try {
          errorReporter(msg, merged ? (redact(merged) as Ctx) : merged);
        } catch {
          /* swallow */
        }
      }
    },
    /** Attach persistent context (e.g. a correlation id) to all child logs. */
    child: (childBase: Ctx) => make({ ...(base ?? {}), ...childBase }),
  };
}

export const logger = make();
export type Logger = ReturnType<typeof make>;
