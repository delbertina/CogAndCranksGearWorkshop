import { useState, useCallback, useMemo } from "react"
import { Info, RefreshCw, CheckCircle2 } from "lucide-react"
import GearSelector from "./GearSelector"
import { AVAILABLE_GEARS, type AvailableGear } from "../lib/consts"
import InfoModal from "./InfoModal"
import GearCanvas from "./GearCanvas"

// Puzzle definitions: [driverTeeth, outputTeeth, inputRpm, targetRpm]
const PUZZLES: Array<{ driverTeeth: number; outputTeeth: number; inputRpm: number; targetRpm: number; label: string }> = [
  { driverTeeth: 16, outputTeeth: 32, inputRpm: 60,  targetRpm: 15,   label: "Slow it down 4x" },
  { driverTeeth: 32, outputTeeth: 16, inputRpm: 30,  targetRpm: 60,   label: "Double the speed" },
  { driverTeeth: 24, outputTeeth: 24, inputRpm: 45,  targetRpm: 45,   label: "Same speed" },
  { driverTeeth: 8,  outputTeeth: 40, inputRpm: 100, targetRpm: 20,   label: "Reduce 5x" },
  { driverTeeth: 40, outputTeeth: 8,  inputRpm: 20,  targetRpm: 100,  label: "Speed up 5x" },
]

const DRIVER_COLOR = "#3d8fb5"
const OUTPUT_COLOR = "#2d7a9e"

const TOLERANCE = 0.5 // RPM tolerance for "solved"

export default function GearGame() {
  const [showInfo, setShowInfo] = useState(true)
  const [puzzleIndex, setPuzzleIndex] = useState(0)
  const [chain, setChain] = useState<AvailableGear[]>([])

  const puzzle = PUZZLES[puzzleIndex]

  const getPaletteRadius = (teeth: number) =>
    AVAILABLE_GEARS.find((gear) => gear.teeth === teeth)?.radius ?? 40 + teeth

  // Build full gear array: driver + intermediates + output
  const driverGear = useMemo(() => ({
    teeth: puzzle.driverTeeth,
    radius: getPaletteRadius(puzzle.driverTeeth),
    label: `${puzzle.driverTeeth}T`,
    color: DRIVER_COLOR,
  }), [puzzle.driverTeeth])

  const outputGear = useMemo(() => ({
    teeth: puzzle.outputTeeth,
    radius: getPaletteRadius(puzzle.outputTeeth),
    label: `${puzzle.outputTeeth}T`,
    color: OUTPUT_COLOR,
  }), [puzzle.outputTeeth])

  const allGears = useMemo(() => [driverGear, ...chain, outputGear], [driverGear, chain, outputGear])

  // Compute output speed using a simple compound gear train model.
  const outputRpm = useMemo(() => {
    let speed = puzzle.inputRpm
    const gears = allGears
    let lastTeeth = gears[0].teeth

    for (let i = 1; i < gears.length; i++) {
      const teeth = gears[i].teeth
      if (i === gears.length - 1) {
        speed *= lastTeeth / teeth
      } else if (i % 2 === 1) {
        speed *= lastTeeth / teeth
        lastTeeth = teeth
      } else {
        lastTeeth = teeth
      }
    }

    return speed
  }, [allGears, puzzle.inputRpm])

  const solved = Math.abs(outputRpm - puzzle.targetRpm) <= TOLERANCE

  const nextPuzzle = useCallback(() => {
    setChain([])
    setPuzzleIndex((i) => (i + 1) % PUZZLES.length)
  }, [])

  return (
    <>
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}

      <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
        {/* Header */}
        <header className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold font-serif text-gear-orange tracking-tight">Cog & Crank's</span>
            <span className="hidden sm:inline-block text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Gear Workshop
            </span>
          </div>
          <button
            onClick={() => setShowInfo(true)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted border border-border"
            aria-label="Show information about gear ratios"
          >
            <Info size={15} />
            How it works
          </button>
        </header>

        <main className="flex-1 flex flex-col gap-3 p-4 sm:p-6 max-w-5xl mx-auto w-full">
          {/* Puzzle card */}
          <div className={`rounded-2xl border p-5 transition-all duration-500 ${solved
            ? "border-green-500 bg-green-50 dark:bg-green-950/20"
            : "border-border bg-card"}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                  Puzzle {puzzleIndex + 1} of {PUZZLES.length}
                </p>
                <h1 className="text-xl font-bold text-foreground text-balance">{puzzle.label}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Driver: <strong>{puzzle.driverTeeth}T</strong> at <strong>{puzzle.inputRpm} RPM</strong>
                  {" "}&rarr; Get output to <strong className="text-gear-orange">{puzzle.targetRpm} RPM</strong>
                </p>
              </div>

              {solved ? (
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="flex items-center gap-2 text-green-600 font-bold text-lg animate-bounce">
                    <CheckCircle2 size={24} />
                    Solved!
                  </div>
                  <button
                    onClick={nextPuzzle}
                    className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-semibold transition-colors"
                    style={{ backgroundColor: "var(--gear-orange)", color: "#fff" }}
                  >
                    <RefreshCw size={14} />
                    Next Puzzle
                  </button>
                </div>
              ) : (
                <div className="shrink-0 text-right">
                  <div className="text-3xl font-mono font-bold text-foreground">
                    {outputRpm.toFixed(1)}
                    <span className="text-base font-normal text-muted-foreground ml-1">RPM</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    current output / target: <span className="font-semibold text-gear-orange">{puzzle.targetRpm}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Gear visualisation */}
          <div className="bg-card border border-border rounded-2xl p-4 overflow-hidden min-h-80">
            <GearCanvas gears={allGears} inputRpm={puzzle.inputRpm} solved={solved} />
          </div>

          {/* Gear selector */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <GearSelector
              chain={chain}
              onChange={setChain}
            />
          </div>
        </main>
      </div>
    </>
  )
}

