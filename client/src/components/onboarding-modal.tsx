import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  ChevronLeft, ChevronRight, X, TreePine, Camera, MapPin, Tent,
  ShoppingBag, DollarSign, Leaf, Axe, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

import welcomeImg from "@assets/images/onboarding-welcome.png";
import identifyImg from "@assets/images/onboarding-identify.png";
import catalogImg from "@assets/images/onboarding-catalog.png";
import campingImg from "@assets/images/onboarding-camping.png";
import marketplaceImg from "@assets/images/onboarding-marketplace.png";
import compareImg from "@assets/images/onboarding-compare.png";
import ediblesImg from "@assets/images/onboarding-edibles.png";
import arboristImg from "@assets/images/onboarding-arborist.png";

const STORAGE_KEY = "verdara-onboarding-v1";

interface OnboardingSlide {
  image: string;
  icon: typeof TreePine;
  title: string;
  subtitle: string;
  bullets: string[];
  link: string;
  linkLabel: string;
  accentColor: string;
}

const slides: OnboardingSlide[] = [
  {
    image: welcomeImg,
    icon: TreePine,
    title: "Welcome to Verdara",
    subtitle: "Your all-in-one outdoor adventure companion",
    bullets: [
      "Plan trips, identify wildlife, compare gear prices, and more",
      "170+ real outdoor locations across the US and growing daily",
      "Powered by AI to make every adventure smarter",
    ],
    link: "/",
    linkLabel: "Open Command Center",
    accentColor: "emerald",
  },
  {
    image: identifyImg,
    icon: Camera,
    title: "AI Species Identification",
    subtitle: "Point your camera at any plant, tree, fish, or animal",
    bullets: [
      "Snap a photo or upload one from your gallery",
      "AI identifies the species with confidence scores",
      "Get habitat info, conservation status, and fun facts",
    ],
    link: "/identify",
    linkLabel: "Try Species ID",
    accentColor: "emerald",
  },
  {
    image: catalogImg,
    icon: MapPin,
    title: "Explore the Outdoors",
    subtitle: "Browse trails, parks, lakes, and hidden gems nationwide",
    bullets: [
      "Interactive maps with trail markers across the US",
      "Detailed location pages with photos, reviews, and directions",
      "A living catalog that grows with 10-15 new places every day",
    ],
    link: "/catalog",
    linkLabel: "Browse the Catalog",
    accentColor: "amber",
  },
  {
    image: campingImg,
    icon: Tent,
    title: "Camping & Trip Planning",
    subtitle: "Plan your perfect trip from start to finish",
    bullets: [
      "Book campgrounds and reserve your spot",
      "Build custom routes with the trip planner",
      "Gear checklists and live weather forecasts",
    ],
    link: "/camping",
    linkLabel: "Plan a Trip",
    accentColor: "amber",
  },
  {
    image: marketplaceImg,
    icon: ShoppingBag,
    title: "Wood Economy Marketplace",
    subtitle: "Buy and sell handcrafted wood products",
    bullets: [
      "Browse artisan woodwork from verified sellers",
      "Secure checkout powered by Stripe",
      "TrustShield escrow protection on every order",
    ],
    link: "/marketplace",
    linkLabel: "Visit the Marketplace",
    accentColor: "amber",
  },
  {
    image: compareImg,
    icon: DollarSign,
    title: "Price Compare",
    subtitle: "Search 90+ outdoor retailers in plain language",
    bullets: [
      "Type what you need in everyday words — AI figures out the rest",
      "Compare across REI, Bass Pro, Backcountry, BladeHQ, and more",
      "Tap any store to jump straight to that product on their site",
    ],
    link: "/price-compare",
    linkLabel: "Compare Prices",
    accentColor: "emerald",
  },
  {
    image: ediblesImg,
    icon: Leaf,
    title: "Wild Edibles & Natural Medicine",
    subtitle: "Discover what nature provides",
    bullets: [
      "15+ edible and medicinal plants with detailed guides",
      "Historical uses, safety warnings, and preparation tips",
      "AI plant identification to help you forage safely",
    ],
    link: "/foraging",
    linkLabel: "Explore Wild Edibles",
    accentColor: "emerald",
  },
  {
    image: arboristImg,
    icon: Axe,
    title: "Arborist Pro & Arbora",
    subtitle: "Professional tree care business tools",
    bullets: [
      "Manage clients, schedule jobs, and send invoices",
      "Full CRM with deal pipeline and estimates",
      "Crew management, inventory tracking, and equipment integration",
    ],
    link: "/arbora",
    linkLabel: "Open Arbora",
    accentColor: "amber",
  },
];

interface OnboardingModalProps {
  onDismiss: () => void;
}

export function OnboardingModal({ onDismiss }: OnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [, navigate] = useLocation();
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const slide = slides[currentSlide];
  const isLast = currentSlide === slides.length - 1;

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    onDismiss();
  }, [onDismiss]);

  const goNext = useCallback(() => {
    if (isLast) {
      dismiss();
      return;
    }
    setDirection(1);
    setCurrentSlide((s) => Math.min(s + 1, slides.length - 1));
  }, [isLast, dismiss]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrentSlide((s) => Math.max(s - 1, 0));
  }, []);

  const goToSlide = useCallback((i: number) => {
    setDirection(i > currentSlide ? 1 : -1);
    setCurrentSlide(i);
  }, [currentSlide]);

  const handleLink = useCallback(() => {
    dismiss();
    navigate(slide.link);
  }, [dismiss, navigate, slide.link]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, dismiss]);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    setTouchStart(null);
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0, transition: { duration: 0.3 } }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      data-testid="onboarding-modal"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full h-full max-w-lg mx-auto flex flex-col overflow-hidden md:max-h-[90vh] md:rounded-2xl md:border md:border-white/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={dismiss}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/70"
          data-testid="button-skip-onboarding"
          aria-label="Skip"
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="absolute top-4 left-4 z-20 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
          <span className="text-xs text-white/70 font-medium">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>

        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 flex flex-col"
            >
              <div className="relative h-[45%] min-h-[220px] overflow-hidden flex-shrink-0">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-background" />
              </div>

              <div className="flex-1 px-6 pb-6 pt-4 flex flex-col bg-background">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    slide.accentColor === "emerald" ? "bg-emerald-500/15 border border-emerald-500/30" : "bg-amber-500/15 border border-amber-500/30"
                  }`}>
                    <slide.icon className={`w-5 h-5 ${slide.accentColor === "emerald" ? "text-emerald-400" : "text-amber-400"}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground leading-tight" data-testid={`text-onboarding-title-${currentSlide}`}>
                      {slide.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">{slide.subtitle}</p>
                  </div>
                </div>

                <ul className="space-y-2.5 my-4 flex-1">
                  {slide.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                        slide.accentColor === "emerald" ? "bg-emerald-400" : "bg-amber-400"
                      }`} />
                      <span className="text-sm text-foreground/80">{bullet}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant="outline"
                  onClick={handleLink}
                  className={`w-full gap-2 rounded-xl mb-4 ${
                    slide.accentColor === "emerald"
                      ? "border-emerald-500/20 text-emerald-400"
                      : "border-amber-500/20 text-amber-400"
                  }`}
                  data-testid={`link-onboarding-feature-${currentSlide}`}
                >
                  {slide.linkLabel} <ArrowRight className="w-4 h-4" />
                </Button>

                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goPrev}
                    disabled={currentSlide === 0}
                    className="gap-1 text-muted-foreground"
                    data-testid="button-onboarding-prev"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </Button>

                  <div className="flex gap-1.5" data-testid="onboarding-dots">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => goToSlide(i)}
                        className={`rounded-full transition-all duration-300 ${
                          i === currentSlide
                            ? "w-6 h-2 bg-emerald-400"
                            : "w-2 h-2 bg-white/20 hover:bg-white/40"
                        }`}
                        data-testid={`button-onboarding-dot-${i}`}
                        aria-label={`Go to slide ${i + 1}`}
                      />
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goNext}
                    className={`gap-1 ${isLast ? "text-emerald-400 font-semibold" : "text-muted-foreground"}`}
                    data-testid="button-onboarding-next"
                  >
                    {isLast ? "Get Started" : "Next"} <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export function useOnboarding() {
  const [show, setShow] = useState(() => !localStorage.getItem(STORAGE_KEY));
  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShow(false);
  }, []);
  return { showOnboarding: show, dismissOnboarding: dismiss };
}
