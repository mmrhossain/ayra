import { registry } from "./registry.ts";

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "Better Auth session bearer token",
});

export const bearerAuth = [{ bearerAuth: [] }];
