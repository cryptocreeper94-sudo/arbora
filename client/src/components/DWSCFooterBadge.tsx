import { useRef } from "react";

export function DWSCFooterBadge() {
  const clickRef = useRef({ count: 0, timer: null as any });
  const handleClick = () => {
    clickRef.current.count++;
    if (clickRef.current.count === 3) {
      clickRef.current.count = 0;
      clearTimeout(clickRef.current.timer);
      window.open('https://dwsc.io/#portal', '_blank');
    } else {
      clearTimeout(clickRef.current.timer);
      clickRef.current.timer = setTimeout(() => { clickRef.current.count = 0; }, 800);
    }
  };

  return (
    <footer className="w-full py-3 px-4 flex items-center justify-center gap-2 border-t border-white/[0.06] bg-black/30 text-[10px]">
      <span className="text-white/30">© 2026 DarkWave Studios, LLC</span>
      <span className="text-white/15">·</span>
      <a href="https://dwtl.io" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white/50 transition-colors no-underline">Trust Layer</a>
      <span className="text-white/15">·</span>
      <a href="https://trustshield.tech" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white/50 transition-colors no-underline">TrustShield</a>
      <span className="text-white/15">·</span>
      <span onClick={handleClick} className="text-white/20 cursor-default select-none hover:text-white/40 transition-colors" title="◈ DWSC">◈</span>
    </footer>
  );
}
