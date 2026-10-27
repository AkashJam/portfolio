// Five topics replace the eleven categories (I30); the blog index's chips filter on them in
// `?tag=`. Its own module, so the app can import the list without the content-collections
// config (and the MDX build it carries) coming with it.
export const topics = [
  "Frontend",
  "Backend and distributed systems",
  "Infrastructure",
  "Architecture",
  "Engineering practice",
] as const;
