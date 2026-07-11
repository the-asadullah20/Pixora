import { cn } from "@/lib/utils";

interface RabbitMascotProps {
  className?: string;
  /** Adds a gentle continuous hop animation. Off by default so static uses stay still. */
  animated?: boolean;
}

/**
 * Pixora's mascot: a cute pixel-art rabbit carrying a carrot.
 * Drawn as hand-placed 1x1 grid rects on a 20x20 viewBox — crisp at any size,
 * true to the "pixel-friendly RAG" reference.
 */
export function RabbitMascot({ className, animated = false }: RabbitMascotProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      className={cn("drop-shadow-sm", animated && "animate-rabbit-hop", className)}
      role="img"
      aria-label="Pixora rabbit mascot"
    >
      <rect x="8" y="0" width="2" height="1" fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="0.1" />
      <rect x="12" y="0" width="2" height="1" fill="#FFFFFF" />
      <rect x="7" y="1" width="3" height="1" fill="#FFFFFF" />
      <rect x="12" y="1" width="3" height="1" fill="#FFFFFF" />
      <rect x="7" y="2" width="1" height="1" fill="#FFFFFF" />
      <rect x="8" y="2" width="1" height="1" fill="#7DD3FC" />
      <rect x="9" y="2" width="1" height="1" fill="#FFFFFF" />
      <rect x="12" y="2" width="1" height="1" fill="#FFFFFF" />
      <rect x="13" y="2" width="1" height="1" fill="#7DD3FC" />
      <rect x="14" y="2" width="1" height="1" fill="#FFFFFF" />
      <rect x="7" y="3" width="1" height="1" fill="#FFFFFF" />
      <rect x="8" y="3" width="1" height="1" fill="#7DD3FC" />
      <rect x="9" y="3" width="1" height="1" fill="#FFFFFF" />
      <rect x="12" y="3" width="1" height="1" fill="#FFFFFF" />
      <rect x="13" y="3" width="1" height="1" fill="#7DD3FC" />
      <rect x="14" y="3" width="1" height="1" fill="#FFFFFF" />
      <rect x="7" y="4" width="1" height="1" fill="#FFFFFF" />
      <rect x="8" y="4" width="1" height="1" fill="#7DD3FC" />
      <rect x="9" y="4" width="1" height="1" fill="#FFFFFF" />
      <rect x="12" y="4" width="1" height="1" fill="#FFFFFF" />
      <rect x="13" y="4" width="1" height="1" fill="#7DD3FC" />
      <rect x="14" y="4" width="1" height="1" fill="#FFFFFF" />
      <rect x="7" y="5" width="1" height="1" fill="#FFFFFF" />
      <rect x="8" y="5" width="1" height="1" fill="#7DD3FC" />
      <rect x="9" y="5" width="1" height="1" fill="#FFFFFF" />
      <rect x="12" y="5" width="1" height="1" fill="#FFFFFF" />
      <rect x="13" y="5" width="1" height="1" fill="#7DD3FC" />
      <rect x="14" y="5" width="1" height="1" fill="#FFFFFF" />
      <rect x="7" y="6" width="3" height="1" fill="#FFFFFF" />
      <rect x="12" y="6" width="3" height="1" fill="#FFFFFF" />
      <rect x="6" y="7" width="10" height="1" fill="#FFFFFF" />
      <rect x="5" y="8" width="12" height="1" fill="#FFFFFF" />
      <rect x="5" y="9" width="2" height="1" fill="#FFFFFF" />
      <rect x="7" y="9" width="1" height="1" fill="#0B2545" />
      <rect x="8" y="9" width="4" height="1" fill="#FFFFFF" />
      <rect x="12" y="9" width="1" height="1" fill="#0B2545" />
      <rect x="13" y="9" width="3" height="1" fill="#FFFFFF" />
      <rect x="5" y="10" width="2" height="1" fill="#FFFFFF" />
      <rect x="7" y="10" width="1" height="1" fill="#0B2545" />
      <rect x="8" y="10" width="4" height="1" fill="#FFFFFF" />
      <rect x="12" y="10" width="1" height="1" fill="#0B2545" />
      <rect x="13" y="10" width="3" height="1" fill="#FFFFFF" />
      <rect x="5" y="11" width="11" height="1" fill="#FFFFFF" />
      <rect x="5" y="12" width="4" height="1" fill="#FFFFFF" />
      <rect x="9" y="12" width="2" height="1" fill="#0EA5E9" />
      <rect x="11" y="12" width="4" height="1" fill="#FFFFFF" />
      <rect x="4" y="13" width="12" height="1" fill="#FFFFFF" />
      <rect x="3" y="14" width="14" height="1" fill="#FFFFFF" />
      <rect x="17" y="14" width="1" height="1" fill="#4ADE80" />
      <rect x="3" y="15" width="13" height="1" fill="#FFFFFF" />
      <rect x="16" y="15" width="3" height="1" fill="#FB923C" />
      <rect x="3" y="16" width="14" height="1" fill="#FFFFFF" />
      <rect x="17" y="16" width="2" height="1" fill="#FB923C" />
      <rect x="4" y="17" width="12" height="1" fill="#FFFFFF" />
      <rect x="5" y="18" width="2" height="1" fill="#7DD3FC" />
      <rect x="11" y="18" width="2" height="1" fill="#7DD3FC" />
      <rect x="5" y="19" width="2" height="1" fill="#7DD3FC" />
      <rect x="11" y="19" width="2" height="1" fill="#7DD3FC" />
    </svg>
  );
}
