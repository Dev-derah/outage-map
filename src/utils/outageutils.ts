import { dummyOutages } from "@/data/dummyOutages";

// Helper function to get outages by type
export const getOutagesByType = (type: "Power" | "Internet" | "Water") => {
  return dummyOutages.filter((outage) => outage.type === type);
};

// Helper function to get outages by status
export const getOutagesByStatus = (status: "active" | "resolved") => {
  return dummyOutages.filter((outage) => outage.status === status);
};

// Helper function to get outages by severity
export const getOutagesBySeverity = (severity: "high" | "medium" | "low") => {
  return dummyOutages.filter((outage) => outage.severity === severity);
};

// Helper function to get outages by time period
export const getOutagesByTimePeriod = (days: number) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return dummyOutages.filter((outage) => {
    const reportedDate = new Date(outage.reportedAt);
    return reportedDate >= cutoffDate;
  });
};

// Helper function to calculate outage metrics
export const getOutageMetrics = () => {
  const powerOutages = getOutagesByType("Power");
  const internetOutages = getOutagesByType("Internet");
  const waterOutages = getOutagesByType("Water");
  const activeOutages = getOutagesByStatus("active");
  const resolvedOutages = getOutagesByStatus("resolved");

  return {
    total: dummyOutages.length,
    power: powerOutages.length,
    internet: internetOutages.length,
    water: waterOutages.length,
    active: activeOutages.length,
    resolved: resolvedOutages.length,
  };
};

// Function to find outages near a location
export const findOutagesNearLocation = (
  lat: number,
  lng: number,
  radiusKm: number = 50
) => {
  // Calculate distance between two points using Haversine formula
  const getDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // Radius of the earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return dummyOutages.filter((outage) => {
    const distance = getDistance(lat, lng, outage.lat, outage.lng);
    return distance <= radiusKm;
  });
};

 // utils/outageUtils.ts
import { Outage } from "@/types";

export const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  // Convert degrees to radians
  const R = 6371; // Earth radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * 
    Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 100) / 100; // Round to 2 decimal places
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const filterOutages = (outages: Outage[], filters: any): Outage[] => {
  const now = new Date();
  
  return outages.filter(outage => {
    // Filter by outage type
    if (!filters.outageTypes[outage.type.toLowerCase()]) return false;

    // Filter by timeframe
    const reportedDate = new Date(outage.reportedAt);
    switch (filters.timeframe) {
      case "today":
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (reportedDate < yesterday) return false;
        break;
      case "week":
        const lastWeek = new Date(now);
        lastWeek.setDate(now.getDate() - 7);
        if (reportedDate < lastWeek) return false;
        break;
      case "all":
      default:
        break;
    }

    // Filter by status
    if (filters.status !== "all" && outage.status !== filters.status) return false;

    // Filter by severity
    if (filters.severity !== "all" && outage.severity !== filters.severity) return false;

    return true;
  });
};
