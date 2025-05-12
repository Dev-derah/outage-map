"use client";

export default function LegendKey() {
  return (
    <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-3 text-sm space-y-1">
      <div className="font-semibold mb-1">Outage Key</div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-red-500 rounded-full" /> <span>Power</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-orange-500 rounded-full" />{" "}
        <span>Internet</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-blue-500 rounded-full" /> <span>Water</span>
      </div>
    </div>
  );
}
