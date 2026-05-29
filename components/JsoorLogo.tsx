import Image from "next/image";

import darkIcon from "@/logos/jsoor-logo-icon.svg";
import whiteIcon from "@/logos/jsoor-logo-icon-white.svg";
import darkLogo from "@/logos/jsoor-logo-mark-dark.svg";
import whiteLogo from "@/logos/jsoor-logo-mark-white.svg";
import type { StaticImageData } from "next/image";

type JsoorLogoProps = {
  variant?: "dark" | "white";
  className?: string;
  priority?: boolean;
  markOnly?: boolean;
};

const LOGOS: Record<NonNullable<JsoorLogoProps["variant"]>, StaticImageData> = {
  dark: darkLogo,
  white: whiteLogo,
};

const ICONS: Record<NonNullable<JsoorLogoProps["variant"]>, StaticImageData> = {
  dark: darkIcon,
  white: whiteIcon,
};

export function JsoorLogo({
  variant = "dark",
  className = "h-10 w-auto",
  priority = false,
  markOnly = false,
}: JsoorLogoProps) {
  return (
    <Image
      src={markOnly ? ICONS[variant] : LOGOS[variant]}
      alt="JSOOR"
      className={className}
      priority={priority}
    />
  );
}
