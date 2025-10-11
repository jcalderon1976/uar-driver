import { Component, OnInit, NgZone, Input, ViewChild } from '@angular/core';
import { RideService } from '../../services/ride/ride.service';
import { ModalController } from '@ionic/angular';
import { UtilService } from '../../services/util/util.service';
import { environment } from '../../../environments/environment';
import { IonSearchbar } from '@ionic/angular';

@Component({
  selector: 'app-setlocation',
  templateUrl: './set-location.component.html',
  styleUrls: ['./set-location.component.scss'],
  standalone: false
})
export class SetLocationComponent implements OnInit {
  textoBuscar: string = '';
  public searchItem = '';
  autocompleteItems: string[] = [];
  item: any;
  @Input() country!: string;
  @ViewChild('searchbar', { static: false, read: IonSearchbar }) searchbar!: IonSearchbar;

  constructor(
    private __zone: NgZone,
    private rideService: RideService,
    private modalCtrl: ModalController,
    private util: UtilService
  ) {
  }
  ionViewDidEnter() {
    this.searchbar?.setFocus()
  }
  ngOnInit() {
    this.searchbar?.setFocus()
  }

  onSearchChange(event: any)
  {
    this.textoBuscar = event.detail.value;
    console.log(this.textoBuscar);
    
  }

  async searchOnChange(event: any) {

    this.searchItem = event.detail.value;
    console.log('searchItem=>' + this.searchItem);

    if (this.searchItem) {
      const predictions = await this.util.getGooglePlaceAutoCompleteList(this.searchItem, {}, environment.COUNTRY);
      this.autocompleteItems = [];
      console.log('predictions=' + predictions);
      this.__zone.run(() => {
        if (Array.isArray(predictions)) {
          predictions.forEach((prediction) => {
            this.autocompleteItems.push(prediction.description);
          });
        }
      });
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  reset() {
    this.searchItem = '';
  }

  chooseItem(address: any) {
    this.rideService.getLatLan(address).subscribe(
      result => {
        if (result) {
          this.__zone.run(() => {
            if (this.rideService.locationType === 'destination') {
              this.rideService.destination = { lat: result.lat(), lng: result.lng() };
              this.rideService.destinationAddress = address;
            }
            if (this.rideService.locationType === 'pickup') {
              this.rideService.originAddress = address;
              this.rideService.origin = { lat: result.lat(), lng: result.lng() };
            }
            this.modalCtrl.dismiss();
          });
        }
      }, error => console.log(error),
      () => console.log(`${this.rideService.locationType} selected`)
    );
  }
}

