import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { MapDirectionsService } from '@angular/google-maps';
import { environment } from 'src/environments/environment';

declare const google: any;

@Component({
  selector: 'app-incoming-ride',
  templateUrl: './incoming-ride.component.html',
  styleUrls: ['./incoming-ride.component.scss'],
  standalone: false,
})
export class IncomingRideComponent implements OnInit {
  @Input() dataFromParent?: {
    ride: any;
    driverLocation?: { lat: number; lng: number };
  };

  ride: any;
  driverLocation?: { lat: number; lng: number };

  center!: google.maps.LatLngLiteral;
  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    styles: environment.MAP_STYLE,
  };
  directionsOptions: google.maps.DirectionsRendererOptions = {
    suppressMarkers: false,
    polylineOptions: {
      strokeColor: '#FE695D',
      strokeWeight: 5,
    },
  };

  directionsResult?: google.maps.DirectionsResult;
  loadingRoute = true;

  stats = {
    fare: 0,
    distance: '--',
    duration: '--',
  };

  constructor(
    private modalCtrl: ModalController,
    private directionsService: MapDirectionsService
  ) {}

  ngOnInit(): void {
    this.ride = this.dataFromParent?.ride;
    this.driverLocation = this.dataFromParent?.driverLocation;

    if (!this.ride) {
      this.onDecline();
      return;
    }

    this.stats.fare = Number(this.ride.totalFare ?? this.ride.fare ?? 0);
    this.center = {
      lat: this.ride.origin_lat,
      lng: this.ride.origin_lng,
    };

    if (typeof google === 'undefined') {
      this.setFallbackStats();
      this.loadingRoute = false;
      return;
    }

    const origin = this.driverLocation ?? {
      lat: this.ride.origin_lat,
      lng: this.ride.origin_lng,
    };

    this.directionsService
      .route({
        origin,
        destination: {
          lat: this.ride.destination_lat,
          lng: this.ride.destination_lng,
        },
        waypoints: [
          {
            location: {
              lat: this.ride.origin_lat,
              lng: this.ride.origin_lng,
            },
            stopover: true,
          },
        ],
        travelMode: google.maps.TravelMode.DRIVING,
      })
      .subscribe({
        next: ({ result }) => {
          this.directionsResult = result ?? undefined;
          this.updateStatsFromRoute();
          this.loadingRoute = false;
        },
        error: (err) => {
          console.error('Error creating directions preview', err);
          this.setFallbackStats();
          this.loadingRoute = false;
        },
      });
  }

  onAccept(): void {
    this.modalCtrl.dismiss({ action: 'accept' });
  }

  onDecline(): void {
    this.modalCtrl.dismiss({ action: 'decline' });
  }

  private updateStatsFromRoute(): void {
    if (!this.directionsResult?.routes?.length) {
      this.setFallbackStats();
      return;
    }

    const legs = this.directionsResult.routes[0].legs ?? [];
    let totalMeters = 0;
    let totalSeconds = 0;

    legs.forEach((leg) => {
      totalMeters += leg.distance?.value ?? 0;
      totalSeconds += leg.duration?.value ?? 0;
    });

    if (totalMeters > 0) {
      this.stats.distance = `${(totalMeters / 1000).toFixed(1)} km`;
    } else {
      this.stats.distance = this.getRideDistanceFallback();
    }

    if (totalSeconds > 0) {
      const minutes = Math.round(totalSeconds / 60);
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remaining = minutes % 60;
        this.stats.duration = remaining
          ? `${hours}h ${remaining}m`
          : `${hours}h`;
      } else {
        this.stats.duration = `${minutes} min`;
      }
    } else {
      this.stats.duration = this.getRideDurationFallback();
    }
  }

  private setFallbackStats(): void {
    this.stats.distance = this.getRideDistanceFallback();
    this.stats.duration = this.getRideDurationFallback();
  }

  private getRideDistanceFallback(): string {
    const distance =
      this.ride?.distance ?? this.ride?.tripDistance ?? this.ride?.totalDistance;
    if (distance !== undefined && distance !== null) {
      const numeric = Number(distance);
      if (!Number.isNaN(numeric)) {
        return `${numeric.toFixed(1)} km`;
      }
      return `${distance} km`;
    }
    return '--';
  }

  private getRideDurationFallback(): string {
    return (
      this.ride?.waitingTime ||
      this.ride?.estimatedDuration ||
      this.ride?.duration ||
      '--'
    );
  }
}


