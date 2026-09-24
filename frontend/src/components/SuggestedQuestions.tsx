import { motion } from 'framer-motion'
import { CalendarDays } from 'lucide-react'

const QUESTIONS = [
    { q: 'What time is check-in?', icon: '🕒' },
    { q: 'Does the hotel have a swimming pool?', icon: '🏊' },
    { q: 'Which room is suitable for three guests?', icon: '🛏️' },
    { q: 'Is breakfast included?', icon: '🍳' },
    { q: 'What is the cancellation policy?', icon: '📜' },
]

interface Props {
    onPick: (q: string) => void
    onOpenForm: () => void
}

export default function SuggestedQuestions({ onPick, onOpenForm }: Props) {
    return (
        <div className="grid gap-2 pl-10 sm:grid-cols-2">
            <motion.button
                onClick={onOpenForm}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-coral-500 to-gold-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-coral-500/25 sm:col-span-2"
            >
                <CalendarDays className="h-4 w-4" /> Check availability
            </motion.button>

            {QUESTIONS.map(({ q, icon }, i) => (
                <motion.button
                    key={q}
                    onClick={() => onPick(q)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 * (i + 1) }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2.5 rounded-2xl border border-white bg-white/85 px-3.5 py-2.5 text-left text-sm text-ocean-900 shadow-sm transition-shadow hover:shadow-md"
                >
                    <span aria-hidden className="text-lg">{icon}</span>
                    {q}
                </motion.button>
            ))}
        </div>
    )
}