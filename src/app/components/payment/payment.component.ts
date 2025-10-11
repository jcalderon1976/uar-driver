import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { from, Subscription,Subject } from 'rxjs';
import { InitPaymentMethodService } from 'src/app/services/initPaymentMethod/init-payment-method.service';
import { UtilService } from 'src/app/services/util/util.service';
import { Driver } from '../../models/driver';
import { InitUserProvider } from '../../services/inituser/inituser.service';
import { PaymentMethod } from 'src/app/models/paymentMethod';
import { AddCardComponent } from '../add-card/add-card.component';
import { APIService } from  '../../services/api/api.service';


@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
  standalone: false,
})
export class PaymentComponent implements OnInit, OnDestroy {
  cardDetails: any;
  paymentMethodsList: PaymentMethod[] = [];
  selectedCardIndex: number = 0; // Default selected index
  loggedInUser!: Driver;
  subscriptions: Subscription = new Subscription(); // Manage subscriptions

  customAlertOptions: any = {
    header: 'Select Card Type',
  };

  constructor(
    private modalCtrl: ModalController,
    private addCard: InitPaymentMethodService,
    private util: UtilService, 
    private api: APIService,
    
    private userProvider: InitUserProvider   
  ) { }

  private destroy$ = new Subject<void>();

  
  ngOnInit() {
    // Fetch logged-in user data
    this.loggedInUser = this.userProvider.getUserData();

    // Fetch payment methods and determine default
    const paymentMethodSubscription = from(this.addCard.getPaymentMethodData(this.loggedInUser.id))
      .subscribe(array => {
        this.paymentMethodsList = array;

        // Set default selected card if available
        const defaultCardIndex = this.paymentMethodsList.findIndex(card => card.DefaultPaymentMethod);
        if (defaultCardIndex !== -1) {
          this.selectedCardIndex = defaultCardIndex;
        }
        else{
          this.selectedCardIndex = 0;
        }
      });

    // Add subscription to the list
    this.subscriptions.add(paymentMethodSubscription);
  }

  maskCardNumber(cardNumber: string): string {
    if (!cardNumber) return '';
    return `XXXX-XXXX-XXXX-${cardNumber.slice(-4)}`;
  }

  getImage(paymentMethod: string): string {
    const images = {
      visa: 'assets/cards/visa.png',
      master: 'assets/cards/mastercard.png',
      amex: 'assets/cards/amex.png'
    };
    return images[paymentMethod as keyof typeof images] || 'assets/cards/discover.png';
  }

  saveCard() {
    this.modalCtrl.dismiss();
  }

  async addPayment() {
    const modal = await this.util.createModal(AddCardComponent);
    
    modal.onWillDismiss().then(async (dataReturned) => {
      if (dataReturned != null) {
       console.dir(dataReturned);
      }             
    });

    return await modal.present();
  }

  goBack() {
    this.modalCtrl.dismiss();
  }

  ngOnDestroy() {
    // Unsubscribe to prevent memory leaks
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
    this.paymentMethodsList.forEach(payment => {
      console.log(`Document ID: ${payment.id}`);
      
      if(payment.id == newDefaultCard.id){
        // Update the new Default Card.
        payment.DefaultPaymentMethod = true;
        this.api.setPaymentMethodDefault(payment.id, payment);
      }
      else{
        payment.DefaultPaymentMethod = false;
        this.api.setPaymentMethodDefault(payment.id, payment);
      }
      
      

    });
    
   

    
  }
}
