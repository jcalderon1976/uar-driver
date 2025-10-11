import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RideService } from '../../services/ride/ride.service';
import { Router } from '@angular/router';
import { InitUserProvider } from '../../services/inituser/inituser.service';
import { APIService } from '../../services/api/api.service';
import { Ride } from '../../models/ride';
import { environment } from '../../../environments/environment';
import { UtilService } from '../../services/util/util.service';
import {
  GoogleMap,
  MapDirectionsRenderer,
  MapDirectionsService,
  MapInfoWindow,
  MapMarker,
} from '@angular/google-maps';
import { GmapService } from 'src/app/services/gmap/gmap.service';
import { map, Observable, Subscription, Subject } from 'rxjs';
import { ModalController, NavController } from '@ionic/angular';
import { TrackService } from 'src/app/services/track/track.service';
import { Driver } from 'src/app/models/driver';
declare var google: any;

@Component({
  selector: 'app-pickup',
  templateUrl: './pickup.component.html',
  styleUrls: ['./pickup.component.scss'],
  standalone: false,
})
export class PickupComponent implements OnInit {
  @ViewChild(GoogleMap) googleMap!: GoogleMap; // ✅ Ensure ViewChild is used properly
  @ViewChild('toolbar', { read: ElementRef }) toolbarRef!: ElementRef;

  public count = 0;
  public zoom = 8;
  public screenOptions!: google.maps.MapOptions;
  public rideId!: any;
  public driverId!: any;
  public listenerId!: any;
  public origin: { lat: any; lng: any } = { lat: null, lng: null };
  public destination: { lat: any; lng: any } = { lat: null, lng: null };
  //Variables
  directionsResults$: Observable<google.maps.DirectionsResult | undefined> =
    new Observable<google.maps.DirectionsResult | undefined>();
  position!: google.maps.LatLngLiteral;
  center!: google.maps.LatLngLiteral;
  options: google.maps.MapOptions = {
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles: environment.MAP_STYLE,
    disableDoubleClickZoom: true,
    maxZoom: 25,
    disableDefaultUI: true,
  };
  public orderId!: any;
  public rating = 3; // Calificación dinámica (de 1 a 5)
  trackSub!: Subscription;
  source: any = {}; // { lat: 18.3916667, lng: -66.1155749 }; //
  dest: any = {}; // { lat: 18.4078943, lng: -66.1084666 }; //
  driverLocation: any = {}; //= { lat: 18.3916667, lng: -66.1155749 };  // ✅ Driver's starting position
  public driverAcepted: boolean = false;
  private destroy$ = new Subject<void>();

  map!: google.maps.Map;
  markers: google.maps.Marker[] = [];
  towTruckMarker!: google.maps.Marker; // ✅ Store tow truck marker
  originMarker!: google.maps.Marker; // ✅ Store tow truck marker
  public oldPosition!: google.maps.LatLngLiteral; // Store the previous position

  constructor(
    public rideService: RideService,
    private route: Router,
    private userProvider: InitUserProvider,
    private mapDirectionsService: MapDirectionsService,
    private maps: GmapService,
    private api: APIService,
    private modalCtrl: ModalController,
    private util: UtilService,
    private track: TrackService
  ) {}

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.googleMap && this.googleMap.googleMap) {
        this.map = this.googleMap.googleMap; // ✅ Correct way to access the Google Map instance
      }
    }, 500); // Small delay to ensure map is initialized

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

  async ngOnInit() {
    this.driverAcepted = false;
    await this.calculateRoute();
  }

  async calculateRoute() {
    
  }

  // ✅ Function to update marker position (Real-time update)
  updateDriverLocation(newLocation: { lat: number; lng: number }) {
    if (this.towTruckMarker) {
      this.towTruckMarker.setPosition(
        new google.maps.LatLng(newLocation.lat, newLocation.lng)
      );
      this.googleMap.googleMap?.panTo(newLocation); // Smooth pan
    }
  }

  setRideStatusListener() {
    this.listenerId = setInterval(() => {
      this.checkRideStatus();
    }, 7000);
    console.log(
      '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>setInterval(7000) SET RIDE STATUS LISTENER this.listenerId = ' +
        this.listenerId +
        '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<'
    );
  }

  clearRideStatusListener() {
    console.log(
      '*************CLEAR LISTENER PICKUP ***************************this.listenerId=>' +
        this.listenerId
    );
    clearInterval(this.listenerId);
    this.listenerId = null;
  }

  async checkRideStatus() {
    console.log('status check.....');
    const user = this.userProvider.getUserData();
    console.log('user->');
    console.dir(user);

  }

  cancelRide() {
    this.showUserCanceledRideAlert();
  }

  async showDriverRejectedAlert() {
    this.util
      .presentAlert('Sorry!', environment.DRIVER_REJECTED_MSG, 'OK')
      .then(() => {
        this.rideService.resetRideSettings();
        this.modalCtrl.dismiss();
      });
  }

  async showCompletedRideAlert() {
    this.util
      .presentAlert(
        'Servicio fue completado Satifactoriamente!',
        environment.RIDE_COMPLETED_MSG,
        'OK'
      )
      .then(() => {
        this.rideService.resetRideSettings();
        this.modalCtrl.dismiss();
      });
  }

  async showUserCanceledRideAlert() {
    this.util
      .presentAlert('Cancel Ride ?', environment.USER_CANCEL_MSG, 'OK')
      .then(() => {
        if (this.rideId == null || this.rideId.length == 0)
          //this.rideId = this.userProvider.getRideId().toString();

        console.dir('rideId => ' + this.rideId);
        console.log('rideId => ' + this.rideId);

        this.api.setRideRejected(this.rideId).subscribe(
          (res) => {
            this.clearRideStatusListener();
            this.rideService.resetRideSettings();
            //Cancel Paypal
            if (this.rideService.rideInfo.paymentMethod == 'paypal')
              this.rideService.PayPalcancelOrder(this.orderId);
            this.modalCtrl.dismiss();
          },
          (err) => console.log(err)
        );
      });
  }

  getStars(): boolean[] {
    // Genera un arreglo de booleanos: true para estrellas llenas, false para vacías
    return Array(5)
      .fill(false)
      .map((_, index) => index < this.rating);
  }

  stars(number: number): any[] {
    return Array(number).fill(0);
  }

  ionViewWillLeave() {
    this.clearRideStatusListener();
  }

  ngOnDestroy(): void {
    // Emitir valor para romper todas las suscripciones
    this.destroy$.next();
    this.destroy$.complete();
    if (this.trackSub) this.trackSub.unsubscribe();
  }

  async fetchRouteInMapDriver(driverId: string) {
    //Get the driver Location
    this.driverId = driverId;

    await this.rideService
      .getDriverLocation(this.driverId)
      .then((driver: Driver) => {
        //Fetch the Route from Google Directions API ,The origin (start), destination, and travel mode are defined.
        const request: google.maps.DirectionsRequest = {
          origin: { lat: driver.location_lat, lng: driver.location_lng },
          destination: {
            lat: this.rideService.origin.lat,
            lng: this.rideService.origin.lng,
          },
          travelMode: google.maps.TravelMode.DRIVING,
        };

        //Google's route() function processes the request.
        this.directionsResults$ = this.mapDirectionsService.route(request).pipe(
          map((response) => {
            if (response.result) {
              this.addCustomMarkers(
                response.result.routes[0].legs[0],
                true,
                driver.location_lat,
                driver.location_lng
              ); //Add Custom Icons
              this.getTimer(response);
            }
            return response.result;
          })
        );

        //this.updateDriverLocation( this.driverLocation); //Mark the Driver Icon
      });
  }

  async fetchRouteInMapRide(rideInfo: Ride) {
    await this.util.getCurrentLatLng();
    const result = this.util.getCoordinates();
    if (result) {
      rideInfo.origin_lat = result.latitude;
      rideInfo.origin_lng = result.longitude;
    } else {
      console.error('Failed to get coordinates');
      return;
    }

    //Fetch the Route from Google Directions API ,The origin (start), destination, and travel mode are defined.
    const request: google.maps.DirectionsRequest = {
      origin: { lat: rideInfo.origin_lat, lng: rideInfo.origin_lng },
      destination: {
        lat: rideInfo.destination_lat,
        lng: rideInfo.destination_lng,
      },
      travelMode: google.maps.TravelMode.DRIVING,
    };

    //Google's route() function processes the request.
    this.directionsResults$ = this.mapDirectionsService.route(request).pipe(
      map((response) => {
        if (response.result) {
          this.addCustomMarkers(
            response.result.routes[0].legs[0],
            false,
            rideInfo.origin_lat,
            rideInfo.origin_lng
          ); //Add Custom Icons
          this.getTimer(response);
        }
        return response.result;
      })
    );
  }

  private getTimer(response: any) {
    this.rideService.tripDistance =
      response.result.routes[0].legs[0].distance.text;
    this.rideService.waitingTime =
      response.result.routes[0].legs[0].duration.text;
  }

  addCustomMarkers(routeLeg: any, isDriver: boolean, lat: any, lnt: any) {
    if (!this.googleMap || !this.googleMap.googleMap) {
      console.error('Google Map instance is not available');
      return;
    }

    const mapInstance = this.googleMap.googleMap;

    // Clear old markers
    this.markers.forEach((marker) => marker.setMap(null));
    this.markers = [];

    // ✅ Tow Truck Marker (Dynamic)
    this.towTruckMarker = new google.maps.Marker({
      position: routeLeg.start_location, // Start at the first location
      map: mapInstance,
      icon: {
        url: this.updateMarker(lat, lnt), //'../../assets/images/towTruck.png',  // 🛠 Replace with tow truck icon
        scaledSize: new google.maps.Size(50, 50),
      },
    });

    // ✅ End Marker (Destination Pin)
    this.originMarker = new google.maps.Marker({
      position: routeLeg.end_location,
      map: mapInstance,
      icon: {
        url: isDriver
          ? '../../assets/images/location2.png'
          : '../../assets/images/pin.png', // 🛠 Replace with actual destination icon
        scaledSize: new google.maps.Size(40, 40),
      },
    });

    // ✅ Add markers to map
    this.markers.push(this.towTruckMarker, this.originMarker);
  }

  updateMarker(newLat: any, newLng: any): string {
    let newPosition = new google.maps.LatLng(newLat, newLng);
    let direction:
      | 'NorthEast'
      | 'NorthWest'
      | 'SouthEast'
      | 'SouthWest'
      | 'default' = 'default';
    if (this.oldPosition) {
      direction = this.getDirection(this.oldPosition, newPosition);
      console.log('Moving:', direction);
    }
    this.oldPosition = newPosition; // Store the new position for next comparison
    const validDirections = [
      'NorthEast',
      'NorthWest',
      'SouthEast',
      'SouthWest',
      'default',
    ] as const;
    const validDirection = validDirections.includes(direction)
      ? direction
      : 'default';
    return this.getMarkerIcon(validDirection);
  }

  getDirection(oldPos: any, newPos: any) {
    let latDiff = newPos.lat() - oldPos.lat();
    let lngDiff = newPos.lng() - oldPos.lng();

    if (Math.abs(latDiff) > Math.abs(lngDiff)) {
      if (latDiff > 0) {
        //north
        return lngDiff > 0 ? 'NorthEast' : 'NorthWest';
      } //South
      else {
        return lngDiff > 0 ? 'SouthEast' : 'SouthWest';
      }
    } else {
      return lngDiff > 0 ? 'SouthEast' : 'SouthWest';
    }
  }

  getMarkerIcon(
    direction: 'NorthEast' | 'NorthWest' | 'SouthEast' | 'SouthWest' | 'default'
  ) {
    const icons = {
      NorthEast: '../../assets/images/towTruck-NorthEast.png',
      NorthWest: '../../assets/images/towTruck-NorthWest.png',
      SouthEast: '../../assets/images/towTruck-SouthEast.png',
      SouthWest: '../../assets/images/towTruck-SouthWest.png',
      default: './../assets/images/towTruck.png',
    };

    return icons[direction];
  }
}
