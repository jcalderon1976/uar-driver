import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject, map, firstValueFrom } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { APIService } from '../api/api.service';
import { environment } from '../../../environments/environment';
import { IncomingRideComponent } from 'src/app/components/incoming-ride/incoming-ride.component';
import { UtilService } from '../util/util.service';
import { PaypalService } from '../api/paypal.service';
import { InitUserProvider } from '../inituser/inituser.service';
import { Driver } from '../../models/driver';
import { User } from '../../models/user';
import { Ride } from '../../models/ride';
//import { PaymentComponent } from 'src/app/components/payment/payment.component';
//import { BookingConfirmationComponent } from 'src/app/components/booking-confirmation/booking-confirmation.component';
import { GmapService } from 'src/app/services/gmap/gmap.service';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Geolocation } from '@capacitor/geolocation';
import { Storage } from '@ionic/storage-angular';
import { MapDirectionsService ,GoogleMap} from '@angular/google-maps';

interface GeocodeResponse {
  results: { formatted_address: string }[];
}

declare let google: any;

@Injectable({
  providedIn: 'root'
})
export class RideService {
  public zoom = 15;
  public originAddress: string = '';
  public destinationAddress: string = '';
  public tripDistance!: number;
  public waitingTime!: string;
  public createdAt: any;
  public duration: any;
  public DefaultPaymentMethod: boolean = false;
  public locatedCountry = environment.COUNTRY;
  public locationType = 'pickup';
  public origin: any;
  public destination: any;
  public direction_lat: any; // TODO
  public direction_lng: any; // TODO
  public fare = 0;
  public subtotal = 0;
  public iva = 0;
  public totalFee = 0;
  public base = environment.BASE_FEE;
  public ivaFee = environment.IVA_FEE;

  public farePerKm = environment.FEE;
  public timePerKm = 5;
  public driverInfo: Driver;
  public rideInfo!: Ride ;
  public markerOptions = environment.MARKER_OPTIONS;
  public renderOptions = environment.RENDER_OPTIONS;
  public screenOptions = environment.SCREEN_OPTIONS;
  public taxiType: string;
  public carImage: string;
  public mapStyle = environment.MAP_STYLE;
  public key = environment.GOOGLE_MAPS_API_KEY;
  public path: any;
  public directionsResults$: Observable<google.maps.DirectionsResult | undefined> = new Observable();
  public lat: number = 0;
  public lng: number = 0;
  public center!: google.maps.LatLngLiteral;
  public options: google.maps.MapOptions = {
     mapTypeId: google.maps.MapTypeId.ROADMAP,
     styles: environment.MAP_STYLE,
     disableDoubleClickZoom: true,
     maxZoom: 20,
     zoom: 15,
     disableDefaultUI: true,
     fullscreenControl: false,
     streetViewControl: false,
     mapTypeControl: false,
   };
  public PayPalPaymentMethod = false;
  public orderId!: string;

  public markers: Array<{ lat: number; lng: number; label: { text: string; color: string; fontSize: string; fontWeight: string; }; draggable: boolean; position: google.maps.LatLngLiteral; title: string; icon: { url: string; scaledSize: google.maps.Size ; labelOrigin: google.maps.Point; }; options: { animation: google.maps.Animation; }; }> = [];
  public SelectRide: boolean = true;
  public confirm: boolean = false;
  public RequestRide: boolean = false;
  public loggedInUser!: Driver;
  public stats = {
    hoursOnline: 0,
    totalDistance: 0,
    totalRides: 0,
    totalFare: 0
  };
  public rideStage = {
    rideAccepted: false,
    rideStarted: false,
    startedPickupNavigation: false
  }
  public mapData = {
    lat: environment.DEFAULT_LAT,
    lng: environment.DEFAULT_LNG,
    origin: null,
    destination: null,
    originAddress: null,
    destinationAddress: null,
    driverLocation: {lat : 0, lng: 0}
  }
  rideAlert: any;
  listenerId:any;
  ridelistenerId:any;
  public rideUser!: User;
  private _storage: Storage | null = null;
  userCard: boolean;
  private destroy$ = new Subject<void>();
  public originAddr: any;
  public destinationAddr: any;

  constructor(
    private api: APIService,
    private __zone: NgZone,
    private http: HttpClient,
    private util: UtilService,
    private userProvider: InitUserProvider,
    private paypalService: PaypalService,
    private maps: GmapService,
    private storage: Storage,
    private mapDirectionsService: MapDirectionsService,
   
  ) {
    this.initStorage();
    this.taxiType = "tow";
    this.carImage = "../../assets/images/towTruck.png";
    this.driverInfo = {
      id: '',
      token: '',
      email: '',
      password: '',
      approved: false,
      available: false,
      location_lat: 0,
      location_lng: 0,
      dob: '',
      gender: '',
      name: '',
      phone: '',
      profile_img: '',
      car_model: '',
      car_brand: '',
      car_year: 1940,
      car_color: '',
      car_license_plate: '',
      car_number: '', // Added missing property
    };
     

    this.userCard = false;
    this.loggedInUser = this.userProvider.getUserData();
    this.newRideInfo();
    this.setupAppStateListener();
  }

  private setupAppStateListener() {
    if (Capacitor.isNativePlatform()) {
      console.log('📱 Setting up App State listener for iOS/Android...');
      
      App.addListener('appStateChange', ({ isActive }) => {
        console.log('📱 App state changed. Active:', isActive);
        
        if (isActive) {
          console.log('✅ App is now in FOREGROUND');
          
          // If driver is available and no ride is accepted, ensure listener is running
          if (this.loggedInUser.available && !this.rideStage.rideAccepted) {
            if (!this.listenerId) {
              console.log('⚠️ Listener was stopped! Restarting...');
              this.setIncomingRideListener();
            } else {
              console.log('✅ Listener is already running, ID:', this.listenerId);
            }
          }
        } else {
          console.log('⏸️ App moved to BACKGROUND');
          // Optionally keep the listener running in background for iOS
          // or clear it to save battery
        }
      });
      
      console.log('✅ App State listener configured');
    }
  }


  private newRideInfo() {
    this.rideInfo = {
      id: '',
      origin_lat: this.loggedInUser.location_lat || this.mapData.lat,
      origin_lng: this.loggedInUser.location_lng || this.mapData.lng,
      origin_address: '',
      destination_lat: 0,
      destination_lng: 0,
      destination_address: '', // fixed typo here
      distance: 0,
      waitingTime: null,
      fare: 0,
      totalFare: 0,
      clientId: '',
      driverId: 0,
      driver_rejected: false,
      ride_started: false,
      ride_accepted: false,
      user_rejected: false,
      ride_completed: false,
      request_timeout: false,
      createdAt: Timestamp.fromDate(new Date()), // or any valid Timestamp value
      paymentMethod: '',
      tow_type: ''
    };
  }

  ngOnDestroy(): void {
    // Emitir valor para romper todas las suscripciones
    this.destroy$.next();
    this.destroy$.complete();
   
  }


  async initStorage() {
    this._storage = await this.storage.create();
  }

  /**
   * Wrap the Google Maps geocoder in an Observable.
   */
  getLatLan(address: string): Observable<any> {
    const geocoder = new google.maps.Geocoder();
    return new Observable(observer => {
      geocoder.geocode({ address }, (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          observer.next(results[0].geometry.location);
          observer.complete();
        } else {
          console.error('Geocoding error:', status);
          observer.error(new Error("Geocoding failed with status: " + status));
        }
      });
    });
  }

  // Alternative versions using Promises (if needed)
  getOrigin2(rideInfo: any): Promise<any> {
    return new Promise(resolve => {
      this.http
        .get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${rideInfo.origin.lat},${rideInfo.origin.lng}&key=${this.key}`)
        .subscribe(res => {
          resolve(res);
        });
    });
  }

  /**
   * Get the origin address via Google Geocoding API.
   * Returns an Observable for consistency.
   */
  getOrigin(rideInfo: any): Observable<GeocodeResponse> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${rideInfo.origin_lat},${rideInfo.origin_lng}&key=${this.key}`;
    console.log(`🌐 Getting origin address for: ${rideInfo.origin_lat},${rideInfo.origin_lng}`);
    return this.http.get<GeocodeResponse>(url).pipe(
      map(response => {
        console.log(`✅ Origin geocode response received:`, response);
        return response;
      })
    );
  }

  getDestination2(rideInfo: any): Promise<any> {
    return new Promise(resolve => {
      this.http
        .get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${rideInfo.destination.lat},${rideInfo.destination.lng}&key=${this.key}`)
        .subscribe(res => {
          resolve(res);
        });
    });
  }

  /**
   * Get the destination address via Google Geocoding API.
   * Returns an Observable.
   */
  getDestination(rideInfo: any): Observable<GeocodeResponse> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${rideInfo.destination_lat},${rideInfo.destination_lng}&key=${this.key}`;
    console.log(`🌐 Getting destination address for: ${rideInfo.destination_lat},${rideInfo.destination_lng}`);
    return this.http.get<GeocodeResponse>(url).pipe(
      map(response => {
        console.log(`✅ Destination geocode response received:`, response);
        return response;
      })
    );
  }

  async setRideInfo(ride: any) {
    let googleMaps: any = await this.maps.loadGoogleMaps();
    Object.assign(this.rideInfo, ride);
    this.setRideStatusListener();
    await this.setAddress({ lat: ride.origin_lat, lng: ride.origin_lng }, 'pickup');
    await this.setAddress({ lat: ride.destination_lat, lng: ride.destination_lng }, 'destination');
    
    await this.api.getRideUser(ride.clientId).then(user => {  
        this.rideStage.rideAccepted = true;
        //Object.assign(this.rideUser, user);
        this.setRideId(ride.id);
         this.rideUser = user;
         this.rideUser.profile_img = user.profile_img;
         this.rideUser.name = user.name;

         this.mapData.originAddress = this.originAddress || ride.origin_address;
         this.mapData.destinationAddress = this.destinationAddress || ride.destination_address;

         console.log(' this.mapData.originAddress :=' +  this.mapData.originAddress);
         console.log(' this.mapData.destinationAddress :=' +  this.mapData.destinationAddress);



         //update the map

         // Set the map center to the ride's origin coordinates.
         this.mapCenterRideDirections(ride);

         //update the driver location


     });
      
   
  }
  


  private mapCenterRideDirections(ride: any) {
    this.center = {
      lat: ride.origin_lat,
      lng: ride.origin_lng,
    };

    // Create a directions request for the route between origin and destination.
    const request: google.maps.DirectionsRequest = {
      origin: { lat: ride.origin_lat, lng: ride.origin_lng },
      destination: { lat: ride.destination_lat, lng: ride.destination_lng },
      travelMode: google.maps.TravelMode.DRIVING,
    };

    this.directionsResults$ = this.mapDirectionsService
      .route(request)
      .pipe(map((response: any) => response.result));

    // Subscribe to the origin address from the RideService.
    this.getOrigin(this.rideInfo).subscribe({
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
      this.getDestination(this.rideInfo).subscribe({
        next: (res) => {
          console.log('Destination geocode response:', res);
          if (res && res.results && res.results.length) {
            this.destinationAddr = res.results[0].formatted_address;
          }
        },
        error: (err) => console.error('Error obtaining destination address:', err),
      });
    }, 10);
  }

  setRideStatusListener() {
    this.ridelistenerId = setInterval(() => {
      this.checkRideStatus();
    }, 10000);
  }

  async checkRideStatus() {
    console.log('ride status check.....');
    const rideId = this.rideInfo.id;
    this.api.getRide(rideId).subscribe(async (ride: Ride) => {
      if (this.rideAlert && (ride['user_rejected'] || ride['request_timeout'])) {
        console.log('CONDITION1');
        this.clearRideInfo();

      } else if (ride['user_rejected']) {
        console.log('CONDITION2');
        this.showUserRejectedAlert();
      } else {
        
        await this.getcurrentLocations();
        
        console.log('waiting for response from user');
      }
    });
  }


  async showUserRejectedAlert() {

    await this.util.presentAlert('Sorry!', environment.USER_REJECTED_MSG, 'OK').then(async (res) => { this.clearRideInfo();});
    
  }

  async setRideInfoBooking(ride: any) {
    Object.assign(this.rideInfo, ride);
    await this.setAddress({ lat: ride.origin_lat, lng: ride.origin_lng }, 'pickup');
    await this.setAddress({ lat: ride.destination_lat, lng: ride.destination_lng }, 'destination');
    //await this.userProvider.setRideId(ride.id);
    if (ride.driverId) {
      this.api.getDriver(ride.driverId).subscribe(
        async driver => {
          Object.assign(this.driverInfo, driver);
        },
        err => console.log(err)
      );
    }
  }

  checkIfExistingRide(rideId: any) {
    
    this.api.getRide(rideId).subscribe(async ride => {
      if (ride && !ride['ride_completed'] && !ride['driver_rejected'] && !ride['user_rejected'] && !ride['request_timeout']) {
        this.setRideInfo(ride);
      } else {
        console.log('clear', rideId);
        await this.clearRideId();
        this.load();
      }
    }, err => console.log(err));

  }

  async resetRideSettings() {


    if (Capacitor.isNativePlatform()) {
      localStorage.clear();
      sessionStorage.clear();
      caches.keys().then(names => names.forEach(name => caches.delete(name)));
    }


    this.locationType = 'pickup';
    this.destinationAddress = '';
    this.destination = null;
    this.directionsResults$ = new Observable<google.maps.DirectionsResult | undefined>();
    this.RequestRide = false;
    this.SelectRide = true;
    this.confirm = false;
    this.PayPalPaymentMethod = false;
    this.orderId = '';

   // await this.userProvider.clearRideId();
    this.loggedInUser = this.userProvider.getUserData();
    let googleMaps: any = await this.maps.loadGoogleMaps();
    const loader = await this.util.createLoader('Getting your location..');
    await loader.present();

    try {
      await this.util.getCurrentLatLng();
      const result = this.util.getCoordinates() ;

      if (result) {
        this.lat = result.latitude;
        this.lng = result.longitude;
      } else {
        throw new Error('Failed to get coordinates');
      }

      this.center = {
        lat: result.latitude,
        lng: result.longitude,
      };
      this.markers = [{
        lat: this.lat,
        lng: this.lng,
        label: { text: 'Usted esta Aqui', color: 'black', fontSize: '16px', fontWeight: 'bold' },
        draggable: true,
        position: this.center,
        title: "test title",
        icon: {
          url: '../../assets/images/location2.png',
          scaledSize: new google.maps.Size(40, 40),
          labelOrigin: new google.maps.Point(25, 60)
         },
        options: { animation: google.maps.Animation.DROP }
      }];

      
      this.zoom = 20;
      this.options = {
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: environment.MAP_STYLE,
        disableDoubleClickZoom: true,
        maxZoom: this.zoom,
        disableDefaultUI: true,
      };

      await this.setAddress({ lat: this.lat, lng: this.lng }, this.locationType);
      this.locationType = 'destination';
      this.updateUserLocation(this.loggedInUser.id, this.lat, this.lng);
    } catch (error) {
      console.error('Error getting current location:', error);
    } finally {
      loader.dismiss();
      (document.activeElement as HTMLElement)?.blur(); // 👈 evita el warning
    }
  }

  updateUserLocation(id: any, lat: number, lng: number) {
    this.api.updateUser(id, { location_lat: lat, location_lng: lng })
      .subscribe(
        res => console.log('location saved', res),
        err => console.log(err)
      );
  }

  async setAddress(location: { lat: number, lng: number }, locationType: string): Promise<string> {
    const address = await this.util.getGeoCodedAddress(location.lat, location.lng);
    if (locationType === 'pickup') {
      this.origin = location;
      this.originAddress = `${address.full_address}`;
      return this.originAddress;
    }
    if (locationType === 'destination') {
      this.destination = location;
      this.destinationAddress = `${address.full_address}`;
      return this.destinationAddress;
    }
    return '';
  }

  async selectTaxiType(name: string, image: string) {
    // Optionally warn if destination or origin is missing.
    this.taxiType = name;
    this.carImage = image; // Fixed: assign the provided image instead of reassigning this.carImage
    // To open a PaymentComponent modal, you might use:
    // const profileModal = await this.util.createModal(PaymentComponent, { taxiType: this.taxiType, carImage: this.carImage }, 'backTransparent');
    // await profileModal.present();
  }

  setTripDistance(distance: number) {
    this.tripDistance = distance; 
  }
  
  getFare(): number {
    return Math.round(this.tripDistance * this.farePerKm);
  }

  getTotalFare(): number{

    this.fare = this.getFare();
    this.subtotal = this.fare + this.base;
    this.iva = this.subtotal * this.ivaFee;
    this.totalFee = Math.round(this.subtotal + this.iva);
    return this.totalFee ;
}
  getTripTime(): number {
    return Math.round(this.tripDistance) * this.timePerKm;
  }

  setPayPalMethod(payPalPaymentMethod: boolean) {
    this.PayPalPaymentMethod = payPalPaymentMethod;
  }

  getPayPalPaymentMethod(): boolean {
    return this.PayPalPaymentMethod;
  }

  setPaymentMethod(PaymentMethod: string) {
    this.rideInfo.paymentMethod = PaymentMethod;
    if (PaymentMethod === 'paypal') {
      this.setPayPalMethod(true);
    } else {
      this.setPayPalMethod(false);
    }
  }

  getPaymentMethod(): string {
    return this.PayPalPaymentMethod ? 'paypal' : 'Cash';
  }

 
  // Function to create the PayPal order (store orderId for later cancellation)
  PayPalcreateOrder(orderId: string): void {
    this.orderId = orderId;
    this.paypalService.setOrderId(orderId);
  }

  // Function to cancel the PayPal order
  async PayPalcancelOrder(orderId: string): Promise<void> {

    //const status = await this.verEstadoOrdenPayPal(orderId);
     // console.log('Estado de la orden:', status); 
       //if(status === 'APPROVED' || status === 'COMPLETED' || status === 'SAVED' ) {
       this.paypalService.cancelOrder(orderId);
     //  }
    
  }

      // Tipos de estados que puede tener una orden:
      // "CREATED"
      // "SAVED"
      // "APPROVED"
      // "VOIDED"
      // "COMPLETED"
      // "PAYER_ACTION_REQUIRED"
  verEstadoOrdenPayPal(orderId: string): string {
    let orderStatus = 'Unknown'; // Default value to ensure a return
    this.paypalService.getOrderDetails(orderId).subscribe({
      next: (data) => {
        console.log('🧾 Estado de la orden:', data);
        orderStatus = (data as any).status;
      },
      error: (err) => {
        console.error('❌ Error al consultar orden PayPal:', err);
        orderStatus = 'Error al consultar estado de la orden';
      }
    });
    return orderStatus; // Return the status
  }

  async getDriverLocation(driverId: string): Promise<Driver>
  {
    if (driverId) {
      await this.api.getDriver(driverId).subscribe(
          async driver => {
            
            Object.assign(this.driverInfo, driver);
            return this.driverInfo;
          },
          err => console.log(err)
        );

    }

    return this.driverInfo;
    
}
async getcurrentLocations() {

  await this.util.getCurrentLatLng().then((resp: any) => {
      
      this.mapData.lat = resp.latitude;
      this.mapData.lng = resp.longitude;
      const obj: { location_lat: number; location_lng: number; id?: string } = { location_lat: 0, location_lng: 0 };
      obj['location_lat'] = resp.latitude;
      obj['location_lng'] = resp.longitude;
      this.mapData.driverLocation = { lat: resp.latitude, lng: resp.longitude };
      obj['id'] = this.loggedInUser.id;
      // update driver's corodinate in the database
      this.api.updateDriverData(this.loggedInUser.id, obj)
        .subscribe(
          res => console.log(res),
          err => console.log(err)
        );
    })
    .catch(error => {
      console.log('Error getting location', error);
    });

  
}

getRideStats() {
  this.api.getTodayRideStats(this.loggedInUser.id).subscribe(
    stats => {
      Object.assign(this.stats, stats);
    },
    err => console.log(err)
  );
}

setIncomingRideListener(triggerImmediate: boolean = false) {
  console.log('🎧 Setting up incoming ride listener...');
  console.log('🔄 Check interval: 10 seconds');
  
  // Clear any existing listener first
  if (this.listenerId) {
    console.log('⚠️ Clearing existing listener before creating new one');
    this.clearIncomingRideListener();
  }
  
  const check = () => {
    console.log('🔍 ride check......', new Date().toLocaleTimeString());
    this.incomingRidesCheck();
  };

  this.listenerId = setInterval(() => {
    check();
  }, 10000); // Increased to 10 seconds to reduce load

  if (triggerImmediate) {
    console.log('🚀 Triggering immediate ride check');
    check();
  }
  
  console.log('✅ Listener ID:', this.listenerId);
}


clearIncomingRideListener() {
  if (this.listenerId) {
    console.log('🛑 Clearing incoming ride listener, ID:', this.listenerId);
    clearInterval(this.listenerId);
    this.listenerId = null;
    console.log('✅ Listener cleared successfully');
  } else {
    console.log('⚠️ No listener to clear');
  }
}

incomingRidesCheck() {
  if (!this.rideStage.rideAccepted && this.loggedInUser.available) {
    console.log('✅ Conditions met: rideAccepted=false, available=true');
    console.log('📡 Calling api.rideCheck()...');
    
    this.api.rideCheck().subscribe({
      next: (ride) => {
        console.log('📥 rideCheck response received:', ride ? 'Ride found!' : 'No rides');
        if (ride) {
          console.log('🎉 New ride found, ID:', ride.id);
          this.clearIncomingRideListener();
          this.showRidePopup(ride);
        } else {
          console.log('⏳ No New Rides Booked - continuing to listen...');
        }
      },
      error: (error) => {
        console.error('❌ Error in rideCheck:', error);
        console.error('❌ Error message:', error.message || 'Unknown error');
        console.error('❌ Error stack:', error.stack);
        
        // Don't clear the listener on error, let it retry on next interval
        console.log('🔄 Will retry on next check interval...');
        
        // If it's a network error, log it specifically
        if (error.message && error.message.includes('network')) {
          console.error('🌐 Network error detected - check internet connection');
        }
      },
      complete: () => {
        console.log('✅ rideCheck observable completed');
      }
    });
  } else {
    console.log('⏭️ Skipping ride check:');
    console.log('   - rideAccepted:', this.rideStage.rideAccepted);
    console.log('   - available:', this.loggedInUser.available);
  }
}
async showRidePopup(ride: any) {
  console.log('🆕 Incoming ride detected:', ride);
  try {
    const pickupAddress = await this.setAddress(
      { lat: ride.origin_lat, lng: ride.origin_lng },
      'pickup'
    );
    const destinationAddress = await this.setAddress(
      { lat: ride.destination_lat, lng: ride.destination_lng },
      'destination'
    );

    const driverLocation = await this.getDriverLocationForPopup();

    const rideForModal = {
      ...ride,
      origin_address:
        pickupAddress ||
        ride.origin_address ||
        this.originAddress ||
        'Ubicación del pasajero',
      destination_address:
        destinationAddress ||
        ride.destination_address ||
        this.destinationAddress ||
        'Destino',
      totalFare: Number(ride.totalFare ?? ride.fare ?? 0),
    };

    const modal = await this.util.createModal(
      IncomingRideComponent,
      {
        ride: rideForModal,
        driverLocation,
      },
      'incoming-ride-modal'
    );

    this.rideAlert = modal;
    await modal.present();

    const { data } = await modal.onWillDismiss();
    this.rideAlert = null;

    if (data?.action === 'accept') {
      const loader = await this.util.createLoader('Please wait...');
      await loader.present();

      this.api.acceptRide(ride.id, this.loggedInUser.id).subscribe({
        next: (res) => {
          loader.dismiss();
          if (res.message[0]) {
            this.setRideInfo(ride);
          } else {
            this.clearRideInfo();
          }
        },
        error: (error) => {
          loader.dismiss();
          console.error('❌ Error accepting ride:', error);
          this.handleRideDeclined();
        },
      });
    } else {
      console.log('❌ Ride declined or modal dismissed by the driver');
      await this.markRideRejected(ride.id);
      this.handleRideDeclined();
    }
  } catch (error) {
    console.error('❌ Error preparing ride popup:', error);
    this.handleRideDeclined();
  }
}

private async getDriverLocationForPopup(): Promise<{ lat: number; lng: number }> {
  if (
    this.mapData?.driverLocation?.lat !== undefined &&
    this.mapData?.driverLocation?.lng !== undefined
  ) {
    return this.mapData.driverLocation;
  }

  if (
    this.loggedInUser?.location_lat !== undefined &&
    this.loggedInUser?.location_lng !== undefined
  ) {
    return {
      lat: this.loggedInUser.location_lat,
      lng: this.loggedInUser.location_lng,
    };
  }

  try {
    const coords = await this.util.getCurrentLatLng();
    if (coords) {
      return { lat: coords.latitude, lng: coords.longitude };
    }
  } catch (error) {
    console.warn('⚠️ Unable to resolve current driver location', error);
  }

  const fallbackLat =
    this.mapData?.lat ??
    this.loggedInUser?.location_lat ??
    environment.DEFAULT_LAT;
  const fallbackLng =
    this.mapData?.lng ??
    this.loggedInUser?.location_lng ??
    environment.DEFAULT_LNG;

  return { lat: fallbackLat, lng: fallbackLng };
}

private handleRideDeclined(): void {
  this.rideStage.rideAccepted = false;
  this.setIncomingRideListener(true);
}

private async markRideRejected(rideId: string): Promise<void> {
  try {
    await firstValueFrom(this.api.setRideRejected(rideId));
    console.log('🚫 Ride marked as rejected:', rideId);
  } catch (error) {
    console.error('❌ Error marking ride as rejected:', error);
  }
}


async load() {
  console.log('LOAD');
   //this.rideService.rideInfo
   //this.rideservice.mapData
   //this.rideService.rideStage 
  
   await this.getcurrentLocations();
   //await this.getRideStats();
   console.log('this.mapData', this.mapData);
   //this.mapData.lat = this.loggedInUser.location_lat || environment.DEFAULT_LAT;
   //this.mapData.lng = this.loggedInUser.location_lng || environment.DEFAULT_LNG;
   
  if (this.loggedInUser.available) {
          this.setIncomingRideListener();
  }

}

clearRideStatusListener() {
  clearInterval(this.ridelistenerId);
  this.ridelistenerId = null;
}

async clearRideInfo() {
  this.rideStage.rideAccepted = false;
  this.rideStage.rideStarted = false;
  this.rideStage.startedPickupNavigation = false;
  await this.clearRideId();
  if (this.rideAlert) { this.rideAlert.dismiss(); }
  this.rideAlert = null;
  this.load();
  this.clearRideStatusListener();
  // Set the map center to the ride's origin coordinates.
  this.newRideInfo();
  this.mapCenterRideDirections(this.rideInfo);
}

async getRideId() {
  const rideId = await this._storage?.get('rideId');
  return rideId;
}


async setRideId(rideId: any) {
  console.log('ride Id set', rideId);
  await this._storage?.set('rideId', rideId);
}

async clearRideId() {
  await this._storage?.remove('rideId');
}

async showDriverCanceledRideAlert() {

  await this.util.presentAlert('Cancel Ride ?',environment.DRIVER_CANCEL_MSG,'OK').then(async (res) => {
    this.api.cancelRide(this.rideInfo.id).subscribe(res => {
      this.clearRideInfo();
    }, err => console.log(err));
  });


}


startNavigationToPickup() {
  this.rideStage.startedPickupNavigation = true;

  //this.util.startNavigationToPickup(this.mapData.driverLocation, this.mapData.origin);

  const pickInfo = {
    id: '',
    origin_lat: this.loggedInUser.location_lat,  //driver location
    origin_lng: this.loggedInUser.location_lng,  //driver location
    origin_address: '',
    destination_lat: this.rideInfo.origin_lat,  //user location
    destination_lng: this.rideInfo.origin_lng,  //user location
    destination_address: this.rideInfo.origin_address, // fixed typo here
    distance: 0,
    waitingTime: null,
    fare: 0,
    clientId: '',
    driverId: 0,
    driver_rejected: false,
    ride_started: false,
    ride_accepted: false,
    user_rejected: false,
    ride_completed: false,
    request_timeout: false,
    createdAt: Timestamp.fromDate(new Date()), // or any valid Timestamp value
    paymentMethod: '',
    tow_type: ''
  };
  
  this.mapCenterRideDirections(pickInfo);

}

startRideNavigation() {
  //this.util.startNavigationToPickup(this.mapData.origin, this.mapData.destination);

  const startRideInfo = {
    id: '',
    origin_lat: this.rideInfo.origin_lat,  //driver location
    origin_lng: this.rideInfo.origin_lng,  //driver location
    origin_address: this.rideInfo.origin_address,
    destination_lat: this.rideInfo.destination_lat,  //user location
    destination_lng: this.rideInfo.destination_lng,  //user location
    destination_address: this.rideInfo.destination_address, // fixed typo here
    distance: 0,
    waitingTime: null,
    fare: 0,
    clientId: '',
    driverId: 0,
    driver_rejected: false,
    ride_started: false,
    ride_accepted: false,
    user_rejected: false,
    ride_completed: false,
    request_timeout: false,
    createdAt: Timestamp.fromDate(new Date()), // or any valid Timestamp value
    paymentMethod: '',
    tow_type: ''
  };
  
  this.mapCenterRideDirections(startRideInfo);



}

async startRide() {
  const loader = await this.util.createLoader('Starting ride ...');
  await loader.present();

  this.api.startRide(this.rideInfo.id)
    .subscribe(res => {
      console.log('rideStarted', res);
      if (res.message[0]) {  // response of accpetance
        this.rideStage.rideStarted = true;
        this.startRideNavigation();
      } else {
        this.clearRideInfo();
      }
      loader.dismiss();

    }, err => console.log(err));
}

async completeRide() {
  const loader = await this.util.createLoader('Completing your ride ...');
  await loader.present();

  this.api.completeRide(this.rideInfo.id)
    .subscribe(res => {
      console.log('rideCompleted');
      this.clearRideInfo();
      loader.dismiss();

    }, err => console.log(err));
}

async getmapData() {  
  return await this.mapData;
}


clearDirectionResults() {



}


async clearRideInfoWhenUserCancel() {
  this.rideStage.rideAccepted = false;
  this.rideStage.rideStarted = false;
  this.rideStage.startedPickupNavigation = false;
  await this.clearRideId();
  if (this.rideAlert) { this.rideAlert.dismiss(); }
  this.rideAlert = null;
  this.load();
  this.clearRideStatusListener();
}


async getClientName(clientId : any): Promise<string> {
  try {
    console.log('(getClientName   Client ID:', clientId);
    const ride = await firstValueFrom(this.api.getRide(clientId));
    return (ride && ride['name']) ? ride['name'] : 'User not found';
  } catch (error) {
    console.error('Error fetching client name:', error);
    return 'User not found';
  }
}

}
