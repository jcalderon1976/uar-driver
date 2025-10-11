import { Injectable } from '@angular/core';
import { PaymentMethod} from 'src/app/models/paymentMethod'
import { APIService } from  '../../services/api/api.service';
import {  UtilService} from  '../../services/util/util.service';
import { catchError, firstValueFrom, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InitPaymentMethodService {
  public cardDetails!: PaymentMethod;
  constructor( private api: APIService,
               private util: UtilService
  ) {
    this.createNewEmptyPayment()
   }



   async getPaymentMethodData(id: string) {
    
     const paymentMethodsList = await firstValueFrom(this.api.getPaymentMethod(id));
     return paymentMethodsList; 
    }
  

  createNewEmptyPayment() {
    
    this.cardDetails = {
      id:"",
      isSelected: 0,
      clientId: "",
      clientName: '',
      cardNumber: "",
      paymentMethod: '',
      SecurityCode: 0,
      ExpireDate: 0,
      BillingZipCode: 0,
      DefaultPaymentMethod: false,
      image: '',
      email: ''
    };
  }

  
  async addPaymentMethod(cardDetails: any) {
    // Show loading spinner while processing
    const loading = await this.util.createLoader('');
    await loading.present();
  
    this.api.addPaymentMethod(cardDetails).subscribe({
      next: async (res) => {
        console.log('DOCUMENT ID=>' + res.id);
       // Hide loading spinner
        await loading.dismiss();
        (document.activeElement as HTMLElement)?.blur(); // 👈 evita el warning
      },
      error: async (err) => {
        // Hide loading spinner
        await loading.dismiss();
        (document.activeElement as HTMLElement)?.blur(); // 👈 evita el warning
      }
    });
  }
  

  async editPaymentMethod(id : string,  cardDetails : any) {
    // Show loading spinner while processing
    const loading = await this.util.createLoader('');
    await loading.present();
  
    this.api.setPaymentMethodDefault(id, cardDetails).then(async result => {
      await loading.dismiss();
      (document.activeElement as HTMLElement)?.blur(); // 👈 evita el warning
    });

  }

  

  async confirmDelete(paymentMethodId: string) {
    this.util.presentAlert('Confirm Delete','Are you sure you want to remove this payment method?','OK').then((res) => {
      this.deletePaymentMethod(paymentMethodId);
    });
  }

  async deletePaymentMethod(id: string): Promise<void> {
    // Show loading spinner while processing
    const loading = await this.util.createLoader('');
    await loading.present();
  
    await this.api.deletePaymentMethod(id);
    await loading.dismiss();
    (document.activeElement as HTMLElement)?.blur(); // 👈 evita el warning
    

  }

 
}
