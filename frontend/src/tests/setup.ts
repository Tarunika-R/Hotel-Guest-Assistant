import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

if (!globalThis.crypto?.randomUUID) {
    let n = 0
    Object.defineProperty(globalThis, 'crypto', {
        value: { randomUUID: () => `id-${++n}` },
        configurable: true,
    })
}

beforeEach(() => {
    sessionStorage.clear()
    Element.prototype.scrollIntoView = vi.fn()
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }))
})

afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})