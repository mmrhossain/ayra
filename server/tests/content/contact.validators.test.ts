import { describe, expect, it } from "vitest";
import {
  createContactMessageSchema,
  listContactMessagesQuerySchema,
  updateContactMessageSchema,
} from "../../src/modules/content/contact/validators/contact.validators.ts";

describe("contact message validation", () => {
  it("trims valid public submissions before persistence", () => {
    const result = createContactMessageSchema.parse({
      firstName: "  Alex ",
      lastName: " Doe ",
      phone: "+8801712345678",
      email: " alex@example.com ",
      message: "  Please help with my order. ",
    });

    expect(result).toEqual({
      firstName: "Alex",
      lastName: "Doe",
      phone: "+8801712345678",
      email: "alex@example.com",
      message: "Please help with my order.",
    });
  });

  it("rejects malformed or oversized submissions", () => {
    expect(
      createContactMessageSchema.safeParse({
        firstName: "A",
        lastName: "Doe",
        phone: "not-a-phone",
        email: "invalid",
        message: "help",
      }).success,
    ).toBe(false);
    expect(
      createContactMessageSchema.safeParse({
        firstName: "Alex",
        lastName: "Doe",
        phone: "1234567890",
        email: "alex@example.com",
        message: "x".repeat(5001),
      }).success,
    ).toBe(false);
  });

  it("defaults the inbox query and validates status updates", () => {
    expect(listContactMessagesQuerySchema.parse({})).toEqual({
      page: 1,
      limit: 20,
    });
    expect(updateContactMessageSchema.safeParse({ status: "RESOLVED" }).success).toBe(true);
    expect(updateContactMessageSchema.safeParse({ status: "CLOSED" }).success).toBe(false);
  });
});
