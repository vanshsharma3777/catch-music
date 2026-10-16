export function AmbientBackground() {
  return (
    <>
      <style>{`
        .cm-bg{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;contain:strict}
        .cm-blob{position:absolute;border-radius:9999px;will-change:transform;transform:translateZ(0)}

        /* ---------- mobile first: smaller, softer, less muddy ---------- */
        .cm-blob-a{
          left:-30vw;top:-12vh;height:75vw;width:75vw;
          background:radial-gradient(circle at 50% 50%,color-mix(in srgb,var(--accent) 34%,transparent) 0%,transparent 68%);
          filter:blur(48px);animation:cm-drift-a 28s ease-in-out infinite;
        }
        .cm-blob-b{
          right:-35vw;top:34%;height:70vw;width:70vw;
          background:radial-gradient(circle at 50% 50%,color-mix(in srgb,var(--primary) 30%,transparent) 0%,transparent 68%);
          filter:blur(52px);animation:cm-drift-b 34s ease-in-out infinite;
        }
        .cm-blob-c{
          left:-10vw;bottom:-14vh;height:70vw;width:70vw;
          background:radial-gradient(circle at 50% 50%,color-mix(in srgb,var(--accent) 20%,transparent) 0%,transparent 68%);
          filter:blur(48px);animation:cm-drift-a 40s ease-in-out infinite reverse;
        }

        @keyframes cm-drift-a{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(8vw,5vh,0) scale(1.08)}}
        @keyframes cm-drift-b{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(-8vw,-4vh,0) scale(1.1)}}

        /* faint dotted texture instead of hard grid lines on small screens */
        .cm-grid-soft{
          position:absolute;inset:0;
          background-image:radial-gradient(rgba(255,255,255,.07) 1px,transparent 1.2px);
          background-size:26px 26px;
          -webkit-mask-image:radial-gradient(ellipse 90% 60% at 50% 18%,#000 0%,transparent 75%);
          mask-image:radial-gradient(ellipse 90% 60% at 50% 18%,#000 0%,transparent 75%);
        }

        /* soft vignette so content always sits on a clean, dark base */
        .cm-vignette{
          position:absolute;inset:0;
          background:
            linear-gradient(to bottom,transparent 55%,color-mix(in srgb,var(--bg,#000) 70%,transparent) 100%),
            radial-gradient(ellipse 120% 80% at 50% 0%,transparent 40%,color-mix(in srgb,var(--bg,#000) 45%,transparent) 100%);
        }

        /* ---------- tablet / desktop: original large ambient look ---------- */
        @media (min-width:768px){
          .cm-blob-a{
            left:-8rem;top:-10rem;height:36rem;width:36rem;
            background:color-mix(in srgb,var(--accent) 26%,transparent);
            filter:blur(130px);
          }
          .cm-blob-b{
            right:-10rem;top:28%;height:34rem;width:34rem;
            background:color-mix(in srgb,var(--primary) 24%,transparent);
            filter:blur(140px);
          }
          .cm-blob-c{
            left:30%;bottom:-14rem;height:30rem;width:30rem;
            background:color-mix(in srgb,var(--accent) 14%,transparent);
            filter:blur(130px);
          }
          @keyframes cm-drift-a{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(70px,50px,0) scale(1.1)}}
          @keyframes cm-drift-b{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(-80px,-40px,0) scale(1.12)}}
          .cm-grid-soft{
            background-image:
              linear-gradient(to right,rgba(255,255,255,.045) 1px,transparent 1px),
              linear-gradient(to bottom,rgba(255,255,255,.045) 1px,transparent 1px);
            background-size:56px 56px;
            -webkit-mask-image:radial-gradient(ellipse 85% 75% at 50% 30%,#000 0%,transparent 78%);
            mask-image:radial-gradient(ellipse 85% 75% at 50% 30%,#000 0%,transparent 78%);
          }
          .cm-vignette{display:none}
        }

        @media (prefers-reduced-motion:reduce){.cm-blob{animation:none}}
      `}</style>

      <div aria-hidden className="cm-bg">
        <div className="cm-blob cm-blob-a" />
        <div className="cm-blob cm-blob-b" />
        <div className="cm-blob cm-blob-c" />
        <div className="cm-grid-soft" />
        <div className="cm-vignette" />
      </div>
    </>
  );
}

export default AmbientBackground;
