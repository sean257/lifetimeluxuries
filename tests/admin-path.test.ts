import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/navigation", () => ({ notFound: vi.fn(), redirect: vi.fn() }));

const { safeAdminPath } = await import("@/lib/admin");

describe("safeAdminPath", () => {
  it("keeps admin paths", () => {
    expect(safeAdminPath("/admin")).toBe("/admin");
    expect(safeAdminPath("/admin/orders")).toBe("/admin/orders");
    expect(safeAdminPath("/admin/orders/LL-1001")).toBe("/admin/orders/LL-1001");
    expect(safeAdminPath("/admin/orders?status=new&page=2")).toBe("/admin/orders?status=new&page=2");
  });
  it("refuses anything that could leave the dashboard", () => {
    expect(safeAdminPath("https://evil.example")).toBe("/admin");
    expect(safeAdminPath("//evil.example/admin")).toBe("/admin");
    expect(safeAdminPath("/admin/../shop")).toBe("/admin");
    expect(safeAdminPath("/administrator")).toBe("/admin");
    expect(safeAdminPath("/admin/login")).toBe("/admin");
    expect(safeAdminPath(undefined)).toBe("/admin");
    expect(safeAdminPath("/admin?next=https://evil.example")).toBe("/admin");
  });
});
