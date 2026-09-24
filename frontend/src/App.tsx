import { RotateCcw, Waves } from 'lucide-react'
import Backdrop from './components/Backdrop'
import ChatWindow from './components/ChatWindow'
import HeroPanel from './components/HeroPanel'
import { useChat } from './hooks/useChat'
import { useOnline } from './hooks/useOnline'

export default function App() {
  const { messages, loading, send, retry, reset } = useChat()
  const online = useOnline()

  return (
    <div className="relative h-dvh">
      <Backdrop />
      <div className="relative z-10 mx-auto flex h-full max-w-6xl gap-10 sm:p-6 lg:p-10">
        <HeroPanel onAsk={(q) => send(q)} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <main className="glass flex min-h-0 flex-1 flex-col overflow-hidden shadow-2xl shadow-ocean-900/15 sm:rounded-3xl">
            <header className="relative flex items-center gap-3 bg-gradient-to-r from-ocean-950 via-ocean-900 to-ocean-800 px-4 py-3.5 text-white sm:px-5">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-coral-500 shadow-lg shadow-coral-500/30">
                <Waves className="h-5 w-5 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 animate-pulse-ring rounded-full bg-emerald-400 ring-2 ring-ocean-900" />
              </div>
              <div className="flex-1">
                <h1 className="font-display text-lg leading-tight">Azure Bay Resort &amp; Spa</h1>
                <p className="text-xs text-ocean-200">Concierge · Online now</p>
              </div>
              <button
                onClick={reset}
                aria-label="Start a new conversation"
                title="New conversation"
                className="rounded-full p-2 text-ocean-200 transition hover:bg-white/10 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-400/70 to-transparent"
              />
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
      </div>
    </div>
  )
}