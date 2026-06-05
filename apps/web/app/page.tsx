import { Download, Headphones, Music4, WifiOff, Zap } from "lucide-react";
import ButtonComponent from "../components/Button";

export default function ThemePreview() {

  return (
    <div className="">
      <div className={`absolute top-0 left-0 h-[200px] w-[200px] bg-blob-purple blur-[150px]`} ></div>
      <header className="relative z-10 text-pri">
        <div className="mt-8 flex justify-between items-center">
          <div className="flex ml-16 text-pri   ">
            <>
              <svg width="0" height="0">
                <defs>
                  <linearGradient id="music-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>

              <Music4
                size={30}
                style={{
                  stroke: "url(#music-gradient)",
                }}
                strokeWidth={2}
              />
            </>
            <div className="ml-2 text-xl">CatchMusic</div>
          </div>
          <div>
            <ul className="flex  w-[500px] text-sec  px-3 py-2 justify-between cursor-pointer">
              <ButtonComponent onClick={"/hello"} classNameInputs={`className="hover:text-pri hover:scale-110`} buttonInput={"Features"} />
              <ButtonComponent onClick={"/hello"} classNameInputs={`className="hover:text-pri hover:scale-110`} buttonInput={"How it Works"} />
              <ButtonComponent onClick={"/hello"} classNameInputs={`className="hover:text-pri hover:scale-110`} buttonInput={"Glimpse"} />
              <ButtonComponent onClick={"/hello"} classNameInputs={`className="hover:text-pri hover:scale-110`} buttonInput={"About"} />

            </ul>
          </div>
          <div className="mr-16">
            <div><ButtonComponent classNameInputs={`border border-border px-3 py-2 rounded-md bg-gradient-to-r from-blob-purple to-blob-blue`} onClick={"/start"} buttonInput={"Get Started"}></ButtonComponent></div>
          </div>
        </div>
      </header>
      <div className={`absolute bottom-0  right-0  h-[200px] w-[200px] bg-blob-blue blur-[150px]`}></div>

      <main className="mt-[5%] ml-16 ">
        <div>
          <div className="w-[17%] rounded-lg border-[1px]  border-border-light py-1 pl-1 flex  ">
            <div className="px-1"> <Headphones className="text-muted" /></div>
            <div className="text-sec">Your Music. Always With You.</div>
          </div>

          <div className="relative z-10 mt-3  h-full  w-[29%]">
            <div className="text-6xl font-bold mb-2">Save Your Music.</div>
            <div className="text-6xl font-bold">
              Listen{" "}
              <span className="bg-gradient-to-r from-blob-purple to-blob-blue text-transparent bg-clip-text">
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
                    className="text-blob-cyan"
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
                    className="text-blob-cyan"
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
                    className="text-blob-cyan"
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
            <div>
              <button>button1</button>
              <button>button2</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}