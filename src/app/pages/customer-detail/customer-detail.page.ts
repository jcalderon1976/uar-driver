
import { Component, OnInit ,ViewChild, ElementRef} from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { UtilService } from '../../services/util/util.service';
import { RideService } from '../../services/ride/ride.service';
import { InitUserProvider } from '../../services/inituser/inituser.service';
import { Driver } from '../../models/driver';
import { MapDirectionsService } from '@angular/google-maps';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { GoogleMapsModule } from '@angular/google-maps';
import { map, Observable } from 'rxjs';
import { Ride } from 'src/app/models/ride';
import { APIService } from 'src/app/services/api/api.service';
import { NavController } from '@ionic/angular';


@Component({
  selector: 'app-customer-detail',
  templateUrl: './customer-detail.page.html',
  styleUrls: ['./customer-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, GoogleMapsModule], // ✅ Import FormsModule
})
export class CustomerDetailPage implements OnInit {
  @ViewChild('toolbar', { read: ElementRef }) toolbarRef!: ElementRef;
  public tripPayments: Array<any> = [];
  public loggedInUser!: Driver;
  public mapData: any;
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

  public originAddr: any;
  public destinationAddr: any;
  public driver!: string;
  public customer!: string;

  constructor(
    private route: Router,      
    private util: UtilService,
    public rideService: RideService,
    private userProvider: InitUserProvider,
    private mapDirectionsService: MapDirectionsService,
    private api: APIService,
    private navCtrl: NavController
  ) { }


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
   
    this.loggedInUser = this.userProvider.getUserData();
    this.mapData = this.rideService.mapData;
    
    
   // Set the map center to the ride's origin coordinates.
    this.center = {
      lat: this.rideService.origin.lat,
      lng: this.rideService.origin.lng,
    };

// Create a directions request for the route between origin and destination.
const request: google.maps.DirectionsRequest = {
  origin: { lat: this.rideService.origin.lat, lng: this.rideService.origin.lng },
  destination: {
    lat: this.rideService.destination.lat,
    lng: this.rideService.destination.lng,
  },
  travelMode: google.maps.TravelMode.DRIVING,
};
this.directionsResults$ = this.mapDirectionsService
  .route(request)
  .pipe(map((response) => response.result));

// Subscribe to the origin address from the RideService.
this.rideService.getOrigin(this.rideService).subscribe({
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
  this.rideService.getDestination(this.rideService).subscribe({
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

/* // Retrieve the driver's details.
if (this.rideService.driverInfo) {
  this.api.getDriver(this.rideService.driverInfo.id).subscribe((res) => {
    this.driver = res['name'];
  });
} */

// Retrieve the customer's details.
this.api.getUser().subscribe((res) => {
  this.customer = res['name'];
});


this.tripPayments =   [
  { title: 'Paid amount', pay: this.rideService.rideInfo.fare },
  //{ title: 'Apple Pay', pay: '$15' },
  //{ title: 'Discount', pay: '$10' },
]   //environment.TRIP_PAYMENTS;

}




  startNavigationToPickup() {
    this.util.startNavigationToPickup(this.mapData.driverLocation, this.mapData.origin);
  }

  callUser(phone: any) {
    this.util.call(phone);
  }

  chatWithUser() {
    this.util.goForward('/chat');
  }

  async userCancel() {
    // const alert = await this.util.createAlert(
    //   'Cancel Request',
    //   false,
    //   environment.DRIVER_CANCEL_MSG,
    //   {
    //     text: 'Cancel',
    //     role: 'cancel',
    //     cssClass: 'secondary',
    //     handler: (cancel) => {
    //       console.log('Confirm Cancel');
    //     }
    //   },
    //   {
    //     text: 'Okay',
    //     handler: () => {
    //       this.util.goForward('/customerRequest');
    //     }
    //   }
    // );

    // await alert.present();
  }

  goBack() {
    this.navCtrl.back();
  }


}
