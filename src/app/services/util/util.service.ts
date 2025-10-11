import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import {
  ActionSheetController,
  AlertController,
  LoadingController,
  ModalController,
  NavController,
  ToastController
} from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { Plugins } from '@capacitor/core';
const { Browser } = Plugins;
//import { LaunchNavigator, LaunchNavigatorOptions } from '@ionic-native/launch-navigator/ngx';
import { Capacitor } from '@capacitor/core';

declare let google: any;

@Injectable({
  providedIn: 'root'
})
export class UtilService {
  private coordinates: { latitude: number; longitude: number } | null = null;
  
  constructor(
    private toastCtrl: ToastController,
    private alertController: AlertController,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController,
    //private launchNavigator: LaunchNavigator,
  ) {}

  async presentAlert(header: string, message: string, buttonText: string = 'OK' ) {
    (document.activeElement as HTMLElement)?.blur();
    const alert = await this.alertController.create({
      header,
      message,
      buttons: [
        {
          text: buttonText,
          role: 'cancel',
          cssClass: 'alert-button-custom'
        }
      ],
      cssClass: 'custom-alert-card'
    });
    await alert.present();
   }  
  
   async presentAlert2( header: string, message: string, okHandler?: () => void, cancelHandler?: () => void, buttonText: string = 'OK' ) {
      (document.activeElement as HTMLElement)?.blur();
      const alert = await this.alertController.create({
        header,
        message,
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            cssClass: 'custom-cancel-btn',
            handler: () => {
              if (cancelHandler) cancelHandler();
            }
          },
          {
            text: buttonText,
            role: 'confirm',
            cssClass: 'custom-ok-btn',
            handler: () => {
              if (okHandler) okHandler();
            }
          }
        ],
        cssClass: 'custom-alert-card'
      });
    
      await alert.present();
  }

  async createAlert(header: string, backdropDismiss: boolean, message: string, buttonOptions1 : string, buttonOptions2?: string): Promise<HTMLIonAlertElement> {
    const alert = await this.alertController.create({
      header,
      backdropDismiss,
      message,
      buttons: !buttonOptions2 ? [buttonOptions1] : [buttonOptions1, buttonOptions2],
      cssClass: 'custom-alert-card'
    });
    return alert;
  }

  async showToast(message: string) {
    (document.activeElement as HTMLElement)?.blur();
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }

  async createLoader(message: string): Promise<HTMLIonLoadingElement> {
    return await this.loadingCtrl.create({ message });
  }

  validateEmail(email: string): boolean {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  goToNew(route: string) {
    this.navCtrl.navigateRoot(route);
  }

  goBack(route: string) {
    this.navCtrl.navigateBack(route);
  }

  goForward(route: string) {
    this.navCtrl.navigateForward(route);
  }

  async createModal(component: any, componentProps?: any, cssClass?: string): Promise<HTMLIonModalElement> {

    (document.activeElement as HTMLElement)?.blur(); // 👈 remueve foco del botón actual
    return await this.modalCtrl.create({
      component,
      cssClass,
      componentProps: {
        dataFromParent: componentProps
      }
    });
  }

  async createActionSheet(button1: any, button2?: any, button3?: any) {
    (document.activeElement as HTMLElement)?.blur();
    const buttons = [button1, button2, button3].filter(Boolean); // Elimina undefined
    return await this.actionSheetCtrl.create({ buttons });
  }

  latLngConverterSQL(locations: any[]) {
    return locations.map((location: any) => ({
      ...location,
      origin: { lat: location.origin_lat, lng: location.origin_lng },
      destination: { lat: location.destination_lat, lng: location.destination_lng }
    }));
  }

  async getCurrentLatLng() {
    try {
      this.resetCoordinates();
      const position = await Geolocation.getCurrentPosition();
      this.coordinates = position.coords;
      console.log('Coordinates:', this.coordinates);
       return this.coordinates;

        } catch (error: any) {
                if (error.code === 1) {
                  console.error('Permiso de ubicación denegado.');
                  // Aquí puedes mostrar una alerta al usuario
                } else {
                  console.error('Error obteniendo ubicación:', error.message);
                }
                return null; // o manejar el error de otra manera
        }     
   }

  resetCoordinates() {
    this.coordinates = null;
    console.log('Coordinates reset');
  }

  getCoordinates() {
    return this.coordinates;
  }

  async getGooglePlaceAutoCompleteList(searchText: string, geolocation: any, country: string) {
    const service = new google.maps.places.AutocompleteService();
    return await new Promise((resolve) => {
      service.getPlacePredictions(
        {
          input: searchText,
          componentRestrictions: { country: country || environment.COUNTRY }
        },
        (predictions: any) => resolve(predictions)
      );
    });
  }

  async getGeoCodedAddress(lat: number, lng: number) {
    let block, street, building, country, full_address = '';

    const geocoder = new google.maps.Geocoder();
    const latlng = new google.maps.LatLng(lat, lng);
    const request = { location: latlng };

    await new Promise((resolve) => {
      geocoder.geocode(request, (results: any, status: any) => {
        if (status === google.maps.GeocoderStatus.OK && results?.length > 0) {
          const components = results[0].address_components;
          components.forEach((comp: any) => {
            const types = comp.types;
            if (types.includes('route')) full_address += ` ${comp.short_name}`;
            if (types.includes('sublocality')) full_address += ` ${comp.short_name}`;
            if (types.includes('locality')) full_address += ` ${comp.short_name}`;
            if (types.includes('country')) {
              country = comp.short_name;
              environment.COUNTRY = country;
              full_address += `, ${country}`;
            }
            if (types.includes('postal_code')) full_address += ` ${comp.short_name}`;
          });

          block = components[0]?.long_name;
          building = components[1]?.short_name;
          street = components[2]?.short_name;
        }
        resolve(true);
      });
    });

    return { block, street, building, country, full_address };
  }

  startNavigationToPickup(startLocation: any, endLocation : any) {
  //   const options: LaunchNavigatorOptions = {
  //     start: startLocation,
  //     app: this.launchNavigator.APP.GOOGLE_MAPS,
  //   };

  //   this.launchNavigator.navigate(endLocation, options)
  //     .then(
  //       success => console.log('Launched navigator', success),
  //       error => console.log('Error launching navigator', error)
  //     );
  // 
  }

  

  call(number:any) {


    if (Capacitor.isNativePlatform()) {
      window.open(`tel:${number}`, '_system');
    } else {
      console.warn('Este botón solo funciona en un dispositivo móvil.');
    }
 
  }

}
