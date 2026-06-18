import { z } from "zod";

const schema = z.object({
  CINC_SERVER_URL: z.string().url(),
  CINC_WEBUI_KEY: z.string().min(1),
  SESSION_SECRET: z.string().min(32, "must be >= 32 chars"),
  CINC_CA_CERT: z.string().optional(),
  CINC_SSL_NO_VERIFY: z.enum(["true", "false"]).optional(),
  SESSION_TTL_SECONDS: z.coerce.number().optional(),
  CHEF_VERSION: z.string().optional(),
});

export type Config = {
  serverUrl: string;
  webuiKey: string;
  sessionSecret: string;
  caCert?: string;
  sslNoVerify: boolean;
  sessionTtlSeconds: number;
  chefVersion: string;
};

/** Parse and validate the runtime configuration, failing fast and loud. */
export function loadConfig(env: Record<string, string | undefined>): Config {
  const r = schema.safeParse(env);
  if (!r.success) {
    const missing = r.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid cinc-console configuration — ${missing}`);
  }
  const e = r.data;
  return {
    serverUrl: e.CINC_SERVER_URL.replace(/\/$/, ""),
    webuiKey: e.CINC_WEBUI_KEY,
    sessionSecret: e.SESSION_SECRET,
    caCert: e.CINC_CA_CERT,
    sslNoVerify: e.CINC_SSL_NO_VERIFY === "true",
    sessionTtlSeconds: e.SESSION_TTL_SECONDS ?? 28800,
    chefVersion: e.CHEF_VERSION ?? "16.0.0",
  };
}

let cached: Config | null = null;

export function getConfig(): Config {
  if (!cached) cached = loadConfig(process.env);
  return cached;
}

/** Test-only: drop the memoized config. */
export function resetConfigCache(): void {
  cached = null;
}
