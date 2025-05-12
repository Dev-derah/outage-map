'use client'
import Map from "@/components/Map";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useState } from "react";
import { Outage } from "@/types";


export default function HomePage() {
  const [filteredOutages, setFilteredOutages] = useState<Outage[]>([]);
  const [selectedOutage, setSelectedOutage] = useState<Outage | null>(null);

  return (
    <main className="flex h-screen w-screen flex-col bg-gray-900 text-white">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar outages={filteredOutages} selectedOutage={selectedOutage} />
        <div className="relative flex-1">
          <Map
            onOutagesUpdate={setFilteredOutages}
            onOutageSelect={setSelectedOutage}
            selectedOutage={selectedOutage}
          />
        </div>
      </div>
    </main>
  );
}
