import { SharedModule } from '../photo/share.module'; // Asegúrate de que la ruta sea correcta
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SettingAccountComponent } from './setting-account.component'; // Asegúrate de que la ruta sea correcta

@NgModule({
  //declarations: [SettingAccountComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule // 👈 esto es clave
  ]
})

export class SettingAccountModule {}