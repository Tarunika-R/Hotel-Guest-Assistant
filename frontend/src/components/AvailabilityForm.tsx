import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Minus, Plus, X } from 'lucide-react'
import type { AvailabilityQuery } from '../types'
import { addDays, todayISO } from '../utils/dates'

interface Props {
    missing?: string[]
    disabled?: boolean
    onSubmit: (q: AvailabilityQuery) => void
    onClose: () => void
}

export default function AvailabilityForm({ missing = [], disabled, onSubmit, onClose }: Props) {
    const today = todayISO()
    const [checkIn, setCheckIn] = useState('')
    const [checkOut, setCheckOut] = useState('')
    const [adults, setAdults] = useState(2)
    const [errors, setErrors] = useState<{ checkIn?: string; checkOut?: string }>({})

    const highlight = (f: string) => (missing.includes(f) ? 'ring-2 ring-gold-400' : '')
    const inputClass =
        'w-full rounded-xl border border-ocean-100 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-ocean-400'

    const handleCheckIn = (value: string) => {
        setCheckIn(value)
        if (value && (!checkOut || checkOut <= value)) setCheckOut(addDays(value, 1))
        setErrors({})
    }

    const submit = (e: React.SyntheticEvent) => {
        e.preventDefault()
        const next: typeof errors = {}
        if (!checkIn) next.checkIn = 'Choose a check-in date'
        else if (checkIn < today) next.checkIn = 'Check-in cannot be in the past'
        if (!checkOut) next.checkOut = 'Choose a check-out date'
        else if (checkIn && checkOut <= checkIn) next.checkOut = 'Check-out must be after check-in'
        setErrors(next)
        if (Object.keys(next).length) return
        onSubmit({ check_in: checkIn, check_out: checkOut, adults })
    }

    return (
        <motion.form
            onSubmit={submit}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="mx-3 mb-2 max-h-[55vh] overflow-y-auto rounded-2xl border border-ocean-100 bg-white p-4 shadow-lg sm:mx-4"
            aria-label="Check room availability"
        >
            <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-lg text-ocean-900">
                    <CalendarDays className="h-4 w-4 text-ocean-500" /> Check availability
                </h2>
                <button type="button" onClick={onClose} aria-label="Close form" className="rounded-full p-1 text-ink-500 hover:bg-sand-100">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <label className="block text-xs font-medium text-ink-700">
                    Check-in
                    <input
                        type="date"
                        min={today}
                        value={checkIn}
                        onChange={(e) => handleCheckIn(e.target.value)}
                        className={`mt-1 ${inputClass} ${highlight('check_in')}`}
                    />
                    {errors.checkIn && <span className="mt-1 block text-red-600">{errors.checkIn}</span>}
                </label>

                <label className="block text-xs font-medium text-ink-700">
                    Check-out
                    <input
                        type="date"
                        min={checkIn ? addDays(checkIn, 1) : addDays(today, 1)}
                        value={checkOut}
                        onChange={(e) => {
                            setCheckOut(e.target.value)
                            setErrors({})
                        }}
                        className={`mt-1 ${inputClass} ${highlight('check_out')}`}
                    />
                    {errors.checkOut && <span className="mt-1 block text-red-600">{errors.checkOut}</span>}
                </label>

                <div className="text-xs font-medium text-ink-700">
                    Guests
                    <div className={`mt-1 flex items-center justify-between rounded-xl border border-ocean-100 bg-white px-2 py-1 ${highlight('adults')}`}>
                        <button
                            type="button"
                            aria-label="Fewer guests"
                            onClick={() => setAdults((a) => Math.max(1, a - 1))}
                            className="rounded-full p-1.5 text-ocean-600 hover:bg-ocean-50"
                        >
                            <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-semibold text-ink-900" aria-live="polite">{adults}</span>
                        <button
                            type="button"
                            aria-label="More guests"
                            onClick={() => setAdults((a) => Math.min(10, a + 1))}
                            className="rounded-full p-1.5 text-ocean-600 hover:bg-ocean-50"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={disabled}
                className="mt-4 w-full rounded-full bg-gradient-to-r from-coral-500 to-gold-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-coral-500/25 transition hover:opacity-95 disabled:opacity-50"
            >
                {disabled ? 'Searching…' : 'Search rooms'}
            </button>
        </motion.form>
    )
}