import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule ,ReactiveFormsModule} from '@angular/forms';
import { Tab1PageRoutingModule } from './tab1-routing.module';
import { Tab1Page } from './tab1.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';
//import { MapComponent } from '../components/map/map.component';
import { GoogleMapsModule } from '@angular/google-maps';
import { RequestRideComponent} from '../components/request-ride/request-ride.component';
import { NgxPayPalModule } from 'ngx-paypal';
//import { PayPalComponent } from '../../components/pay-pal/pay-pal.component';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    Tab1PageRoutingModule,
    ExploreContainerComponentModule,
    ReactiveFormsModule ,
    GoogleMapsModule,
    NgxPayPalModule //,
   // MapComponent   
    
  ],
  declarations: [Tab1Page ],
  
})
export class Tab1PageModule {}
