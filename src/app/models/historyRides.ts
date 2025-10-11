import { Timestamp } from "@firebase/firestore";

export interface HistoryRide{
    [x: string]: any;
      id: string;
      origin_lat: number;
      origin_lng: number;
      origin_address: string;
      destination_lat: number;
      destination_lng: number;
      destination_address: string;
      distance: number;
      fare: number;
      totalFee: number;
      clientId: number;
      driverId: number;
      driver_rejected: boolean;
      ride_started: boolean;
      ride_accepted: boolean;
      request_timeout: boolean;
      user_rejected: boolean;
      ride_completed: boolean;
      tow_type: string;
      ride_date: string;
      createdAt: Timestamp;
    }