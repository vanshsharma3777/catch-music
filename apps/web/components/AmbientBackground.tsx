export  function AmbientBackground() {
  return (
    <>
      <style>{`
        .cm-bg{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none}
        .cm-blob{position:absolute;border-radius:9999px;will-change:transform}
        .cm-blob-a{
          left:-8rem;top:-10rem;height:36rem;width:36rem;
          background:color-mix(in srgb,var(--accent) 26%,transparent);
          filter:blur(130px);animation:cm-drift-a 32s ease-in-out infinite;
        }
        .cm-blob-b{
          right:-10rem;top:28%;height:34rem;width:34rem;
          background:color-mix(in srgb,var(--primary) 24%,transparent);
          filter:blur(140px);animation:cm-drift-b 38s ease-in-out infinite;
        }
        .cm-blob-c{
          left:30%;bottom:-14rem;height:30rem;width:30rem;
          background:color-mix(in srgb,var(--accent) 14%,transparent);
          filter:blur(130px);animation:cm-drift-a 44s ease-in-out infinite reverse;
        }
        @keyframes cm-drift-a{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(70px,50px,0) scale(1.1)}}
        @keyframes cm-drift-b{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(-80px,-40px,0) scale(1.12)}}
        @media (prefers-reduced-motion:reduce){.cm-blob{animation:none}}

        .cm-grid-soft{
          position:absolute;inset:0;
          background-image:
            linear-gradient(to right,rgba(255,255,255,.045) 1px,transparent 1px),
            linear-gradient(to bottom,rgba(255,255,255,.045) 1px,transparent 1px);
          background-size:56px 56px;
          -webkit-mask-image:radial-gradient(ellipse 85% 75% at 50% 30%,#000 0%,transparent 78%);
          mask-image:radial-gradient(ellipse 85% 75% at 50% 30%,#000 0%,transparent 78%);
        }
      `}</style>

      <div aria-hidden className="cm-bg">
        <div className="cm-blob cm-blob-a" />
        <div className="cm-blob cm-blob-b" />
        <div className="cm-blob cm-blob-c" />
        <div className="cm-grid-soft" />
      </div>
    </>
  );
}
