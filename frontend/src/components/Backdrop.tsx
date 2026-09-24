export default function Backdrop() {
    return (
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute -left-24 top-10 h-80 w-80 animate-float rounded-full bg-ocean-200/60 blur-3xl" />
            <div className="absolute right-0 top-1/3 h-96 w-96 animate-float-slow rounded-full bg-gold-400/25 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-72 w-72 animate-float rounded-full bg-coral-400/20 blur-3xl" />
            <svg
                className="absolute bottom-0 left-0 h-40 w-[200%] animate-wave text-ocean-400/20"
                viewBox="0 0 2880 160"
                preserveAspectRatio="none"
            >
                <path
                    fill="currentColor"
                    d="M0,80 C120,120 240,40 360,80 S600,40 720,80 S960,40 1080,80 S1320,40 1440,80 S1680,40 1800,80 S2040,40 2160,80 S2400,40 2520,80 S2760,40 2880,80 L2880,160 L0,160 Z"
                />
            </svg>
        </div>
    )
}