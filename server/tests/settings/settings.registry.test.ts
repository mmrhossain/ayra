import { describe, expect, it } from "vitest";
import {
  getSettingsByGroup,
  SETTING_DEFINITIONS,
  SETTING_GROUPS,
} from "../../src/modules/settings/settings.registry.ts";

describe("platform settings registry", () => {
  it("has unique keys mapped to known groups", () => {
    const groupKeys = new Set(SETTING_GROUPS.map((group) => group.key));
    const keys = new Set<string>();

    for (const key of SETTING_DEFINITIONS.keys()) {
      expect(keys.has(key)).toBe(false);
      keys.add(key);
    }

    for (const definition of SETTING_DEFINITIONS.values()) {
      expect(groupKeys.has(definition.group)).toBe(true);
    }
  });

  it("accepts each default value through its own schema", () => {
    for (const definition of SETTING_DEFINITIONS.values()) {
      const defaultValue =
        typeof definition.defaultValue === "function"
          ? definition.defaultValue()
          : definition.defaultValue;
      expect(() => definition.schema.parse(defaultValue)).not.toThrow();
    }
  });

  it("keeps secret definitions out of public settings", () => {
    for (const definition of SETTING_DEFINITIONS.values()) {
      if (definition.isSecret) {
        expect(definition.isPublic).not.toBe(true);
        expect(definition.type).toBe("secret");
      }
    }
  });

  it("exposes store, payment, and checkout groups", () => {
    expect(SETTING_GROUPS.map((group) => group.key)).toEqual([
      "store",
      "payment",
      "checkout",
    ]);
    expect(getSettingsByGroup("payment").length).toBeGreaterThan(0);
  });
});
