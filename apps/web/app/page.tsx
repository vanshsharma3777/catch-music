"use client"

import { Check, CheckCircle, Download, Headphones, Menu, MoreHorizontal, Music4, Pause, Play, Repeat, Shuffle, ShuffleIcon, SkipBack, SkipForward, WifiOff, Zap } from "lucide-react";
import ButtonComponent from "../components/Button";
import { useEffect, useRef, useState } from "react";

export default function ThemePreview() {
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
      title: "Teri galliyo se",
      artist: "Album",
      image: "/songs/starboy.jpg",
      url: "https://aac.saavncdn.com/584/ead0e8ac5d1db46a2adc2337cf47f4e1_320.mp4",
    },
  ];
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);
  const currentSong = songs[currentSongIndex];
  const nextSong =songs[(currentSongIndex + 1) % songs.length];
  const previousSong =songs[(currentSongIndex - 1 + songs.length) % songs.length ];

  const progress =
  duration > 0
    ? (currentTime / duration) * 100
    : 0;
  
    useEffect(() => {
  if (audioRef.current) {
    audioRef.current.src = currentSong!.url;
  }
}, [currentSongIndex]);

  const waveform = [
    2, 4, 6, 6, 8, 20, 15, 20, 34, 16, 24, 40, 56, 80, 56, 40, 24, 16, 10, 6, 8,];

    function togglePlayPause() {
        console.log(audioRef.current);

  if (!audioRef.current) return;

  if (isPlaying) {
    audioRef.current.pause();
    setIsPlaying(false);
  } else {
    audioRef.current.play();
    setIsPlaying(true);
  }
}

  function handleSeek(
  e: React.MouseEvent<HTMLDivElement>
) {
  if (!audioRef.current) return;

  const rect = e.currentTarget.getBoundingClientRect();

  const clickX = e.clientX - rect.left;

  const clickedPercentage =
    (clickX / rect.width) * 100;

  audioRef.current.currentTime =
    (clickedPercentage / 100) * duration;
}

  function playCurrentSong() {
  if (!audioRef.current || !currentSong) return;

  audioRef.current.src = currentSong.url;
  audioRef.current.play();
    setIsPlaying(true);

}

  function playNextSong() {
   const wasPlaying = isPlaying;

  setCurrentSongIndex(currentSongIndex+1);

  if (wasPlaying) {
    setTimeout(() => {
      audioRef.current?.play();
    }, 50);
  }
}

  function playPreviousSong() {
  setCurrentSongIndex((prev) =>
    prev === 0 ? songs.length - 1 : prev - 1
  );
}

function playSong(index: number) {
  setCurrentSongIndex(index);
}

function formatTime(time: number) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);

  return `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;
}
  return (
    <div className="min-h-screen">
      <div className={`absolute top-12 left-20 h-[100px] w-[100px] -z-10 bg-blob-gold blur-[80px]`} ></div>
      <header className="relative overflow-hidden z-10 text-pri">
        <div className="mt-8 flex justify-between items-center">
          <div className="flex ml-16 text-pri justify-center items-center  ">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blob-gold to-blob-gold-sec">
                <Music4 size={20} className="text-white" />
              </div>

              <span className="text-2xl font-bold">
                CatchMusic
              </span>
            </div>
          </div>

          <div>
            <ul className="flex  w-[500px] text-sec  px-3 py-2 justify-between cursor-pointer">
              <ButtonComponent onClick={"/hello"} classNameInputs={`hover:transition-all hover:duration-300 hover:transition-ease-in-out hover:scale-110 hover:text-pri hover:scale-110`} buttonInput={"Features"} />
              <ButtonComponent onClick={"/hello"} classNameInputs={`hover:transition-all hover:duration-300 hover:transition-ease-in-out hover:scale-110 hover:text-pri hover:scale-110`} buttonInput={"How it Works"} />
              <ButtonComponent onClick={"/hello"} classNameInputs={`hover:transition-all hover:duration-300 hover:transition-ease-in-out hover:scale-110 hover:text-pri hover:scale-110`} buttonInput={"Glimpse"} />
              <ButtonComponent onClick={"/hello"} classNameInputs={`hover:transition-all hover:duration-300 hover:transition-ease-in-out hover:scale-110 hover:text-pri hover:scale-110 `} buttonInput={"About"} />

            </ul>
          </div>
          <div className="mr-16">
            <div><ButtonComponent classNameInputs={`border text-md text-black font-semibold border-border px-5 py-2 rounded-full bg-blob-gold  hover:transition-all hover:duration-300 hover:transition-ease-in-out hover:scale-110`} onClick={"/start"} buttonInput={"Get Started"}></ButtonComponent></div>
          </div>
        </div>
      </header>
      {/* <div className={`absolute bottom-10  right-24  h-[30px] w-[900px] bg-blob-gold-sec blur-[90px] rounded-[58%_42%_23%_77%/32%_64%_36%_68%]`}></div> */}

      <main className="mt-[5%] ml-16 flex">
        <div className="w-[35%] ">
          <div>
            <div className="w-[45%] rounded-lg border-[1px]  border-border-light py-1 pl-1 flex  ">
              <div className="px-1"> <Headphones className="text-muted" /></div>
              <div className="text-secondary">Your Music. Always With You.</div>
            </div>

            <div className="relative z-10 mt-3  h-full  ">
              <div className="text-6xl font-bold mb-2">Save Your Music.</div>
              <div className="text-6xl font-bold">
                Listen{" "}
                <span className="bg-gradient-to-r from-blob-gold to-blob-gold-sec text-transparent bg-clip-text">
                  Offline.
                </span>
              </div>

              <div className="text-sec mt-3 ">Cache your favorite songs and listen anytime, anywhere. <br /> No internet? No problem. </div>

              <div className="flex mt-6">
                <div className="flex items-start gap-2 text-sm">
                  <div className="shrink-0">

                    <Download
                      size={25}
                      strokeWidth={2}
                      className="text-blob-gold-ter"
                    />
                  </div>

                  <div className="">
                    <div className="font-medium">
                      Save & Cache
                    </div>

                    <div className="text-sec mt-1">
                      Store your favorite songs easily
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm ">
                  <div className="shrink-0">
                    <Zap
                      size={25}
                      strokeWidth={2}
                      className="text-blob-gold-ter"
                    />
                  </div>

                  <div className="">
                    <div className="font-medium">
                      Fast & Smart
                    </div>

                    <div className="text-sec mt-1 text-wrap">
                      Quick cache & instant play
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <div className="shrink-0">
                    <WifiOff
                      size={25}
                      strokeWidth={2}
                      className="text-blob-gold-ter"
                    />
                  </div>

                  <div>
                    <div className="font-medium">
                      Offline Playback
                    </div>

                    <div className="text-sec mt-1">
                      Listen without internet
                    </div>
                  </div>
                </div>
                <div>
                </div>
              </div>
              <div className="flex gap-5 mt-8">
                <div>
                  <ButtonComponent buttonInput={"Sign In to continue"} classNameInputs={`border-2 text-black font-semibold hover:border border-transparent hover:scale-110 hover:transition-all hover:duration-300 hover:transition-ease-in-out border-border px-5 py-3 rounded-lg bg-blob-gold`} onClick={"/start"}></ButtonComponent>

                </div>

                <ButtonComponent buttonInput={"Explore Features"} classNameInputs={`border-2 hover:scale-110 hover:transition-all hover:duration-300 hover:transition-ease-in-out border-border-light px-5 py-3 rounded-md hover:border`} onClick={"/start"} />
              </div>
            </div>
          </div>
          <div className="flex items-center mt-12">
            <div className=" flex items-center pr-3">
              <div className="h-[50px] w-[50px] rounded-full overflow-hidden border-2 border-black">
                <img src="https://play-lh.googleusercontent.com/vHw1Qv2MNAzoXiuJb8lNkybyHBzCsiWblKCefKnsukJlV9z4G0hGL_4uXzLUwxyT7a_q" alt="" className="h-full w-full object-cover" />
              </div>

              <div className="h-[50px] w-[50px] rounded-full overflow-hidden border-2 border-black -ml-3">
                <img src="https://baypark.ca/wp-content/uploads/2020/02/spotify-logo-png-spotify-music-app-icon-1024.jpg" alt="" className="h-full w-full object-cover" />
              </div>

              <div className="h-[50px] w-[50px] rounded-full overflow-hidden border-2 border-black -ml-3">
                <img src="https://static1.pocketnowimages.com/wordpress/wp-content/uploads/styles/xxlarge/public/2019/11/wynk-music.jpg" alt="" className="h-full w-full object-cover" />
              </div>

            </div>
            <div className="text-xl text-sec "><div className="text-md text-ter">Cache once. Listen forever.</div></div>

          </div>
        </div>

        <div className="relative   w-[60%] ">
          <div className=" flex items-startms-center h-full">
            <div className="  flex  w-[70%] jusitfy-center items-center">
              <div className="ml-9 flex   items-center gap-[5px]">
                {waveform.map((height, i) => (
                  <div
                    key={i}
                    className="w-[2px] rounded-full bg-secondary shadow-[0_0_10px_rgba(255,180,50,0.7)]"
                    style={{ height: `${height}px` }}
                  />

                ))}

                <div>
                </div>
              </div>
              <div className="relative  w-[70%] h-full">

                <div className="absolute bg-bg inset-0 rotate-3 hover:rotate-[-3] shadow-[0_20px_60px_rgba(255,180,50,0.12)] rounded-3xl border-2 border-primary">
                  <div className="relative   rounded-3xl overflow-hidden" />
                  <div className="flex p-6 justify-between">
                    <div className="flex items-center">
                      <div className="mr-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full  bg-accent opacity-80 ">
                          <Music4 size={20} className="text-white" />
                        </div>
                      </div>
                      <div>
                        <div>Now Playing</div>
                        <div className="text-muted flex  items-center ">Cached <Check className="text-success" size={16}></Check></div>
                      </div>
                    </div>
                    <div className="flex  items-center ">
                      <div className="mr-4"><MoreHorizontal size={24} /></div>
                      <div><Menu size={20} /></div>
                    </div>
                  </div>

                  <div className="">
                    <div className=" m-6">
                      <div className="flex">
                        <div className="h-[150px] w-[150px] rounded-md  border-primary bg-gradient-to-b from-blob-gold to-blob-gold-sec/40">
                          <img className="" src="https://tse1.mm.bing.net/th/id/OIP.0rnQEf_9CrpB2pXEZHoMQAHaLG?r=0&rs=1&pid=ImgDetMain&o=7&rm=3" alt="" />
                        </div>
                        {currentSong && (
                          <div className="ml-5">
                          <div className="text-2xl font-bold">{currentSong.title}</div>
                          <div className="text-sec text-lg">{currentSong.artist}</div>
                          <div className="h-[30px] mt-2 flex justify-center -center bg-primary rounded-lg w-[90px]">
                            <div className="flex items-center justify-center">
                              <div><CheckCircle size={20} /></div>
                              <div className="pl-1 py-1">Cached</div>
                            </div>
                          </div>
                          <div className="flex">
                            <div className="mt-8">
                            <div className="mb-2 text-sm font-semibold text-muted uppercase tracking-wider">
                              Previous
                            </div>
                            <div className="flex items-center">
                              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-card">
                                🎵
                              </div>
                              <div>
                                <div className="text-sm font-medium">{previousSong?.title}</div>
                                <div className="text-xs text-muted">{previousSong?.artist}</div>
                              </div>
                            </div>
                          </div><div className="mt-8 pl-6 ">
                            <div className="mb-2 text-sm font-semibold text-muted uppercase tracking-wider">
                               Next
                            </div>
                            <div className="flex items-center">
                              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-card">
                                🎵
                              </div>
                              <div>
                                <div className="text-sm font-medium">{nextSong?.title}</div>
                                <div className="text-xs text-muted">{nextSong?.artist}</div>
                              </div>
                            </div>
                          </div>
                          </div>
                        </div>
                        )}
                      </div>
                      <div className="mt-12 w-full">
                        <div className="flex  items-center gap-3">
                          <span>{formatTime(currentTime)}</span>

                          <div onClick={handleSeek} className="relative flex-1 cursor-pointer h-[5px] rounded-full bg-card-hover">
                            <div className="absolute left-0 top-0 h-full  rounded-full bg-secondary" style={{ width: `${progress}%` }}></div>

                            <div className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary" style={{ left: `${progress}%` }}></div>
                          </div>

                          <span>{formatTime(duration)}</span>
                        </div> 
                        <div className="mt-4 ">
                          <div className="flex items-center justify-center gap-10">

                            <button className="text-muted hover:text-accent transition-colors">
                              <ShuffleIcon size={18} />
                            </button>

                            <button onClick={playPreviousSong}
                             className=" hover:text-accent transition-colors">
                              <SkipBack   size={22} />
                            </button>

                            <button   onClick={togglePlayPause}

                              className="flex  h-12 w-12 items-center justify-center rounded-full text-black  bg-blob-gold-sec">
                              {isPlaying ? <Pause size={22} /> : <Play size={22} />}
                            </button>

                            <button  onClick={playNextSong} className=" hover:text-accent transition-colors">
                              <SkipForward   size={22} />
                            </button>

                            <button className="text-muted hover:text-accent transition-colors">
                              <Repeat size={18} />
                            </button>

                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <audio
  ref={audioRef}
  src={currentSong?.url}
  onPlay={() => setIsPlaying(true)}
  onPause={() => setIsPlaying(false) }
  onTimeUpdate={() =>
    setCurrentTime(audioRef.current?.currentTime || 0)
  }
  onLoadedMetadata={() =>
    setDuration(audioRef.current?.duration || 0)
  }
/>
    </div>
    
  );
}