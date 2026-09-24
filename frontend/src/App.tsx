import { RotateCcw, Waves } from 'lucide-react'
import ChatWindow from './components/ChatWindow'
import { useChat } from './hooks/useChat'
import { useOnline } from './hooks/useOnline'

export default function App() {
  const { messages, loading, send, retry, reset } = useChat()
  const online = useOnline()

  return (
    <div className="mx-auto flex h-dvh max-w-3xl flex-col sm:p-6">
      <main className="glass flex min-h-0 flex-1 flex-col overflow-hidden shadow-xl shadow-ocean-900/10 sm:rounded-3xl">
        <header className="flex items-center gap-3 bg-gradient-to-r from-ocean-950 via-ocean-900 to-ocean-800 px-4 py-3.5 text-white sm:px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
            <Waves className="h-5 w-5 text-gold-400" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-lg leading-tight">Azure Bay Resort &amp; Spa</h1>
            <p className="text-xs text-ocean-200">Virtual concierge · Goa</p>
          </div>
          <button
            onClick={reset}
            aria-label="Start a new conversation"
            title="New conversation"
            className="rounded-full p-2 text-ocean-200 transition hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </header>

        {!online && (
          <div role="status" className="bg-gold-400/20 px-4 py-2 text-center text-xs text-ink-900">
            You're offline. Reconnect to keep chatting.
          </div>
        )}

        <ChatWindow messages={messages} loading={loading} send={send} retry={retry} />
      </main>
      <p className="hidden pt-3 text-center text-xs text-ink-500 sm:block">
        AI answers come from our hotel information. For anything else, please contact the front desk.
      </p>
    </div>
  )
}