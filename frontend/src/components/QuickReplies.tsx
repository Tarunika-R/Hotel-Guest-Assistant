const REPLIES = [
    { emoji: '🕒', label: 'Check-in', q: 'What time is check-in?' },
    { emoji: '🏊', label: 'Pool', q: 'Does the hotel have a swimming pool?' },
    { emoji: '🍳', label: 'Breakfast', q: 'Is breakfast included?' },
    { emoji: '📜', label: 'Cancellation', q: 'What is the cancellation policy?' },
    { emoji: '🛏️', label: 'Room for 3', q: 'Which room is suitable for three guests?' },
]

interface Props {
    onPick: (q: string) => void
    disabled: boolean
}

export default function QuickReplies({ onPick, disabled }: Props) {
    return (
        <div role="group" aria-label="Quick questions" className="scrollbar-thin flex gap-2 overflow-x-auto px-3 pb-2 pt-1 sm:px-4">
            {REPLIES.map((r) => (
                <button
                    key={r.label}
                    disabled={disabled}
                    onClick={() => onPick(r.q)}
                    className="shrink-0 whitespace-nowrap rounded-full border border-ocean-100 bg-white/90 px-3 py-1.5 text-xs font-medium text-ocean-800 transition hover:-translate-y-0.5 hover:border-coral-400 hover:shadow disabled:opacity-50"
                >
                    <span aria-hidden>{r.emoji}</span> {r.label}
                </button>
            ))}
        </div>
    )
}