import { useCallback, useRef, useState } from 'react'
import { ApiError, sendChat } from '../api/client'
import type { AvailabilityQuery, ChatMessage, ChatRequest } from '../types'

const SESSION_KEY = 'azure-bay-session'

function loadSession(): string | undefined {
    try {
        return sessionStorage.getItem(SESSION_KEY) ?? undefined
    } catch {
        return undefined
    }
}

function saveSession(id: string) {
    try {
        sessionStorage.setItem(SESSION_KEY, id)
    } catch {
        /* storage unavailable: session lives in memory only */
    }
}

const uid = () => crypto.randomUUID()

const WELCOME: ChatMessage = {
    id: 'welcome',
    role: 'assistant',
    type: 'answer',
    content:
        "Welcome to Azure Bay! I'm your virtual concierge. Ask me about rooms, amenities and policies, or check availability for your stay.",
}

export function useChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
    const [loading, setLoading] = useState(false)
    const sessionId = useRef<string | undefined>(loadSession())
    const lastRequest = useRef<ChatRequest | null>(null)

    const run = useCallback(async (req: ChatRequest) => {
        lastRequest.current = req
        setLoading(true)
        try {
            const res = await sendChat({ ...req, session_id: sessionId.current })
            sessionId.current = res.session_id
            saveSession(res.session_id)
            setMessages((m) => [
                ...m,
                {
                    id: uid(),
                    role: 'assistant',
                    content: res.message,
                    type: res.type,
                    availability: res.availability,
                    missingFields: res.missing_fields,
                    failed: res.type === 'error',
                },
            ])
        } catch (e) {
            const content = e instanceof ApiError ? e.message : 'Something unexpected happened.'
            const retryable = !(e instanceof ApiError && e.kind === 'validation')
            setMessages((m) => [
                ...m,
                { id: uid(), role: 'assistant', type: 'error', content, failed: retryable },
            ])
        } finally {
            setLoading(false)
        }
    }, [])

    /** Send a free-text question, optionally with structured availability data from the form. */
    const send = useCallback(
        (text: string, availability?: AvailabilityQuery) => {
            const message = text.trim()
            if (!message || loading) return
            setMessages((m) => [...m, { id: uid(), role: 'user', content: message }])
            void run({ message, availability })
        },
        [loading, run],
    )

    /** Re-send the last request after a failure (does not duplicate the user bubble). */
    const retry = useCallback(() => {
        if (loading || !lastRequest.current) return
        setMessages((m) => m.filter((x) => !x.failed))
        void run(lastRequest.current)
    }, [loading, run])

    const reset = useCallback(() => {
        sessionId.current = undefined
        lastRequest.current = null
        try {
            sessionStorage.removeItem(SESSION_KEY)
        } catch {
            /* ignore */
        }
        setMessages([WELCOME])
    }, [])

    return { messages, loading, send, retry, reset }
}