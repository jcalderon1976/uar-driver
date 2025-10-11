import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Tab1Page } from './tab1.page';
import { NgxPayPalModule } from 'ngx-paypal';
const routes: Routes = [
  {
    path: '',
    component: Tab1Page,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes),NgxPayPalModule],
  exports: [RouterModule]
})
export class Tab1PageRoutingModule {}
