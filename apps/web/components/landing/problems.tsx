import { Download, Lock, LockKeyhole, WifiOff, WifiOffIcon } from "lucide-react";

export default function ProblemSection() {
    return (
        <div className="mt-16 "  >
            <div id="problems" className="scroll-mt-6" >
                <div className="border w-fit px-4 py-2 mb-2 rounded-full border-primary shadow-[0_20px_60px_rgba(255,180,50,0.12)]">
                    <div className="tracking-widest text-lg text-blob-gold">
                        WHY CATCHMUSIC EXISTS
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    <div>
                        <div className="text-6xl mb-1 font-medium whitespace-nowrap">
                            The Problems We All Face
                        </div>

                        <div className="text-6xl font-medium whitespace-nowrap">
                            (And We <span className="text-blob-gold-sec">Solve Them</span>)
                        </div>
                    </div>
                    <div className="max-w-[450px] text-sec">
                        We built CatchMusic to fix everyday music struggles.
                    </div>
                </div>
            </div>
            <div className="pt-5">
                
                <div className="grid grid-cols-3  gap-5 ">
                    <div className="bg-card   border border-border rounded-lg  p-5">
                    <div className="flex "> 
                        <div className="h-fit w-fit p-3   bg-primary rounded-full">
                            <div>
                                <Download size={30} className="text-blob-gold-sec "/>
                            </div>
                    </div>
                    <div className="pl-2">  
                        <div className="text-blob-gold-sec text-sm">Problem #1</div>
                        <div className="pt-2 font-semibold text-xl"  > Need to Download Every Song?</div>
                        <div className="text-sec">Most music platforms require you to manually download songs, organize them, and keep track of what is available offline.</div>
                    </div>
                    </div>
                    <div className="bg-card-hover p-4 rounded-lg mt-5">
                        <div className="text-blob-gold-sec font-semibold">Our Solution</div>
                        <div className="text-sec">Just play the song once. CatchMusic can automatically cache it for future offline playback, so your favorite music is always ready when you need it.</div>
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-5">
                    <div className="flex "> 
                        <div className="h-fit w-fit p-3   bg-primary rounded-full">
                            <div>
                                <LockKeyhole size={30} className="text-blob-gold-sec "/>
                            </div>
                    </div>
                    <div className="pl-2">  
                        <div className="text-blob-gold-sec text-sm">Problem #2</div>
                        <div className="pt-2 font-semibold text-xl"  >Premium Subscription Required</div>
                        <div className="text-sec">Many streaming platforms reserve offline playback for premium users, limiting access to downloaded music behind paid subscriptions.</div>
                    </div>
                    </div>
                    <div className="bg-card-hover p-4 rounded-lg mt-5">
                        <div className="text-blob-gold-sec font-semibold">Our Solution</div>
                        <div className="text-sec">CatchMusic keeps your cached songs available on your device, giving you quick access to the music you love whenever you want it.</div>
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg  p-5">
                    <div className="flex "> 
                        <div className="h-fit w-fit p-3   bg-primary rounded-full">
                            <div>
                                <WifiOffIcon size={30} className="text-blob-gold-sec "/>
                            </div>
                    </div>
                    <div className="pl-2">  
                        <div className="text-blob-gold-sec text-sm">Problem #3</div>
                        <div className="pt-2 font-semibold text-xl"  >No Inernet means No Music?</div>
                        <div className="text-sec">Whether you're traveling, commuting through a metro, or exploring remote areas, music streaming often stops the moment your internet connection drops. </div>
                    </div>
                    </div>
                    <div className="bg-card-hover p-4 rounded-lg mt-5">
                        <div className="text-blob-gold-sec font-semibold">Our Solution</div>
                        <div className="text-sec">Songs you've already cached remain available, allowing you to continue listening smoothly even when you're offline.</div>
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg  p-5">
                    <div className="flex "> 
                        <div className="h-fit w-fit p-3   bg-primary rounded-full">
                            <div>
                                <WifiOffIcon size={30} className="text-blob-gold-sec "/>
                            </div>
                    </div>
                    <div className="pl-2">  
                        <div className="text-blob-gold-sec text-sm">Problem #4</div>
                        <div className="pt-2 font-semibold text-xl"  >Ads Ruin The Vibe</div>
                        <div className="text-sec">Many music platforms interrupt listening sessions with advertisements and ruining the mood right when you're enjoying. </div>
                    </div>
                    </div>
                    <div className="bg-card-hover p-4 rounded-lg mt-5">
                        <div className="text-blob-gold-sec font-semibold">Our Solution</div>
                        <div className="text-sec">Your cached songs can be played without unexpected interruptions.</div>
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg  p-5">
                    <div className="flex "> 
                        <div className="h-fit w-fit p-3   bg-primary rounded-full">
                            <div>
                                <WifiOffIcon size={30} className="text-blob-gold-sec "/>
                            </div>
                    </div>
                    <div className="pl-2">  
                        <div className="text-blob-gold-sec text-sm">Problem #5</div>
                        <div className="pt-2 font-semibold text-xl"  >Buffering The Same Song Again</div>
                        <div className="text-sec">Every time you stream a song, your device may need to fetch the same data repeatedly. This can lead to waiting, buffering, and unnecessary internet usage. </div>
                    </div>
                    </div>
                    <div className="bg-card-hover p-4 rounded-lg mt-5">
                        <div className="text-blob-gold-sec font-semibold">Our Solution</div>
                        <div className="text-sec">Once a song is cached, it loads instantly from your device. No repeated fetching, no waiting — just press play and enjoy.</div>
                    </div>
                </div>
                <div className="bg-card border border-border rounded-lg  p-5">
                    <div className="flex "> 
                        <div className="h-fit w-fit p-3   bg-primary rounded-full">
                            <div>
                                <WifiOffIcon size={30} className="text-blob-gold-sec "/>
                            </div>
                    </div>
                    <div className="pl-2">  
                        <div className="text-blob-gold-sec text-sm">Problem #6</div>
                        <div className="pt-2 font-semibold text-xl"  >Can't Find That Song Again?</div>
                        <div className="text-sec">We've all discovered a great song, listened to it a few times, and then completely forgotten its name. Finding it again can be frustrating and time-consuming. </div>
                    </div>
                    </div>
                    <div className="bg-card-hover p-4 rounded-lg mt-5">
                        <div className="text-blob-gold-sec font-semibold">Our Solution</div>
                        <div className="text-sec">Your recently cached songs remain available in your personal library, making it easier to revisit tracks you've already enjoyed.</div>
                    </div>
                </div>
                </div>
            </div>
        </div>
    )
}