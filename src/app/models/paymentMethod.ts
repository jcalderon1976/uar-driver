export interface PaymentMethod{
      id: string;
      isSelected:number;
      clientId: string;
      clientName: string;
      cardNumber: string;
      paymentMethod: string;
      SecurityCode: number;
      ExpireDate: number;
      BillingZipCode: number;
      DefaultPaymentMethod: boolean;
      image: string;
      email:string;
      
    }