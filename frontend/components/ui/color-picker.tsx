"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

// Google Calendar predefined colors
const GOOGLE_CALENDAR_COLORS = [
  { id: '1', name: 'Lavender', hex: '#7986CB' },
  { id: '2', name: 'Sage', hex: '#33B679' },
  { id: '3', name: 'Grape', hex: '#8E24AA' },
  { id: '4', name: 'Flamingo', hex: '#E67C73' },
  { id: '5', name: 'Banana', hex: '#F6BF26' },
  { id: '6', name: 'Tangerine', hex: '#F4511E' },
  { id: '7', name: 'Peacock', hex: '#039BE5' },
  { id: '8', name: 'Graphite', hex: '#616161' },
  { id: '9', name: 'Blueberry', hex: '#3F51B5' },
  { id: '10', name: 'Basil', hex: '#0B8043' },
  { id: '11', name: 'Tomato', hex: '#D50000' },
]

interface ColorPickerProps {
  value?: string
  onChange?: (color: string) => void
  className?: string
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = React.useState(value || GOOGLE_CALENDAR_COLORS[0].hex)

  React.useEffect(() => {
    if (value) {
      setSelectedColor(value)
    }
  }, [value])

  const handleColorSelect = (hex: string) => {
    setSelectedColor(hex)
    onChange?.(hex)
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-6 gap-2">
        {GOOGLE_CALENDAR_COLORS.map((color) => {
          const isSelected = selectedColor.toLowerCase() === color.hex.toLowerCase()
          return (
            <button
              key={color.id}
              type="button"
              onClick={() => handleColorSelect(color.hex)}
              className={cn(
                "relative h-10 w-10 rounded-md border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isSelected ? "border-foreground shadow-md" : "border-border"
              )}
              style={{ backgroundColor: color.hex }}
              aria-label={`Select ${color.name} color`}
            >
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white drop-shadow-md" />
                </div>
              )}
            </button>
          )
        })}
      </div>
      {selectedColor && (
        <div className="flex items-center gap-2 text-sm">
          <div
            className="h-4 w-4 rounded border"
            style={{ backgroundColor: selectedColor }}
          />
          <span className="text-muted-foreground">
            {GOOGLE_CALENDAR_COLORS.find(c => c.hex.toLowerCase() === selectedColor.toLowerCase())?.name || 'Custom'}
          </span>
        </div>
      )}
    </div>
  )
}

