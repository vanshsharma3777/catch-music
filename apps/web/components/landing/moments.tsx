import { Train, BookOpen, Mountain, Plane, X, Check } from "lucide-react";

export default function MomentsSection() {
  const useCases = [
    { title: "Travelling", text: "No networks on trains. Your music stays with you.", icon: Train },
    { title: "Studying", text: "Keep focus playlists ready even without WiFi.", icon: BookOpen },
    { title: "Trekking", text: "Enjoy music in remote locations without network.", icon: Mountain },
    { title: "Flights", text: "No internet required. Have fun with your own playlists.", icon: Plane }
  ];

  return (
    <section className="py-20 bg-bg">
      <div className="max-w-7xl mx-auto px-6 lg:px-16 space-y-24">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex flex-col items-center text-center p-8 rounded-3xl border border-border bg-gradient-to-b from-surface to-card shadow-md hover:border-border-light transition-all duration-300 group">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-ter border border-border-light text-secondary shadow-sm group-hover:text-primary transition-colors duration-300">
                  <Icon size={28} strokeWidth={1.5} />
                </div>
                <h3 className="mt-6 font-semibold text-base text-pri tracking-wide">{item.title}</h3>
                <p className="mt-2 text-xs md:text-sm text-sec leading-relaxed">{item.text}</p>
              </div>
            );
          })}
        </div>

        <div className="space-y-12">
          <div className="flex flex-col gap-4 border-b border-border pb-12">
            <div className="inline-flex items-center rounded-full border border-border-light bg-surface px-4 py-1.5 shadow-sm w-max">
              <span className="text-xs font-semibold tracking-widest text-primary uppercase">
                Before vs After
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-pri leading-[1.15]">
              Better Experience. <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary-hover text-transparent bg-clip-text">
                Zero Hassle.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col rounded-3xl border border-border bg-gradient-to-b from-surface to-card p-8 shadow-md">
              <h3 className="text-error font-bold text-lg tracking-wide border-b border-border pb-4 mb-6 text-center md:text-left">
                Before CatchMusic
              </h3>
              <div className="space-y-4">
                {["Open app", "Search song", "Need Internet", "Buffering", "Premium required"].map((text, idx) => (
                  <div key={idx} className="flex items-center gap-3.5 group">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-error/10 border border-error/20 text-error">
                      <X size={14} strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-medium text-sec group-hover:text-pri transition-colors">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col rounded-3xl border border-border bg-gradient-to-b from-surface to-card p-8 shadow-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--glow-gold)] to-transparent opacity-30 pointer-events-none" />
              <h3 className="text-success font-bold text-lg tracking-wide border-b border-border pb-4 mb-6 text-center md:text-left">
                After CatchMusic
              </h3>
              <div className="space-y-4 relative z-10">
                {["Play once", "Automatically cached", "Offline ready", "Instant playback", "No extra step"].map((text, idx) => (
                  <div key={idx} className="flex items-center gap-3.5 group">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-success/10 border border-success/20 text-success">
                      <Check size={14} strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-semibold text-pri group-hover:text-primary transition-colors">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}