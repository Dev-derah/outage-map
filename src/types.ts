export interface Outage {
  id: string;
  type: "Power" | "Internet" | "Water";
  lat: number;
  lng: number;
  description: string;
  reportedAt: string;
  status: "active" | "resolved";
  severity: "high" | "medium" | "low";
  affectedCustomers?: number;
  estimatedResolution?: string;
  address?: string;
}


export interface Location {
  lat: number;
  lng: number;
  description?: string;
  address?: string;
}