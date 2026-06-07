import { ArrowLeft, ArrowRight, Book, BookOpen, Check, Cross, Download, HeadphoneOffIcon, HeadphonesIcon, LucideFlagTriangleRight, Mountain, MountainIcon, MoveLeft, MoveRight, Plane, Play, ShieldCheckIcon, Train, X } from "lucide-react";

export default function MomentsSection() {
    return (
        <div  className=" mt-12 ">
            
            <div className="flex items-center gap-6">
                
                <div className="grid grid-cols-4 gap-5">
                    <div className="flex flex-col border  border-border items-center bg-card p-8 rounded-lg gap-2" >
                    <div className=" h-fit w-fit rounded-full"><Train size={50} className="  text-secondary" /></div>

                    <div className=" flex-1 flex-col text-center break-words ">
                        <div>Travelling</div>
                        <div className="text-sec text-wrap">No networks on trains. Your music stays with you.</div>
                    </div>
                </div>
                    <div className="flex flex-col border  border-border items-center bg-card p-8 rounded-lg gap-2" >
                    <div className=" h-fit w-fit rounded-full"><BookOpen size={50} className="  text-secondary" /></div>

                    <div className=" flex-1 flex-col text-center break-words ">
                        <div>Studying</div>
                        <div className="text-sec text-wrap">Keep focus playlists ready even without WiFi.</div>
                    </div>
                </div>
                    <div className="flex flex-col border  border-border items-center bg-card p-8 rounded-lg gap-2" >
                    <div className=" h-fit w-fit rounded-full"><MountainIcon size={50} className="  text-secondary" /></div>

                    <div className=" flex-1 flex-col text-center break-words ">
                        <div>Trekking</div>
                        <div className="text-sec text-wrap">Enjoy music in remote locations without network.</div>
                    </div>
                </div>
                    <div className="flex flex-col border  border-border items-center bg-card p-8 rounded-lg gap-2" >
                    <div className=" h-fit w-fit rounded-full"><Plane size={50} className="  text-secondary" /></div>

                    <div className=" flex-1 flex-col text-center break-words ">
                        <div>Flights</div>
                        <div className="text-sec text-wrap">No internet require. Have fun with your own playlists.</div>
                    </div>
                </div>
                </div>


            </div>

            <div className="mt-12">
                <div>
                    <div className="border w-fit px-4 py-2 mb-2 rounded-full border-primary shadow-[0_20px_60px_rgba(255,180,50,0.12)]">
                    <div className="tracking-widest  text-md text-blob-gold">
                        BEFORE vs AFTER
                    </div>
                </div>
                <div className="flex items-center text-sec  gap-16">
                    <div className="flex flex-col ">
                        <div>
                            <div className="text-6xl text-pri mb-1 font-medium whitespace-nowrap">
                                Better Experience.
                            </div>

                            <div className="text-6xl text-blob-gold font-medium whitespace-nowrap">
                                Zero Hassle.
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center w-full gap-5">
                        <div className="flex flex-col border  border-border items-center bg-card p-8 rounded-lg gap-2" >
                    <div className=" text-error  text-xl">Before CatchMusic</div>

                    <div className="">
                        <div className="flex p-1 items-center gap-3">
                        <div className="h-fit w-fit rounded-full  p-1 bg-error "><X className="text-pri"/></div>
                        <div>Open app</div>
                    </div>
                    <div className="flex p-1 items-center gap-3">
                        <div className="h-fit w-fit rounded-full  p-1 bg-error "><X className="text-pri"/></div>
                        <div>Search song</div>
                    </div>
                    <div className="flex p-1 items-center gap-3">
                        <div className="h-fit w-fit rounded-full  p-1 bg-error "><X className="text-pri"/></div>
                        <div>Need Internet</div>
                    </div>
                    <div className="flex p-1 items-center gap-3">
                        <div className="h-fit w-fit rounded-full  p-1 bg-error "><X className="text-pri"/></div>
                        <div>Buffering</div>
                    </div>
                    <div className="flex p-1 items-center gap-3">
                        <div className="h-fit w-fit rounded-full  p-1 bg-error "><X className="text-pri"/></div>
                        <div>Premium required</div>
                    </div>
                    </div>
                </div>
                        <div className="flex flex-col  border  border-border items-center bg-card p-8 rounded-lg gap-2" >
                    <div className=" text-success  text-xl">After CatchMusic</div>

                    <div className="">
                        <div className="flex p-1 items-center gap-3">
                        <div className="h-fit w-fit rounded-full  p-1 bg-success "><Check className="text-black" /></div>
                        <div>Play once</div>
                    </div>
                    <div className="flex p-1 items-center gap-3">
                        <div className="h-fit w-fit rounded-full  p-1 bg-success "><Check className="text-black"/></div>
                        <div>Automatically cached</div>
                    </div>
                    <div className="flex p-1 items-center gap-3">
                        <div className="h-fit w-fit rounded-full  p-1 bg-success "><Check className="text-black"/></div>
                        <div>Offline ready</div>
                    </div>
                    <div className="flex p-1 items-center gap-3">
                        <div className="h-fit w-fit rounded-full  p-1 bg-success "><Check className="text-black"/></div>
                        <div>Instant playback</div>
                    </div>
                    <div className="flex p-1 items-center gap-3">
                        <div className="h-fit w-fit rounded-full  p-1 bg-success "><Check className="text-black"/></div>
                        <div>No extra step</div>
                    </div>
                    </div>
                </div>
                    
                    </div>
                </div>
                </div>
            </div>
        </div>
    )
}