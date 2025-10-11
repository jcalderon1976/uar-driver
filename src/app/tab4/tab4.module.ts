import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tab4Page } from './tab4.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';
import { PhotoComponent } from '../components/photo/photo.component';
import { Tab4PageRoutingModule } from './tab4-routing.module';
import { SharedModule } from '../components/photo/share.module'; // ruta según tu estructura
@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    Tab4PageRoutingModule,
    SharedModule
  ],
  declarations: [Tab4Page]
})
export class Tab4PageModule {}
