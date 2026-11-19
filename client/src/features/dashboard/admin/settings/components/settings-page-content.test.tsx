import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminSettingGroup } from "@/features/dashboard/admin/settings/types";
const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("@/features/dashboard/admin/settings/api/settings", () => ({ ADMIN_SETTINGS_QUERY_KEY: ["admin-settings"], fetchAdminSettings: mocks.fetch }));
vi.mock("@/features/dashboard/admin/settings/components/settings-tabs", () => ({ SettingsTabs: ({ groups }: { groups: Array<{ label: string }> }) => createElement("div", { "data-settings": true }, groups.map(group => group.label).join(",")) }));
import { SettingsPageContent } from "./settings-page-content";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const initialData: AdminSettingGroup[] = [{ key: "store", label: "Store settings", description: "", fields: [] }];
describe("Admin route-loaded settings", () => {
  let root: Root;
  let container: HTMLDivElement;
  let client: QueryClient;
  beforeEach(() => {
    mocks.fetch.mockReset();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(async () => { await act(async () => root.unmount()); client.clear(); container.remove(); });
  async function render() {
    await act(async () => root.render(createElement(QueryClientProvider, { client }, createElement(SettingsPageContent, { initialData }))));
  }
  it("renders server data immediately without another initial request or loader", async () => {
    await render();
    expect(container.textContent).toBe("Store settings");
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(container.querySelector('[role="status"]')).toBeNull();
  });
  it("keeps the content visible during mutation-triggered refreshes", async () => {
    let resolve!: (groups: AdminSettingGroup[]) => void;
    mocks.fetch.mockImplementation(() => new Promise<AdminSettingGroup[]>(done => { resolve = done; }));
    await render();
    let refresh!: Promise<void>;
    await act(async () => { refresh = client.invalidateQueries({ queryKey: ["admin-settings"] }); });
    expect(container.textContent).toBe("Store settings");
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    await act(async () => { resolve([{ ...initialData[0], label: "Updated settings" }]); await refresh; await new Promise(done => setTimeout(done, 0)); });
    expect(container.textContent).toBe("Updated settings");
  });
});
