import Link from "next/link";
import type { ReactNode } from "react";

import { ArrowLeft } from "lucide-react";

type BackLinkProps = {
  href: string;
  children: ReactNode;
};

export default function BackLink({
  href,
  children,
}: BackLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-primary"
    >
      <ArrowLeft className="h-4 w-4" />
      {children}
    </Link>
  );
}