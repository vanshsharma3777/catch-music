'use client'

import { Check, CheckCircle, Download, Headphones, Menu, MoreHorizontal, Music4, Pause, Play, Repeat, ShuffleIcon, SkipBack, SkipForward, WifiOff, Zap } from "lucide-react";
import ButtonComponent from "../Button";
import { useEffect, useRef, useState } from "react";

export default function MainSection(){
  const waveform = [2, 4, 6, 6, 8, 20, 15, 20, 34, 16, 24, 40, 56, 80, 56, 40, 24, 16, 10, 6, 8];  
const songs = [
    {
      title: "Aari Aari",
      artist: "Dhurandhar-2",
      image: "/songs/despacito.jpg",
      url: "https://aac.saavncdn.com/581/19682aba7f775484c3c24a7f26191aed_320.mp4",
    },
    {
      title: "Barbad",
      artist: "Saiyaara",
      image: "/songs/blindinglights.jpg",
      url: "https://aac.saavncdn.com/598/9117397be2712fb843b268a7c16b941a_320.mp4",
    },
    {
      title: "Teri galliyon se",
      artist: "Album",
      image: "/songs/starboy.jpg",
      url: "https://aac.saavncdn.com/584/ead0e8ac5d1db46a2adc2337cf47f4e1_320.mp4",
    },
  ];

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const currentSong = songs[currentSongIndex];
  const nextSong = songs[(currentSongIndex + 1) % songs.length];
  const previousSong = songs[(currentSongIndex - 1 + songs.length) % songs.length];

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
      
  useEffect(() => {
    if (!audioRef.current) return;
    
    audioRef.current.src = currentSong!.url;
    audioRef.current.load();

    if (isPlaying) {
      audioRef.current.play().catch((err) => console.log("Playback interrupted:", err));
    }
  }, [currentSongIndex]);
    
  function togglePlayPause() {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => console.log("Playback failed:", err));
    }
  }
    
  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    if (!audioRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedPercentage = clickX / rect.width;
    audioRef.current.currentTime = clickedPercentage * duration;
  }
    
  function playNextSong() {
    setCurrentSongIndex((prevIndex) => (prevIndex + 1) % songs.length);
  }
    
  function playPreviousSong() {
    setCurrentSongIndex((prevIndex) => (prevIndex - 1 + songs.length) % songs.length);
  }
    
  function formatTime(time: number) {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 lg:px-16 py-12">
      <main className="max-w-7xl mx-auto pt-8 lg:pt-12"> 
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          
          <div className="w-full lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-[var(--surface)] px-3.5 py-1.5 shadow-[var(--shadow-sm)]">
              <Headphones size={14} className="text-[var(--primary)]" />
              <span className="text-xs font-medium tracking-wide text-[var(--text-secondary)]">Your Music. Always With You.</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--text-primary)] leading-[1.1]">
                Save Your Music. <br />
                Listen <span className="bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary-hover)] text-transparent bg-clip-text">Offline.</span>
              </h1>
              <p className="max-w-xl text-base md:text-lg leading-relaxed text-[var(--text-secondary)] tracking-wide">
                Cache your favorite songs and listen anytime, anywhere. <br className="hidden sm:inline" /> No internet? No problem.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
              <div className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--glow-gold)] text-[var(--primary)] border border-[var(--border-glow)]">
                  <Download size={18} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[var(--text-primary)] tracking-wide">Save & Cache</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-normal">Store your favorite songs easily</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--glow-gold)] text-[var(--primary)] border border-[var(--border-glow)]">
                  <Zap size={18} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[var(--text-primary)] tracking-wide">Fast & Smart</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-normal">Quick cache & instant play</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--glow-gold)] text-[var(--primary)] border border-[var(--border-glow)]">
                  <WifiOff size={18} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[var(--text-primary)] tracking-wide">Offline Play</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-normal">Listen without internet</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <ButtonComponent 
                buttonInput="Sign In to continue" 
                classNameInputs="w-full sm:w-auto rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] px-6 py-3.5 text-black font-semibold text-sm tracking-wide shadow-[var(--shadow-premium)] transition-all duration-300 hover:brightness-110 hover:-translate-y-0.5" 
                onClick="/start" 
              />
              <ButtonComponent 
                buttonInput="Explore Features" 
                classNameInputs="w-full sm:w-auto rounded-xl border border-[var(--border-light)] bg-[var(--input-bg)] px-6 py-3.5 text-[var(--text-primary)] font-medium text-sm tracking-wide transition-all duration-300 hover:bg-[var(--card-hover)] hover:border-[var(--text-muted)]" 
                onClick="/start" 
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-6 border-t border-[var(--border)]">
              <div className="flex items-center">
                <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-[var(--background)] ring-1 ring-[var(--border-light)]">
                  <img src="https://play-lh.googleusercontent.com/vHw1Qv2MNAzoXiuJb8lNkybyHBzCsiWblKCefKnsukJlV9z4G0hGL_4uXzLUwxyT7a_q" alt="Platform 1" className="h-full w-full object-cover grayscale opacity-60" />
                </div>
                <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-[var(--background)] ring-1 ring-[var(--border-light)] -ml-3">
                  <img src="https://baypark.ca/wp-content/uploads/2020/02/spotify-logo-png-spotify-music-app-icon-1024.jpg" alt="Platform 2" className="h-full w-full object-cover grayscale opacity-60" />
                </div>
                <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-[var(--background)] ring-1 ring-[var(--border-light)] -ml-3">
                  <img src="https://static1.pocketnowimages.com/wordpress/wp-content/uploads/styles/xxlarge/public/2019/11/wynk-music.jpg" alt="Platform 3" className="h-full w-full object-cover grayscale opacity-60" />
                </div>
              </div>
              <p className="text-xs font-medium tracking-wide text-[var(--text-muted)]">
                Other streaming giants restrict lifetime offline playback. We break that barrier.
              </p>
            </div>
          </div>

          <div className="w-full lg:col-span-5 flex flex-col items-center lg:items-end mt-8 lg:mt-0 gap-6">
            <div className="relative w-full max-w-[440px] rounded-3xl border border-[var(--border-light)] bg-gradient-to-b from-[var(--surface)] to-[var(--card)] p-5 shadow-[var(--shadow-lg)] lg:hover:scale-[1.02] transition-all duration-500 group">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-[var(--glow-gold)] to-transparent opacity-40 pointer-events-none" />
              
              <div className="relative z-10 flex items-center justify-between pb-5 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--glow-gold)] text-[var(--primary)] border border-[var(--border-glow)] animate-pulse">
                    <Music4 size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Now Playing</span>
                    <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
                      Cached <Check className="text-[var(--success)]" size={12} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                  <button className="hover:text-[var(--text-primary)] transition-colors"><MoreHorizontal size={20} /></button>
                  <button className="hover:text-[var(--text-primary)] transition-colors"><Menu size={18} /></button>
                </div>
              </div>

              <div className="relative z-10 py-6 flex gap-5">
                <div className="h-28 w-28 shrink-0 rounded-2xl border border-[var(--border-light)] overflow-hidden shadow-[var(--shadow-md)] bg-gradient-to-b from-[var(--background-tertiary)] to-[var(--surface)]">
                  <img className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://tse1.mm.bing.net/th/id/OIP.0rnQEf_9CrpB2pXEZHoMQAHaLG?r=0&rs=1&pid=ImgDetMain&o=7&rm=3" alt="Album Art" />
                </div>
                {currentSong && (
                  <div className="flex flex-col justify-between py-1 overflow-hidden w-full">
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)] truncate">{currentSong.title}</h3>
                      <p className="text-sm text-[var(--text-secondary)] truncate mt-0.5">{currentSong.artist}</p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] px-2.5 py-1 w-max">
                      <CheckCircle size={14} className="text-[var(--primary)]" />
                      <span className="text-[11px] font-medium tracking-wide text-[var(--text-secondary)]">Local Storage</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative z-10 grid grid-cols-2 gap-3 p-3 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] mb-6">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs">⏮️</div>
                  <div className="overflow-hidden">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Previous</span>
                    <span className="block text-xs font-medium text-[var(--text-secondary)] truncate">{previousSong?.title}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 overflow-hidden border-l border-[var(--border)] pl-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs">⏭️</div>
                  <div className="overflow-hidden">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Next Up</span>
                    <span className="block text-xs font-medium text-[var(--text-secondary)] truncate">{nextSong?.title}</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 space-y-3">
                <div onClick={handleSeek} className="relative w-full cursor-pointer h-1.5 rounded-full bg-[var(--background-tertiary)] border border-[var(--border)] group/track">
                  <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" style={{ width: `${progress}%` }} />
                  <div className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--text-primary)] shadow-[var(--shadow-sm)] opacity-0 group-hover/track:opacity-100 transition-opacity" style={{ left: `${progress}%` }} />
                </div>
                
                <div className="flex justify-between text-xs font-medium text-[var(--text-muted)] tracking-wider">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="relative z-10 flex items-center justify-center gap-8 pt-4">
                <button className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"><ShuffleIcon size={16} /></button>
                <button onClick={playPreviousSong} className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"><SkipBack size={20} /></button>
                <button onClick={togglePlayPause} className="flex h-12 w-12 items-center justify-center rounded-xl text-black bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] shadow-[var(--shadow-premium)] hover:scale-105 active:scale-95 transition-all">
                  {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                </button>
                <button onClick={playNextSong} className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"><SkipForward size={20} /></button>
                <button className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"><Repeat size={16} /></button>
              </div>
            </div>

            <div className="w-full max-w-[440px] hidden lg:flex items-end justify-center gap-1 h-12 px-2">
              {waveform.map((height, i) => (
                <div
                  key={i}
                  className="w-[3px] rounded-full bg-gradient-to-t from-[var(--primary)] to-[var(--accent)] opacity-25 transition-all duration-300"
                  style={{ height: isPlaying ? `${height * 0.5}px` : '4px' }}
                />
              ))}
            </div>
          </div>

        </div>
      </main>

      <audio
        ref={audioRef}
        src={currentSong?.url}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
      />
    </div>
  )
}