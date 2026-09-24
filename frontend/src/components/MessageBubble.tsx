import { motion } from 'framer-motion'
import { Waves } from 'lucide-react'
import type { ChatMessage } from '../types'
import AvailabilityResults from './AvailabilityResults'
import ErrorBanner from './ErrorBanner'

interface Props {
    message: ChatMessage
    isLast: boolean
    onRetry: () => void
    onAsk: (text: string) => void
}

export default function MessageBubble({ message, isLast, onRetry, onAsk }: Props) {
    const isUser = message.role === 'user'

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            {!isUser && (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-coral-500 text-white shadow shadow-coral-500/30">
                    <Waves className="h-4 w-4" />
                </div>
            )}

            <div className={`max-w-[85%] ${isUser ? '' : 'w-full sm:max-w-[80%]'}`}>
                {message.type === 'error' ? (
                    <ErrorBanner message={message.content} onRetry={message.failed && isLast ? onRetry : undefined} />
                ) : (
                    <div
                        className={
                            isUser
                                ? 'rounded-2xl rounded-br-md bg-gradient-to-br from-ocean-500 to-ocean-800 px-4 py-2.5 text-sm text-white shadow-sm'
                                : message.type === 'fallback'
                                    ? 'rounded-2xl rounded-tl-md border border-gold-400/50 bg-gold-400/10 px-4 py-2.5 text-sm text-ink-900'
                                    : 'rounded-2xl rounded-tl-md border border-white bg-white px-4 py-2.5 text-sm text-ink-900 shadow-md shadow-ocean-900/5'
                        }
                    >
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                )}

                {message.availability && <AvailabilityResults result={message.availability} onAsk={onAsk} />}
            </div>
        </motion.div>
    )
}