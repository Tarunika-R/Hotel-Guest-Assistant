import { describe, expect, it } from 'vitest'
import { sendChat } from '../api/client'
import { jsonResponse, mockFetch, reply } from './helpers'

describe('sendChat', () => {
    it('calls the backend API with no secrets in the request', async () => {
        const f = mockFetch()
        f.mockResolvedValue(jsonResponse(reply({ message: 'hi' })))
        const res = await sendChat({ message: 'x' })
        expect(res.message).toBe('hi')
        expect(f.mock.calls[0][0]).toBe('/api/chat')
        expect(f.mock.calls[0][1].headers).toEqual({ 'Content-Type': 'application/json' })
    })

    it('maps 422 to a validation error with the backend detail', async () => {
        mockFetch().mockResolvedValue(jsonResponse({ detail: 'bad dates' }, 422))
        await expect(sendChat({ message: 'x' })).rejects.toMatchObject({ kind: 'validation', message: 'bad dates' })
    })

    it('maps 500 to a server error', async () => {
        mockFetch().mockResolvedValue(jsonResponse({ error: 'internal_error' }, 500))
        await expect(sendChat({ message: 'x' })).rejects.toMatchObject({ kind: 'server' })
    })

    it('maps a failed fetch to a network error', async () => {
        mockFetch().mockRejectedValue(new TypeError('Failed to fetch'))
        await expect(sendChat({ message: 'x' })).rejects.toMatchObject({ kind: 'network' })
    })

    it('maps an aborted request to a timeout error', async () => {
        mockFetch().mockRejectedValue(new DOMException('aborted', 'AbortError'))
        await expect(sendChat({ message: 'x' })).rejects.toMatchObject({ kind: 'timeout' })
    })
})