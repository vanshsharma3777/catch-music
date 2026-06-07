    import { ArrowLeft, ArrowRight, Download, HeadphoneOffIcon, HeadphonesIcon, LucideFlagTriangleRight, MoveLeft, MoveRight, Play, ShieldCheckIcon } from "lucide-react";

    export default function WorkingSection() {
        return (
            <div id="working" className="mt-12  scroll-mt-6 ">
                <div className="border w-fit px-4 py-2 mb-2 rounded-full border-primary shadow-[0_20px_60px_rgba(255,180,50,0.12)]">
                    <div className="tracking-widest text-md text-blob-gold">
                        HOW IT WORKS
                    </div>
                </div>

                <div className="flex items-center ">
                    <div className="flex flex-col ">
                        <div>
                            <div className="text-6xl mb-1 font-medium whitespace-nowrap">
                                Simple Steps.
                            </div>

                            <div className="text-6xl text-blob-gold font-medium whitespace-nowrap">
                                Powerful Experience.
                            </div>
                        </div>

                    </div>
                    <div className="flex justify-around  w-full">
                        <div className="flex  flex-col justify-around items-center  gap-2">
                        <div className="h-fit  p-6 border-secondary bg-primary shadow-[0px_20px_60px_rgba(255,180,50,0.12)] w-fit   rounded-full border-2 ">
                            <div className=" h-fit w-fit rounded-full"><Play size={30} className="text-white" /></div>
                        </div>

                        <div className=" flex-1 flex-col text-center break-words ">
                            <div>Play Songs</div>
                            <div className="text-sec text-wrap">Play any song you love.</div>
                        </div>
                    </div>

                    <div className="flex flex-col   items-center  gap-2">
                        <div className="h-fit  p-6 border-secondary bg-primary shadow-[0px_20px_60px_rgba(255,180,50,0.12)] w-fit   rounded-full border-2 ">
                            <div className=" h-fit w-fit rounded-full"><Download size={30} className="text-white" /></div>
                        </div>

                        <div className=" flex-1 flex-col text-center break-words ">
                            <div>Cache It</div>
                            <div className="text-sec text-wrap">We cache the song in background.</div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center  gap-2">
                        <div className="h-fit  p-6 border-secondary bg-primary shadow-[0px_20px_60px_rgba(255,180,50,0.12)] w-fit   rounded-full border-2 ">
                            <div className=" h-fit w-fit rounded-full"><ShieldCheckIcon size={30} className="text-white" /></div>
                        </div>

                        <div className=" flex-1 flex-col text-center break-words ">
                            <div>Stored Securely</div>
                            <div className="text-sec text-wrap">Stored in your browser storage safely.</div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center  gap-2">
                        <div className="h-fit  p-6 border-secondary bg-primary shadow-[0px_20px_60px_rgba(255,180,50,0.12)] w-fit   rounded-full border-2 ">
                            <div className=" h-fit w-fit rounded-full"><HeadphonesIcon size={30} className="text-white" /></div>
                        </div>

                        <div className=" flex-1 flex-col text-center break-words ">
                            <div>Listen Offline</div>
                            <div className="text-sec text-wrap">Enjoy your music without internet.</div>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        )
    }