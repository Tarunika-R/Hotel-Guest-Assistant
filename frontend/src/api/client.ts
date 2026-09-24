import type { ChatRequest, ChatResponse } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '' // empty = same origin via Vite proxy
const TIMEOUT_MS = 30_000

export type ApiErrorKind = 'network' | 'timeout' | 'validation' | 'server'

export class ApiError extends Error {
    kind: ApiErrorKind
    constructor(kind: ApiErrorKind, message: string) {
        super(message)
        this.kind = kind
    }
}

export async function sendChat(payload: ChatRequest): Promise<ChatResponse> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
        const res = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
        })

        if (res.status === 422) {
            const body = await res.json().catch(() => null)
            throw new ApiError('validation', body?.detail ?? 'Please check your input and try again.')
        }
        if (!res.ok) {
            throw new ApiError('server', 'Something went wrong on our side. Please try again.')
        }
        return (await res.json()) as ChatResponse
    } catch (err) {
        if (err instanceof ApiError) throw err
        if (err instanceof DOMException && err.name === 'AbortError') {
            throw new ApiError('timeout', 'The request took too long. Please try again.')
        }
        throw new ApiError('network', "We couldn't reach the assistant. Check your connection and try again.")
    } finally {
        clearTimeout(timer)
    }
}