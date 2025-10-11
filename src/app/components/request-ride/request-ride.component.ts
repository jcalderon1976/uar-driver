import { Component, OnInit, NgZone, Input } from '@angular/core';
import { RideService } from '../../services/ride/ride.service';
import { ModalController } from '@ionic/angular';
import { UtilService } from '../../services/util/util.service';
import { environment } from '../../../environments/environment';

import { APIService } from '../../services/api/api.service';
import { InitUserProvider } from '../../services/inituser/inituser.service';

import { User } from '../../models/user';
import { Ride } from '../../models/ride';

@Component({
  selector: 'app-request-ride',
  templateUrl: './request-ride.component.html',
  styleUrls: ['./request-ride.component.scss'],
  standalone: false 
})
export class RequestRideComponent  implements OnInit {

  public lat: number;
  public lng: number;
  public loggedInUser!: any;
  public zoom!: number;
  public markerOptions = environment.MARKER_OPTIONS;
  public screenOptions: any;
  modalCtrl: any;

   constructor(
    public rideService: RideService,
    private userProvider: InitUserProvider,
    private api: APIService,
    private util: UtilService) {  
      this.lat = this.rideService.direction_lat;
      this.lng = this.rideService.direction_lng;
    }
   
  ngOnInit() {
    // to redirect to further pages if a booking is active //TODO
    this.loggedInUser = this.userProvider.getUserData();
    if (this.loggedInUser) {
      if (this.loggedInUser['ride_started'] === true) {
        this.util.goToNew('/bookingconfirmation');
      }
    }
  }

  Confirmacion() {
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  async alertOnSubmit() {

    await this.util.presentAlert2(
      'Confirm Booking',
      environment.USER_CONFIRM_MSG,
      async () => { 
        console.log('✅ Confirmado'); 
        
      },     // OK handler
      () => { 
        console.log('❌ Cancel booking');
        this.util.goToNew('/tabs');
       }      // Cancel handler
    );
  }

  async bookRide() {
    const loading = await this.util.createLoader('Connecting you to drivers ...');
    await loading.present();

    const rideData: Ride = {
      id: '',
      origin_lat: this.rideService.origin.lat,
      origin_lng: this.rideService.origin.lng,
      origin_address: this.rideService.originAddress,
      destination_lat: this.rideService.destination.lat,
      destination_lng: this.rideService.destination.lng,
      destination_address: this.rideService.destinationAddress,
      tow_type: this.rideService.taxiType,
      driver_rejected: false,
      request_timeout: false,
      ride_accepted: false,
      ride_started: false,
      user_rejected: false,
      ride_completed: false,
      fare: this.rideService.getFare(),
      totalFare: this.rideService.getTotalFare(),
      clientId: this.loggedInUser.id,
      driverId: 0,
      distance: this.rideService.tripDistance,
      //waitingTime: this.rideService.waitingTime,
      createdAt: this.rideService.createdAt,
      paymentMethod: this.rideService.getPaymentMethod()
    };

    this.api.bookRide(rideData)
      .subscribe(async (ride: Ride) => {
        loading.dismiss();
        (document.activeElement as HTMLElement)?.blur(); // 👈 evita el warning
        console.log('ride', ride);
        await this.rideService.setRideInfo(ride);
      });
  }
}


