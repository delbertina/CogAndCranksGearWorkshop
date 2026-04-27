import { useEffect, useRef } from "react"
import { X } from "lucide-react"

interface InfoModalProps {
  onClose: () => void
}

export default function InfoModal({ onClose }: InfoModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-title"
    >
      <div className="relative bg-card text-card-foreground rounded-2xl shadow-2xl max-w-xl w-full p-8 border border-border">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h2 id="info-title" className="text-2xl font-bold mb-4 text-gear-orange font-serif">
          How Gear Ratios Work
        </h2>

        <div className="space-y-4 text-sm leading-relaxed text-foreground font-sans">
          <p>
            A <strong>gear ratio</strong> describes how the speed of one gear relates to another. When two gears mesh
            together, the smaller gear spins faster and the larger gear spins slower.
          </p>

          <p>
            The rule is simple: if Gear A has <em>N</em> teeth and Gear B has <em>M</em> teeth, then for every full
            rotation of A, Gear B completes <em>N / M</em> rotations.
          </p>

          <div className="bg-muted rounded-lg p-4 font-mono text-xs text-center">
            Output Speed = Input Speed &times; (Driver Teeth / Driven Teeth)
          </div>

          <p>
            In this app, intermediate gears form a compound train. Each pair of intermediate gears shares an axle:
            one gear meshes with the previous axle, and the next gear is fixed to it.
          </p>

          <p>
            This lets intermediate gears change the overall speed, not just the direction. Use pairs of gears to
            boost or reduce the output speed between the driver and the final output gear.
          </p>

          <p>
            Note: adjacent meshing gears spin in <strong>opposite directions</strong>, while gears fixed together on
            the same axle spin in the same direction.
          </p>

          <hr className="border-border" />

          <p className="font-semibold text-gear-teal">Your Challenge</p>
          <p>
            A <strong>driver gear</strong> on the left spins at a fixed input speed. Your goal is to assemble a chain
            of intermediate gears so that the final <strong>output gear</strong> on the right reaches the target speed
            shown. Pick any number of gears and any sizes — keep experimenting until it lights up green!
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 rounded-lg font-semibold text-sm transition-colors"
          style={{ backgroundColor: "var(--gear-orange)", color: "#fff" }}
        >
          Start Experimenting
        </button>
      </div>
    </div>
  )
}
