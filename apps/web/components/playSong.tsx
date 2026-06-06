import { useEffect, useRef } from "react";

export default function MusicPlayer() {
const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    audioRef.current?.play();
  }, []);

  return (
    <>
      <audio
        ref={audioRef}
        src="/despacito.mp3"
      />

      {/* Your UI */}
    </>
  );
}