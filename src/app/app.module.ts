import { NgModule,NO_ERRORS_SCHEMA , CUSTOM_ELEMENTS_SCHEMA , APP_INITIALIZER} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { GoogleMapsModule } from '@angular/google-maps';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgxPayPalModule } from 'ngx-paypal';

//Routing
import { AppRoutingModule } from './app-routing.module';
//Components
import { AppComponent } from './app.component';
import { BookingConfirmationComponent } from './components/booking-confirmation/booking-confirmation.component';
//import { MapComponent } from './components/map/map.component';
import { PickupComponent } from './components/pickup/pickup.component';
import { LegalComponent } from './components/legal/legal.component';
import { SettingAccountComponent } from './components/setting-account/setting-account.component';
import { AddCardComponent } from './components/add-card/add-card.component';
import { PaymentComponent } from './components/payment/payment.component';
import { CarInfoComponent } from './components/car-info/car-info.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { ChangeUserComponent } from './components/change-user/change-user.component';
import { CameraUploadComponent } from './components/app-camera-upload/app-camera-upload.component';
import { EditCardComponent } from './components/edit-card/edit-card.component';
import { Payment2Component } from './components/payment2/payment2.component';
import { ChangePaymentComponent } from './components/change-payment/change-payment.component';
import { SetLocationComponent } from './components/set-location/set-location.component';  
import { RequestRideComponent } from  './components/request-ride/request-ride.component';  
import { PhotoComponent } from './components/photo/photo.component';

// AngularFire
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

//Environment
import { environment } from '../environments/environment';

//services
import { GmapService } from 'src/app/services/gmap/gmap.service';
import { InitUserProvider } from  './services/inituser/inituser.service';

//import { LaunchNavigator } from '@ionic-native/launch-navigator/ngx';
import { IonicStorageModule } from '@ionic/storage-angular';
import { LottieComponent, provideLottieOptions } from 'ngx-lottie';
import player from 'lottie-web';

@NgModule({
  declarations: [
    AppComponent,
    BookingConfirmationComponent,LegalComponent,AddCardComponent,PaymentComponent,
    CarInfoComponent,ChangePasswordComponent,ChangeUserComponent,SettingAccountComponent,
    PickupComponent,Payment2Component,EditCardComponent,ChangePaymentComponent,
    SetLocationComponent,RequestRideComponent,
   // MapComponent
  ],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonicStorageModule.forRoot(),
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    GoogleMapsModule,NgxPayPalModule,
    //,SetLocationComponent,RequestRideComponent,
    NgxMaskDirective,
    NgxMaskPipe,
    FormsModule
  ],
  //exports: [MapComponent],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideNgxMask(),
    provideLottieOptions({ player: () => player }),
    GmapService,//LaunchNavigator,
    InitUserProvider,
    {
      provide: APP_INITIALIZER,
      useFactory: initUserProviderFactory,
      deps: [InitUserProvider],
      multi: true
    },
    BookingConfirmationComponent,
    PickupComponent,SettingAccountComponent,LegalComponent,AddCardComponent,PaymentComponent,CameraUploadComponent,
    CarInfoComponent,ChangePasswordComponent,ChangeUserComponent,SettingAccountComponent,EditCardComponent,
    Payment2Component,ChangePaymentComponent,SetLocationComponent,RequestRideComponent,PhotoComponent
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
//export class MapModule {}
export function initUserProviderFactory(provider: InitUserProvider) {
  return () => provider.load();
}
