"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode } from "react";

export default function LayoutAnimator({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <AnimatePresence>
            <motion.div
                key={pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full relative z-[1]"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
