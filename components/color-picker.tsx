"use client";

const COLORS = [
  "#D4A373",
  "#C97A40",
  "#B56576",
  "#9D4EDD",
  "#6C8B4D",
  "#2A9D8F",
  "#4D7A9B",
  "#577590",
  "#8C6A5D",
  "#3A5A40",
  "#E9C46A",
  "#F4A261",
  "#E76F51",
  "#C44536",
  "#355070",
  "#6D597A",
  "#118AB2",
  "#073B4C",
];

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
