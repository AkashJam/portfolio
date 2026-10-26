import { cn } from "@/lib/utils";

/**
 * A project's `picture` field, or just a label for one whose capture does not exist
 * yet: with no `src` the frame is drawn with an empty panel, so Home's rows still
 * line up (Market and Portfolio wait for Phase 23's captures).
 */
type Picture = { src?: string; label?: string };

/**
 * A project's one picture (I25) in its frame — a window chrome bar over a 16:9
 * screenshot. Drawn here for the case-study header; the Home showcase row and
 * the /projects preview take the same component and the same file.
 *
 * `aspect-video` pins the box before the file loads, so the page below it never
 * moves. Every picture is cut to 16:9 when it is made (phase20.md, *The
 * pictures (I25)*), so `object-cover` has nothing to crop — it is there for the
 * one that is ever a little off.
 *
 * The image is decorative: everything it shows is in the summary and the
 * Approach section beside it, and a screen reader gains nothing from "a
 * screenshot of an admin tool". Empty alt keeps it out of the accessibility
 * tree entirely, which is also what /projects does with its preview (I21).
 */
export function ProjectPicture({ picture, className }: { picture: Picture; className?: string }) {
  return (
    <figure className={cn("overflow-hidden rounded-[16px] border border-hairline bg-panel", className)}>
      <div className="flex items-center gap-1.5 border-b border-hairline px-3 py-2.5">
        {[0, 1, 2].map((dot) => (
          <span key={dot} className="block size-2 rounded-full bg-text-faint/35" />
        ))}
        {picture.label && (
          <span className="ml-2.5 font-mono text-meta leading-none text-text-muted">
            {picture.label}
          </span>
        )}
      </div>
      {picture.src ? (
        <>
          {/* A plain <img>: the site ships no next/image anywhere, and a pre-sized
              file keeps the lean standalone runtime free of the image optimizer.
              Whether that stays true once Lighthouse has run on the built page is
              step 3's call (phase20.md). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={picture.src} alt="" className="block aspect-video w-full object-cover" />
        </>
      ) : (
        <div aria-hidden="true" className="aspect-video w-full bg-panel-2" />
      )}
    </figure>
  );
}
