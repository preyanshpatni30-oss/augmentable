import React, { useEffect, useRef, useState } from 'react';

// ── Viewport windowing (crash prevention) ──
// The "AR Only" filter lists every AR dish in one column (~20 for Mayanagri). Mounting all of
// them at once instantiates ~20 heavy dish cards — each with a media area, several effects, and
// (for some) a <model-viewer> WebGL preview — which exhausts GPU/memory and OOM-crashes the tab
// on phones, even high-end ones. This wrapper mounts its child only while it's near the viewport
// and renders a same-height spacer otherwise, so the number of live cards stays small no matter
// how long the list is. Off-screen cards aren't visible, so this is invisible to the guest.
export const LazyMount: React.FC<{
  children: React.ReactNode;
  /** Spacer height used before the child has ever been measured. */
  estimatedHeight?: number;
  /** How far outside the viewport to pre-mount, so cards are ready before they're seen. */
  rootMargin?: string;
}> = ({ children, estimatedHeight = 480, rootMargin = '1000px 0px' }) => {
  const ref = useRef<HTMLDivElement>(null);
  // Remember the real rendered height so the spacer keeps layout (and scroll position) stable
  // when the child unmounts.
  const heightRef = useRef<number>(estimatedHeight);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMounted(true);
        } else {
          const h = el.getBoundingClientRect().height;
          if (h > 0) heightRef.current = h;
          setMounted(false);
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} style={mounted ? undefined : { height: heightRef.current }}>
      {mounted ? children : null}
    </div>
  );
};
