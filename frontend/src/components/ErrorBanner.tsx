import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
    message: string
    onRetry?: () => void
}

export default function ErrorBanner({ message, onRetry }: Props) {
    return (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
                <p>{message}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
                    >
                        <RotateCcw className="h-3 w-3" /> Try again
                    </button>
                )}
            </div>
        </div>
    )
}