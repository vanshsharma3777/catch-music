"use client"

import { Check, CheckCircle, Download, Globe, Headphones, Menu, MoreHorizontal, Music4, Pause, Play, Repeat, Shield, ShieldAlert, ShieldCheck, ShieldX, Shuffle, ShuffleIcon, SkipBack, SkipForward, Volume2, WholeWord, WifiOff, Zap } from "lucide-react";
import ButtonComponent from "../components/Button";
import { useEffect, useRef, useState } from "react";
import MainSection from "../components/landing/main_section";
import HeaderSection from "../components/landing/Header_section";
import FeaturesSection from "../components/landing/features_section";
import ProblemSection from "../components/landing/problems";

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
    </div>
    
  );
}