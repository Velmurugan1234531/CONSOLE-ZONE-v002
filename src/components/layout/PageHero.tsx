"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useVisuals } from "@/context/visuals-context";
import { usePathname } from "next/navigation";

interface PageHeroProps {
    title: string;
    subtitle: string;
    images: string[];
    children?: React.ReactNode;
    height?: string; // e.g. "50vh", "100vh"
}

export default function PageHero({ title, subtitle, images, children, height = "50vh" }: PageHeroProps) {
    const { settings, isLoading } = useVisuals();
    const [activeIndex, setActiveIndex] = useState(0);

    const pathname = usePathname();

    // Determine page ID from pathname
    const getPageId = (path: string) => {
        if (path === '/') return 'home';
        const parts = path.split('/').filter(Boolean);
        const segment = parts[0];
        if (segment === 'admin') return 'admin';
        if (segment === 'rent' || segment === 'book' || segment === 'rental') return 'rental';
        if (segment === 'buy' || segment === 'sell' || segment === 'services') return segment;
        return 'home';
    };

    const pageId = getPageId(pathname);
    const effects = settings?.pageEffects?.[pageId] || settings?.backgroundEffects;

    // Slideshow logic
    useEffect(() => {
        if (!settings || !images || images.length <= 1) return;

        const speed = effects?.slideshowSpeed || 10;
        if (speed <= 0) return;

        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % images.length);
        }, speed * 1000);

        return () => clearInterval(interval);
    }, [images, settings, effects?.slideshowSpeed]);

    // Use defaults during loading or server-side rendering to prevent hydration mismatch
    const DEFAULT_OVERLAY = 60;
    const backgroundOverlay = (isLoading || !settings) ? DEFAULT_OVERLAY : (effects?.overlayDarkness ?? DEFAULT_OVERLAY);
    const blurAmount = (isLoading || !settings) ? 0 : (effects?.blurIntensity ?? 0);
    const opacity = (isLoading || !settings) ? 1 : ((effects?.imageOpacity ?? 100) / 100);

    return (
        <section className="relative w-full flex items-center justify-center overflow-hidden pt-16" style={{ height }}>
            {/* Hero Background Layer */}
            <div className="absolute inset-0 z-0">
                <AnimatePresence mode="wait">
                    {images && images.length > 0 ? (
                        <motion.div
                            key={images[activeIndex]}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: opacity }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            className="absolute inset-0 w-full h-full"
                        >
                            <img
                                src={images[activeIndex]}
                                alt={title}
                                className="w-full h-full object-cover"
                                style={{ filter: `blur(${blurAmount}px)` }}
                            />
                        </motion.div>
                    ) : (
                        <div className="absolute inset-0 bg-[#050505]" />
                    )}
                </AnimatePresence>

                {/* Gradient Overlays */}
                <div
                    className="absolute inset-0 bg-black"
                    style={{ opacity: backgroundOverlay / 100 }}
                    suppressHydrationWarning
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-[#050505]" />
            </div>

            {/* Content Layer */}
            <div className="relative z-10 text-center px-4 w-full max-w-7xl mx-auto space-y-6">
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter italic leading-none"
                >
                    {title}
                </motion.h1>
                {subtitle && (
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-400 font-mono text-sm md:text-base uppercase tracking-[0.2em] max-w-3xl mx-auto"
                    >
                        {subtitle}
                    </motion.p>
                )}
                {children && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {children}
                    </motion.div>
                )}
            </div>
        </section>
    );
}
