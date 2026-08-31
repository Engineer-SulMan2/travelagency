export type Airport = { code: string; city: string; name: string };

export const AIRPORTS: Airport[] = [
  { code: "ISB", city: "Islamabad", name: "Islamabad International" },
  { code: "KHI", city: "Karachi", name: "Jinnah International" },
  { code: "LHE", city: "Lahore", name: "Allama Iqbal International" },
  { code: "PEW", city: "Peshawar", name: "Bacha Khan International" },
  { code: "SKT", city: "Sialkot", name: "Sialkot International" },
  { code: "MUX", city: "Multan", name: "Multan International" },
  { code: "DXB", city: "Dubai", name: "Dubai International" },
  { code: "AUH", city: "Abu Dhabi", name: "Zayed International" },
  { code: "DOH", city: "Doha", name: "Hamad International" },
  { code: "JED", city: "Jeddah", name: "King Abdulaziz International" },
  { code: "LHR", city: "London", name: "Heathrow" },
  { code: "IST", city: "Istanbul", name: "Istanbul Airport" },
];

export function findAirport(code: string) {
  return AIRPORTS.find((a) => a.code === code);
}
