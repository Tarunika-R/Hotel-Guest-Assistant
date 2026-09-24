import { vi } from 'vitest'
import type { ChatResponse } from '../types'

export const reply = (o: Partial<ChatResponse> = {}): ChatResponse => ({
    request_id: 'r1',
    session_id: 's1',
    type: 'answer',
    message: 'ok',
    availability: null,
    missing_fields: [],
    ...o,
})

export const jsonResponse = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

export const mockFetch = () => {
    const fn = vi.fn()
    vi.stubGlobal('fetch', fn)
    return fn
}