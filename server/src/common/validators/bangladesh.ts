import { z } from "zod";

export const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

export const bdPhoneSchema = z
  .string()
  .regex(BD_PHONE_REGEX, "Invalid Bangladesh phone number");
