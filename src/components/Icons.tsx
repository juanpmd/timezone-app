// Small inline icon set so no icon package is needed.

type P = { size?: number };
const base = (size: number) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });

export const ChevronLeft = ({ size = 14 }: P) => <svg {...base(size)}><path d="m15 18-6-6 6-6" /></svg>;
export const ChevronRight = ({ size = 14 }: P) => <svg {...base(size)}><path d="m9 18 6-6-6-6" /></svg>;
export const Gear = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);
export const Pencil = ({ size = 14 }: P) => <svg {...base(size)}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>;
export const Back = ({ size = 16 }: P) => <svg {...base(size)}><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>;
export const Plus = ({ size = 16 }: P) => <svg {...base(size)}><path d="M12 5v14M5 12h14" /></svg>;
export const Sparkle = ({ size = 14 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2c.4 4.6 3.4 7.6 8 8-4.6.4-7.6 3.4-8 8-.4-4.6-3.4-7.6-8-8 4.6-.4 7.6-3.4 8-8Z" />
    <path d="M5 15c.2 2 1.5 3.3 3.5 3.5C6.5 18.7 5.2 20 5 22c-.2-2-1.5-3.3-3.5-3.5C3.5 18.3 4.8 17 5 15Z" opacity=".7" />
  </svg>
);
export const Clock = ({ size = 18 }: P) => <svg {...base(size)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
export const Trash = ({ size = 14 }: P) => <svg {...base(size)}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>;
export const Camera = ({ size = 16 }: P) => <svg {...base(size)}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>;
