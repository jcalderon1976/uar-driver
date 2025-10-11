import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { RegisterPageRoutingModule } from './register-routing.module';
import { RegisterPage } from './register.page';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { PhotoComponent } from 'src/app/components/photo/photo.component';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RegisterPageRoutingModule,
    RegisterPage,
    NgxMaskDirective,
    NgxMaskPipe
  ],
  providers: [provideNgxMask(),PhotoComponent],
  declarations: []
})
export class RegisterPageModule {}
