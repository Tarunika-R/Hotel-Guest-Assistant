import { useEffect, useRef, useState } from 'react'
import { CalendarDays, SendHorizontal } from 'lucide-react'

interface Props {
    disabled: boolean
    onSend: (text: string) => void
    onOpenForm: () => void
}

const MAX = 1000

export default function ChatInput({ disabled, onSend, onOpenForm }: Props) {
    const [value, setValue] = useState('')
    const ref = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 128)}px`
    }, [value])

    const mounted = useRef(false)
    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true
            return
        }
        if (!disabled && window.matchMedia('(min-width: 640px)').matches) ref.current?.focus()
    }, [disabled])

    const submit = () => {
        if (!value.trim() || disabled) return
        onSend(value)
        setValue('')
        ref.current?.focus()
    }

    return (
        <div className="border-t border-ocean-100/60 bg-white/70 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
            <div className="flex items-end gap-2 rounded-2xl border border-ocean-100 bg-white p-1.5 shadow-sm focus-within:border-ocean-400">
                <button
                    onClick={onOpenForm}
                    aria-label="Check availability"
                    title="Check availability"
                    className="shrink-0 rounded-xl p-2.5 text-ocean-600 transition hover:bg-ocean-50"
                >
                    <CalendarDays className="h-5 w-5" />
                </button>

                <textarea
                    ref={ref}
                    value={value}
                    rows={1}
                    maxLength={MAX}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                            e.preventDefault()
                            submit()
                        }
                    }}
                    placeholder="Ask about rooms, amenities, policies…"
                    aria-label="Your message"
                    className="max-h-32 flex-1 resize-none bg-transparent px-1 py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-500/70"
                />

                <button
                    onClick={submit}
                    disabled={disabled || !value.trim()}
                    aria-label="Send message"
                    className="shrink-0 rounded-xl bg-gradient-to-br from-ocean-500 to-ocean-800 p-2.5 text-white shadow transition hover:opacity-95 disabled:opacity-40"
                >
                    <SendHorizontal className="h-5 w-5" />
                </button>
            </div>
            {value.length > MAX * 0.8 && (
                <p className="mt-1 text-right text-xs text-ink-500">
                    {value.length}/{MAX}
                </p>
            )}
        </div>
    )
}