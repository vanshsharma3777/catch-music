import { Download, LockKeyhole, WifiOff, Layers, Radio, HelpCircle } from "lucide-react";

export default function ProblemSection() {
  const problemCards = [
    {
      id: "01",
      title: "Need to Download Every Song?",
      problem: "Most music platforms require you to manually download songs, organize them, and keep track of what is available offline.",
      solution: "Just play the song once. CatchMusic can automatically cache it for future offline playback, so your favorite music is always ready when you need it.",
      icon: Download
    },
    {
      id: "02",
      title: "Premium Subscription Required",
      problem: "Many streaming platforms reserve offline playback for premium users, limiting access to downloaded music behind paid subscriptions.",
      solution: "CatchMusic keeps your cached songs available on your device, giving you quick access to the music you love whenever you want it.",
      icon: LockKeyhole
    },
    {
      id: "03",
      title: "No Internet means No Music?",
      problem: "Whether you're traveling, commuting through a metro, or exploring remote areas, music streaming often stops the moment your internet connection drops.",
      solution: "Songs you've already cached remain available, allowing you to continue listening smoothly even when you're offline.",
      icon: WifiOff
    },
    {
      id: "04",
      title: "Ads Ruin The Vibe",
      problem: "Many music platforms interrupt listening sessions with advertisements and ruining the mood right when you're enjoying.",
      solution: "Your cached songs can be played without unexpected interruptions.",
      icon: Radio
    },
    {
      id: "05",
      title: "Buffering The Same Song Again",
      problem: "Every time you stream a song, your device may need to fetch the same data repeatedly. This can lead to waiting, buffering, and unnecessary internet usage.",
      solution: "Once a song is cached, it loads instantly from your device. No repeated fetching, no waiting — just press play and enjoy.",
      icon: Layers
    },
    {
      id: "06",
      title: "Can't Find That Song Again?",
      problem: "We've all discovered a great song, listened to it a few times, and then completely forgotten its name. Finding it again can be frustrating and time-consuming.",
      solution: "Your recently cached songs remain available in your personal library, making it easier to revisit tracks you've already enjoyed.",
      icon: HelpCircle
    }
  ];

  return (
    <section id="problems" className="py-20 bg-bg scroll-mt-6">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        
        <div className="flex flex-col gap-4 border-b border-border pb-12 mb-16">
          <div className="inline-flex items-center rounded-full border border-border-light bg-surface px-4 py-1.5 shadow-sm w-max">
            <span className="text-xs font-semibold tracking-widest text-primary uppercase">
              Why CatchMusic Exists
            </span>
          </div>
          <div className="space-y-3">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-pri leading-[1.15]">
              The Problems We All Face <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary-hover text-transparent bg-clip-text">
                (And We Solve Them)
              </span>
            </h2>
            <p className="max-w-md text-base md:text-lg text-sec leading-relaxed tracking-wide">
              We built CatchMusic to fix everyday music struggles.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problemCards.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="flex flex-col justify-between rounded-3xl border border-border bg-gradient-to-b from-surface to-card p-6 shadow-md hover:border-border-light transition-all duration-300 group">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-ter border border-border-light text-accent shadow-sm group-hover:border-accent/35 transition-colors duration-300">
                      <Icon size={20} strokeWidth={1.75} />
                    </div>
                    <span className="text-xs font-bold tracking-widest text-muted uppercase">
                      Problem #{item.id}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-bold tracking-tight text-pri group-hover:text-primary transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p className="text-sm text-sec leading-relaxed min-h-[72px]">
                      {item.problem}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-bg-sec/60 border border-border-light p-4 shadow-inner">
                  <span className="block text-xs font-semibold tracking-wider text-primary uppercase mb-1">
                    Our Solution
                  </span>
                  <p className="text-xs md:text-sm text-sec leading-relaxed">
                    {item.solution}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}