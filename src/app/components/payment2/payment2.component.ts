import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { ModalController } from '@ionic/angular';
import { from, Subscription, Subject } from 'rxjs';
import { InitPaymentMethodService } from 'src/app/services/initPaymentMethod/init-payment-method.service';
import { UtilService } from 'src/app/services/util/util.service';
import { Driver } from '../../models/driver';
import { InitUserProvider } from '../../services/inituser/inituser.service';
import { PaymentMethod } from 'src/app/models/paymentMethod';
import { AddCardComponent } from '../add-card/add-card.component';
import { APIService } from '../../services/api/api.service';
import { EditCardComponent } from '../edit-card/edit-card.component';
import { IPayPalConfig, ICreateOrderRequest } from 'ngx-paypal';
import { environment } from 'src/environments/environment';
import { IonHeader, IonList } from '@ionic/angular/standalone';

import Swiper from 'swiper';
import { SwiperOptions } from 'swiper/types';

@Component({
  selector: 'app-payment',
  templateUrl: './payment2.component.html',
  styleUrls: ['./payment2.component.scss'],
  standalone: false,
})
export class Payment2Component implements OnInit, OnDestroy {
  @ViewChild('toolbar', { read: ElementRef }) toolbarRef!: ElementRef;
  @ViewChild('swiperContainer', { static: false }) swiperContainer!: ElementRef;
  swiper!: Swiper;

  cardDetails: any;
  paymentMethodsList: PaymentMethod[] = [];
  selectedCardIndex: number = 0; // Default selected index
  loggedInUser!: Driver;
  subscriptions: Subscription = new Subscription(); // Manage subscriptions
  selectedCardId: number | null = null; // Track selected card
  paymentList: boolean = true;
  paymentOptions: boolean = false;
  PayPalOptions: boolean = false;
  customAlertOptions: any = {
    header: 'Select Card Type',
  };

  checkmarkImg = '../../../assets/cards/Default_Checkmark.png';
  // PayPal configuration
  public payPalConfig?: IPayPalConfig;
  public payPalConfigCredit?: IPayPalConfig;
  private destroy$ = new Subject<void>();

  constructor(
    private modalCtrl: ModalController,
    private addCard: InitPaymentMethodService,
    private util: UtilService,
    private api: APIService,
    private userProvider: InitUserProvider,
    private cdr: ChangeDetectorRef
  ) {}

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

    const config: SwiperOptions = {
      effect: 'coverflow',
      grabCursor: true,
      centeredSlides: true,
      slidesPerView: 'auto',
      coverflowEffect: {
        rotate: 50,
        stretch: 0,
        depth: 100,
        modifier: 1,
        slideShadows: true,
      },
      pagination: { el: '.swiper-pagination' },
    };

    this.swiper = new Swiper(this.swiperContainer.nativeElement, config);
  }

  /** Llamar esto después de añadir la tarjeta */
  focusOnNewCard() {
    const index = this.paymentMethodsList.length - 1; // Última tarjeta añadida
    setTimeout(() => {
      this.swiper.slideTo(index, 500); // 500ms de animación
    }, 100); // ⏳ Esperar que Angular renderice
  }

  async ngOnInit() {
    this.paymentList = true;
    this.paymentOptions = false;
    this.PayPalOptions = false;

    // Fetch logged-in user data
    this.loggedInUser = this.userProvider.getUserData();

    // Fetch payment methods and determine default

    const paymentMethodSubscription = from(
      this.addCard.getPaymentMethodData(this.loggedInUser.id)
    ).subscribe((array) => {
      this.paymentMethodsList = array;

      this.cdr.detectChanges();

      setTimeout(() => {
        const swiper = new Swiper('.mySwiper', {
          effect: 'coverflow',
          grabCursor: true,
          centeredSlides: true,
          slidesPerView: 'auto',
          coverflowEffect: {
            rotate: 50,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: true,
          },
          pagination: {
            el: '.swiper-pagination',
          },
        });
      }, 0);

      // Set default selected card if available
      const defaultCardIndex = this.paymentMethodsList.findIndex(
        (card) => card.DefaultPaymentMethod
      );
      if (defaultCardIndex !== -1) {
        this.selectedCardIndex = defaultCardIndex;
      } else {
        this.selectedCardIndex = 0;
      }
    });

    // Add subscription to the list
    this.subscriptions.add(paymentMethodSubscription);
  }

  maskCardNumber(cardNumber: string): string {
    if (!cardNumber) return '';
    return `**** **** **** ${cardNumber.slice(-4)}`;
  }

  getImage(paymentMethod: string): string {
    const images = {
      visa: 'assets/cards/visa2.png',
      mastercard: 'assets/cards/mastercard2.png',
      discover: 'assets/cards/discover.png',
      amex: 'assets/cards/amex.png',
    };
    return (
      images[paymentMethod as keyof typeof images] ||
      'assets/cards/discover.png'
    );
  }

  saveCard() {
    this.modalCtrl.dismiss();
  }

  addPayment() {
    this.paymentList = true;
    this.paymentOptions = false;
    this.PayPalOptions = false;
  }

  async addCreditCard() {
    this.paymentList = true;
    this.paymentOptions = false;
    this.PayPalOptions = false;
    const modal = await this.util.createModal(AddCardComponent);

    modal.onWillDismiss().then(async (dataReturned) => {
      this.addCard
        .getPaymentMethodData(this.loggedInUser.id)
        .then(async (result) => {
          this.paymentMethodsList = result;
          console.dir(this.paymentMethodsList);
          this.focusOnNewCard(); // 👉 Mueve el Swiper a la nueva tarjeta
        });
    });

    return await modal.present();
  }

  addPayPal() {
    this.paymentOptions = false;
    this.paymentList = false;
    this.PayPalOptions = true;
    //this.initPayPalConfig();
  }

  /* private initPayPalConfig(): void {
    this.payPalConfig = {
      currency: environment.PAYPAL_CONFIGURATION.currency , //'USD',
      clientId: environment.PAYPAL_CONFIGURATION.clientId ,  //'AZtN3jlfoMwBOBTuOxo5oQSmDBMY5eBvubO0mmaM603HsWJlUZBOpAQqpHG6-7zpQdIQQfWWdquhy8Vv'
      createOrderOnClient: (data) => <ICreateOrderRequest>{
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: '10.00'
          }
        }]
      },
      onApprove: async (data, actions) => {
        const details = await actions.order.get();
        const payer = details.payer;
  
        // 🔥 Aquí obtienes nombre y email
        const userName = `${payer.name.given_name} ${payer.name.surname}`;
        const userEmail = payer.email_address;
  
        console.log('PayPal User:', userName);
        console.log('PayPal Email:', userEmail);
  
        // ✅ Puedes guardar en Firestore, tu API, etc.
        this.saveUser(userName, userEmail);
      },
      onClientAuthorization: (data) => {
        console.log('Transacción completada:', data);
      },
      style: {
        label: 'paypal',
        layout: 'vertical'
      }
    };
  }
  

 */

  goBack() {
    this.modalCtrl.dismiss();
  }

  async cardEvent(card: PaymentMethod, index: number) {
    // Lógica para manejar la tarjeta
    const modal = await this.util.createModal(EditCardComponent, card);

    modal.onWillDismiss().then(async (dataReturned) => {
      if (dataReturned != null) {
        console.dir(dataReturned);

        const paymentMethodSubscription = from(
          this.addCard.getPaymentMethodData(this.loggedInUser.id)
        ).subscribe((array) => {
          this.paymentMethodsList = array;
        });
      }
    });

    return await modal.present();
  }

  ngOnDestroy(): void {
    // Emitir valor para romper todas las suscripciones
    this.destroy$.next();
    this.destroy$.complete();

    // Unsubscribe to avoid memory leaks
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }

  onRadioClick(index: number, card: any) {
    console.log('Radio clicked! Index:', index);
    console.log('Selected Card:', card);
    //Do logic. Set Card Default
    //card.DefaultPaymentMethod = true;
    // this.api.setPaymentMethodDefault(this.loggedInUser.id, card);
  }

  async onRadioChange(event: any) {
    const newDefaultIndex = event.detail.value;
    const newDefaultCard = this.paymentMethodsList[newDefaultIndex];

    console.dir(this.paymentMethodsList);

    if (!newDefaultCard || !newDefaultCard.clientId) return;

    // Reset all DefaultPaymentMethod to false first
    this.paymentMethodsList.forEach((payment) => {
      console.log(`Document ID: ${payment.id}`);

      if (payment.id == newDefaultCard.id) {
        // Update the new Default Card.
        payment.DefaultPaymentMethod = true;
        this.api.setPaymentMethodDefault(payment.id, payment);
      } else {
        payment.DefaultPaymentMethod = false;
        this.api.setPaymentMethodDefault(payment.id, payment);
      }
    });
  }
}
