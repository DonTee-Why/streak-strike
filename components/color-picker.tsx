"use client";

const COLORS = ["#D4A373", "#6C8B4D", "#4D7A9B", "#B56576", "#8C6A5D", "#3A5A40"];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          aria-label={`Choose ${color}`}
          className={`h-8 w-8 rounded-full border-2 ${value === color ? "border-ink" : "border-transparent"}`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
