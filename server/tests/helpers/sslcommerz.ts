import { createHash } from "node:crypto";

const hashKeys = (payload: Record<string, string>) =>
  payload.verify_key ??
  Object.keys(payload)
    .filter((key) => key !== "verify_sign" && key !== "store_id" && key !== "store_passwd")
    .join(",");

export const signSslcommerzPayload = (payload: Record<string, string>) => {
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD ?? "testpass";
  const fields: Record<string, string> = {};
  for (const key of hashKeys(payload).split(",")) {
    if (payload[key] !== undefined) fields[key] = payload[key];
  }
  fields.store_passwd = createHash("md5").update(storePassword).digest("hex");

  const hashString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("&");

  return createHash("md5").update(hashString).digest("hex");
};

export const sslcommerzIpnBody = (payload: Record<string, string>) => {
  const data = { ...payload };
  if (!data.verify_key) {
    data.verify_key = Object.keys(data)
      .filter((key) => key !== "verify_sign" && key !== "store_id" && key !== "store_passwd")
      .join(",");
  }
  data.verify_sign = signSslcommerzPayload(data);
  return data;
};
