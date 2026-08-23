interface ArchFlowProps {
  /** Each node is a label, or a pair of labels stacked in one box. */
  nodes: (string | [string, string])[];
  /** Node label to visually emphasize (matches mockups/v2's brand-highlighted node). */
  highlight?: string;
}

/** Architecture-flow diagram for project case studies (portfolio.md §18). */
export function ArchFlow({ nodes, highlight }: ArchFlowProps) {
  return (
    <div
      className="not-prose my-8 flex flex-wrap items-center gap-2 rounded-xl border border-hairline bg-panel p-5"
      role="img"
      aria-label={`Architecture flow: ${nodes
        .map((n) => (Array.isArray(n) ? n.join(" / ") : n))
        .join(" → ")}`}
    >
      {nodes.map((node, i) => (
        <div key={i} className="flex items-center gap-2">
          {i > 0 && (
            <span aria-hidden="true" className="text-text-faint">
              →
            </span>
          )}
          {Array.isArray(node) ? (
            <div className="flex flex-col gap-1">
              {node.map((label) => (
                <FlowNode key={label} label={label} active={label === highlight} />
              ))}
            </div>
          ) : (
            <FlowNode label={node} active={node === highlight} />
          )}
        </div>
      ))}
    </div>
  );
}

function FlowNode({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={
        active
          ? "rounded-lg border border-brand bg-brand/10 px-3 py-1.5 font-mono text-xs whitespace-nowrap text-text"
          : "rounded-lg border border-hairline bg-panel-2 px-3 py-1.5 font-mono text-xs whitespace-nowrap text-text-muted"
      }
    >
      {label}
    </span>
  );
}
