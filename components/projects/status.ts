import type { Project } from "content-collections";

// A project's status colour and mark, shared by the /projects index and the case-study
// fact grid (and Home's showcase rows).
export const STATUS_COLOR: Record<Project["status"], string> = {
  Live: "text-market-up",
  Research: "text-warn",
  "This site": "text-text-muted",
};

export const STATUS_MARK: Record<Project["status"], string> = {
  Live: "●",
  Research: "◆",
  "This site": "",
};
