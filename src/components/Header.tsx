"use client";

export default function Header() {
  return (
    <header className="w-full px-6 py-4 bg-gray-950 border-b border-gray-800 shadow-md z-20">
      <h1 className="text-2xl font-bold text-white">OutageMap</h1>
      <p className="text-sm text-gray-400">
        Real-time local utility outage tracker
      </p>
    </header>
  );
}
