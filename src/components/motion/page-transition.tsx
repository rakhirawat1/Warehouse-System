"use client";

import { motion } from "framer-motion";

import { pageVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

export default function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageVariants}
      className={cn("min-w-0", className)}
    >
      {children}
    </motion.div>
  );
}
