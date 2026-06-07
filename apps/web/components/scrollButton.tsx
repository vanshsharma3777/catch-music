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

      setShowBottom(
        scrollTop + windowHeight < documentHeight - 200
      );
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
    <div className="fixed bottom-6 right-6 z-50">
      {showTop && (
        <button
          onClick={scrollToTop}
          className="p-3 rounded-full bg-primary"
        >
          <ArrowUp />
        </button>
      )}

      {showBottom && !showTop && (
        <button
          onClick={scrollToBottom}
          className="p-3 rounded-full bg-primary"
        >
          <ArrowDown />
        </button>
      )}
    </div>
  );
}