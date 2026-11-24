const { expect, test } = require('@playwright/test');

const BASE_URL = 'https://ecommercebs.vercel.app/';

// Product data observed on the live site (Silk Wrap Dress, product/1).
const PRODUCT = { name: 'Silk Wrap Dress', price: 189.99, size: 'M' };
const TAX_RATE = 0.08; // observed: $15.20 tax on $189.99 subtotal

const money = (n) => `$${n.toFixed(2)}`;

test.describe('FashionStack storefront', () => {
  test('home page shows brand and featured products', async ({ page }) => {
    await page.goto(BASE_URL);

    await expect(page.getByRole('heading', { name: 'FashionStack', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Featured Products' })).toBeVisible();
    await expect(page.getByRole('heading', { name: PRODUCT.name })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View Details' })).toHaveCount(6);
  });

  test('Men category navigation opens the Men page', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.getByRole('heading', { name: 'Featured Products' })).toBeVisible();

    await page.getByRole('button', { name: 'Men', exact: true }).first().click();

    await expect(page).toHaveURL(/\/category\/men$/);
    await expect(page.getByText("Men's Fashion", { exact: true })).toBeVisible();
  });

  test('product details page shows the selected product', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.getByRole('heading', { name: 'Featured Products' })).toBeVisible();

    await page.getByRole('button', { name: 'View Details' }).first().click();

    await expect(page).toHaveURL(/\/product\/1$/);
    await expect(page.getByRole('heading', { name: PRODUCT.name })).toBeVisible();
    await expect(page.getByText(money(PRODUCT.price), { exact: true })).toBeVisible();
  });

  test('search with no matching product shows the empty state', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.getByRole('heading', { name: 'Featured Products' })).toBeVisible();

    await page.getByPlaceholder('Search...').fill('Denim');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/search\?q=Denim$/);
    await expect(page.getByText('No results found', { exact: true })).toBeVisible();
  });

  test('add to cart and verify the cart totals', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.getByRole('heading', { name: 'Featured Products' })).toBeVisible();
    await page.getByRole('button', { name: 'View Details' }).first().click();
    await expect(page.getByRole('heading', { name: PRODUCT.name })).toBeVisible();

    await page.getByRole('button', { name: PRODUCT.size, exact: true }).click();
    await page.getByRole('button', { name: /Add to Cart/ }).click();
    await page.getByRole('button', { name: 'View Cart' }).click();

    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByText('1 item in your cart')).toBeVisible();
    await expect(page.getByText(`Size: ${PRODUCT.size}`)).toBeVisible();

    // Expected totals are computed from the product price and tax rate, not read off the page.
    const tax = Math.round(PRODUCT.price * TAX_RATE * 100) / 100;
    const total = Math.round((PRODUCT.price + tax) * 100) / 100;
    await expect(page.getByText(money(tax), { exact: true })).toBeVisible();
    await expect(page.getByText(money(total), { exact: true })).toBeVisible();
  });

  test('login page shows the sign-in form', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.getByRole('heading', { name: 'Featured Products' })).toBeVisible();

    await page.getByRole('button', { name: 'Login', exact: true }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Welcome Back', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
  });
});
