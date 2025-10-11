import { Car } from "./car";

export interface User {
  id: string;
  name: string;
  email: string;
  NewEmail: string;
  phone: string;
  password: string;
  password2: string;
  location_lat: number;
  location_lng: number;
  token: string;
  profile_img?: string;
  rideId: string;
  location: string;
  car?: Car;
}


