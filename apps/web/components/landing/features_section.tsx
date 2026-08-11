export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-bg">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 border-b border-border pb-16">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center rounded-full border border-border-light bg-surface px-4 py-1.5 shadow-sm">
              <span className="text-xs font-semibold tracking-widest text-primary uppercase">
                Features
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-pri leading-[1.15]">
              Powerful Features. <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary-hover text-transparent bg-clip-text">
                Built for Music Lovers.
              </span>
            </h2>
            <p className="max-w-md text-base md:text-lg text-sec leading-relaxed tracking-wide">
              CatchMusic makes offline music simple, smart, and completely hassle-free.
            </p>
          </div>

          <div className="relative w-full lg:max-w-md rounded-2xl border border-border-light bg-gradient-to-b from-surface to-card p-6 shadow-md overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--glow-gold)] to-transparent opacity-50 pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <h3 className="text-base font-semibold text-pri">
                Powered by <span className="text-primary">Browser Storage</span>
              </h3>
              <p className="text-sm text-sec leading-relaxed tracking-wide">
                Your music is stored directly in your <span className="text-pri font-medium">browser storage</span>, giving you lightning-fast local access, instant offline playback, and complete ownership of your library.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8">
          
          <div className="grid lg:grid-cols-12 gap-8 items-center rounded-3xl border border-border bg-gradient-to-b from-surface to-card p-8 lg:p-12 shadow-md hover:border-border-light transition-all duration-300 group">
            <div className="lg:col-span-7 flex gap-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg-ter border border-border-light font-bold text-sm text-primary">
                01
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-pri">Instant Caching</h3>
                <span className="inline-block text-xs font-medium tracking-wide text-secondary uppercase">One tap. Done Forever.</span>
                <p className="text-sm md:text-base text-sec leading-relaxed pt-2">
                  Cache favorite songs instantly by listening online for the first time. Once cached, you can listen anytime, anywhere — without downloading again until you choose to delete it.
                </p>
              </div>
            </div>
            <div className="lg:col-span-5 flex justify-center lg:justify-end overflow-hidden rounded-2xl border border-border-light bg-bg-sec/50">
              <img src="despacito-cache.png" alt="Instant Caching Preview" className="h-49 lg:h-57 w-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center rounded-3xl border border-border bg-gradient-to-b from-surface to-card p-8 lg:p-12 shadow-md hover:border-border-light transition-all duration-300 group">
            <div className="lg:col-span-7 flex gap-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg-ter border border-border-light font-bold text-sm text-primary">
                02
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-pri">First Time Online</h3>
                <span className="inline-block text-xs font-medium tracking-wide text-secondary uppercase">We handle the rest.</span>
                <p className="text-sm md:text-base text-sec leading-relaxed pt-2">
                  The first time you play a song, it streams online. Simply hit the cache button to instantly save it to local storage in the background. Next time, you are fully set to stream offline.
                </p>
              </div>
            </div>
            <div className="lg:col-span-5 flex justify-center lg:justify-end overflow-hidden rounded-2xl border border-border-light bg-bg-sec/50">
              <img src="browser-caching.png" alt="Background Processing Preview" className="h-48 lg:h-56 w-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center rounded-3xl border border-border bg-gradient-to-b from-surface to-card p-8 lg:p-12 shadow-md hover:border-border-light transition-all duration-300 group">
            <div className="lg:col-span-7 flex gap-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg-ter border border-border-light font-bold text-sm text-primary">
                03
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-pri">Smart Storage Management</h3>
                <span className="inline-block text-xs font-medium tracking-wide text-secondary uppercase">We've got your back.</span>
                <p className="text-sm md:text-base text-sec leading-relaxed pt-2">
                  Running out of native browser storage space? Our system handles threshold cleanups seamlessly, identifying infrequently played tracks so your newer music discovery library always has room.
                </p>
              </div>
            </div>
            <div className="lg:col-span-5 flex justify-center lg:justify-end overflow-hidden rounded-2xl border border-border-light bg-bg-sec/50">
              <img src="storage-warning.png" alt="Storage Analytics Dashboard" className="h-48 lg:h-56 w-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center rounded-3xl border border-border bg-gradient-to-b from-surface to-card p-8 lg:p-12 shadow-md hover:border-border-light transition-all duration-300 group">
            <div className="lg:col-span-7 flex gap-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg-ter border border-border-light font-bold text-sm text-primary">
                04
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-pri">Different Devices. Different Moods.</h3>
                <span className="inline-block text-xs font-medium tracking-wide text-secondary uppercase">Your music, your way.</span>
                <p className="text-sm md:text-base text-sec leading-relaxed pt-2">
                  No overlapping sync logs. Dedicate a focused ambient environment for deep work streams on your workstation while preserving your high-energy gym playlist isolated exclusively inside your phone.
                </p>
              </div>
            </div>
            <div className="lg:col-span-5 flex justify-center lg:justify-end overflow-hidden rounded-2xl border border-border-light bg-bg-sec/50">
              <img src="comp-phone.png" alt="Multi Device Context Isolation" className="h-48 lg:h-56 w-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}