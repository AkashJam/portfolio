export interface EducationEntry {
  institution: string;
  degree: string;
  location?: string;
  start: string;
  /** Omit to render "Present". */
  end?: string;
}

// Most-recent-first, author-controlled order (no sort logic — same call as
// data/experience.ts: not worth the machinery for two entries).
export const education: EducationEntry[] = [
  {
    institution: "Politecnico di Milano",
    degree: "MSc, Computer Science & Engineering",
    location: "Milan, Italy",
    start: "2019",
    end: "2023",
  },
  {
    institution: "SRM University",
    degree: "BSc, Computer Science & Technology",
    location: "Chennai, India",
    start: "2014",
    end: "2018",
  },
];
