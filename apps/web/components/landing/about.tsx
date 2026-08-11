import { Smartphone, BookOpen, Zap, Star, Globe, Send } from "lucide-react";

export default function AboutSection() {
  const stats = [
    { id: 1, title: "30 Songs", desc: "Cached seamlessly directly inside mobile contexts.", icon: Smartphone },
    { id: 2, title: "50 Songs", desc: "Expanded partition allocation inside desktop views.", icon: BookOpen },
    { id: 3, title: "Blazing Fast", desc: "Zero runtime latency with localized local forage engine.", icon: Zap },
    { id: 4, title: "High Quality", desc: "Bitrate structures optimized for absolute clarity.", icon: Star },
    { id: 5, title: "Global Access", desc: "Stream cloud repositories free from geoblocks.", icon: Globe }
  ];

  return (
    <section id="about" className="py-20 bg-bg scroll-mt-6">
      <div className="max-w-7xl mx-auto px-6 lg:px-16 space-y-20">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 border-b border-border pb-16">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center rounded-full border border-border-light bg-surface px-4 py-1.5 shadow-sm">
              <span className="text-xs font-semibold tracking-widest text-primary uppercase">
                About CatchMusic
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-pri leading-[1.15]">
              Limitless Music. <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary-hover text-transparent bg-clip-text">
                No Hassle.
              </span>
            </h2>
            <p className="max-w-md text-base md:text-lg text-sec leading-relaxed tracking-wide">
              Enjoy your favorite music instantly, anywhere. No interruption. Just pure music.
            </p>
          </div>
          <div className="w-full lg:max-w-md overflow-hidden rounded-2xl border border-border-light bg-bg-sec/50">
            <img src="about-music.png" alt="Dashboard Core Infrastructure Preview" className="w-full h-auto object-cover opacity-80" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="flex flex-col items-center text-center rounded-2xl border border-border bg-gradient-to-b from-surface to-card p-6 shadow-md hover:border-border-light transition-all duration-300 group">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bg-ter border border-border-light text-secondary group-hover:text-primary transition-colors duration-300">
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 font-bold text-base text-pri tracking-wide">{item.title}</h3>
                <p className="mt-2 text-xs text-sec leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-12 gap-12 items-center pt-8 border-t border-border">
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4">
            <h3 className="text-3xl font-bold tracking-tight text-pri">
              Your Music <br />
              <span className="bg-gradient-to-r from-primary to-accent text-transparent bg-clip-text text-4xl font-extrabold">
                Always with you
              </span>
            </h3>
            <div className="w-full max-w-[280px] overflow-hidden rounded-2xl border border-border-light bg-bg-sec/30 mt-4">
              <img src="boy2.png" alt="Offline music illustration" className="w-full h-auto object-contain opacity-75" />
            </div>
          </div>

          <div className="lg:col-span-7 w-full max-w-xl mx-auto lg:ml-auto rounded-3xl border border-border bg-gradient-to-b from-surface to-card p-6 lg:p-8 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--glow-gold)] to-transparent opacity-20 pointer-events-none" />
            
            <div className="relative z-10 space-y-2 border-b border-border pb-4">
              <h4 className="text-xl font-bold tracking-tight text-pri">Give a Review</h4>
              <p className="text-xs text-sec tracking-wide">We would love to hear your architectural insights and features feedback.</p>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="relative z-10 mt-6 space-y-4">
              <div className="space-y-1">
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  className="w-full bg-[var(--background)] px-4 py-3 rounded-xl border border-border-light text-sm text-pri placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors duration-300"
                />
              </div>
              <div className="space-y-1">
                <textarea 
                  rows={3} 
                  placeholder="Write your feedback..." 
                  className="w-full bg-[var(--background)] px-4 py-3 rounded-xl border border-border-light text-sm text-pri placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] resize-none transition-colors duration-300"
                />
              </div>
              
              <button className="w-full sm:w-1/2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] px-6 py-3 text-black font-semibold text-sm tracking-wide shadow-[var(--shadow-premium)] transition-all duration-300 hover:brightness-110 active:scale-[0.98] mx-auto">
                <Send size={16} strokeWidth={2.25} />
                <span>Submit Review</span>
              </button>
            </form>
          </div>
        </div>

      </div>
    </section>
  );
}