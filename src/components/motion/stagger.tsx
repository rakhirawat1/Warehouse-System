"use client";

import { motion } from "framer-motion";

import { riseItem, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function Stagger({
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
      variants={staggerContainer}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={riseItem} className={cn("min-w-0", className)}>
      {children}
    </motion.div>
  );
}
