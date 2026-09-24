import { motion } from 'framer-motion'
import { CalendarDays, Check, Flame, Users } from 'lucide-react'
import type { AvailabilityResult } from '../types'
import { formatRange } from '../utils/dates'

interface Props {
    result: AvailabilityResult
    onAsk: (text: string) => void
}

const money = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const THEMES: Record<string, string> = {
    'standard-queen': 'from-ocean-500 to-ocean-800',
    'deluxe-king': 'from-coral-400 via-gold-500 to-ocean-500',
    'junior-suite': 'from-ocean-800 via-ocean-600 to-ocean-400',
    'family-suite': 'from-emerald-500 to-ocean-600',
}
const FALLBACK_THEME = 'from-ocean-500 to-ocean-800'

export default function AvailabilityResults({ result, onAsk }: Props) {
    if (result.options.length === 0) return null

    return (
        <div className="mt-3 space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-ocean-800 shadow-sm">
                <CalendarDays className="h-3.5 w-3.5 text-coral-500" />
                {formatRange(result.check_in, result.check_out)} · {result.nights} night{result.nights > 1 ? 's' : ''} ·{' '}
                {result.adults} guest{result.adults > 1 ? 's' : ''}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                {result.options.map((room, i) => (
                    <motion.article
                        key={room.room_id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.35 }}
                        whileHover={{ y: -4 }}
                        className="overflow-hidden rounded-2xl border border-white bg-white shadow-md shadow-ocean-900/5 transition-shadow hover:shadow-xl hover:shadow-ocean-900/10"
                    >
                        <div className={`relative h-24 overflow-hidden bg-gradient-to-br ${THEMES[room.room_id] ?? FALLBACK_THEME} p-3.5 text-white`}>
                            <span aria-hidden className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/20" />
                            <svg
                                aria-hidden
                                className="absolute inset-x-0 bottom-0 h-8 w-full text-white/25"
                                viewBox="0 0 400 32"
                                preserveAspectRatio="none"
                            >
                                <path fill="currentColor" d="M0,16 C50,32 100,0 150,16 S250,32 300,16 S400,0 400,16 L400,32 L0,32 Z" />
                            </svg>
                            {i === 0 && result.options.length > 1 && (
                                <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ocean-800">
                                    Best value
                                </span>
                            )}
                            <h3 className="relative font-display text-lg leading-tight drop-shadow-sm">{room.name}</h3>
                            <p className="relative mt-0.5 flex items-center gap-1 text-xs text-white/90">
                                <Users className="h-3.5 w-3.5" /> Sleeps {room.capacity}
                            </p>
                        </div>

                        <div className="space-y-3 p-3.5">
                            {room.rooms_left <= 2 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-coral-400/15 px-2 py-0.5 text-xs font-medium text-coral-500">
                                    <Flame className="h-3 w-3" />
                                    Only {room.rooms_left} left
                                </span>
                            )}

                            <ul className="flex flex-wrap gap-1.5">
                                {room.features.map((f) => (
                                    <li key={f} className="inline-flex items-center gap-1 rounded-full bg-ocean-50 px-2 py-0.5 text-xs text-ocean-800">
                                        <Check className="h-3 w-3 text-ocean-500" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <div className="flex items-end justify-between border-t border-sand-100 pt-3">
                                <div>
                                    <p className="font-display text-2xl text-ocean-900">
                                        {money(room.price_per_night)}
                                        <span className="text-xs font-normal text-ink-500"> / night</span>
                                    </p>
                                    <p className="text-xs text-ink-500">{money(room.total_price)} total</p>
                                </div>
                                <button
                                    onClick={() => onAsk(`Tell me more about the ${room.name}`)}
                                    className="rounded-full border border-ocean-200 px-3 py-1.5 text-xs font-medium text-ocean-600 transition hover:border-coral-400 hover:bg-coral-400/10 hover:text-coral-500"
                                >
                                    Ask about this room
                                </button>
                            </div>
                        </div>
                    </motion.article>
                ))}
            </div>
        </div>
    )
}