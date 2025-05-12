"use client";
import { useState } from "react";

export default function FilterPanel() {
  const [type, setType] = useState("All");

  return (
    <div className="absolute top-4 left-4 z-10 p-4 rounded-xl shadow-md">
      <label className="block text-sm font-semibold mb-2">Filter by Type</label>
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="w-full border px-2 py-1 rounded"
      >
        <option>All</option>
        <option>Power</option>
        <option>Internet</option>
        <option>Water</option>
      </select>
    </div>
  );
}
