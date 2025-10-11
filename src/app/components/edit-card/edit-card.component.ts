import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { PaymentService } from '../../services/payment/payment.service';
import { AlertController, IonInput, ModalController } from '@ionic/angular';
import { PaymentMethod } from 'src/app/models/paymentMethod';
import { InitPaymentMethodService } from 'src/app/services/initPaymentMethod/init-payment-method.service';
import { Driver } from '../../models/driver';
import { InitUserProvider } from '../../services/inituser/inituser.service';
import { from, Observable } from 'rxjs';
import { APIService } from 'src/app/services/api/api.service';
import { UtilService } from 'src/app/services/util/util.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'edit-add-card',
  templateUrl: './edit-card.component.html',
  styleUrls: ['./edit-card.component.scss'],
  standalone: false,
})
export class EditCardComponent implements OnInit {
  @Input() dataFromParent: any; // Recibir datos del componente padre
  @ViewChild('cardInput', { static: false }) cardInput!: IonInput;
  @ViewChild('toolbar', { read: ElementRef }) toolbarRef!: ElementRef;

  cardDetails: any = {};
  public cards: PaymentMethod[] = [];
  paymentMethodsList: PaymentMethod[] = [];
  // Track cursor position
  private cursorPosition: number = 0;

  customAlertOptions: any = {
    header: 'Select Card Type',
  };

  nameError = false;
  cardError = false;
  cvvError = false;
  expiryError = false;
  zipError = false;

  public loggedInUser!: Driver;

  constructor(
    private paymentService: PaymentService,
    private alertController: AlertController,
    private api: APIService,
    private modalCtrl: ModalController,
    private addCard: InitPaymentMethodService,
    private userProvider: InitUserProvider,
    private cd: ChangeDetectorRef,
    private util: UtilService
  ) {
    this.cardDetails = {
      id: '',
      isSelected: 0,
      clientId: '',
      clientName: '',
      cardNumber: '',
      paymentMethod: '',
      SecurityCode: 0,
      ExpireDate: 0,
      BillingZipCode: 0,
      DefaultPaymentMethod: false,
      image: '',
      email: '',
    };
  }

  ngAfterViewInit() {
    const toolbarEl = this.toolbarRef.nativeElement;
    const shadowRoot = toolbarEl.shadowRoot;

    if (shadowRoot) {
      const style = document.createElement('style');
      style.textContent = `
        .toolbar-background {
          background: linear-gradient(45deg, #FE695D, #AA2CE6) !important; 
          font-size: 14px;
        }
      `;
      shadowRoot.appendChild(style);
    }

    setTimeout(() => {
      this.cardDetails = { ...this.dataFromParent }; // Copia segura
      this.cd.detectChanges(); // 🔥 Forzar renderización
      console.log('[AFTER VIEW INIT] Card Details:', this.cardDetails);
    }, 100);
  }

  ngOnInit() {
    // to redirect to further pages if a booking is active //TODO
    this.loggedInUser = this.userProvider.getUserData();
    // console.log('[EditCardComponent] Data from parent:', this.dataFromParent);
    // this.cardDetails = this.dataFromParent;
  }

  async saveCard() {
    if (this.validateCardDetails()) {
      try {
        if (!this.cardDetails.id) return;

        await this.addCard.editPaymentMethod(
          this.cardDetails.id,
          this.cardDetails
        );

        const data = await firstValueFrom(
          this.api.getPaymentMethod(this.loggedInUser.id)
        );
        this.paymentMethodsList = data;
        console.dir(this.paymentMethodsList);

        for (const payment of this.paymentMethodsList) {
          const shouldBeDefault =
            payment.id === this.cardDetails.id &&
            this.cardDetails.DefaultPaymentMethod;

          if (payment.DefaultPaymentMethod !== shouldBeDefault) {
            // Solo actualiza si es necesario
            payment.DefaultPaymentMethod = shouldBeDefault;
            await this.api.setPaymentMethodDefault(payment.id, payment);
          }
        }

        await this.util.presentAlert(
          'Success',
          'Your payment method has been saved successfully!',
          'OK'
        );
        this.modalCtrl.dismiss();
      } catch (error) {
        await this.util
          .presentAlert(
            'Error',
            (error as any)?.message ||
              'Failed to save payment method. Please try again.',
            'OK'
          )
          .then(() => {
            this.modalCtrl.dismiss(); // Cerrar el modal después del éxito
          });
      }
    }
  }

  async saveCard2() {
    if (this.validateCardDetails()) {
      try {
        if (!this.cardDetails.id) return;

        await this.addCard
          .editPaymentMethod(this.cardDetails.id, this.cardDetails)
          .then(async (result) => {
            from(
              this.addCard.getPaymentMethodData(this.loggedInUser.id)
            ).subscribe(async (array) => {
              this.paymentMethodsList = array;

              console.dir(this.paymentMethodsList);

              // Reset all DefaultPaymentMethod to false first
              this.paymentMethodsList.forEach((payment) => {
                console.log(`Document ID: ${payment.id}`);
                console.log(`this.cardDetails.id : ${this.cardDetails.id}`);
                console.log(
                  `this.cardDetails.DefaultPaymentMethod: ${this.cardDetails.DefaultPaymentMethod}`
                );

                if (
                  payment.id === this.cardDetails.id &&
                  this.cardDetails.DefaultPaymentMethod
                ) {
                  // Update the new Default Card.
                  payment.DefaultPaymentMethod = true;
                  this.api.setPaymentMethodDefault(payment.id, payment);
                } else {
                  payment.DefaultPaymentMethod = false;
                  this.api.setPaymentMethodDefault(payment.id, payment);
                }
              });

              await this.util
                .presentAlert(
                  'Success',
                  'Your payment method has been saved successfully!',
                  'OK'
                )
                .then(() => {
                  this.modalCtrl.dismiss(); // Cerrar el modal después del éxito
                });
            });
          });
      } catch (error) {
        await this.util
          .presentAlert(
            'Error',
            (error as any)?.message ||
              'Failed to save payment method. Please try again.',
            'OK'
          )
          .then(() => {
            this.modalCtrl.dismiss(); // Cerrar el modal después del éxito
          });
      }
    }
  }

  async deleteCard() {
    try {
      await this.addCard
        .deletePaymentMethod(this.cardDetails.id)
        .then(async (result) => {
          await this.util
            .presentAlert(
              'Success',
              'Your payment method has been deleted successfully!',
              'OK'
            )
            .then(() => {
              this.modalCtrl.dismiss(); // Cerrar el modal después del éxito
            });
        });
    } catch (error) {
      await this.util
        .presentAlert(
          'Error',
          (error as any)?.message ||
            'Failed to delete payment method. Please try again.',
          'OK'
        )
        .then(() => {});
    }
  }

  goBack() {
    this.modalCtrl.dismiss();
  }

  validateCardDetails(): boolean {
    let message = [];
    message.push(`Please correct: `);

    if (
      !this.cardDetails.clientName ||
      !this.cardDetails.cardNumber ||
      !this.cardDetails.paymentMethod
    ) {
      this.showErrorAlert('Please fill out all required fields.');
      return false;
    }
    if (this.cardDetails.cardNumber.length !== 19) {
      this.showErrorAlert('Invalid card number format.');
      return false;
    }
    if (
      this.cardDetails.SecurityCode.toString().length < 3 ||
      this.cardDetails.SecurityCode.toString().length > 4
    ) {
      this.showErrorAlert('CVV should be 3 or 4 digits.');
      return false;
    }
    if (this.cardDetails.ExpireDate.toString().length !== 5) {
      this.showErrorAlert('Expiry Date should be in MM/YY format.');
      return false;
    }

    return true;
  }

  async showErrorAlert(message: string) {
    await this.util.presentAlert('Error', message, 'OK');
  }

  // Maintain cursor position after edits
  async handleInput(event: any): Promise<void> {
    const inputElement = await this.cardInput.getInputElement();

    if (inputElement) {
      // Save current cursor position
      this.cursorPosition = inputElement.selectionStart || 0;

      // Fix cursor position after input value changes
      setTimeout(() => {
        const inputValueLength = inputElement.value.length;

        // Prevent cursor from going beyond the total length
        if (this.cursorPosition > inputValueLength) {
          this.cursorPosition = inputValueLength;
        }

        console.log(
          `inputElement.selectionStart = ${inputElement.selectionStart}`
        );
        console.log(`inputElement.selectionEnd =${inputElement.selectionEnd}`);

        console.log(`inputValueLength =${inputValueLength}`);
        console.log(`this.cursorPosition =${this.cursorPosition}`);

        // Restore the cursor position after edits
        inputElement.setSelectionRange(
          this.cursorPosition,
          this.cursorPosition
        );
      }, 0);
    }
  }

  focusNext(nextInput: any) {
    setTimeout(() => {
      nextInput.setFocus(); // Le da foco al siguiente input
    }, 100);
  }

  formatCardNumber(event: any) {
    let input = event.detail.value || '';
    input = input.replace(/\D/g, '');
    input = input.substring(0, 16);

    const parts = [];
    for (let i = 0; i < input.length; i += 4) {
      parts.push(input.substring(i, i + 4));
    }

    const formatted = parts.join(' ');
    this.cardDetails.cardNumber = formatted;

    // Detectar tipo de tarjeta
    const cardType = this.detectCardType(input);
    this.cardDetails.paymentMethod = cardType; // visa, mastercard, amex...

    // Validar número si tiene 16 dígitos
    if (input.length === 16) {
      const isValid = this.isValidCardNumber(formatted);
      console.log('¿Número válido?', isValid);
    }
  }
  formatCVVNumber(event: any) {
    let input = event.detail.value || '';

    // Solo números
    input = input.replace(/\D/g, '');

    // Limitar longitud a 4 dígitos (por si es Amex)
    input = input.substring(0, 4);

    // Asignar valor formateado al modelo o variable de CVV
    this.cardDetails.SecurityCode = input;

    // (Opcional) Verificar si ya tiene longitud válida para la tarjeta
    if (this.cardDetails.paymentMethod === 'amex' && input.length === 4) {
      console.log('CVV válido para Amex');
    } else if (
      (this.cardDetails.paymentMethod === 'visa' ||
        this.cardDetails.paymentMethod === 'master') &&
      input.length === 3
    ) {
      console.log('CVV válido para Visa/MasterCard');
    }
  }

  formatExpiryNumber(event: any) {
    let input = event.detail.value || '';

    // Quitar caracteres no numéricos
    input = input.replace(/\D/g, '');

    // Limitar a 4 dígitos (MMYY)
    input = input.substring(0, 4);

    // Insertar la barra "/" después del mes
    if (input.length >= 3) {
      input = input.substring(0, 2) + '/' + input.substring(2);
    }

    // Guardar el valor formateado en el modelo
    this.cardDetails.ExpireDate = input;
  }

  getImage(paymentMethod: string): string {
    const images = {
      visa: 'assets/cards/visa2.png',
      mastercard: 'assets/cards/mastercard2.png',
      amex: 'assets/cards/amex.png',
      discover: 'assets/cards/discover.png',
    };
    return (
      images[paymentMethod as keyof typeof images] ||
      'assets/cards/discover.png'
    );
  }

  submitIfValid() {
    // Si todo está bien, llama a register()
    //this.register();
  }

  detectCardType(cardNumber: string): string {
    const number = cardNumber.replace(/\s/g, '');

    const cardPatterns: { [key: string]: RegExp } = {
      visa: /^4[0-9]{0,}$/,
      mastercard: /^(5[1-5]|2[2-7])[0-9]{0,}$/,
      amex: /^3[47][0-9]{0,}$/,
      discover: /^6(?:011|5[0-9]{2})[0-9]{0,}$/,
    };

    for (const card in cardPatterns) {
      if (cardPatterns[card].test(number)) {
        return card;
      }
    }
    return 'unknown';
  }

  isValidCardNumber(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\D/g, '');
    let sum = 0;
    let shouldDouble = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i), 10);

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }
}
