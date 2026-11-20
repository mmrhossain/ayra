import { registry } from "./registry.ts";

registry.registerComponent("securitySchemes", "sessionCookie", {
  type: "apiKey",
  in: "cookie",
  name: "ayra.session_token",
  description: "Better Auth session cookie. HTTPS deployments can use __Secure-ayra.session_token.",
});

export const sessionAuth = [{ sessionCookie: [] }];
