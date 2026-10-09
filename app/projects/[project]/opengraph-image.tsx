import { ImageResponse } from "next/og";
import { allProjects } from "content-collections";

import { OG_SIZE, OgCard, loadOgFonts } from "@/lib/og";

// A card per case study (phase7.md Step 2). Same rendering and
// gating as the blog card (see its comment): on request, findProject decides.
const isDev = process.env.NODE_ENV !== "production";
const MAX_CHIPS = 5;

function findProject(slug: string) {
  const project = allProjects.find((p) => p.slug === slug);
  if (!project || (project.draft && !isDev)) return null;
  return project;
}

export const contentType = "image/png";

export function generateImageMetadata({ params }: { params: { project: string } }) {
  const project = findProject(params.project);
  return [
    { id: "card", size: OG_SIZE, contentType, alt: project ? `${project.title} — case study` : "Projects — Akash James" },
  ];
}

export default async function Image({ params }: { params: Promise<{ project: string }> }) {
  const project = findProject((await params).project);
  if (!project) return new Response("Not found", { status: 404 });
  return new ImageResponse(
    (
      <OgCard
        eyebrow={`Case study · ${project.year} · ${project.role}`}
        headline={project.title}
        summary={project.summary}
        chips={project.tags.slice(0, MAX_CHIPS)}
      />
    ),
    { ...OG_SIZE, fonts: await loadOgFonts() }
  );
}
