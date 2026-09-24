import { BedDouble, Users } from 'lucide-react'
import type { AvailabilityResult } from '../types'
import { formatRange } from '../utils/dates'

interface Props {
    result: AvailabilityResult
    onAsk: (text: string) => void
}

const money = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export default function AvailabilityResults({ result, onAsk }: Props) {
    if (result.options.length === 0) return null

    return (
        <div className="mt-3 space-y-2.5">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
                {formatRange(result.check_in, result.check_out)} · {result.nights} night{result.nights > 1 ? 's' : ''} ·{' '}
                {result.adults} guest{result.adults > 1 ? 's' : ''}
            </p>

            <div className="grid gap-2.5 sm:grid-cols-2">
                {result.options.map((room) => (
                    <article
                        key={room.room_id}
                        className="overflow-hidden rounded-2xl border border-ocean-100 bg-white shadow-sm transition hover:shadow-md"
                    >
                        <div className="flex items-center justify-between bg-gradient-to-r from-ocean-800 to-ocean-500 px-3.5 py-2.5 text-white">
                            <h3 className="font-display text-base">{room.name}</h3>
                            <BedDouble className="h-4 w-4 opacity-80" />
                        </div>

                        <div className="space-y-2.5 p-3.5">
                            <div className="flex items-center gap-1.5 text-xs text-ink-500">
                                <Users className="h-3.5 w-3.5" /> Sleeps {room.capacity}
                                {room.rooms_left <= 2 && (
                                    <span className="ml-auto rounded-full bg-gold-400/20 px-2 py-0.5 font-medium text-gold-500">
                                        Only {room.rooms_left} left
                                    </span>
                                )}
                            </div>

                            <ul className="flex flex-wrap gap-1.5">
                                {room.features.map((f) => (
                                    <li key={f} className="rounded-full bg-ocean-50 px-2 py-0.5 text-xs text-ocean-800">
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <div className="flex items-end justify-between border-t border-sand-100 pt-2.5">
                                <div>
                                    <p className="text-lg font-semibold text-ink-900">
                                        {money(room.price_per_night)}
                                        <span className="text-xs font-normal text-ink-500"> / night</span>
                                    </p>
                                    <p className="text-xs text-ink-500">{money(room.total_price)} total</p>
                                </div>
                                <button
                                    onClick={() => onAsk(`Tell me more about the ${room.name}`)}
                                    className="rounded-full border border-ocean-200 px-3 py-1.5 text-xs font-medium text-ocean-600 transition hover:bg-ocean-50"
                                >
                                    Ask about this room
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    )
}