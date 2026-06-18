// Dev helper: create (or password-set) a Cinc user so it can log into the
// console. Signs POST /users with the webui key, impersonating the admin via
// X-Ops-Request-Source: web — the same mechanism the console uses.
//
// Uses the SAME env as the app:
//   CINC_SERVER_URL, CINC_WEBUI_KEY
// Args: <username> <password> [adminName=pivotal]
//
//   node scripts/seed-user.mjs alice s3cret
import { createHash, createSign } from "node:crypto";

const [username, password, admin = "pivotal"] = process.argv.slice(2);
const base = process.env.CINC_SERVER_URL;
const key = process.env.CINC_WEBUI_KEY;

if (!username || !password || !base || !key) {
  console.error(
    "usage: CINC_SERVER_URL=… CINC_WEBUI_KEY=… node scripts/seed-user.mjs <username> <password> [admin]",
  );
  process.exit(2);
}

const contentHash = (b) => createHash("sha256").update(b).digest("base64");
const ts = new Date().toISOString().replace(/\.\d+Z$/, "Z");
const path = "/users";
const body = JSON.stringify({ name: username, password });
const canon = [
  `Method:POST`,
  `Path:${path}`,
  `X-Ops-Content-Hash:${contentHash(body)}`,
  `X-Ops-Sign:version=1.3`,
  `X-Ops-Timestamp:${ts}`,
  `X-Ops-UserId:${admin}`,
  `X-Ops-Server-API-Version:1`,
].join("\n");
const sig = createSign("RSA-SHA256").update(canon).sign(key, "base64");

const headers = {
  "X-Ops-Sign": "version=1.3",
  "X-Ops-UserId": admin,
  "X-Ops-Timestamp": ts,
  "X-Ops-Content-Hash": contentHash(body),
  "X-Ops-Server-API-Version": "1",
  "X-Ops-Request-Source": "web",
  "Content-Type": "application/json",
  Accept: "application/json",
};
for (let i = 0; i * 60 < sig.length; i++)
  headers[`X-Ops-Authorization-${i + 1}`] = sig.slice(i * 60, i * 60 + 60);

const res = await fetch(base + path, { method: "POST", headers, body });
const text = await res.text();
if (res.status === 201) {
  console.log(`created user "${username}" with a password — you can now log in.`);
} else if (res.status === 409) {
  console.error(
    `user "${username}" already exists. Delete it first, or pick another name.`,
  );
  process.exit(1);
} else {
  console.error(`failed (${res.status}): ${text}`);
  process.exit(1);
}
