import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tab3Page } from './tab3.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';
import { PhotoComponent } from '../components/photo/photo.component';
import { Tab3PageRoutingModule } from './tab3-routing.module';
import { SharedModule } from '../components/photo/share.module'; // ruta según tu estructura
@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    Tab3PageRoutingModule,
    SharedModule
  ],
  declarations: [Tab3Page]
})
export class Tab3PageModule {}
