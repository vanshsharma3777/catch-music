import { BookOpen, Copyright, Globe, Globe2, MountainIcon, Music, Phone, PhoneIcon, Plane, Send, Smartphone, Star, Train, Zap } from "lucide-react";

export default function AboutSection(){
    

    return (
        <div className="mt-12"> 
                <div className="w-[85%] ">
                    <div className="flex justify-between">
                    <div className="shrink-0">
                    <div className="border w-fit px-4 py-2 mb-2 rounded-full border-primary shadow-[0_20px_60px_rgba(255,180,50,0.12)]">
                        <div className="tracking-widest text-md text-blob-gold">
                            ABOUT CATCHMUSIC
                        </div>
                    </div>

                    <div className="flex flex-col gap-5">
                        <div>
                            <div className="text-6xl mb-1 font-medium whitespace-nowrap">
                                Limitless Music.
                            </div>

                            <div className="text-6xl text-blob-gold font-medium whitespace-nowrap">
                                No Hassle.
                            </div>
                        </div>

                        <div className="max-w-[450px] text-sec">
                            Enjoy your favorite music instantly, anywhere. No interruption. Just pure music.
                        </div>
                    </div>
                </div>
              <div className="shrink-0">
                    <img
                        src="about-music.png"
                        alt=""
                        className="w-[450px] h-auto object-contain"
                    />
                </div>

                </div>
                </div>

                <div>
                    <div className="flex items-center mt-4 gap-6">
                
                <div className="grid grid-cols-5 gap-5">
                    <div className="flex flex-col border  border-border items-center bg-card p-8 rounded-lg gap-2" >
                    <div className=" h-fit w-fit rounded-full"><Smartphone size={50} className="  text-secondary" /></div>

                    <div className=" flex-1 flex-col text-center break-words ">
                        <div>30 songs</div>
                        <div className="text-sec text-wrap">Nearly 30 songs can be cached in your mobile device.</div>
                    </div>
                </div>
                    <div className="flex flex-col border  border-border items-center bg-card p-8 rounded-lg gap-2" >
                    <div className=" h-fit w-fit rounded-full"><BookOpen size={50} className="  text-secondary" /></div>

                    <div className=" flex-1 flex-col text-center break-words ">
                        <div>50 songs</div>
                        <div className="text-sec text-wrap">Nearly 30 songs can be cached in your laptop or computers.</div>
                    </div>
                </div>
                    <div className="flex flex-col border  border-border items-center bg-card p-8 rounded-lg gap-2" >
                    <div className=" h-fit w-fit rounded-full"><Zap size={50} className="  text-secondary" /></div>

                    <div className=" flex-1 flex-col text-center break-words ">
                        <div>Blazing Fast</div>
                        <div className="text-sec text-wrap">Optimized for speed and seamless streaming.</div>
                    </div>
                </div>
                    <div className="flex flex-col border  border-border items-center bg-card p-8 rounded-lg gap-2" >
                    <div className=" h-fit w-fit rounded-full"><Star size={50} className="  text-secondary" /></div>

                    <div className=" flex-1 flex-col text-center break-words ">
                        <div>High Quality</div>
                        <div className="text-sec text-wrap">Crystal clear audio for best experience.</div>
                    </div>
                </div>
                    <div className="flex flex-col border  border-border items-center bg-card p-8 rounded-lg gap-2" >
                    <div className=" h-fit w-fit rounded-full"><Globe size={50} className="  text-secondary" /></div>

                    <div className=" flex-1 flex-col text-center break-words ">
                        <div>Global Access</div>
                        <div className="text-sec text-wrap">Enjoy music from around the world.</div>
                    </div>
                </div>
                </div>

                

            </div>

            <div className="flex p-6 gap-10 justify-center ">
                    <div className="flex p-8 items-center ">
                        <div className="flex   ">
                            
                            <div className="ml-3">
                                <div className="text-3xl">Your Music</div>
                                <div className="text-blob-gold-sec  text-4xl">Always with you</div>
                            </div>
                        </div>
                        <div className="shrink-0"><img src="boy2.png" alt="" className="w-[350]" /> </div>
                    </div>
                </div>
                <div className="flex justify-center  ">
                    <div className="mt-12  bg-card border border-border w-[70%] py-5 px-5 rounded-xl ">
                    <div className="">
                        <div className="text-2xl pb-1 ">Give a Review</div>
                        <div className="text-sec pt-1 text-sm">We'd love to hear your thoughts and suggestions!</div>
                    </div>

                    <div className="mt-4  grid ">
                        <input type="text" placeholder="Your Name" className="bg-black  p-4 rounded-lg border border-border" />
                        
                        <textarea rows={3} placeholder="Write your feedback" className="  bg-black border mt-3 p-4 rounded-lg border-border  resize-none" />
                    
                    <div className="flex justify-center">
                        <div className=" mt-3 p-2 w-[50%] rounded-lg border  text-center border-secondary shadow-[0px_20px_60px_rgba(255,180,50,0.12)]  hover:bg-blob-gold-sec hover:text-black hover:scale-105 transition-all duration-300 ease-in-out  cursor-pointer">
                        <div className=" flex justify-center items-center">
                            <button className=" text-2xl flex items-center gap-2">
                                <div>
                                    <Send/>
                                </div>
                                <div>
                                    Submit
                                </div>
                            </button>
                        </div>
                    </div>
                    </div>
                    
                    </div>
                </div>
                </div>
                

                <div>
                    
                </div>
                </div>
                
        </div>
    )
}