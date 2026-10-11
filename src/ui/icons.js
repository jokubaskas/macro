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
