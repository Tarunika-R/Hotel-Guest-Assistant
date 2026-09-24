import { motion } from 'framer-motion'
import { Car, Sparkles, Star, Wifi } from 'lucide-react'

const PILLS = [
    { emoji: '🏊', label: 'Infinity pool', ask: 'Does the hotel have a swimming pool?' },
    { emoji: '🌅', label: 'Sea-view rooms', ask: 'Which rooms have a sea view?' },
    { emoji: '💆', label: 'Spa & wellness', ask: 'Tell me about the spa' },
    { emoji: '🍽️', label: 'The Tide Room', ask: 'What are the restaurant timings?' },
]

const PERKS = [
    { icon: Star, text: '4-star resort' },
    { icon: Wifi, text: 'Free Wi-Fi' },
    { icon: Car, text: 'Free parking' },
]

export default function HeroPanel({ onAsk }: { onAsk: (q: string) => void }) {
    return (
        <aside className="relative hidden w-[40%] max-w-md shrink-0 flex-col justify-center lg:flex">
            <div
                aria-hidden
                className="absolute -left-8 -top-2 h-36 w-36 animate-float rounded-full bg-gradient-to-br from-gold-400 to-coral-500 opacity-90 shadow-[0_0_90px_30px_rgba(242,100,63,0.35)]"
            />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10"
            >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-ocean-800 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-coral-500" /> AI concierge · replies instantly
                </span>

                <h2 className="mt-5 font-display text-5xl leading-[1.05] text-ocean-950">
                    Your Goa escape,{' '}
                    <span className="bg-gradient-to-r from-coral-500 via-gold-500 to-ocean-500 bg-clip-text text-transparent">
                        one message away.
                    </span>
                </h2>

                <p className="mt-4 text-base leading-relaxed text-ink-700">
                    Ask about rooms, the pool, breakfast or cancellations, and see live availability in seconds.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                    {PILLS.map((p, i) => (
                        <motion.button
                            key={p.label}
                            onClick={() => onAsk(p.ask)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.08 }}
                            whileHover={{ y: -3, scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="inline-flex items-center gap-2 rounded-full border border-white bg-white/80 px-4 py-2 text-sm font-medium text-ocean-900 shadow-sm backdrop-blur transition-shadow hover:shadow-lg"
                        >
                            <span aria-hidden>{p.emoji}</span>
                            {p.label}
                        </motion.button>
                    ))}
                </div>

                <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-700">
                    {PERKS.map(({ icon: Icon, text }) => (
                        <li key={text} className="inline-flex items-center gap-1.5">
                            <Icon className="h-4 w-4 text-gold-500" /> {text}
                        </li>
                    ))}
                </ul>
            </motion.div>
        </aside>
    )
}