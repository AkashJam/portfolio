import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// globals.css's named type scale (D9). Without this, tailwind-merge reads
// `text-meta` as a colour and drops it (or a real colour) from `cn()`.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["meta", "small", "body", "lead", "h3", "h2", "h1"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
