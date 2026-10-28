// The opening paragraph of a post is its lead (phase18.md I28, D9; `site-review/blog-post.html`):
// 18px, in `.prose :where(.lead)`. Marking it here, when the MDX is compiled, means no post
// has to carry a class and a post that opens with an import or a component still gets one.
// Only the first paragraph that is a direct child of the document counts, so a paragraph
// inside a callout or a list is never the lead.
interface Node {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: Node[];
}

export function rehypeLead() {
  return (tree: Node) => {
    const first = tree.children?.find((node) => node.type === "element" && node.tagName === "p");
    if (!first) return;
    first.properties = { ...first.properties, className: ["lead"] };
  };
}
