import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ModalController, NavController } from '@ionic/angular';
import { InitUserProvider } from '../../services/inituser/inituser.service';
import { APIService } from '../../services/api/api.service';
import { environment } from '../../../environments/environment';
import { Ride } from '../../models/ride';
import { UtilService } from '../../services/util/util.service';
import { RideService } from '../../services/ride/ride.service';
import { Driver } from '../../models/driver';
//import { PickupPage } from 'src/app/pages/pickup/pickup.page';
import { PickupComponent } from '../pickup/pickup.component';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Subscription } from 'rxjs';
import { IonToolbar, IonTitle } from '@ionic/angular/standalone';

@Component({
  selector: 'app-booking-confirmation',
  templateUrl: './booking-confirmation.component.html',
  styleUrls: ['./booking-confirmation.component.scss'],
  standalone: false,
})
export class BookingConfirmationComponent implements OnInit, OnDestroy {
  @ViewChild('toolbar', { read: ElementRef }) toolbarRef!: ElementRef;
  public progress = 10;
  public loader!: HTMLIonLoadingElement;
  public loaderListenerId: number | null = null;
  public timeoutListenerId: number | undefined;
  public delayAlert: HTMLIonAlertElement | null = null;
  public cancelAlert!: HTMLIonAlertElement;
  public rideId!: string;
  public listenerId: number | null = null;
  public loggedInUser!: Driver;
  public lat: number;
  public lng: number;
  public pickupAceptept = false;
  private destroy$ = new Subject<void>();
  private getRideSubscription!: Subscription; // Store the subscription
  private setRideSubscription!: Subscription; // Store the subscription

  constructor(
    private navCtrl: NavController,
    public rideService: RideService,
    private util: UtilService,
    private userProvider: InitUserProvider,
    private api: APIService,
    private modalCtrl: ModalController
  ) {
    this.lat = this.rideService.direction_lat;
    this.lng = this.rideService.direction_lng;
    this.preLoad();
  }

  ngAfterViewInit() {
    const toolbarEl = this.toolbarRef.nativeElement;
    const shadowRoot = toolbarEl.shadowRoot;

    if (shadowRoot) {
      const style = document.createElement('style');
      style.textContent = `
        .toolbar-background {
          background: linear-gradient(45deg, #FE695D, #AA2CE6) !important;
        }
      `;
      shadowRoot.appendChild(style);
    }
  }

  async ngOnInit() {
    this.pickupAceptept = false;
  }

  ngOnDestroy(): void {
    // Emitir valor para romper todas las suscripciones
    this.destroy$.next();
    this.destroy$.complete();

    // Unsubscribe to avoid memory leaks
    if (this.getRideSubscription) {
      this.getRideSubscription.unsubscribe();
    }
    if (this.setRideSubscription) {
      this.setRideSubscription.unsubscribe();
    }
  }

  async preLoad() {
    // to redirect to further pages if a booking is active //TODO
    this.loggedInUser = await this.userProvider.getUserData();

    console.log('this.loggedInUser ');
    console.dir(this.loggedInUser);

    /*  if (this.loggedInUser) {
        if (this.loggedInUser['ride_started'] === true) {
          this.util.goToNew('/bookingconfirmation');
        }
      } */

    console.log('this.userProvider');
    console.dir(this.userProvider);
    //const result = await this.userProvider.getRideId();
   // this.rideId = result?.toString() || ''; // Convert to string or set to empty string if null
   // console.log('rideId');
   // console.dir(this.rideId);

    //Verifica si el usuario tiene un viaje activo
    //if (this.rideId) {
//console.log('send to booked ride', this.rideId);
   // /  this.load();
   // } else {
   //   this.bookRide().then(() => {
   //     this.load();
   //   }); // Book a ride and then load
   // }
  }

  async load() {
    this.createLoaderBar();
    this.setRideStatusListener();
    this.setLoaderBar();
    //this.rideId = await this.userProvider.getRideId();
    console.log('SetLoggedinUser', this.loggedInUser);
  }

  async createLoaderBar() {
    (document.activeElement as HTMLElement)?.blur();
    this.loader = await this.util.createLoader(
      'Waiting for driver response...'
    );
    await this.loader.present();
  }

  setLoaderBar() {
    console.log(
      '>1>1>1>1>1>1>1>1>1>1>1>> SET LOADER BAR LISTENER <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<'
    );
    this.loaderListenerId = <number>(<unknown>setInterval(() => {
      this.progress += 5;
      if (this.progress > 90 && this.loaderListenerId !== null) {
        clearInterval(this.loaderListenerId);
      }
    }, 2000));
  }

  setRideStatusListener() {
    if (this.listenerId == null) {
      this.listenerId = <number>(<unknown>setInterval(() => {
        this.checkRideStatus();
      }, 7000));
      console.log(
        '>2>2>2>2>2>2>2>2>2>2>2>> setInterval(7000) SET RIDE STATUS  LISTENER this.listenerId= ' +
          this.listenerId +
          '  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<'
      );
    }
    if (this.timeoutListenerId == null) {
      this.timeoutListenerId = <number>(<unknown>setTimeout(() => {
        this.api.setRideTimeOut(this.rideId).subscribe(
          (res) => {
            if (res.message[0]) {
              this.clearRideStatusListener();
              this.showTimeOutAlert();
            }
          },
          (err) => console.log(err)
        );
      }, 60000));
      console.log(
        '>3>3>3>3>3>3>3>3>3>3>3>> setTimeout(60000) SET RIDE STATUS  LISTENER his.timeoutListenerId =' +
          this.timeoutListenerId +
          ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<'
      );
    }
  }

  clearRideStatusListener() {
    if (this.listenerId != null) {
      console.log(
        '*************CLEAR LISTENER BOOKIN CONFIRMATION***************************this.listenerId=>' +
          this.listenerId
      );
      clearInterval(this.listenerId);
      this.listenerId = null;
    }
    if (this.loaderListenerId != null) {
      console.log(
        '*************this.loaderListenerId=>' + this.loaderListenerId
      );
      clearInterval(this.loaderListenerId);
      this.loaderListenerId = null;
    }
    if (this.timeoutListenerId != null) {
      console.log(
        '*************this.timeoutListenerId=>' + this.timeoutListenerId
      );
      clearTimeout(this.timeoutListenerId);
      this.timeoutListenerId = undefined;
    }

    this.loader.dismiss();
    (document.activeElement as HTMLElement)?.blur(); // 👈 evita el warning
  }

  async checkRideStatus() {
    console.log('SetLoggedinUser', this.loggedInUser);
    console.log('status check.....');
    console.dir(this.rideId);

    this.api
      .getRide(this.rideId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((ride: Ride) => {
        if (ride && ride['ride_accepted'] && !this.pickupAceptept) {
         // this.userProvider.setRideId(this.rideId); // Set the ride ID in the user provider
          this.clearRideStatusListener();
          this.api.getDriver(ride.driverId).subscribe(
            (driver) => {
              Object.assign(this.rideService.driverInfo, driver);
            },
            (err) => console.log(err)
          );
          console.log('RIDER ACCEPTED');
          this.GoPickupModal(ride);
          this.pickupAceptept = true;
          //this.util.goToNew('/pickup');
        } else {
          console.log('waiting for response from driver'); // TODO
        }

        //check if getRide listener is end
      });
  }

  async GoPickupModal(ride: any) {
    if (ride['ride_accepted'] && !ride['ride_started']) {
      this.modalCtrl.dismiss();
      const modal = await this.util.createModal(PickupComponent);
      await modal.present();
      await modal.onDidDismiss();
    }
  }

  async showTimeOutAlert() {
    if (!this.delayAlert) {
      this.util
        .presentAlert('Sorry!', environment.DRIVER_DELAY_MSG, 'OK')
        .then(() => {
          this.rideService.resetRideSettings();
          this.modalCtrl.dismiss();
        });
    }
  }

  goBack() {
    this.navCtrl.back();
  }

  ionViewWillLeave() {
    this.delayAlert = null;
    this.clearRideStatusListener();
  }

  submit() {
    this.modalCtrl.dismiss();
  }

  async bookRide() {
    console.log('this.rideService ');
    console.dir(this.rideService);

    const loading = await this.util.createLoader(
      'Connecting you to drivers ...'
    ); //
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
      paymentMethod: this.rideService.getPaymentMethod(),
    };

    console.log('rideData =>');
    console.dir(rideData);

    this.api.bookRide(rideData).subscribe(async (ride: Ride) => {
      loading.dismiss();
      (document.activeElement as HTMLElement)?.blur(); // 👈 evita el warning
      console.log('ride', ride);
      this.rideId = ride.id;
      await this.rideService.setRideInfoBooking(ride);
    });
  }
}
