import Image from "next/image";

import darkLogo from "@/logos/jsoor-logo-dark.png";
import whiteLogo from "@/logos/jsoor-logo-white.png";
import type { StaticImageData } from "next/image";

type JsoorLogoProps = {
  variant?: "dark" | "white";
  className?: string;
  priority?: boolean;
};

const LOGOS: Record<NonNullable<JsoorLogoProps["variant"]>, StaticImageData> = {
  dark: darkLogo,
  white: whiteLogo,
};

export function JsoorLogo({
  variant = "dark",
  className = "h-10 w-auto",
  priority = false,
}: JsoorLogoProps) {
  return (
    <Image
      src={LOGOS[variant]}
      alt="JSOOR"
      className={className}
      priority={priority}
    />
  );
}
