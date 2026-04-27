import { useEffect, useRef } from "react"

export interface GearDef {
  teeth: number
  radius: number // visual radius in px
  label: string
  color: string
}

interface GearCanvasProps {
  gears: GearDef[]
  inputRpm: number
  solved: boolean
}

const TOOTH_DEPTH = 0.14 // fraction of radius
const NUM_SPOKES = 5

function computeSpeeds(gears: GearDef[], inputRpm: number): number[] {
  const speeds: number[] = [inputRpm]
  let lastTeeth = gears[0].teeth

  for (let i = 1; i < gears.length; i++) {
    const teeth = gears[i].teeth

    if (i === gears.length - 1) {
      // Output gear always meshes with the previous driven gear
      speeds.push(Math.abs(speeds[i - 1]) * (lastTeeth / teeth))
    } else if (i % 2 === 1) {
      // Every odd-indexed gear in the chain meshes with the previous axle
      speeds.push(Math.abs(speeds[i - 1]) * (lastTeeth / teeth))
      lastTeeth = teeth
    } else {
      // Every even-indexed gear after the driver is fixed to the previous axle
      speeds.push(Math.abs(speeds[i - 1]))
      lastTeeth = teeth
    }
  }

  return speeds
}

function computeDirections(gears: GearDef[]): number[] {
  const dirs: number[] = [1]
  for (let i = 1; i < gears.length; i++) {
    if (i === gears.length - 1) {
      dirs.push(-dirs[i - 1])
    } else if (i % 2 === 1) {
      dirs.push(-dirs[i - 1])
    } else {
      dirs.push(dirs[i - 1])
    }
  }
  return dirs
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`
}

function lightenColor(hex: string, amount: number) { return adjustColor(hex, amount) }
function darkenColor(hex: string, amount: number) { return adjustColor(hex, -amount) }

export default function GearCanvas({ gears, inputRpm, solved }: GearCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const anglesRef = useRef<number[]>([])

  // Keep latest values in refs so the animation loop always reads current data
  const gearsRef = useRef<GearDef[]>(gears)
  const inputRpmRef = useRef(inputRpm)
  const solvedRef = useRef(solved)

  // Sync refs on every render — no re-subscription of the rAF loop needed
  useEffect(() => {
    gearsRef.current = gears
    inputRpmRef.current = inputRpm
    solvedRef.current = solved

    // Resize angles array when gear count changes, preserving existing angles
    if (anglesRef.current.length !== gears.length) {
      const next = gears.map((_, i) => anglesRef.current[i] ?? 0)
      anglesRef.current = next
    }
  })

  // Start the animation loop once on mount, cancel on unmount
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = typeof window !== "undefined" ? Math.max(1, window.devicePixelRatio || 1) : 1

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resizeCanvas()
    const resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(canvas)

    let lastTime: number | null = null

    function draw(timestamp: number) {
      if (!ctx || !canvas) return

      // Always read from refs so we have the latest gears/rpm/solved
      const currentGears = gearsRef.current
      const currentInputRpm = inputRpmRef.current
      const currentSolved = solvedRef.current

      if (currentGears.length === 0) {
        animRef.current = requestAnimationFrame(draw)
        return
      }

      const dt = lastTime === null ? 0 : (timestamp - lastTime) / 1000
      lastTime = timestamp

      const speeds = computeSpeeds(currentGears, currentInputRpm)
      const directions = computeDirections(currentGears)

      // Update angles: RPM -> rad/s = rpm * 2π / 60
      for (let i = 0; i < currentGears.length; i++) {
        if (anglesRef.current[i] === undefined) anglesRef.current[i] = 0
        const dir = directions[i]
        anglesRef.current[i] += dir * speeds[i] * ((2 * Math.PI) / 60) * dt
      }

      const W = canvas.clientWidth
      const H = canvas.clientHeight

      ctx.clearRect(0, 0, W, H)

      // Green backdrop when solved
      if (currentSolved) {
        ctx.save()
        ctx.globalAlpha = 0.08
        ctx.fillStyle = "#22c55e"
        ctx.fillRect(0, 0, W, H)
        ctx.restore()
      }

      // Layout: place gears so adjacent teeth mesh (centre-to-centre = r1 + r2), then scale to fit
      const padding = 48
      const positions: { x: number; y: number }[] = []
      let curX = padding + currentGears[0].radius
      positions.push({ x: curX, y: H / 2 })
      for (let i = 1; i < currentGears.length; i++) {
        curX += currentGears[i - 1].radius + currentGears[i].radius
        positions.push({ x: curX, y: H / 2 })
      }

      const lastX = positions[currentGears.length - 1].x + currentGears[currentGears.length - 1].radius
      const scale = lastX > W - padding ? (W - padding * 2) / (lastX - padding) : 1
      const sp = positions.map((p) => ({ x: padding + (p.x - padding) * scale, y: p.y }))
      const sr = currentGears.map((g) => g.radius * scale)

      // Axle line
      if (currentGears.length > 1) {
        ctx.save()
        ctx.strokeStyle = "rgba(120,120,120,0.18)"
        ctx.lineWidth = 2
        ctx.setLineDash([6, 6])
        ctx.beginPath()
        ctx.moveTo(sp[0].x, H / 2)
        ctx.lineTo(sp[currentGears.length - 1].x, H / 2)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()
      }

      const isDark =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches

      for (let i = 0; i < currentGears.length; i++) {
        const { x, y } = sp[i]
        const radius = sr[i]
        const angle = anglesRef.current[i] ?? 0
        const color = currentGears[i].color
        const isEndpoint = i === 0 || i === currentGears.length - 1
        const isOutput = i === currentGears.length - 1 && currentGears.length > 1

        const teeth = currentGears[i].teeth
        const inner = radius * (1 - TOOTH_DEPTH)
        const outer = radius * (1 + TOOTH_DEPTH)
        const angleStep = (2 * Math.PI) / teeth
        const toothWidth = 0.35

        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle)

        // Gear body path
        ctx.beginPath()
        for (let t = 0; t < teeth; t++) {
          const base = t * angleStep
          const rise = base + angleStep * (0.5 - toothWidth / 2)
          const fall = base + angleStep * (0.5 + toothWidth / 2)

          if (t === 0) ctx.moveTo(inner * Math.cos(base), inner * Math.sin(base))
          else ctx.lineTo(inner * Math.cos(base), inner * Math.sin(base))

          ctx.lineTo(inner * Math.cos(rise), inner * Math.sin(rise))
          ctx.lineTo(outer * Math.cos(rise), outer * Math.sin(rise))
          ctx.lineTo(outer * Math.cos(fall), outer * Math.sin(fall))
          ctx.lineTo(inner * Math.cos(fall), inner * Math.sin(fall))
        }
        ctx.closePath()

        const baseColor = currentSolved && isOutput ? "#22c55e" : color
        const grad = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, outer)
        grad.addColorStop(0, lightenColor(baseColor, 40))
        grad.addColorStop(1, baseColor)
        ctx.fillStyle = grad
        ctx.fill()
        ctx.strokeStyle = currentSolved && isOutput ? "#16a34a" : darkenColor(baseColor, 30)
        ctx.lineWidth = isEndpoint ? 3 : 2
        ctx.stroke()

        // Hub
        ctx.beginPath()
        ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2)
        ctx.fillStyle = currentSolved && isOutput ? "#16a34a" : darkenColor(baseColor, 20)
        ctx.fill()
        ctx.strokeStyle = currentSolved && isOutput ? "#15803d" : darkenColor(baseColor, 40)
        ctx.lineWidth = 2
        ctx.stroke()

        // Spokes
        ctx.strokeStyle = darkenColor(baseColor, 20)
        ctx.lineWidth = Math.max(2, radius * 0.06)
        for (let s = 0; s < NUM_SPOKES; s++) {
          const a = (s / NUM_SPOKES) * Math.PI * 2
          ctx.beginPath()
          ctx.moveTo(radius * 0.22 * Math.cos(a), radius * 0.22 * Math.sin(a))
          ctx.lineTo(inner * 0.85 * Math.cos(a), inner * 0.85 * Math.sin(a))
          ctx.stroke()
        }

        // Centre dot
        ctx.beginPath()
        ctx.arc(0, 0, radius * 0.07, 0, Math.PI * 2)
        ctx.fillStyle = "#fff"
        ctx.fill()

        ctx.restore()

        // Labels (drawn in canvas space, not rotated)
        const labelColor = currentSolved && isOutput ? "#16a34a" : isDark ? "#e5e7eb" : "#1a1a1a"
        const rpmColor = currentSolved && isOutput ? "#16a34a" : isDark ? "#9ca3af" : "#666"
        const labelY = y + outer + 18

        ctx.save()
        ctx.textAlign = "center"
        ctx.font = `bold ${Math.max(11, Math.min(14, radius * 0.35))}px sans-serif`
        ctx.fillStyle = labelColor
        ctx.fillText(currentGears[i].label, x, labelY)

        ctx.font = `${Math.max(10, Math.min(12, radius * 0.28))}px sans-serif`
        ctx.fillStyle = rpmColor
        ctx.fillText(`${speeds[i].toFixed(1)} RPM`, x, labelY + 15)

        ctx.font = `bold 10px sans-serif`
        if (i === 0) {
          ctx.fillStyle = isDark ? "#9ca3af" : "#888"
          ctx.fillText("DRIVER", x, labelY + 28)
        } else if (isOutput) {
          ctx.fillStyle = currentSolved ? "#22c55e" : isDark ? "#9ca3af" : "#888"
          ctx.fillText(currentSolved ? "TARGET MET" : "OUTPUT", x, labelY + 28)
        }

        ctx.restore()
      }

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animRef.current)
      resizeObserver.disconnect()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // empty deps — loop runs forever, reads latest values via refs

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={280}
      className="w-full rounded-xl"
      style={{ width: "100%", height: "auto", minHeight: 290, aspectRatio: "800 / 280" }}
      aria-label="Animated gear chain visualisation"
    />
  )
}
