/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";
import mapboxgl, { Popup } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { dummyOutages } from "@/data/dummyOutages";
import { convertOutagesToGeoJSON } from "@/utils/map/clusterUtils";
import { haversineDistance } from "@/utils/map/geoUtils";
import { Outage,Location } from "@/types";
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;



export interface FiltersConfig {
  outageTypes?: { power: boolean; internet: boolean; water: boolean };
  timeframe?: string;
  status?: string;
  severity?: string;
}

export interface MapProps {
  onOutagesUpdate?: (outages: Outage[]) => void;
  onLocationSelect?: (location: Location) => void;
  selectedFilters?: FiltersConfig;
  onOutageSelect?: Dispatch<SetStateAction<Outage | null>>;
  selectedOutage:Outage | null;
}

export default function Map({
  onOutagesUpdate,
  onLocationSelect,
  selectedFilters,
  onOutageSelect,
  selectedOutage,
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<
    "granted" | "denied" | "prompt"
  >("prompt");
  const [isLocationPermissionModalOpen, setIsLocationPermissionModalOpen] =
    useState<boolean>(false);
  const [filteredOutages, setFilteredOutages] = useState<Outage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  console.log(selectedOutage);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPermission = sessionStorage.getItem("locationPermission") as
        | "granted"
        | "denied"
        | "prompt";
      setLocationPermissionStatus(storedPermission || "prompt");
    }
  }, []);

  const geocode = async (query: string) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();
      return data.features;
    } catch (error) {
      console.error("Geocoding error:", error);
      return [];
    }
  };

  const reverseGeocode = async (lng: number, lat: number) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();
      return data.features[0]?.place_name || "Unknown location";
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return "Unknown location";
    }
  };

  const filterOutages = useCallback(
    async (location?: Location) => {
      let filtered = [...dummyOutages];

      if (selectedFilters) {
        filtered = filtered.filter((outage) => {
          if (selectedFilters.outageTypes) {
            if (outage.type === "Power" && !selectedFilters.outageTypes.power)
              return false;
            if (
              outage.type === "Internet" &&
              !selectedFilters.outageTypes.internet
            )
              return false;
            if (outage.type === "Water" && !selectedFilters.outageTypes.water)
              return false;
          }
          return true;
        });
      }

      if (location) {
        filtered = await Promise.all(
          filtered.map(async (outage) => {
            const distance = haversineDistance(
              location.lat,
              location.lng,
              outage.lat,
              outage.lng
            );
            const address = await reverseGeocode(outage.lng, outage.lat);
            return { ...outage, distanceFromUser: distance, address };
          })
        );
      }

      return filtered;
    },
    [selectedFilters]
  );

  const requestLocationPermission = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;

    if (sessionStorage.getItem("locationPermission") === "granted") return;

    navigator.permissions?.query({ name: "geolocation" }).then((status) => {
      setLocationPermissionStatus(status.state);

      if (status.state === "granted") {
        sessionStorage.setItem("locationPermission", "granted");
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            const address = await reverseGeocode(longitude, latitude);
            const location = { lat: latitude, lng: longitude, address };
            setUserLocation(location);
            setSelectedLocation(location);
            setSearchInput(address);
            mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 12 });
            setIsLoading(false);
          },
          () => setIsLoading(false),
          { enableHighAccuracy: true }
        );
      } else if (status.state === "prompt") {
        setIsLocationPermissionModalOpen(true);
        setIsLoading(false);
      } else {
        sessionStorage.setItem("locationPermission", "denied");
        setIsLoading(false);
      }
    });
  }, []);
  const handleSearch = async (query: string) => {
    setSearchInput(query);
    if (query.length > 2) {
      const results = await geocode(query);
      setSearchResults(results);
    }
  };

  const handleLocationSelect = async (result: any) => {
    const [lng, lat] = result.center;
    const address = result.place_name;
    const newLocation = { lat, lng, address };

    setSelectedLocation(newLocation);
    setSearchInput(address);
    setSearchResults([]);

    if (mapRef.current) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 12 });
    }

    const outages = await filterOutages(newLocation);
    setFilteredOutages(outages);
    if (onOutagesUpdate) onOutagesUpdate(outages);
    if (onLocationSelect) onLocationSelect(newLocation);
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-98.35, 39.5],
      zoom: 3,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserLocation: true,
      }),
      "top-right"
    );

    mapRef.current = map;

    map.on("load", async () => {
      requestLocationPermission();

      const geojson = convertOutagesToGeoJSON(dummyOutages);

      map.addSource("outages", {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "outages",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#3b82f6",
          "circle-radius": ["step", ["get", "point_count"], 15, 10, 20, 50, 25],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#fff",
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "outages",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
      });

      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "outages",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "case",
            ["==", ["get", "status"], "resolved"],
            "#22c55e",
            ["==", ["get", "type"], "Power"],
            "#ef4444",
            ["==", ["get", "type"], "Internet"],
            "#f97316",
            ["==", ["get", "type"], "Water"],
            "#3b82f6",
            "#ffffff",
          ],
          "circle-opacity": 0.6,
          "circle-radius": 30,
          "circle-blur": 0.4,
          "circle-stroke-width": 0,
        },
      });

      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        const clusterId = features[0].properties?.cluster_id;
        (
          map.getSource("outages") as mapboxgl.GeoJSONSource
        ).getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.easeTo({
            center: (features[0].geometry as any).coordinates,
            zoom:0,
          });
        });
      });

      map.on("click", "unclustered-point", async (e) => {
        const feature = e.features?.[0];
        const coords = (feature?.geometry as any).coordinates;
        const outage = dummyOutages.find(
          (o) => o.lat === coords[1] && o.lng === coords[0]
        );

        if (selectedLocation && outage) {
          const distance = haversineDistance(
            selectedLocation.lat,
            selectedLocation.lng,
            outage.lat,
            outage.lng
          );

          new mapboxgl.Popup()
            .setLngLat(coords)
            .setHTML(
              `
              <div style="color: #111;">
                <strong>${outage.type} Outage</strong><br />
                ${outage.description}<br />
                Severity: ${outage.severity}<br />
                ${distance ? `Distance: ${distance.toFixed(1)}km` : ""}
              </div>
            `
            )
            .addTo(map);
        }
      });

      map.on("click", async (e) => {
        // Do NOT request geolocation here. Just reverse geocode the clicked point.
        const address = await reverseGeocode(e.lngLat.lng, e.lngLat.lat);
        const clickedLocation = {
          lng: e.lngLat.lng,
          lat: e.lngLat.lat,
          address,
        };

        setSelectedLocation(clickedLocation);
        setSearchInput(address);

        const nearbyOutages = await filterOutages(clickedLocation);
        setFilteredOutages(nearbyOutages);
        if (onOutagesUpdate) onOutagesUpdate(nearbyOutages);
        if (onLocationSelect) onLocationSelect(clickedLocation);
      });
    });
  }, [filterOutages, onOutagesUpdate, onLocationSelect, requestLocationPermission, selectedLocation]);

  return (
    <div className="w-full h-screen relative">
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-96">
        <div className="relative">
          <input
            type="text"
            placeholder="Search location..."
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2 rounded-lg shadow-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-12 w-full bg-gray-800 rounded-lg shadow-lg z-20">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleLocationSelect(result)}
                  className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors"
                >
                  {result.place_name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-xl shadow-lg"
      />

      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
            <p className="mt-2">Loading map...</p>
          </div>
        </div>
      )}

      {isLocationPermissionModalOpen && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg max-w-md">
            <h3 className="text-xl font-bold mb-4 text-white">
              Enable Location Services
            </h3>
            <p className="mb-6 text-gray-300">
              This app needs your location to show nearby utility outages.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                onClick={() => setIsLocationPermissionModalOpen(false)}
              >
                Skip
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
                onClick={() => {
                  setIsLocationPermissionModalOpen(false);
                  navigator.geolocation.getCurrentPosition(
                    async (position) => {
                      const userLat = position.coords.latitude;
                      const userLng = position.coords.longitude;
                      const address = await reverseGeocode(userLng, userLat);
                      const newLocation = {
                        lat: userLat,
                        lng: userLng,
                        address,
                      };
                      setSelectedLocation(newLocation);
                      setSearchInput(address);
                      if (mapRef.current) {
                        mapRef.current.flyTo({
                          center: [userLng, userLat],
                          zoom: 12,
                        });
                      }
                    },
                    () => {
                      setLocationPermissionStatus("denied");
                      sessionStorage.setItem("locationPermission", "denied");
                    },
                    { enableHighAccuracy: true }
                  );
                }}
              >
                Allow Location
              </button>
            </div>
          </div>
        </div>
      )}

      {locationPermissionStatus === "denied" && (
        <div className="absolute bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg">
          <p>Location access denied. Some features may be limited.</p>
          <button
            className="text-sm underline mt-1"
            onClick={() => requestLocationPermission()}
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
