import { CalendarDays } from 'lucide-react'

const QUESTIONS = [
    'What time is check-in?',
    'Does the hotel have a swimming pool?',
    'Which room is suitable for three guests?',
    'Is breakfast included?',
    'What is the cancellation policy?',
]

interface Props {
    onPick: (q: string) => void
    onOpenForm: () => void
}

export default function SuggestedQuestions({ onPick, onOpenForm }: Props) {
    return (
        <div className="flex flex-wrap gap-2 pl-10">
            <button
                onClick={onOpenForm}
                className="inline-flex items-center gap-1.5 rounded-full bg-ocean-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-ocean-800"
            >
                <CalendarDays className="h-3.5 w-3.5" /> Check availability
            </button>
            {QUESTIONS.map((q) => (
                <button
                    key={q}
                    onClick={() => onPick(q)}
                    className="rounded-full border border-ocean-200 bg-white/80 px-3.5 py-1.5 text-xs text-ocean-800 transition hover:border-ocean-400 hover:bg-white"
                >
                    {q}
                </button>
            ))}
        </div>
    )
}