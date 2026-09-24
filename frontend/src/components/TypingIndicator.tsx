export default function TypingIndicator() {
    return (
        <div className="flex items-center gap-1.5 px-1 py-2" role="status" aria-label="Assistant is typing">
            {[0, 150, 300].map((delay) => (
                <span
                    key={delay}
                    className="h-2 w-2 animate-bounce rounded-full bg-coral-400"
                    style={{ animationDelay: `${delay}ms` }}
                />
            ))}
        </div>
    )
}