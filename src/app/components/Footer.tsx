"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Footer() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Predictor", path: "/predictor" },
    { name: "Feedback", path: "/feedback" },
  ];

  return (
    <footer
  className="w-full mt-auto border-t"
  style={{
    background: "var(--footer-bg)",
    borderColor: "var(--footer-border)",
  }}
>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 items-start gap-5">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <Image
  src="/future-engineers-logo-v2.png"
  alt="Future Engineers Logo"
  width={34}
  height={34}
  className="h-[34px] w-[34px] object-contain"
/>

            <div>
              <h3 className="font-bold text-base leading-tight text-[var(--footer-text)]">
                Future <span className="text-blue-500">Engineers</span>
              </h3>
              <p className="text-xs text-[var(--footer-muted)] mt-1">
                WBJEE College Predictor 2026
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-5">
            <div className="flex items-center justify-center gap-6">
              {navLinks.map((link) => {
                const isActive = pathname === link.path;

                return (
                  <Link
                    key={link.name}
                    href={link.path}
                    className={`relative text-sm font-medium transition-colors hover:text-blue-500 py-1 ${
                      isActive ? "text-blue-500" : "text-[var(--footer-muted)]"
                    }`}
                  >
                    {link.name}

                    {isActive && (
                      <motion.div
                        layoutId="footer-underline"
                        className="absolute left-0 bottom-0 w-full h-[2px] bg-blue-500 rounded-full"
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            <p className="text-[11px] text-[var(--footer-muted)]">
              © 2026 Future Engineers. All Rights Reserved.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
            <p className="text-xs text-[var(--footer-muted)]">
              Built for WBJEE 2026 Aspirants
            </p>

<p className="text-xs text-[var(--footer-muted)] leading-relaxed max-w-[420px]">
  <AlertCircle className="inline w-3 h-3 text-red-500 mr-1 mb-[1px]" />
  <strong className="text-red-500">Disclaimer:</strong> Based on previous-year
  WBJEE cutoff trends. Final admission depends on official counselling.
</p>
          </div>
        </div>
      </div>
    </footer>
  );
}