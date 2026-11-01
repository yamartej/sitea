const { test, expect } = require("@playwright/test");

const API = "http://127.0.0.1:8000/api";
const password = process.env.NAV_QA_PASSWORD;
if (!password || process.env.GITHUB_ACTIONS !== "true") {
  throw new Error("This test may run only in the ephemeral GitHub Actions environment.");
}

async function login(page, role) {
  await page.goto("/");
  await page.locator("#email").fill("qa-" + role + "@totalplus.invalid");
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
  await expect(page).toHaveURL(/\/pages\/dashboard(?:\?|$)/, { timeout: 30000 });
  await expect(page.locator('aside[aria-label="Sidebar"]')).toBeVisible();
  return page.locator('aside[aria-label="Sidebar"]');
}

async function apiLogin(request, role) {
  const res = await request.post(API + "/login", {
    data: { email: "qa-" + role + "@totalplus.invalid", password },
  });
  expect(res.status()).toBe(200);
  const data = await res.json();
  expect(data.token).toBeTruthy();
  return data.token;
}

test("seller: sees only authorized sales entries, opens real Sales UI", async ({ page }) => {
  const sidebar = await login(page, "seller");
  await expect(sidebar.getByRole("button", { name: "Ventas", exact: true })).toBeVisible();
  await expect(sidebar.getByRole("button", { name: "Inventario", exact: true })).toHaveCount(0);
  await expect(sidebar.getByRole("button", { name: "Compras", exact: true })).toHaveCount(0);
  await expect(sidebar.getByRole("button", { name: "Administración", exact: true })).toHaveCount(0);
  await sidebar.getByRole("button", { name: "Ventas", exact: true }).click();
  await expect(sidebar.getByRole("link", { name: "Clientes", exact: true })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Ventas", exact: true })).toBeVisible();
  await sidebar.getByRole("link", { name: "Ventas", exact: true }).click();
  await expect(page).toHaveURL(/\/pages\/sales(?:\?|$)/);
});

test("warehouse: transfers page uses real company-filtered API", async ({ page }) => {
  const sidebar = await login(page, "warehouse");
  await expect(sidebar.getByRole("button", { name: "Inventario", exact: true })).toBeVisible();
  await expect(sidebar.getByRole("button", { name: "Ventas", exact: true })).toHaveCount(0);
  await sidebar.getByRole("button", { name: "Inventario", exact: true }).click();
  await sidebar.getByRole("link", { name: "Transferencias entre almacenes" }).click();
  await expect(page).toHaveURL(/\/pages\/transfers(?:\?|$)/);
  await expect(page.getByRole("heading", { name: "Transferencias entre almacenes" })).toBeVisible();
  await expect(page.getByLabel("Almacén de origen")).toContainText("QA Alpha Principal");
  await expect(page.getByLabel("Almacén de origen")).not.toContainText("QA Beta Privado");
  await expect(page.getByLabel("Producto")).toContainText("QA Synthetic Product");
  await page.getByLabel("Almacén de origen").selectOption({ label: "QA Alpha Principal" });
  await page.getByLabel("Almacén de destino").selectOption({ label: "QA Alpha Secundario" });
  await page.getByLabel("Producto").selectOption({ label: "QA Synthetic Product" });
  await page.getByLabel("Cantidad a transferir").fill("2");
  const submit = page.getByRole("button", { name: "Registrar transferencia" });
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByText(/Transferencia registrada/)).toBeVisible();

  // Confirm that the actual Laravel transaction created two Kardex entries.
  const token = await apiLogin(page.request, "warehouse");
  const response = await page.request.get(API + "/inventory/kardex", {
    headers: { Authorization: "Bearer " + token },
  });
  expect(response.status()).toBe(200);
  const ledger = (await response.json()).data;
  expect(ledger.filter((movement) => movement.type === "transfer_out" &&
    movement.quantity_delta === -2)).toHaveLength(1);
  expect(ledger.filter((movement) => movement.type === "transfer_in" &&
    movement.quantity_delta === 2)).toHaveLength(1);
});

test("buyer: purchase orders and partial receipt page are reachable", async ({ page }) => {
  const sidebar = await login(page, "buyer");
  await sidebar.getByRole("button", { name: "Compras", exact: true }).click();
  await expect(sidebar.getByRole("link", { name: "Órdenes de compra" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "Recepción de mercancía" })).toBeVisible();
  await sidebar.getByRole("link", { name: "Órdenes de compra" }).click();
  await expect(page).toHaveURL(/\/pages\/purchase-orders(?:\?|$)/);
  await sidebar.getByRole("link", { name: "Recepción de mercancía" }).click();
  await expect(page).toHaveURL(/\/pages\/purchase-receipts(?:\?|$)/);
});

test("finance: credits and reports visible, sales and administration hidden", async ({ page }) => {
  const sidebar = await login(page, "finance");
  await expect(sidebar.getByRole("button", { name: "Créditos y cobranzas" })).toBeVisible();
  await expect(sidebar.getByRole("button", { name: "Reportes" })).toBeVisible();
  await expect(sidebar.getByRole("button", { name: "Ventas" })).toHaveCount(0);
  await expect(sidebar.getByRole("button", { name: "Administración" })).toHaveCount(0);
  await sidebar.getByRole("button", { name: "Reportes" }).click();
  await sidebar.getByRole("link", { name: "Reporte de ventas" }).click();
  await expect(page).toHaveURL(/\/pages\/sales-report(?:\?|$)/);
});

test("global admin: only explicitly chosen company is used for transfers", async ({ page }) => {
  const sidebar = await login(page, "admin");
  await expect(sidebar.getByRole("button", { name: "Administración" })).toBeVisible();
  await sidebar.getByRole("button", { name: "Inventario" }).click();
  await sidebar.getByRole("link", { name: "Transferencias entre almacenes" }).click();
  const picker = page.getByLabel(/Empresa para operar/);
  await expect(picker).toBeVisible();
  await expect(page.getByText("Seleccione una empresa para operar.")).toBeVisible();
  await picker.selectOption({ label: "QA Navigation Company Alpha" });
  await expect(page.getByLabel("Almacén de origen")).toContainText("QA Alpha Principal");
  await expect(page.getByLabel("Almacén de origen")).not.toContainText("QA Beta Privado");
});

test("real Laravel permissions and tenant guards deny unauthorized operations", async ({ request }) => {
  const sellerToken = await apiLogin(request, "seller");
  const warehouseToken = await apiLogin(request, "warehouse");
  const adminToken = await apiLogin(request, "admin");

  const auth = (token) => ({ Authorization: "Bearer " + token });
  const deniedUsers = await request.get(API + "/users", {
    headers: auth(sellerToken),
  });
  expect(deniedUsers.status()).toBe(403);

  const deniedTransfer = await request.post(API + "/inventory/transfer", {
    headers: auth(sellerToken),
    data: {
      source_warehouse_id: 1,
      destination_warehouse_id: 2,
      product_id: 1,
      quantity: 1,
      reference_type: "manual_transfer",
    },
  });
  expect(deniedTransfer.status()).toBe(403);

  const own = await request.get(API + "/warehouses", {
    headers: auth(warehouseToken),
  });
  expect(own.status()).toBe(200);
  const ownRows = await own.json();
  expect(ownRows.map((w) => w.name)).toContain("QA Alpha Principal");
  expect(ownRows.map((w) => w.name)).not.toContain("QA Beta Privado");

  const cross = await request.get(API + "/warehouses", {
    headers: auth(warehouseToken),
    params: { company_id: 2 },
  });
  expect(cross.status()).toBe(403);

  const selected = await request.get(API + "/warehouses", {
    headers: auth(adminToken),
    params: { company_id: 2 },
  });
  expect(selected.status()).toBe(200);
  const selectedRows = await selected.json();
  expect(selectedRows.map((w) => w.name)).toContain("QA Beta Privado");
  expect(selectedRows.map((w) => w.name)).not.toContain("QA Alpha Principal");

  const sellerMenu = await request.post(API + "/menu_items", {
    headers: auth(sellerToken),
    data: { role_ids: [99999] },
  });
  expect(sellerMenu.status()).toBe(200);
  const urls = (await sellerMenu.json()).map((m) => m.url);
  expect(urls).toContain("/menu/sales");
  expect(urls).toContain("/pages/sales");
  expect(urls).not.toContain("/menu/administration");
});
