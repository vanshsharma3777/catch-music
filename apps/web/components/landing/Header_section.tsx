"use client"

import { Music4 } from "lucide-react";
import ButtonComponent from "../Button";

export default function HeaderSection() {
  return (
    <div>
      <header className="relative  overflow-hidden z-10 text-pri">
        <div className="mt-8 flex justify-between items-center">
          <div className="flex  text-pri justify-center items-center  ">
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
              <button onClick={() => {
                document.getElementById("features")?.scrollIntoView({
                  behavior: "smooth",
                });
              }} className="hover:transition-all hover:duration-300 hover:transition-ease-in-out  hover:text-pri hover:scale-110">Features</button>
              <button onClick={() => {
                document.getElementById("problems")?.scrollIntoView({
                  behavior: "smooth",
                });
              }} className="hover:transition-all hover:duration-300 hover:transition-ease-in-out  hover:text-pri hover:scale-110">Problems</button>
              <button onClick={() => {
                document.getElementById("features")?.scrollIntoView({
                  behavior: "smooth",
                });
              }} className="hover:transition-all hover:duration-300 hover:transition-ease-in-out  hover:text-pri hover:scale-110">Solution</button>
              <button onClick={() => {
                document.getElementById("features")?.scrollIntoView({
                  behavior: "smooth",
                });
              }} className="hover:transition-all hover:duration-300 hover:transition-ease-in-out  hover:text-pri hover:scale-110">Features</button>
          </ul>
        </div>
        <div className="">
          <div><ButtonComponent classNameInputs={`border mr-2 text-md text-black font-semibold border-border px-5 py-2 rounded-full bg-blob-gold  hover:transition-all hover:duration-300 hover:transition-ease-in-out hover:scale-110`} onClick={"/start"} buttonInput={"Get Started"}></ButtonComponent></div>
        </div>
    </div>
      </header >
        </div >
    )
}