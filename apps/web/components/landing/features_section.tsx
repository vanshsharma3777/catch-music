export default function FeaturesSection() {
    return (
        <div className="">
            <div id="features" className="mt-16 flex items-center justify-between gap-10">

                <div className="shrink-0">
                    <div className="border w-fit px-4 py-2 mb-2 rounded-full border-primary shadow-[0_20px_60px_rgba(255,180,50,0.12)]">
                        <div className="tracking-widest text-lg text-blob-gold">
                            FEATURES
                        </div>
                    </div>

                    <div className="flex flex-col gap-5">
                        <div>
                            <div className="text-6xl mb-1 font-medium whitespace-nowrap">
                                Powerful Features.
                            </div>

                            <div className="text-6xl text-blob-gold font-medium whitespace-nowrap">
                                Built for Music Lovers.
                            </div>
                        </div>

                        <div className="max-w-[450px] text-sec">
                            CatchMusic makes offline music simple, smart and completely hassle-free.
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl border border-primary ml-8 p-6 backdrop-blur-sm">
                    <div className="text-lg font-semibold mb-2">
                        Powered by{" "}
                        <span className="text-blob-gold">
                            Browser Storage
                        </span>
                    </div>

                    <p className="text-muted-foreground  leading-relaxed">
                        Your music is stored directly in your{" "}
                        <span className="text-white font-medium">
                            browser storage
                        </span>
                        , giving you fast access, offline playback, and complete control over your library.
                    </p>
                </div>

                <div className="shrink-0">
                    <img
                        src="cloud-database.png"
                        alt=""
                        className="w-[450px] h-auto object-contain"
                    />
                </div>
            </div>

            <div className="mt-8 flex flex-col  gap-12">
                <div className="flex   p-6 gap-10">
                    <div className="flex px-8 py-8  w-full border-primary shadow-[0_20px_60px_rgba(255,180,50,0.12)] rounded-lg">
                        <div className="flex w-[80%]">
                            <div className="">
                                <div className="p-2 mx-2 bg-primary rounded-lg text-blob-gold-sec text-2xl "> 01</div>
                            </div>
                            <div className="ml-3">
                                <div className="text-3xl">Instant Caching</div>
                                <div className="text-blob-gold-sec  tracking-wider">One tap. Done Forever.</div>
                                <div className="text-sec mt-2">Cache favorite songs instantly by listening it online for the first time . Once cached, you can listen anytime, anywhere - without downloading again until you had deleted it.</div>
                            </div>
                        </div>
                        <div className="shrink-0"><img src="despacito-cache.png" alt="" className="w-[350]" /> </div>
                    </div>
                </div>
                <div className="flex   p-6 gap-10 ">
                    <div className="flex  px-8 py-8  w-full border-primary shadow-[0_20px_60px_rgba(255,180,50,0.12)] rounded-lg">
                        <div className="flex w-[80%]">
                            <div className="">
                                <div className="p-2 mx-2 bg-primary rounded-lg text-blob-gold-sec text-2xl "> 02</div>
                            </div>
                            <div className="ml-3">
                                <div className="text-3xl">First Time Online</div>
                                <div className="text-blob-gold-sec  tracking-wider">We handle the rest.</div>
                                <div className="text-sec mt-2">The first time you play a song, it strwams online and if you wants to cache it then they have to hit cache button and will automatically cached in background - so next time you're good to go.</div>
                            </div>
                        </div>
                        <div className="shrink-0"><img src="browser-caching.png" alt="" className="w-[350]" /> </div>
                    </div>
                </div>
                <div className="flex   p-6 gap-10  ">
                    <div className="flex px-8  py-8  border-primary shadow-[0_20px_60px_rgba(255,180,50,0.12)] rounded-lg">
                        <div className="flex w-[80%]">
                            <div className="">
                                <div className="p-2 mx-2 bg-primary rounded-lg text-blob-gold-sec text-2xl "> 03</div>
                            </div>
                            <div className="ml-3">
                                <div className="text-3xl">Smart Storage Management</div>
                                <div className="text-blob-gold-sec  tracking-wider">We've got you back.</div>
                                <div className="text-sec mt-2">Running out of browser's storage? We will notify you and help you remove the song you have not listened to in a while.New music, always has room.</div>
                            </div>
                        </div>
                        <div className="shrink-0"><img src="storage-warning.png" alt="" className="w-[350]" /> </div>
                    </div>
                </div>
                <div className="flex p-6 gap-10  ">
                    <div className="flex px-8 py-8 w-full border-primary shadow-[0_20px_60px_rgba(255,180,50,0.12)] rounded-lg">
                        <div className="flex w-[80%]  ">
                            <div className="">
                                <div className="p-2 mx-2 bg-primary rounded-lg text-blob-gold-sec text-2xl "> 04</div>
                            </div>
                            <div className="ml-3">
                                <div className="text-3xl">Different Devices.<br /> Different Moods.</div>
                                <div className="text-blob-gold-sec  tracking-wider">Your music your way.</div>
                                <div className="text-sec mt-2">No syncing.No mixing.Use different songs for different devices based on your mood and moment. You can choose you favorite songs for every device.Like if a user is using laptop and studying then he/she can store focused / motivating songs on the other hand if someone wishes to have party or romantic songs on their phone they can store accordingly.</div>
                            </div>
                        </div>
                        <div className="shrink-0"><img src="comp-phone.png" alt="" className="w-[350]" /> </div>
                    </div>
                </div>
                
            </div>
            
        </div>
    )
}