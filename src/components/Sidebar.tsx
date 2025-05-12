/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Menu,
  X,
  Filter,
  Clock,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Outage } from "@/types";
import { filterOutages, haversineDistance } from "@/utils/outageutils";


interface SidebarProps {
  outages: Outage[];
  selectedOutage: Outage | null;
}

export default function Sidebar({ outages, selectedOutage }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    outageTypes: {
      power: true,
      internet: true,
      water: true,
    },
    timeframe: "all",
    status: "all",
    severity: "all",
  });
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "filters"
  );
  const [currentView, setCurrentView] = useState<"area" | "specific">("area");
  const [locationScope, setLocationScope] = useState<string>("Current Area");

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };
  // Calculate metrics helper
  const calculateMetrics = (outages: Outage[]) => ({
    total: outages.length,
    power: outages.filter((o) => o.type === "Power").length,
    internet: outages.filter((o) => o.type === "Internet").length,
    water: outages.filter((o) => o.type === "Water").length,
    active: outages.filter((o) => o.status === "active").length,
    resolved: outages.filter((o) => o.status === "resolved").length,
    highSeverity: outages.filter((o) => o.severity === "high").length,
    mediumSeverity: outages.filter((o) => o.severity === "medium").length,
    lowSeverity: outages.filter((o) => o.severity === "low").length,
  });

const outageMetrics = useMemo(() => {
  return {
    total: 0,
    power: 0,
    internet: 0,
    water: 0,
    active: 0,
    resolved: 0,
    highSeverity: 0,
    mediumSeverity: 0,
    lowSeverity: 0,
  };
}, []);

  const handleFilterChange = (
    category: keyof typeof activeFilters,
    value: string
  ) => {
    if (category === "outageTypes") {
      setActiveFilters((prev) => ({
        ...prev,
        outageTypes: {
          ...prev.outageTypes,
          [value]: !prev.outageTypes[value as keyof typeof prev.outageTypes],
        },
      }));
    } else {
      setActiveFilters((prev) => ({
        ...prev,
        [category]: value,
      }));
    }
  };
  // Recent outages based on view
const recentOutages = useMemo(() => {
  return [];
}, []);

  // Update view based on selection
  useEffect(() => {
    if (selectedOutage) {
      const isSpecific = /\d+/.test(selectedOutage.address || "");
      setCurrentView(isSpecific ? "specific" : "area");
      setLocationScope(selectedOutage.address || "Selected Location");
    } else {
      setCurrentView("area");
      setLocationScope("Current Area");
    }
  }, [selectedOutage]);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden absolute top-20 left-4 z-30 p-2 bg-gray-800 text-white rounded-md shadow-md"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <aside
        className={`bg-gray-950 border-r border-gray-800 z-20 overflow-y-auto h-full w-80 transform transition-transform duration-300 md:translate-x-0 md:static absolute top-0 left-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Collapsible Filters Section */}
          <div className="border-b border-gray-800">
            <button
              className="w-full p-4 flex justify-between items-center text-left"
              onClick={() => toggleSection("filters")}
            >
              <div className="flex items-center">
                <Filter size={16} className="mr-2" />
                <span className="font-semibold">Filters</span>
              </div>
              {expandedSection === "filters" ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </button>

            {expandedSection === "filters" && (
              <div className="px-4 pb-4">
                {/* Outage Type Filters */}
                <div className="mb-4">
                  <h4 className="text-sm text-gray-400 mb-2">Outage Type</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={activeFilters.outageTypes.power}
                        onChange={() =>
                          handleFilterChange("outageTypes", "power")
                        }
                        className="mr-2 rounded text-blue-500 focus:ring-blue-500 focus:ring-opacity-50 bg-gray-700 border-gray-600"
                      />
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                      Power
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={activeFilters.outageTypes.internet}
                        onChange={() =>
                          handleFilterChange("outageTypes", "internet")
                        }
                        className="mr-2 rounded text-blue-500 focus:ring-blue-500 focus:ring-opacity-50 bg-gray-700 border-gray-600"
                      />
                      <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                      Internet
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={activeFilters.outageTypes.water}
                        onChange={() =>
                          handleFilterChange("outageTypes", "water")
                        }
                        className="mr-2 rounded text-blue-500 focus:ring-blue-500 focus:ring-opacity-50 bg-gray-700 border-gray-600"
                      />
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                      Water
                    </label>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Outage Summary */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-semibold text-white flex items-center">
                <Info size={16} className="mr-2" /> Outage Summary
              </h3>
              <span className="bg-blue-500 px-2 py-1 rounded-md text-xs font-medium">
                {outageMetrics.total} Total
              </span>
            </div>
            {/* <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-gray-800 p-2 rounded-md">
                <div className="text-xs text-gray-400">Power</div>
                <div className="text-md font-semibold flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  {outageMetrics.power}
                </div>
              </div>
              <div className="bg-gray-800 p-2 rounded-md">
                <div className="text-xs text-gray-400">Internet</div>
                <div className="text-md font-semibold flex items-center">
                  <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                  {outageMetrics.internet}
                </div>
              </div>
              <div className="bg-gray-800 p-2 rounded-md">
                <div className="text-xs text-gray-400">Water</div>
                <div className="text-md font-semibold flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  {outageMetrics.water}
                </div>
              </div>
              <div className="bg-gray-800 p-2 rounded-md">
                <div className="text-xs text-gray-400">Status</div>
                <div className="text-md font-semibold flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  {outageMetrics.active} Active / {outageMetrics.resolved}{" "}
                  Resolved
                </div>
              </div>
            </div> */}
            <div className="bg-gray-800 p-2 rounded-md">
              <div className="text-xs text-gray-400">Power</div>
              <div className="text-md font-semibold flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                {outageMetrics.power}
                <div className="ml-auto flex gap-1 text-xs">
                  <span className="text-red-400">
                    ↑{outageMetrics.highSeverity}
                  </span>
                  <span className="text-yellow-400">
                    →{outageMetrics.mediumSeverity}
                  </span>
                  <span className="text-green-400">
                    ↓{outageMetrics.lowSeverity}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Reports */}
          <div className="border-b border-gray-800">
            <button
              className="w-full p-4 flex justify-between items-center text-left"
              onClick={() => toggleSection("recent")}
            >
              <div className="flex items-center">
                <Clock size={16} className="mr-2" />
                <span className="font-semibold">Recent Reports</span>
              </div>
              {expandedSection === "recent" ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </button>

            {expandedSection === "recent" && (
              <div className="px-4 pb-4 space-y-3">
                {/* <div className="bg-gray-800 p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                      <span className="font-medium">Power Outage</span>
                    </div>
                    <span className="text-xs text-gray-400">2h ago</span>
                  </div>
                  <p className="text-sm mt-1 text-gray-300">
                    Downtown area affected by transformer failure
                  </p>
                </div> */}

              </div>
            )}
          </div>

          {/* Legend */}
          <div className="p-4 mt-auto">
            <h4 className="text-sm text-gray-400 mb-2">Legend</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <span className="text-sm">Power Outage</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                <span className="text-sm">Internet Outage</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-sm">Water Outage</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm">Resolved</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
