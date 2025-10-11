import { Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild , Input, Output, EventEmitter} from '@angular/core';
import { isEmpty, Subscription } from 'rxjs';
import { GmapService } from 'src/app/services/gmap/gmap.service';
import { TrackService } from 'src/app/services/track/track.service';
import { UtilService } from 'src/app/services/util/util.service';
import { environment } from 'src/environments/environment';
import { InitUserProvider } from '../../services/inituser/inituser.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: false
})
export class MapComponent  implements OnInit, OnDestroy{
  @ViewChild('map', { static: true }) mapElementRef!: ElementRef;
  @Input() mapLocation : any;
  @Output() LocationInfo = new EventEmitter<string>();

  //mapElementRef: ElementRef;
  googleMaps: any ;
  source: any = {}; // { lat: 18.3916667, lng: -66.1155749 }; //
  dest: any =  {}; // { lat: 18.4078943, lng: -66.1084666 };
  map: any;
  directionsService: any;
  directionsDisplay: any;
  source_marker: any;
  destination_marker: any;
  trackSub!: Subscription;
  sourceIconUrl = 'assets/images/location2.png'; //'assets/imgs/towTruck.png';
  destinationIconUrl = 'assets/images/location2.png';
  linePath: any;

  constructor(
    private maps: GmapService,
    private renderer: Renderer2,
    private track: TrackService,
    private util: UtilService,
    private userProvider: InitUserProvider
  ) { 
  }


  ngOnInit() {
    //this.getCurrentLoaction();
          /*
          this.trackSub = this.track.getLocation().subscribe({
              next: (data) => {
                console.log(data);
                this.source = data ?.source;

                if(!this.dest?.lat) {
                  this.dest = data?.destination;


                  this.loadMap();
                }else {
                  //update marker & route
                  this.changeMarkerPosition(this.source);
                }
              }
            }); 
          */
  }



  ngAfterViewInit(){
  //this.loadMap();
 }
  //.originAddress this.rideService.destinationAddress
 async loadMap(source: any, dest : any) {

  try{
    console.log('map' );
    let googleMaps: any = await this.maps.loadGoogleMaps();
    const mapEl = this.mapElementRef.nativeElement;


    this.source.lat = !source.lat.isEmpty() ? source.lat : dest.origin_lat;
    this.source.lng = !source.lng.isEmpty() ? source.lng : dest.origin_lng;
    this.dest.lat   = dest.destination_lat;
    this.dest.lng   = dest.destination_lng;

    this.map = await new googleMaps.Map( mapEl, { 
      center:  { lat: this.source.lat, lng: this.source.lng },
      disableDefaultUI: true,
      styles: environment.MAP_STYLE,
      zoom: 17,
      mapTypeId: googleMaps.MapTypeId.ROADMAP
    }); 

    //DirectionsService
    this.directionsService = new googleMaps.DirectionsService;
    this.directionsDisplay = new googleMaps.DirectionsRenderer;
    this.directionsDisplay = new googleMaps.DirectionsRenderer();
    

    const source_position = new googleMaps.LatLng(this.source.lat , this.source.lng);
    const destination_position = new googleMaps.LatLng(this.dest.lat , this.dest.lng);

    console.log('source_position' + source_position);
    console.log('destination_position' + destination_position);


    // Adds markers to the map.
    // Marker sizes are expressed as a Size of X,Y where the origin of the image
    // (0,0) is located in the top left of the image.
  
    // Origins, anchor positions and coordinates of the marker increase in the X
    // direction to the right and in the Y direction down.
    const source_icon = {
      url: this.sourceIconUrl,
      // This marker is 20 pixels wide by 32 pixels high.
      scaledSize: new google.maps.Size(32, 32),
      // The origin for this image is (0, 0).
      origin: new google.maps.Point(0, 0),
      // The anchor for this image is the base of the flagpole at (0, 32).
      anchor: new google.maps.Point(10, 32),
    };
    // Shapes define the clickable region of the icon. The type defines an HTML
    // <area> element 'poly' which traces out a polygon as a series of X,Y points.
    // The final coordinate closes the poly by connecting to the first coordinate.
    const shape = {
      coords: [1, 1, 1, 20, 18, 20, 18, 1],
      type: "poly",
    };

     const destination_icon = {
      url: this.destinationIconUrl,
      scaledSize: new googleMaps.Size(32,32), //scaled size
      origin: new googleMaps.Point(0,0), //origin
      anchor: new googleMaps.Point(10,32) //anchor
    };

    this.source_marker = new googleMaps.Marker({
      map: this.map,
      position: source_position,
      animation: googleMaps.Animation.DROP,
      icon: source_icon,
      shape: shape,
    });

     this.destination_marker = new googleMaps.Marker({
      map: this.map,
      position: destination_position,
      animation: googleMaps.Animation.DROP,
      icon: destination_icon,
    }); 

    this.source_marker.setMap(this.map);
    this.destination_marker.setMap(this.map);

    this.directionsDisplay.setMap(this.map);
    this.directionsDisplay.setOptions({
      polylineOptions: {
        strokeWeight:  6,
        strokeOpacity: 2,
        strokeColor: 'black'
      },
      suppressMarkers: true

    }); 

    await this.drawRoute(); 
    
    this.map.setCenter(source_position);
    
    this.renderer.addClass(mapEl, 'visible');
    
  }catch (e) {
    console.log(e);
  }

}


drawRoute() {
  interface LatLng {
    lat: number;
    lng: number;
  }

  interface RouteResponse {
    routes: Array<{
      legs: Array<{
        duration: {
          text: string;
        };
      }>;
    }>;
  }

  this.directionsService.route({
    origin: this.source as LatLng,
    destination: this.dest as LatLng,
    travelMode: 'DRIVING',
    provideRouteAlternatives: true
  }, (response: RouteResponse, status: string) => {
    if (status === 'OK') {
      this.directionsDisplay.setDirections(response);
      console.log('response: ', response);

      const directionsData = response.routes[0].legs[0];
      console.log(directionsData);
      const duration = directionsData.duration.text;
      console.log(duration);

    } else {
      console.log(status);
    }
  });


}


changeMarkerPosition(data: any) {
  const newPosition = {lat: data?.lat, lng: data?.lng }; //Set the new marker position
  this.source_marker.setPosition(newPosition);
  this.map.panTo(newPosition); //Pan the map to the new marker position
  this.drawRoute();
}



ngOnDestroy(): void {
    //if(this.trackSub) this.trackSub.unsubscribe();
}

}
 


