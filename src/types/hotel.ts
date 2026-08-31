export type HotelResult = {
  id: string;
  name: string;
  city: string;
  starRating: number;
  roomType: string;
  netFarePerNight: number; // per room, per night
  currency: "PKR";
  amenities: string[];
  freeCancellation: boolean;
};

export type HotelSearchParams = {
  city: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string;
  rooms: number;
};
