import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { RideService } from '../../services/ride/ride.service';
import { ModalController } from '@ionic/angular';
import { PaymentMethod } from 'src/app/models/paymentMethod';
import { APIService } from 'src/app/services/api/api.service';
import { Driver } from 'src/app/models/driver';
import { InitUserProvider } from 'src/app/services/inituser/inituser.service';
import { from, Subscription, Subject } from 'rxjs';
import { InitPaymentMethodService } from 'src/app/services/initPaymentMethod/init-payment-method.service';
import { UtilService } from 'src/app/services/util/util.service';
import { AddCardComponent } from '../add-card/add-card.component';
import Swiper from 'swiper';
import { SwiperOptions } from 'swiper/types';

@Component({
  selector: 'app-change-payment',
  templateUrl: './change-payment.component.html',
  styleUrls: ['./change-payment.component.scss'],
  standalone: false,
})
export class ChangePaymentComponent implements OnInit {
  @ViewChild('toolbar', { read: ElementRef }) toolbarRef!: ElementRef;
  @ViewChild('swiperContainer', { static: false }) swiperContainer!: ElementRef;
  swiper!: Swiper;
  private destroy$ = new Subject<void>();

  checkmarkImg = '../../../assets/cards/Default_Checkmark.png';
  paymentOptions = [
    {
      id: 1,
      name: 'paypal',
      description: 'PayPal',
      logo: 'logo-paypal',
      isChecked: 'checked',
    },
    {
      id: 2,
      name: 'credit',
      description: 'Credit / Debit Card',
      logo: 'card',
      isChecked: 'checked',
    },
    {
      id: 3,
      name: 'cash',
      description: 'Cash',
      logo: 'cash',
      isChecked: 'checked',
    },
  ];
  paymentMethodsList: PaymentMethod[] = [];
  paymentMethod!: PaymentMethod;
  selectedPaymentOption: string = '';
  public totalFare!: number;
  public tripTime!: number;
  selectedCardIndex: number = 0; // Default selected index
  loggedInUser!: Driver;
  subscriptions: Subscription = new Subscription(); // Manage subscriptions
  // Definición clara y consistente

  paypal: PaymentMethod = {
    id: '',
    isSelected: 0,
    clientId: '',
    clientName: '',
    cardNumber: 'P A Y  P A L',
    paymentMethod: 'paypal',
    SecurityCode: 0,
    ExpireDate: 9999,
    BillingZipCode: 0,
    DefaultPaymentMethod: false,
    image: 'assets/cards/paypal.png',
    email: '',
  };

  cash: PaymentMethod = {
    id: '',
    isSelected: 0,
    clientId: '',
    clientName: '',
    cardNumber: 'C A S H',
    paymentMethod: 'cash',
    SecurityCode: 0,
    ExpireDate: 9999,
    BillingZipCode: 0,
    DefaultPaymentMethod: false,
    image: 'assets/cards/cash.png',
    email: '',
  };

  constructor(
    public rideService: RideService,
    private modalCtrl: ModalController,
    private api: APIService,
    private userProvider: InitUserProvider,
    private util: UtilService,
    private addCard: InitPaymentMethodService
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

  ngOnInit() {
    this.totalFare = this.rideService.getFare();
    this.tripTime = this.rideService.duration;

    // Fetch logged-in user data
    this.loggedInUser = this.userProvider.getUserData();

    // Fetch payment methods and determine default
    const paymentMethodSubscription = from(
      this.addCard.getPaymentMethodData(this.loggedInUser.id)
    ).subscribe((array) => {
      this.paymentMethodsList = array;
      this.paypal.clientName = this.loggedInUser.name;
      this.cash.clientName = this.loggedInUser.name;
      this.paymentMethodsList.push(this.paypal);
      this.paymentMethodsList.push(this.cash);
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

    //this.swiper = new Swiper(this.swiperContainer.nativeElement, config);
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

  compareWith(o1: any, o2: any) {
    return o1.id === o2.id;
  }

  handleChange(ev: any) {
    this.selectedPaymentOption = ev.target.value.name;
    console.log(ev.target.value.name);
  }

  trackItems(index: number, item: any) {
    return item.id;
  }

  submit() {
    const data = { value: this.selectedPaymentOption };
    console.log('inside submit: data = ' + this.selectedPaymentOption);
    this.modalCtrl.dismiss(data);
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

  onRadioClick(index: number, card: any) {}

  maskCardNumber(
    cardNumber: string,
    paymentMethod: string,
    email: string
  ): string {
    switch (paymentMethod) {
      case 'cash': {
        return `Efectivo `;
        break;
      }
      case 'paypal': {
        return email;
        break;
      }
      default: {
        if (!cardNumber) return '';
        return `XXXX-XXXX-XXXX-${cardNumber.slice(-4)}`;
        break;
      }
    }
    return '';
  }

  maskCardNumber2(cardNumber: string): string {
    if (!cardNumber) return '';
    else if (cardNumber === 'P A Y  P A L') return cardNumber;
    else if (cardNumber === 'C A S H') return cardNumber;
    else {
      return `**** **** **** ${cardNumber.slice(-4)}`;
    }
  }
  maskExpiryDate(expiredDate: number): string {
    if (expiredDate != null) return 'Expiry date: ' + expiredDate;

    return '';
  }

  getImage(paymentMethod: string): string {
    const images = {
      visa: 'assets/cards/visa.png',
      mastercard: 'assets/cards/mastercard.png',
      discover: 'assets/cards/discover.png',
      amex: 'assets/cards/amex.png',
      paypal: 'assets/cards/paypal.png',
      cash: 'assets/cards/cash.png',
    };
    return (
      images[paymentMethod as keyof typeof images] ||
      'assets/cards/discover.png'
    );
  }

  async cardEvent(card: PaymentMethod, index: number) {
    this.selectedPaymentOption = card.paymentMethod;
    const data = { value: this.selectedPaymentOption, card: card };
    console.log('inside submit: data = ' + this.selectedPaymentOption);
    this.modalCtrl.dismiss(data);
  }

  async Cash() {
    this.selectedPaymentOption = 'cash';
    const data = { value: this.selectedPaymentOption };
    console.log('inside submit: data = ' + this.selectedPaymentOption);
    this.modalCtrl.dismiss(data);
  }

  async PayPal() {
    this.selectedPaymentOption = 'paypal';
    const data = { value: this.selectedPaymentOption };
    console.log('inside submit: data = ' + this.selectedPaymentOption);
    this.modalCtrl.dismiss(data);
  }

  goBack() {
    this.modalCtrl.dismiss();
  }

  async addNewMethod() {
    // Lógica para manejar la tarjeta
    const modal = await this.util.createModal(AddCardComponent);

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
}
