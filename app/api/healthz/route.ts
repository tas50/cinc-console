import { NextResponse } from "next/server";

// Liveness/readiness probe. Intentionally does not touch the cinc server — it
// reports that the process is up and serving, which is what k8s probes and the
// container HEALTHCHECK need.
export function GET() {
  return NextResponse.json({ status: "ok" });
}
