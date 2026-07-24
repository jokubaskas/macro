// Vieninga line-icon SVG sistema — pakeičia emoji visame appe.
// 24×24 viewBox, currentColor potėpis, suapvalinti galai — švarus, profesionalus stilius.

function IconBase({ size = "1em", color = "currentColor", strokeWidth = 1.75, viewBox = "0 0 24 24", style, children, ...rest }) {
  return (
    <svg width={size} height={size} viewBox={viewBox} fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ display:"inline-block", verticalAlign:"-0.125em", flexShrink:0, ...style }}
      {...rest}>
      {children}
    </svg>
  );
}

export function Cake(props) {
  return (
    <IconBase {...props}>
      <path d="M4 21v-6.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2V21"/>
      <path d="M4 21h16"/>
      <path d="M4 17.3c1.3.9 2.4.9 3.5 0s2.3-.9 3.5 0 2.3.9 3.5 0 2.3-.9 3.5 0"/>
      <path d="M8 12.5V10M12 12.5V9M16 12.5V10"/>
      <path d="M8 10a1 1 0 1 0 0-2M12 9a1 1 0 1 0 0-2M16 10a1 1 0 1 0 0-2"/>
    </IconBase>
  );
}

export function Search(props) {
  return <IconBase {...props}><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/></IconBase>;
}

export function Droplet(props) {
  return <IconBase {...props}><path d="M12 2.5c3.5 4.5 7 8.9 7 12.7A7 7 0 1 1 5 15.2c0-3.8 3.5-8.2 7-12.7Z"/></IconBase>;
}

export function Glass(props) {
  return <IconBase {...props}><path d="M7 3h10l-1.2 15.3A2 2 0 0 1 13.8 20h-3.6a2 2 0 0 1-2-1.7L7 3Z"/><path d="M7.6 8.2h8.8"/></IconBase>;
}

export function Check(props) {
  return <IconBase {...props}><path d="M4 12.5l5 5L20 6.5"/></IconBase>;
}

export function CheckCircle(props) {
  return <IconBase {...props}><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></IconBase>;
}

export function Calendar(props) {
  return <IconBase {...props}><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.5h17"/><path d="M8 3v4M16 3v4"/></IconBase>;
}

export function ChevronRight(props) {
  return <IconBase {...props}><path d="M9 5l7 7-7 7"/></IconBase>;
}

export function ChevronLeft(props) {
  return <IconBase {...props}><path d="M15 5l-7 7 7 7"/></IconBase>;
}

export function Ticket(props) {
  return <IconBase {...props}>
    <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5v1a2 2 0 0 0 0 4v1A2.5 2.5 0 0 1 17.5 17h-11A2.5 2.5 0 0 1 4 14.5v-1a2 2 0 0 0 0-4v-1Z"/>
    <path d="M14 6.5v2.2M14 15.3v2.2M14 10.9v2.2" strokeDasharray="1.6 2.4"/>
  </IconBase>;
}

export function Dumbbell(props) {
  return <IconBase {...props}>
    <path d="M6.5 9v6M4 10v4M2.5 11v2"/>
    <path d="M17.5 9v6M20 10v4M21.5 11v2"/>
    <path d="M6.5 12h11"/>
  </IconBase>;
}

export function BarChart(props) {
  return <IconBase {...props}><path d="M5 20V11M12 20V4M19 20v-7"/></IconBase>;
}

export function Moon(props) {
  return <IconBase {...props}><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/></IconBase>;
}

export function Camera(props) {
  return <IconBase {...props}>
    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-1.7A1.5 1.5 0 0 1 9.8 4.5h4.4a1.5 1.5 0 0 1 1.3.8L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z"/>
    <circle cx="12" cy="13" r="3.5"/>
  </IconBase>;
}

export function TrendingUp(props) {
  return <IconBase {...props}><path d="M4 16l5.5-5.5L13 14l6.5-6.5"/><path d="M15 7.5h4.5V12"/></IconBase>;
}

export function WaveHand(props) {
  return <IconBase {...props}>
    <path d="M7 13V6a1.4 1.4 0 1 1 2.8 0v5.2"/>
    <path d="M9.8 11V4.6a1.4 1.4 0 1 1 2.8 0V11"/>
    <path d="M12.6 11.2V6a1.4 1.4 0 1 1 2.8 0v7"/>
    <path d="M15.4 12V9.4a1.4 1.4 0 1 1 2.8 0v5.4c0 3.4-2.6 6.2-6 6.2h-1.4c-2 0-3.9-1-5-2.7L4 14.6a1.3 1.3 0 0 1 2-1.6l1.8 2"/>
  </IconBase>;
}

export function Close(props) {
  return <IconBase {...props}><path d="M5 5l14 14M19 5L5 19"/></IconBase>;
}

export function Save(props) {
  return <IconBase {...props}>
    <path d="M5 4.5h11l3.5 3.5v11.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1Z"/>
    <path d="M8 4.5v5h7v-5"/>
    <path d="M8 19.5v-6h8v6"/>
  </IconBase>;
}

export function Clipboard(props) {
  return <IconBase {...props}>
    <rect x="5" y="4.5" width="14" height="17" rx="2"/>
    <path d="M9 4.5V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v.5"/>
    <path d="M8.5 11h7M8.5 15h7"/>
  </IconBase>;
}

export function Salad(props) {
  return <IconBase {...props}>
    <path d="M3.5 13.5h17A7.5 7.5 0 0 1 12 20a7.5 7.5 0 0 1-8.5-6.5Z"/>
    <path d="M8 13c-.6-2 .3-3.8 2-4.6M12 13c0-2.4 1-4.2 2.6-5.2M16 13c.7-1.7 2-2.8 3.6-3"/>
    <path d="M12 8.4V4"/>
  </IconBase>;
}

export function Muscle(props) {
  return <IconBase {...props}>
    <path d="M4 13.5c0-1.8.7-3 2-3 .8 0 1.3.4 1.7 1 .6-1.4 1.8-2.3 3.3-2.3 3 0 5 2.4 5 5.8 0 2.4-1.7 4-4 4H8a4 4 0 0 1-4-4v-1.5Z"/>
    <path d="M9 11.2V8.5a2 2 0 0 1 2-2h1"/>
  </IconBase>;
}

export function Lightbulb(props) {
  return <IconBase {...props}>
    <path d="M9 18h6M9.5 21h5"/>
    <path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.6.5 1 1.2 1 2v.7h5.6v-.7c0-.8.4-1.5 1-2A6.5 6.5 0 0 0 12 2.5Z"/>
  </IconBase>;
}

export function Sparkle(props) {
  return <IconBase {...props}>
    <path d="M12 3.5c.5 3 1.7 4.9 5 5.5-3.3.6-4.5 2.5-5 5.5-.5-3-1.7-4.9-5-5.5 3.3-.6 4.5-2.5 5-5.5Z"/>
    <path d="M19 15.5c.3 1.6.9 2.6 2.5 2.9-1.6.3-2.2 1.3-2.5 2.9-.3-1.6-.9-2.6-2.5-2.9 1.6-.3 2.2-1.3 2.5-2.9Z"/>
  </IconBase>;
}

export function Ruler(props) {
  return <IconBase {...props}>
    <rect x="3" y="8" width="18" height="8" rx="1.5" transform="rotate(0 12 12)"/>
    <path d="M6.5 8v2.5M10 8v3.5M13.5 8v2.5M17 8v3.5"/>
  </IconBase>;
}

export function Flame(props) {
  return <IconBase {...props}>
    <path d="M12 21.5c-3.6 0-6-2.3-6-5.7 0-2.3 1.2-3.8 2.3-5.4.2 1.4.9 2.2 1.7 2.2-.3-2.7.6-5.3 3-7.1-.4 2 .1 3.4 1.3 4.6 1.6 1.6 3.7 3 3.7 5.7 0 3.4-2.4 5.7-6 5.7Z"/>
  </IconBase>;
}

export function Timer(props) {
  return <IconBase {...props}>
    <circle cx="12" cy="13" r="8"/>
    <path d="M12 9v4l2.8 2"/>
    <path d="M9.5 2.5h5"/>
  </IconBase>;
}

export function Footprints(props) {
  return (
    <IconBase {...props}>
      <ellipse cx="7.6" cy="16.2" rx="2.6" ry="4" transform="rotate(-14 7.6 16.2)"/>
      <circle cx="5.8" cy="10.6" r="0.9" fill="currentColor" stroke="none"/>
      <circle cx="7.8" cy="9.6" r="0.95" fill="currentColor" stroke="none"/>
      <circle cx="9.6" cy="10.5" r="0.8" fill="currentColor" stroke="none"/>
      <ellipse cx="16.4" cy="7.8" rx="2.6" ry="4" transform="rotate(14 16.4 7.8)"/>
      <circle cx="14.6" cy="14.2" r="0.8" fill="currentColor" stroke="none"/>
      <circle cx="16.6" cy="15.2" r="0.95" fill="currentColor" stroke="none"/>
      <circle cx="18.6" cy="14.3" r="0.9" fill="currentColor" stroke="none"/>
    </IconBase>
  );
}

export function Heart(props) {
  return <IconBase {...props}><path d="M12 20.2s-7.5-4.5-9.7-9C.9 8 2.2 4.5 5.6 4c2.2-.3 4 .9 6.4 3.5C14.4 4.9 16.2 3.7 18.4 4c3.4.5 4.7 4 3.3 7.2-2.2 4.5-9.7 9-9.7 9Z"/></IconBase>;
}

export function Walk(props) {
  return <IconBase {...props}>
    <circle cx="14" cy="4.5" r="1.6"/>
    <path d="M10.5 21l1.6-5.3-2.2-1.8.9-4.7 3-1.3 2.6 2.4 2.6 1.1"/>
    <path d="M11 13.9 8 15.4 6.5 19"/>
  </IconBase>;
}

export function Ban(props) {
  return <IconBase {...props}><circle cx="12" cy="12" r="9"/><path d="M5.8 5.8l12.4 12.4"/></IconBase>;
}

export function Users(props) {
  return <IconBase {...props}>
    <circle cx="9" cy="8.5" r="3"/>
    <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/>
    <path d="M15.5 6a3 3 0 0 1 0 5.9"/>
    <path d="M17.5 14.7c2.6.5 4.5 2.4 4.5 5.3"/>
  </IconBase>;
}

export function Scale(props) {
  return <IconBase {...props}>
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 7v5l3.2 2"/>
  </IconBase>;
}

export function ArrowUp(props) {
  return <IconBase {...props}><path d="M12 19V5M6 11l6-6 6 6"/></IconBase>;
}

export function ArrowDown(props) {
  return <IconBase {...props}><path d="M12 5v14M6 13l6 6 6-6"/></IconBase>;
}

export function MapPin(props) {
  return <IconBase {...props}>
    <path d="M12 21.5S5 15 5 9.5a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/>
    <circle cx="12" cy="9.5" r="2.5"/>
  </IconBase>;
}

export function HelpCircle(props) {
  return <IconBase {...props}>
    <circle cx="12" cy="12" r="9"/>
    <path d="M9.3 9.3a2.7 2.7 0 1 1 4 2.4c-.8.5-1.3 1-1.3 2"/>
    <path d="M12 17v.1"/>
  </IconBase>;
}

export function CreditCard(props) {
  return <IconBase {...props}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.2"/>
    <path d="M3 9.5h18"/>
    <path d="M6.5 14.5h4"/>
  </IconBase>;
}

export function Mail(props) {
  return <IconBase {...props}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.2"/>
    <path d="M4 7l8 6 8-6"/>
  </IconBase>;
}

export function Coins(props) {
  return <IconBase {...props}>
    <ellipse cx="9" cy="8" rx="5.5" ry="3.2"/>
    <path d="M3.5 8v4.5c0 1.8 2.5 3.2 5.5 3.2s5.5-1.4 5.5-3.2V8"/>
    <path d="M12.3 14.2c1.4 1.7 3.6 2.8 5.7 2.3 1.9-.5 2.8-2.2 2.1-3.9"/>
  </IconBase>;
}

export function Laptop(props) {
  return <IconBase {...props}>
    <rect x="4.5" y="5" width="15" height="10" rx="1.5"/>
    <path d="M2.5 19.5h19"/>
  </IconBase>;
}

export function Sun(props) {
  return <IconBase {...props}>
    <circle cx="12" cy="12" r="4.5"/>
    <path d="M12 2.5v3M12 18.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>
  </IconBase>;
}

export function MessageCircle(props) {
  return <IconBase {...props}>
    <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-2.9-.35-4.15-1L3 20l1.1-4.1A8.44 8.44 0 0 1 3.5 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z"/>
  </IconBase>;
}

export function AlertTriangle(props) {
  return <IconBase {...props}>
    <path d="M12 4.2 21.5 20h-19L12 4.2Z"/>
    <path d="M12 10.5v4"/>
    <path d="M12 17.7v.1"/>
  </IconBase>;
}

export function Edit(props) {
  return <IconBase {...props}>
    <path d="M4 19.5h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 16.5v3Z"/>
  </IconBase>;
}

export function Repeat(props) {
  return <IconBase {...props}>
    <path d="M4 11V9a3 3 0 0 1 3-3h12M17 4l2 2-2 2"/>
    <path d="M20 13v2a3 3 0 0 1-3 3H5M7 20l-2-2 2-2"/>
  </IconBase>;
}

export function Refresh(props) {
  return <IconBase {...props}>
    <path d="M4 12a8 8 0 0 1 14.5-4.5"/>
    <path d="M20 12a8 8 0 0 1-14.5 4.5"/>
    <path d="M18.5 3v4.5H14"/>
    <path d="M5.5 21v-4.5H10"/>
  </IconBase>;
}

export function Settings(props) {
  return <IconBase {...props}>
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 3.5v2.3M12 18.2v2.3M20.5 12h-2.3M5.8 12H3.5M17.8 6.2l-1.6 1.6M7.8 16.2l-1.6 1.6M17.8 17.8l-1.6-1.6M7.8 7.8 6.2 6.2"/>
  </IconBase>;
}

export function Trash(props) {
  return <IconBase {...props}>
    <path d="M4.5 7h15M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2"/>
    <path d="M6.5 7 7.3 19a2 2 0 0 0 2 1.8h5.4a2 2 0 0 0 2-1.8L17.5 7"/>
    <path d="M10.2 11v6M13.8 11v6"/>
  </IconBase>;
}

export function Lock(props) {
  return <IconBase {...props}>
    <rect x="5" y="10.5" width="14" height="10" rx="2"/>
    <path d="M7.5 10.5V7.8a4.5 4.5 0 0 1 9 0v2.7"/>
  </IconBase>;
}

export function Bell(props) {
  return <IconBase {...props}>
    <path d="M6 10.5a6 6 0 0 1 12 0c0 4 1.2 5.2 1.5 5.8H4.5c.3-.6 1.5-1.8 1.5-5.8Z"/>
    <path d="M10 19.5a2 2 0 0 0 4 0"/>
  </IconBase>;
}

export function Phone(props) {
  return <IconBase {...props}>
    <rect x="6.5" y="2.5" width="11" height="19" rx="2.2"/>
    <path d="M11 18.5h2"/>
  </IconBase>;
}

export function Target(props) {
  return <IconBase {...props}>
    <circle cx="12" cy="12" r="9"/>
    <circle cx="12" cy="12" r="5"/>
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>
  </IconBase>;
}

export function Leaf(props) {
  return <IconBase {...props}>
    <path d="M20 4.5c.6 8-3.7 14-11 14H5.5C5 12 10 5 20 4.5Z"/>
    <path d="M6.5 20c2.5-4.5 5.6-7.6 10-9.8"/>
  </IconBase>;
}

export function Flower(props) {
  return <IconBase {...props}>
    <circle cx="12" cy="12" r="2.4"/>
    <path d="M12 3.5a3 3 0 0 1 3 3v.5a3 3 0 0 1-3 3 3 3 0 0 1-3-3v-.5a3 3 0 0 1 3-3Z"/>
    <path d="M20.5 12a3 3 0 0 1-3 3h-.5a3 3 0 0 1-3-3 3 3 0 0 1 3-3h.5a3 3 0 0 1 3 3Z"/>
    <path d="M12 20.5a3 3 0 0 1-3-3v-.5a3 3 0 0 1 3-3 3 3 0 0 1 3 3v.5a3 3 0 0 1-3 3Z"/>
    <path d="M3.5 12a3 3 0 0 1 3-3h.5a3 3 0 0 1 3 3 3 3 0 0 1-3 3h-.5a3 3 0 0 1-3-3Z"/>
  </IconBase>;
}

export function User(props) {
  return <IconBase {...props}>
    <circle cx="12" cy="8" r="3.8"/>
    <path d="M4.5 20c0-3.6 3.1-6 7.5-6s7.5 2.4 7.5 6"/>
  </IconBase>;
}

export function Party(props) {
  return <IconBase {...props}>
    <path d="M4 20 15 9M4 20l3-8.5L14.5 4l1 4.5L20 9.7 13 16"/>
    <path d="M14.5 4v.01M20 9.7v.01M9.5 6.5v.01"/>
  </IconBase>;
}

export function Smile(props) {
  return <IconBase {...props}>
    <circle cx="12" cy="12" r="9"/>
    <path d="M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8"/>
    <path d="M8.7 9.5v.01M15.3 9.5v.01"/>
  </IconBase>;
}

export function Meh(props) {
  return <IconBase {...props}>
    <circle cx="12" cy="12" r="9"/>
    <path d="M8.5 15h7"/>
    <path d="M8.7 9.5v.01M15.3 9.5v.01"/>
  </IconBase>;
}

export function Frown(props) {
  return <IconBase {...props}>
    <circle cx="12" cy="12" r="9"/>
    <path d="M8.5 16.3c1-1.2 2.2-1.8 3.5-1.8s2.5.6 3.5 1.8"/>
    <path d="M8.7 9.5v.01M15.3 9.5v.01"/>
  </IconBase>;
}

// Vientisos spalvos taškas (šviesoforo/statuso indikatorius) — ne linijinė ikona sąmoningai.
export function Dot({ size = "0.6em", color = "currentColor", style }) {
  return <span style={{ display:"inline-block", width:size, height:size, borderRadius:"50%", background:color, flexShrink:0, ...style }} />;
}

export function Eye(props) {
  return <IconBase {...props}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/>
    <circle cx="12" cy="12" r="3"/>
  </IconBase>;
}

export function EyeOff(props) {
  return <IconBase {...props}>
    <path d="M3 3l18 18"/>
    <path d="M10.6 5.6A10.6 10.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.6 17.6 0 0 1-3.2 4.1M6.6 6.8C4 8.6 2.5 12 2.5 12S6 18.5 12 18.5a9.6 9.6 0 0 0 3.5-.65"/>
    <path d="M14.1 14.1a3 3 0 0 1-4.2-4.2"/>
  </IconBase>;
}