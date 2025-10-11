import { Component, OnInit,AfterViewInit, ViewChild ,ElementRef} from '@angular/core';
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
import { map, Observable } from 'rxjs';
import { MapDirectionsService ,GoogleMap} from '@angular/google-maps';


declare var google: any;


@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit {
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
          this.getcurrentLocations();
         
          console.log('this.rideService.rideStage', this.rideService.rideStage);
          console.log('this.rideService', this.rideService);

          this.rideStage = this.rideService.rideStage;
  }


  async ngOnInit() {
        console.log('ngOnInit');
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

 

  ionViewWillLeave() {
    this.rideService.clearIncomingRideListener();
    this.rideService.clearRideStatusListener();
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
    } else {
      this.rideService.clearIncomingRideListener();
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


}


