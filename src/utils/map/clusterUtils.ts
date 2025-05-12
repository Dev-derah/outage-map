import { Outage } from "@/types";

export const convertOutagesToGeoJSON = (
  outages: Outage[]
): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: outages.map((outage) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [outage.lng, outage.lat],
    },
    properties: {
      id: outage.id,
      type: outage.type,
      description: outage.description,
      severity: outage.severity,
    },
  })),
});
