import { Play, Download, ShieldCheck, Headphones } from "lucide-react";

export default function WorkingSection() {
  const steps = [
    {
      id: "01",
      title: "Play Songs",
      description: "Play any song you love from the cloud streaming stream.",
      icon: Play
    },
    {
      id: "02",
      title: "Cache It",
      description: "Our system intercepts chunks and caches the data silently.",
      icon: Download
    },
    {
      id: "03",
      title: "Stored Securely",
      description: "Files are preserved safely inside sandbox browser storage.",
      icon: ShieldCheck
    },
    {
      id: "04",
      title: "Listen Offline",
      description: "Enjoy high-fidelity audio streams without network latency.",
      icon: Headphones
    }
  ];

  return (
    <section id="working" className="py-20 bg-bg scroll-mt-6">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        
        <div className="flex flex-col gap-4 border-b border-border pb-12 mb-16">
          <div className="inline-flex items-center rounded-full border border-border-light bg-surface px-4 py-1.5 shadow-sm w-max">
            <span className="text-xs font-semibold tracking-widest text-primary uppercase">
              How It Works
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-pri leading-[1.15]">
            Simple Steps. <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary-hover text-transparent bg-clip-text">
              Powerful Experience.
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.id} className="relative flex flex-col items-center text-center group">
                
                
                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl border border-border-light bg-gradient-to-b from-surface to-card text-accent shadow-md transition-all duration-300 group-hover:border-accent/40 group-hover:scale-105">
                  <div className="absolute top-2 right-2 text-[10px] font-bold tracking-wider text-muted select-none">
                    {step.id}
                  </div>
                  <Icon size={26} strokeWidth={1.75} className="group-hover:text-primary transition-colors" />
                </div>

                <div className="mt-6 space-y-2 max-w-[220px]">
                  <h3 className="font-semibold text-base text-pri tracking-wide group-hover:text-primary-hover transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs md:text-sm text-sec leading-relaxed">
                    {step.description}
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