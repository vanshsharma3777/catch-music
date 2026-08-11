"use client"

import { useState } from "react"
import { Menu, X, Music4 } from "lucide-react"
import ButtonComponent from "../Button"

export default function HeaderSection() {
  const [isOpen, setIsOpen] = useState(false)

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    })
    setIsOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md transition-all duration-300">
      <div className="max-w-7xl mx-auto h-20 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3.5 cursor-pointer group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] via-[var(--secondary)] to-[var(--background-secondary)] p-[1px] transition-transform duration-500 group-hover:scale-[1.03]">
            <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[var(--background-secondary)]">
              <Music4 size={18} className="text-[var(--primary)] transition-colors duration-300 group-hover:text-[var(--primary-hover)]" />
            </div>
          </div>
          <span className="text-xl font-semibold tracking-tight text-[var(--text-primary)] transition-all duration-300 group-hover:text-[var(--primary-hover)]">
            CatchMusic
          </span>
        </div>
        <nav className="hidden lg:flex items-center gap-10">
          {["features", "problems", "working", "about"].map((section) => (
            <button
              key={section}
              onClick={() => scrollToSection(section)}
              className="relative text-[14px] font-medium tracking-wide text-[var(--text-secondary)] capitalize transition-all duration-300 hover:text-[var(--text-primary)] group"
            >
              {section}
              <span className="absolute -bottom-1.5 left-1/2 h-[1.5px] w-0 -translate-x-1/2 bg-[var(--primary)] transition-all duration-300 ease-out group-hover:w-full opacity-80" />
            </button>
          ))}
        </nav>
        <div className="hidden lg:block">
          <ButtonComponent
            classNameInputs="rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] px-6 py-2.5 text-black font-semibold tracking-wide text-[14px] shadow-[var(--shadow-premium)] transition-all duration-300 hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0"
            onClick="/start"
            buttonInput="Get Started"
          />
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Menu size={24} />
        </button>
        {isOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setIsOpen(false)} />}
        <div 
          className={`fixed inset-y-0 right-0 z-50 h-screen w-[300px] border-l border-[var(--border)] bg-[var(--background-secondary)] transition-transform duration-300 ease-in-out lg:hidden shadow-[var(--shadow-lg)] ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex justify-end p-6">
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex flex-col gap-6 px-8 pt-4">
            {["features", "problems", "working", "about"].map((section) => (
              <button
                key={section}
                onClick={() => scrollToSection(section)}
                className="text-left text-lg font-medium tracking-wide text-[var(--text-secondary)] capitalize hover:text-[var(--text-primary)] transition-all duration-300 border-b border-[var(--border)] pb-2"
              >
                {section}
              </button>
            ))}
            <div className="pt-6">
              <ButtonComponent
                classNameInputs="w-full text-center rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] px-6 py-3 text-black font-semibold tracking-wide shadow-[var(--shadow-premium)]"
                onClick="/start"
                buttonInput="Get Started"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}