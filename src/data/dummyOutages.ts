interface Outage {
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
}

export const dummyOutages: Outage[] = [];
