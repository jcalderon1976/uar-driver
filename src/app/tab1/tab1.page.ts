import { Component, OnInit,AfterViewInit, ViewChild ,ElementRef, OnDestroy} from '@angular/core';
import { MenuController } from '@ionic/angular';
import { RideService } from '../services/ride/ride.service';
import { APIService } from '../services/api/api.service';
import { InitUserProvider } from '../services/inituser/inituser.service';
import { UtilService } from '../services/util/util.service';
import { Driver } from '../models/driver';
import { Loader } from '@googlemaps/js-api-loader';
import { Geolocation } from '@capacitor/geolocation';
import { environment } from 'src/environments/environment';
import { IonHeader, IonFab } from "@ionic/angular/standalone";
import { map, Observable, Subscription, firstValueFrom } from 'rxjs';
import { MapDirectionsService ,GoogleMap} from '@angular/google-maps';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { HistoryRide } from '../models/historyRides';

declare var google: any;


@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit, OnDestroy {
  @ViewChild('toolbar', { read: ElementRef }) toolbarRef!: ElementRef;
  @ViewChild('googleMap', { static: false }) mapRef!: GoogleMap;
  map!: google.maps.Map;
  marker!: google.maps.Marker;
  circle!: google.maps.Circle;
  public loggedInUser: Driver; // user data
  public listenerId: any;
  public driverAvailable;
  public rideStage;
  public mapData = {
    lat: environment.DEFAULT_LAT,
    lng: environment.DEFAULT_LNG,
    origin: null,
    destination: null,
    originAddress: null,
    destinationAddress: null,
    driverLocation: {lat : 0, lng: 0}
  } 

  public lat: any;
  public lng: any;
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
  // Variables for Google Maps
  directionsResults$!: Observable<google.maps.DirectionsResult | undefined>;
  position!: google.maps.LatLngLiteral;
  zoom = 10;
  public originAddr: any;
  public destinationAddr: any;
  markerOptions: google.maps.MarkerOptions = {
    animation: google.maps.Animation.DROP,
    draggable: true,
    icon:{
            url: 'assets/images/location.png', // si tienes un ícono personalizado
            scaledSize: new google.maps.Size(40, 40),  // tamaño personalizado (px)
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(16, 32) // opcional: punto de anclaje
    } 
  };

  public walletData: any = [];
  private lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
  private pageSize = 5;
  loadingMore = false;
  public rides: HistoryRide[] = [];
  private userSubscription?: Subscription;
  private onlineSessionStart: number | null = null;
  private onlineTimerId?: ReturnType<typeof setInterval>;

  constructor(
    private menuCtrl: MenuController,
    public rideService: RideService,
    private api: APIService,
    private userProvider: InitUserProvider,
    private util: UtilService,
    private mapDirectionsService: MapDirectionsService,
  ) {
          console.log('Tab1Page constructor');
          
          this.loggedInUser = this.userProvider.getUserData();
          this.driverAvailable = this.loggedInUser.available;
          this.refreshLoggedInUser();
          this.getcurrentLocations();
         
          console.log('this.rideService.rideStage', this.rideService.rideStage);
          console.log('this.rideService', this.rideService);

          this.rideStage = this.rideService.rideStage;
          this.loadOnlineStats();
          this.getHistory(this.loggedInUser.id);
  }


  async ngOnInit() {
        console.log('ngOnInit');
        this.refreshLoggedInUser();
        this.loadOnlineStats();
    }

    
  

  async ngAfterViewInit() {
    
    console.log('ngAfterViewInit');

    this.rideStage.rideAccepted = false;
        const rideId =  await this.rideService.getRideId().then(async (rideId) => {
           console.log('rideId', rideId);
           if (rideId) {
            await  this.rideService.checkIfExistingRide(rideId);
           } else {
            await this.rideService.load();
           }
        });
    


    

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

  async getCurrentLocation(fromIcon: boolean) {
    
    this.loggedInUser = this.userProvider.getUserData();
    const loader = await this.util.createLoader('Getting your location..');
    await loader.present();

    try {

      await this.util.getCurrentLatLng();

      const result = this.util.getCoordinates() ;

      if (result) {
        this.lat = result.latitude;
        this.lng = result.longitude;
      } else {
        console.error('Error: result is null');
      }

  } catch (error) {
    console.error('Error getting current location:', error);
  } finally {
    loader.dismiss();
    (document.activeElement as HTMLElement)?.blur(); // 👈 evita el warning
  }
  }

 

  ionViewDidEnter() {
    console.log('🔵 Tab1 - ionViewDidEnter');
    console.log('🔍 Checking if listener needs to be restarted...');
    console.log('   - Driver available:', this.loggedInUser.available);
    console.log('   - Ride accepted:', this.rideStage.rideAccepted);
    console.log('   - Current listener ID:', this.rideService.listenerId);
    
    // Refresh user data
    this.loggedInUser = this.userProvider.getUserData();
    this.driverAvailable = this.loggedInUser.available;
    this.refreshLoggedInUser();
    this.loadOnlineStats();
    
    // If driver is available and no ride is accepted, ensure listener is running
    if (this.loggedInUser.available && !this.rideStage.rideAccepted) {
      if (!this.rideService.listenerId) {
        console.log('⚠️ Listener was cleared! Restarting...');
        this.rideService.setIncomingRideListener();
      } else {
        console.log('✅ Listener is already running');
      }
    } else {
      console.log('⏭️ Not starting listener (driver not available or ride already accepted)');
    }

    if (this.driverAvailable) {
      this.startOnlineTracking();
    } else {
      this.stopOnlineTracking();
    }

    this.loggedInUser = this.userProvider.getUserData();
    this.getHistory(this.loggedInUser.id);
  }

  ionViewWillLeave() {
    console.log('🔴 Tab1 - ionViewWillLeave');
    (document.activeElement as HTMLElement)?.blur();
  }

  async cancelRide() {
    await this.rideService.showDriverCanceledRideAlert();
  }

  mapReady(a: any, event : any) {
    if (event) {
      console.log('event if');
    }
  }


  driverStatusChange(event: any) {
    if (event.detail.checked) {
      if (!this.listenerId) { this.rideService.setIncomingRideListener(); }
      this.startOnlineTracking();
    } else {
      this.rideService.clearIncomingRideListener();
      this.stopOnlineTracking();
    }
    this.loggedInUser.available = event.detail.checked;
    this.api.updateDriverData(this.loggedInUser.id, { available: event.detail.checked })
      .subscribe(driver => {
        console.log(driver);
      }, err => console.log(err));

  }

  goToCustomerDetail() {
    this.util.goForward('/customer-detail');
  }

  async requestIgnore() {
    this.util.goForward('/customerRequest');
  }


  async getcurrentLocations() {

    await this.util.getCurrentLatLng()
      .then((resp: any) => { 
        
        this.rideService.center = {
          lat: resp.latitude,
          lng: resp.longitude,
        };
        
        
        
        return resp;   
      })
      .catch(error => {
        console.log('Error getting location', error);
        return null;
      });
  
    
  }


  async onMapReady(mapInstance: google.maps.Map) {
    this.map = mapInstance;
     await this. getcurrentLocations().then((resp: any) => {
      this.mapData.lat = this.rideService.center.lat;
      this.mapData.lng = this.rideService.center.lng;
     
    
      const position = new google.maps.LatLng(this.mapData.lat, this.mapData.lng);
        
      // Crear marcador
      this.marker = new google.maps.Marker({
            position,
            map: this.map,
            draggable: true,
            title: 'Arrástrame',
            icon:{
              url: 'assets/images/location.png', // si tienes un ícono personalizado
              scaledSize: new google.maps.Size(40, 40),  // tamaño personalizado (px)
              origin: new google.maps.Point(0, 0),
              anchor: new google.maps.Point(16, 32) // opcional: punto de anclaje
            } 
        });
        

        

        // Escuchar evento dragend
        this.marker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
        const lat = event.latLng?.lat();
        const lng = event.latLng?.lng();
        
        if (lat !== undefined && lng !== undefined) {
              this.mapData.lat = lat;
              this.mapData.lng = lng;
        
              this.rideService.mapData.lat = lat;
              this.rideService.mapData.lng = lng;
        
              console.log('Dragged to:', lat, lng);
        
              // Actualizar círculo también
              this.circle.setCenter({ lat, lng });
        }



        });
        
          // Crear círculo
          this.circle = new google.maps.Circle({
            strokeColor: '#B5BAE2',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#B5BAE2',
            fillOpacity: 0.35,
            map: this.map,
            center: position,
            radius: 1000,
            draggable: false,
            editable: false,
          });

    }); 
  }


  async getHistory(uid: any): Promise<void> {
    const loader = await this.util.createLoader('Loading Ride History ...');
    await loader.present();

    try {
      const {
        rides,
        totalFare,
        totalDistance,
        totalRides,
        lastDoc,
      } = await this.collectDriverHistory(uid);

      this.walletData = rides;
      this.rideService.stats.totalFare = totalFare;
      this.rideService.stats.totalDistance = totalDistance;
      this.rideService.stats.totalRides = totalRides;
      this.lastDoc = lastDoc;

      this.loadTodayStats();
    } catch (error) {
      console.error('❌ Tab1: Error getting history:', error);
      this.walletData = [];
      this.rideService.stats.totalFare = 0;
      this.rideService.stats.totalDistance = 0;
      this.rideService.stats.totalRides = 0;
    } finally {
      await loader.dismiss();
    }
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.clearOnlineTimer();
  }

  private refreshLoggedInUser(): void {
    this.userSubscription?.unsubscribe();

    this.userSubscription = this.api.getUser().subscribe({
      next: (userData) => {
        if (userData) {
          const merged = {
            ...this.loggedInUser,
            ...userData,
            id: this.loggedInUser?.id ?? userData.id ?? '',
          } as Driver;

          this.loggedInUser = merged;
          this.driverAvailable = this.loggedInUser.available;
        }
      },
      error: (err) => console.error('Error refreshing driver info:', err)
    });
  }

  private loadTodayStats(): void {
    if (!this.loggedInUser?.id) {
      return;
    }

    this.api.getTodayRideStats(this.loggedInUser.id).subscribe({
      next: (stats) => {
        this.rideService.stats = {
          ...this.rideService.stats,
          ...stats,
        };
      },
      error: (err) => {
        console.error('Error loading ride stats:', err);
      },
    });
  }

  private async collectDriverHistory(
    userId: string
  ): Promise<{
    rides: HistoryRide[];
    totalFare: number;
    totalDistance: number;
    totalRides: number;
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  }> {
    let cursor: QueryDocumentSnapshot<DocumentData> | null = null;
    let aggregated: HistoryRide[] = [];
    let totalFare = 0;
    let totalDistance = 0;

    while (true) {
      const page = await firstValueFrom<HistoryRide[]>(
        this.api.getRideHistoryPaginated(
          userId,
          'createdAt',
          this.pageSize,
          cursor
        )
      );

      if (!page || page.length === 0) {
        break;
      }

      aggregated = this.mergeRidesById(aggregated, page);
      totalFare += page.reduce(
        (sum: number, ride: HistoryRide) =>
          sum + Number(ride.totalFare || 0),
        0
      );
      totalDistance += page.reduce(
        (sum: number, ride: HistoryRide) =>
          sum + Number(ride.distance || 0),
        0
      );

      const snapshot = (page[page.length - 1]['__snapshot__'] ??
        null) as QueryDocumentSnapshot<DocumentData> | null;
      cursor = snapshot ?? cursor;

      if (!snapshot || page.length < this.pageSize) {
        break;
      }
    }

    return {
      rides: aggregated,
      totalFare,
      totalDistance,
      totalRides: aggregated.length,
      lastDoc: cursor,
    };
  }

  private mergeRidesById(
    existing: HistoryRide[],
    incoming: HistoryRide[]
  ): HistoryRide[] {
    const rideMap = new Map<string, HistoryRide>();

    existing.forEach((ride) => {
      if (ride?.id) {
        rideMap.set(ride.id, ride);
      }
    });

    incoming.forEach((ride) => {
      if (ride?.id) {
        rideMap.set(ride.id, ride);
      }
    });

    return Array.from(rideMap.values());
  }

  private loadOnlineStats(): void {
    const todayKey = this.getTodayKey();
    const storedDate = localStorage.getItem('driverOnlineDate');

    if (storedDate && storedDate !== todayKey) {
      this.clearOnlineStorage(storedDate);
    }

    localStorage.setItem('driverOnlineDate', todayKey);

    const accumulatedMs = parseInt(localStorage.getItem(this.getAccumulatedKey(todayKey)) ?? '0', 10);
    this.rideService.stats.hoursOnline = this.msToHours(accumulatedMs);

    const startValue = localStorage.getItem(this.getStartKey(todayKey));
    if (startValue) {
      this.onlineSessionStart = parseInt(startValue, 10);
      this.startOnlineTimer();
    } else {
      this.onlineSessionStart = null;
      this.clearOnlineTimer();
    }
  }

  private startOnlineTracking(): void {
    const todayKey = this.getTodayKey();
    localStorage.setItem('driverOnlineDate', todayKey);

    if (!this.onlineSessionStart) {
      this.onlineSessionStart = Date.now();
      localStorage.setItem(this.getStartKey(todayKey), this.onlineSessionStart.toString());
    }

    this.startOnlineTimer();
  }

  private stopOnlineTracking(clearSession: boolean = true): void {
    const todayKey = this.getTodayKey();
    const accumKey = this.getAccumulatedKey(todayKey);

    if (this.onlineSessionStart) {
      const accumulatedMs = parseInt(localStorage.getItem(accumKey) ?? '0', 10);
      const sessionMs = Date.now() - this.onlineSessionStart;
      const totalMs = accumulatedMs + sessionMs;

      localStorage.setItem(accumKey, totalMs.toString());
      this.rideService.stats.hoursOnline = this.msToHours(totalMs);
    }

    this.clearOnlineTimer();

    if (clearSession) {
      localStorage.removeItem(this.getStartKey(todayKey));
      this.onlineSessionStart = null;
    }
  }

  private startOnlineTimer(): void {
    if (this.onlineTimerId) {
      return;
    }

    this.onlineTimerId = setInterval(() => {
      const todayKey = this.getTodayKey();
      const accumulatedMs = parseInt(localStorage.getItem(this.getAccumulatedKey(todayKey)) ?? '0', 10);
      const sessionMs = this.onlineSessionStart ? Date.now() - this.onlineSessionStart : 0;
      const totalMs = accumulatedMs + sessionMs;

      this.rideService.stats.hoursOnline = this.msToHours(totalMs);
    }, 60_000);
  }

  private clearOnlineTimer(): void {
    if (this.onlineTimerId) {
      clearInterval(this.onlineTimerId);
      this.onlineTimerId = undefined;
    }
  }

  private getTodayKey(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  private getAccumulatedKey(dateKey: string): string {
    return `driverOnlineAccumulated_${dateKey}`;
  }

  private getStartKey(dateKey: string): string {
    return `driverOnlineStart_${dateKey}`;
  }

  private clearOnlineStorage(dateKey: string): void {
    localStorage.removeItem(this.getAccumulatedKey(dateKey));
    localStorage.removeItem(this.getStartKey(dateKey));
  }

  private msToHours(ms: number): number {
    return parseFloat((ms / 3_600_000).toFixed(2));
  }

}


