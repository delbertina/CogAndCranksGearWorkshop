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
