import { expect, test } from '@playwright/test'

const iso = (offsetDays: number) => {
    const d = new Date()
    d.setDate(d.getDate() + offsetDays)
    const p = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const send = async (page: import('@playwright/test').Page, text: string) => {
    await page.getByLabel('Your message').fill(text)
    await page.getByLabel('Your message').press('Enter')
}

// Full flow with NO LLM needed: form -> real backend -> deterministic availability.
test('guest checks availability through the form', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/Welcome to Azure Bay/)).toBeVisible()

    await page.getByRole('button', { name: 'Check availability' }).first().click()
    await page.getByLabel('Check-in', { exact: true }).fill(iso(30))
    await page.getByLabel('Check-out', { exact: true }).fill(iso(32))
    await page.getByRole('button', { name: 'Search rooms' }).click()

    await expect(page.getByText(/Good news|no rooms available/i)).toBeVisible()
})

test('shows a friendly error and a retry button when the API is unreachable', async ({ page }) => {
    await page.route('**/api/chat', (route) => route.abort())
    await page.goto('/')
    await send(page, 'What time is check-in?')

    await expect(page.getByRole('alert')).toContainText(/couldn't reach/i)
    await expect(page.getByRole('button', { name: /try again/i })).toBeVisible()
})

// The tests below call the real LLM. Run them with: E2E_LLM=1 npm run e2e
test.describe('with the live model', () => {
    test.skip(!process.env.E2E_LLM, 'set E2E_LLM=1 to run tests that call Gemini')

    test('asks a question and a follow-up', async ({ page }) => {
        await page.goto('/')
        await send(page, 'What time is check-in?')
        await expect(page.getByText(/3:00 PM/).first()).toBeVisible({ timeout: 30_000 })

        await send(page, 'And what about check-out?')
        await expect(page.getByText(/11:00 AM/).first()).toBeVisible({ timeout: 30_000 })
    })

    test('vague availability question opens the form', async ({ page }) => {
        await page.goto('/')
        await send(page, 'Do you have rooms next weekend?')
        await expect(page.getByRole('form', { name: /check room availability/i })).toBeVisible({ timeout: 30_000 })
    })
})