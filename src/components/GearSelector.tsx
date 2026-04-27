import { Trash2, ArrowRight } from "lucide-react"

export const AVAILABLE_GEARS = [
  { teeth: 8,  radius: 28, label: "8T",  color: "#e07b39" },
  { teeth: 12, radius: 36, label: "12T", color: "#e07b39" },
  { teeth: 16, radius: 44, label: "16T", color: "#e07b39" },
  { teeth: 20, radius: 52, label: "20T", color: "#e07b39" },
  { teeth: 24, radius: 60, label: "24T", color: "#e07b39" },
  { teeth: 32, radius: 72, label: "32T", color: "#e07b39" },
  { teeth: 40, radius: 84, label: "40T", color: "#e07b39" },
  { teeth: 48, radius: 96, label: "48T", color: "#e07b39" },
] as const

export type AvailableGear = (typeof AVAILABLE_GEARS)[number]

interface GearSelectorProps {
  chain: AvailableGear[]
  onChange: (chain: AvailableGear[]) => void
  driverTeeth: number
  outputTeeth: number
}

export default function GearSelector({ chain, onChange, driverTeeth, outputTeeth }: GearSelectorProps) {
  const addGear = (gear: AvailableGear) => {
    onChange([...chain, gear])
  }

  const removeGear = (index: number) => {
    const next = [...chain]
    next.splice(index, 1)
    onChange(next)
  }

  return (
    <div className="space-y-5">
      {/* Current chain */}
      <div>
        <div className="flex items-center gap-2 flex-wrap min-h-14 bg-muted/40 rounded-xl px-4 py-3 border border-border">
          {/* Driver (fixed) */}
          <GearChip teeth={driverTeeth} color="#2d7a9e" label="Driver" fixed />

          {chain.length === 0 && (
            <span className="text-xs text-muted-foreground italic px-2">
              Add intermediate gears below, or connect directly
            </span>
          )}

          {chain.map((g, i) => (
            <div key={i} className="flex items-center gap-1">
              <ArrowIcon />
              <GearChip
                teeth={g.teeth}
                color={g.color}
                label={g.label}
                onRemove={() => removeGear(i)}
              />
            </div>
          ))}

          {/* Output (fixed) */}
          <div className="flex items-center gap-1">
            <ArrowIcon />
            <GearChip teeth={outputTeeth} color="#2d7a9e" label="Output" fixed />
          </div>
        </div>
      </div>

      {/* Gear palette */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Available Gears — click to add
        </p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {AVAILABLE_GEARS.map((gear) => (
            <button
              type="button"
              key={gear.teeth}
              onClick={() => addGear(gear)}
              className="flex min-h-20 flex-col items-center justify-center gap-1.5 p-2 rounded-xl border border-border hover:border-gear-orange hover:bg-muted/60 transition-all group cursor-pointer focus:outline-none focus:ring-2 focus:ring-gear-orange/30"
              title={`Add ${gear.label} gear`}
              aria-label={`Add ${gear.label} intermediate gear`}
            >
              <GearIcon size={28} color={gear.color} />
              <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                {gear.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {chain.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-gear-orange/30 rounded-md px-1"
          aria-label="Clear all intermediate gears"
        >
          <Trash2 size={12} />
          Clear all intermediate gears
        </button>
      )}
    </div>
  )
}

function ArrowIcon() {
  return <ArrowRight size={14} className="text-muted-foreground shrink-0" />
}

interface GearChipProps {
  teeth: number
  color: string
  label: string
  fixed?: boolean
  onRemove?: () => void
}

function GearChip({ teeth, color, label, fixed, onRemove }: GearChipProps) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border shrink-0"
      style={{
        backgroundColor: `${color}22`,
        borderColor: `${color}66`,
        color: color,
      }}
    >
      <GearIcon size={14} color={color} />
      <span>{label}</span>
      {!fixed && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 rounded-full p-1 hover:bg-muted/60 hover:opacity-90 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-gear-orange/30"
          aria-label={`Remove ${label} gear`}
        >
          <Trash2 size={10} />
        </button>
      )}
    </div>
  )
}

function GearIcon({ size, color }: { size: number; color: string }) {
  const r = size / 2
  const inner = r * 0.65
  const outer = r * 0.95
  const teeth = 8
  const as = (2 * Math.PI) / teeth
  const tw = 0.4

  const points: string[] = []
  for (let i = 0; i < teeth; i++) {
    const b = i * as
    const rise = b + as * (0.5 - tw / 2)
    const fall = b + as * (0.5 + tw / 2)
    points.push(`${r + inner * Math.cos(b)},${r + inner * Math.sin(b)}`)
    points.push(`${r + inner * Math.cos(rise)},${r + inner * Math.sin(rise)}`)
    points.push(`${r + outer * Math.cos(rise)},${r + outer * Math.sin(rise)}`)
    points.push(`${r + outer * Math.cos(fall)},${r + outer * Math.sin(fall)}`)
    points.push(`${r + inner * Math.cos(fall)},${r + inner * Math.sin(fall)}`)
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <polygon points={points.join(" ")} fill={color} opacity={0.85} />
      <circle cx={r} cy={r} r={r * 0.28} fill={color} />
      <circle cx={r} cy={r} r={r * 0.12} fill="white" opacity={0.7} />
    </svg>
  )
}
