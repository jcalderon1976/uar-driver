import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { DrivingLicensePage } from './driving-license.page';

const routes: Routes = [
  {
    path: '',
    component: DrivingLicensePage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [DrivingLicensePage]
})
export class DrivinglicensePageModule { }
