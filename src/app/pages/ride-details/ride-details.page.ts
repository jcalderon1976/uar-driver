import {  Component,  OnInit,  Input,  AfterViewInit,  ElementRef,  ViewChild,} from '@angular/core';
import { NavParams, ModalController } from '@ionic/angular';
import { RideService } from '../../services/ride/ride.service';
import { APIService } from '../../services/api/api.service';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import { MapDirectionsService } from '@angular/google-maps';
import { Ride } from 'src/app/models/ride';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { GoogleMapsModule } from '@angular/google-maps';

@Component({
  selector: 'app-ride-details',
  templateUrl: './ride-details.page.html',
  styleUrls: ['./ride-details.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, GoogleMapsModule], // ✅ Import FormsModule
})
export class RideDetailsPage implements OnInit {
  @ViewChild('toolbar', { read: ElementRef }) toolbarRef!: ElementRef;

  rideInfo!: Ride;

  public lat!: number;
  public lng!: number;
  public originAddr: any;
  public destinationAddr: any;
  public driver!: string;
  public customer!: string;
  // Variables for Google Maps
  directionsResults$!: Observable<google.maps.DirectionsResult | undefined>;
  position!: google.maps.LatLngLiteral;
  zoom = 10;
  center!: google.maps.LatLngLiteral;
  options: google.maps.MapOptions = {
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles: environment.MAP_STYLE,
    disableDoubleClickZoom: true,
    maxZoom: 25,
    disableDefaultUI: true,
  };

  vertices!: google.maps.LatLngLiteral[];
  markers = [];
  infoContent = '';

  constructor(
    public modalController: ModalController,
    private navParams: NavParams, // Access passed data
    private ride: RideService,
    private mapDirectionsService: MapDirectionsService,
    private api: APIService
  ) {}

  ngAfterViewInit() {
    const toolbarEl = this.toolbarRef.nativeElement;
    const shadowRoot = toolbarEl.shadowRoot;

    if (shadowRoot) {
      const style = document.createElement('style');
      style.textContent = `
        .toolbar-background {
          background: linear-gradient(45deg, #FE695D, #AA2CE6) !important;
        }
      `;
      shadowRoot.appendChild(style);
    }
  }

  ngOnInit() {
    //If this.rideInfo is null????
    this.rideInfo =
      this.navParams.data['dataFromParent'].componentProps.rideInfo; // this.navParams.get('rideInfo'); // Get the passed object

    console.log('Ride Info:', this.rideInfo);

    // Set the map center to the ride's origin coordinates.
    this.center = {
      lat: this.rideInfo.origin_lat,
      lng: this.rideInfo.origin_lng,
    };

    // Create a directions request for the route between origin and destination.
    const request: google.maps.DirectionsRequest = {
      origin: { lat: this.rideInfo.origin_lat, lng: this.rideInfo.origin_lng },
      destination: {
        lat: this.rideInfo.destination_lat,
        lng: this.rideInfo.destination_lng,
      },
      travelMode: google.maps.TravelMode.DRIVING,
    };
    this.directionsResults$ = this.mapDirectionsService
      .route(request)
      .pipe(map((response) => response.result));

    // Subscribe to the origin address from the RideService.
    this.ride.getOrigin(this.rideInfo).subscribe({
      next: (res) => {
        console.log('Origin geocode response:', res);
        if (res && res.results && res.results[0]) {
          this.originAddr = res.results[0].formatted_address;
        }
      },
      error: (err) => console.error('Error obtaining origin address:', err),
    });

    // Subscribe to the destination address from the RideService.
    // A slight delay (10 ms) is applied if necessary.
    setTimeout(() => {
      this.ride.getDestination(this.rideInfo).subscribe({
        next: (res) => {
          console.log('Destination geocode response:', res);
          if (res && res.results && res.results.length) {
            this.destinationAddr = res.results[0].formatted_address;
          }
        },
        error: (err) =>
          console.error('Error obtaining destination address:', err),
      });
    }, 10);

    // Retrieve the driver's details.
    if (this.rideInfo.driverId) {
      this.api.getDriver(this.rideInfo.driverId).subscribe((res) => {
        this.driver = res['name'];
      });
    }

    // Retrieve the customer's details.
    console.log('Ride Info:', this.rideInfo);
    console.log('clientId:', this.rideInfo['clientId']);

   this.api.getRideUser(this.rideInfo['clientId']).then((res) => {
    console.log('Customer name:', res.name);
    this.customer = res.name  ;
    }, (err) => {
    console.error('Error obtaining customer name:', err);
    this.customer = 'User not found';
   });

  }

  goBack() {
    this.modalController.dismiss(null, 'cancel');
  }

  cancel() {
    this.modalController.dismiss(null, 'cancel');
  }
}
