import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,  // ✅ Ensure it's a standalone component
  imports: [IonicModule, CommonModule], // ✅ Import IonicModule to support Ionic components
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],

})
export class HomePage {

  constructor() {}

}
