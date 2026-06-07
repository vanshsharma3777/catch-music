"use client"

import { Check, CheckCircle, Copyright, Download, Globe, Headphones, Menu, MoreHorizontal, Music4, Pause, Play, Repeat, Shield, ShieldAlert, ShieldCheck, ShieldX, Shuffle, ShuffleIcon, SkipBack, SkipForward, Volume2, WholeWord, WifiOff, Zap } from "lucide-react";
import ButtonComponent from "../components/Button";
import { useEffect, useRef, useState } from "react";
import MainSection from "../components/landing/main_section";
import HeaderSection from "../components/landing/Header_section";
import FeaturesSection from "../components/landing/features_section";
import ProblemSection from "../components/landing/problems";
import WorkingSection from "../components/landing/working";
import MomentsSection from "../components/landing/moments";
import AboutSection from "../components/landing/about";
import { FaLinkedin } from "react-icons/fa";
import { SiGithub, SiX } from "react-icons/si";
import ScrollButtons from "../components/scrollButton";

export default function ThemePreview() {
  
  return (
    <div className="min-h-screen mx-16">
      <div className={`absolute top-12 left-20 h-[100px] w-[100px] -z-10 bg-blob-gold blur-[80px]`} ></div>
     <HeaderSection/>
      {/* <div className={`absolute bottom-10  right-24  h-[30px] w-[900px] bg-blob-gold-sec blur-[90px] rounded-[58%_42%_23%_77%/32%_64%_36%_68%]`}></div> */}
      <MainSection/>
      <section>
        <div className="mt-10 flex  justify-center ">
          <div className="w-[70%] bg-card  p-4 rounded-xl border-border">
            <div className="flex justify-between  items-center">
              
            <div className="flex  w-full justify-center" >
              <div className="flex mt-3 justify-center items-center">
                <div className="flex items-start  gap-2  text-lg">
                  <div className="shrink-0">

                    <Globe
                      size={30}
                      strokeWidth={2}
                      className="text-blob-gold-ter"
                    />
                  </div>

                  <div className="">
                    <div className="font-medium">
                      Works Everywhere
                    </div>
                    <div className="text-sec mt-1">
                      Cross-plateform supports for all your devices
                    </div>

                  </div>
                </div>
                <div className="flex items-start mx-3  gap-2 text-lg  ">
                  <div className="shrink-0">
                    <Volume2
                      size={30}
                      strokeWidth={2}
                      className="text-blob-gold-ter"
                    />
                  </div>

                  <div className="">
                    <div className="font-medium">
                      High Quality Audio
                    </div>

                    <div className="text-sec mt-1 text-wrap">
                      Experience your music in best qualiy
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2  text-lg">
                  <div className="shrink-0">
                    <ShieldCheck
                      size={30}
                      strokeWidth={2}
                      className="text-blob-gold-ter"
                    />
                  </div>

                  <div>
                    <div className="font-medium">
                      Private & Secure 
                    </div>

                    <div className="text-sec mt-1">
                      Your data is encrypted and always protected
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>
      <FeaturesSection/>
      <ProblemSection/>
      <WorkingSection/>
      <MomentsSection/>
      <AboutSection/>
      <ScrollButtons/>

      <div className="flex justify-center mb-5 ">
                    <div className="mt-12 flex justify-between text-sm bg-card border border-border w-full py-5 px-5 rounded-xl ">
                    <div className="flex  items-center">
                       <div className="flex gap-2 items-center text-sec"> <Copyright className="text-secondary" />2026 CatchMusic. All rights reserved.</div>
                        </div>
                        <div className="flex  justify-center">
                            <div className="flex justify-center">
                                <div className="flex gap-2 text-sec pl-3"><SiGithub className="text-secondary " size={20} /><a href="https://github.com/vanshsharma3777">Github</a></div>
                            <div className="flex gap-2 text-sec px-6"><SiX className="text-secondary " size={20} /> <a href="https://x.com/itz_sharmaji001">X</a></div>
                            <div className="flex gap-2 text-sec pr-3"><FaLinkedin className="text-secondary " size={20} /><a href="https://www.linkedin.com/in/vansh-sharma-812199316/">LinkedIn</a></div>
                            </div>
                        </div>
                        <div className="text-sec">
                            Built with ❤️ by Vansh
                        </div>
                </div>
                </div>
    </div>
    
  );
}