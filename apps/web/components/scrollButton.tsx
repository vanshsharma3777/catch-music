import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

export default function ScrollButtons() {
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      setShowTop(scrollTop > 200);
      setShowBottom(scrollTop + windowHeight < documentHeight - 200);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
      {showTop && (
        <button
          onClick={scrollToTop}
          className="p-3 rounded-xl border border-border-light bg-surface text-pri shadow-md hover:text-primary hover:border-accent/40 active:scale-95 transition-all duration-300 group"
        >
          <ArrowUp size={18} strokeWidth={2.5} className="group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}

      {showBottom && !showTop && (
        <button
          onClick={scrollToBottom}
          className="p-3 rounded-xl border border-border-light bg-surface text-pri shadow-md hover:text-primary hover:border-accent/40 active:scale-95 transition-all duration-300 group"
        >
          <ArrowDown size={18} strokeWidth={2.5} className="group-hover:translate-y-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
}