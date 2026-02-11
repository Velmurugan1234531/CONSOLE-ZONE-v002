"use client";

import { usePathname } from "next/navigation";
import { useVisuals } from "@/context/visuals-context";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function PageBackground() {
    const pathname = usePathname();
    const { settings } = useVisuals();
    const [currentImages, setCurrentImages] = useState<string[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    // Determine page ID from pathname
    const getPageId = (path: string) => {
        if (path === '/') return 'home';
        const parts = path.split('/').filter(Boolean);
        const segment = parts[0];

        // Map specific routes to background IDs
        if (segment === 'admin') return 'admin';
        if (segment === 'rent' || segment === 'book' || segment === 'rental') return 'rental';
        if (segment === 'buy' || segment === 'sell' || segment === 'services') return segment;

        return 'home'; // Default fallback
    };

    const pageId = getPageId(pathname);

    useEffect(() => {
        if (!settings) return;
        // Get background for this page
        const bgImages = settings.pageBackgrounds?.[pageId] || [];
        setCurrentImages(bgImages);
        setActiveIndex(0); // Reset index on page change or settings change
    }, [pathname, settings, pageId]);

    // Determine effects (per-page or global)
    const effects = settings?.pageEffects?.[pageId] || settings?.backgroundEffects;

    // Slideshow logic
    useEffect(() => {
        if (!settings || currentImages.length <= 1) return;

        const speed = effects?.slideshowSpeed || 0;
        if (speed <= 0) return;

        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % currentImages.length);
        }, speed * 1000);

        return () => clearInterval(interval);
    }, [currentImages, settings, effects?.slideshowSpeed]);

    if (!settings) return null;

    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#050505]">
            {/* Background Image Layer */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${pageId}-${currentImages[activeIndex]}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full"
                >
                    <img
                        src={currentImages[activeIndex]}
                        alt="Page Background"
                        className="w-full h-full object-cover"
                        style={{
                            opacity: (effects?.imageOpacity ?? 100) / 100,
                            filter: `blur(${effects?.blurIntensity ?? 0}px)`
                        }}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Overlay Layer */}
            <div
                className="absolute inset-0 bg-black"
                style={{ opacity: (effects?.overlayDarkness ?? 0) / 100 }}
            />
        </div>
    );
}
