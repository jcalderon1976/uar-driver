import { Car } from "./car";

export interface Driver {
  id: string;
  token: string;
  email: string;
  password: string;
  approved: boolean;
  available: boolean;
  location_lat: number;
  location_lng: number;
  dob: string;
  gender: string;
  name: string;
  phone: string;
  profile_img: string;
  car_brand: string;
  car_model: string;
  car_year: number;
  car_color: string;
  car_license_plate: string;
  car_number: string;
  car?: Car;
}
