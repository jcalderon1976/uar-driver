// shared.module.ts o el módulo correspondiente
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoComponent } from './photo.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [PhotoComponent],
  imports: [CommonModule, IonicModule , FormsModule ],// 👈 IonicModule es necesario para usar componentes de Ionic
  exports: [PhotoComponent] // 👈 necesario para usarlo en otros módulos
})
export class SharedModule {}
