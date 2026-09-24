import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { AvailabilityQuery, ChatMessage } from '../types'
import { formatRange } from '../utils/dates'
import AvailabilityForm from './AvailabilityForm'
import ChatInput from './ChatInput'
import MessageBubble from './MessageBubble'
import SuggestedQuestions from './SuggestedQuestions'
import TypingIndicator from './TypingIndicator'

interface Props {
    messages: ChatMessage[]
    loading: boolean
    send: (text: string, availability?: AvailabilityQuery) => void
    retry: () => void
}

export default function ChatWindow({ messages, loading, send, retry }: Props) {
    const [showForm, setShowForm] = useState(false)
    const endRef = useRef<HTMLDivElement>(null)

    const last = messages[messages.length - 1]
    const needsInput = last?.type === 'needs_input' ? last : null

    // Auto-open the form when the assistant needs dates or guest count.
    useEffect(() => {
        if (needsInput) setShowForm(true)
    }, [needsInput?.id]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, [messages, loading, showForm])

    const submitAvailability = (q: AvailabilityQuery) => {
        setShowForm(false)
        send(
            `Check availability for ${q.adults} guest${q.adults > 1 ? 's' : ''}, ${formatRange(q.check_in, q.check_out)}`,
            q,
        )
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div
                role="log"
                aria-live="polite"
                aria-label="Conversation"
                className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-5"
            >
                {messages.map((m, i) => (
                    <MessageBubble key={m.id} message={m} isLast={i === messages.length - 1} onRetry={retry} onAsk={(t) => send(t)} />
                ))}

                {messages.length === 1 && (
                    <SuggestedQuestions onPick={(q) => send(q)} onOpenForm={() => setShowForm(true)} />
                )}

                {loading && (
                    <div className="pl-10">
                        <div className="inline-block rounded-2xl rounded-tl-md border border-white bg-white px-3 shadow-sm">
                            <TypingIndicator />
                        </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            <AnimatePresence>
                {showForm && (
                    <AvailabilityForm
                        missing={needsInput?.missingFields}
                        disabled={loading}
                        onSubmit={submitAvailability}
                        onClose={() => setShowForm(false)}
                    />
                )}
            </AnimatePresence>

            <ChatInput disabled={loading} onSend={(t) => send(t)} onOpenForm={() => setShowForm(true)} />
        </div>
    )
}