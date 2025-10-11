import { Component, ViewChild } from '@angular/core';
import { AuthService } from '../../services/api/auth.service';
import { UtilService } from '../../services/util/util.service';  
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule, IonInput  } from '@ionic/angular';
import { AlertController } from '@ionic/angular';
import { User } from '../../models/user'; 
import { Car } from '../../models/car';
import { APIService } from '../../services/api/api.service';
import { InitUserProvider } from '../../services/inituser/inituser.service';
import { CarApiService } from '../../services/api/car-api.service';  // Ajusta la ruta si está en otro folder 
import { PaymentMethod } from 'src/app/models/paymentMethod';
import { InitPaymentMethodService } from 'src/app/services/initPaymentMethod/init-payment-method.service';
import { from, Observable ,Subscription , Subject} from 'rxjs';
import { SharedModule } from '../../components/photo/share.module'; // ruta según tu estructura
import { PhotoService } from '../../services/util/photo.service'; 

@Component({
  selector: 'app-register',
  standalone: true,  
  imports: [CommonModule, IonicModule, FormsModule,SharedModule],  // ✅ Import FormsModule
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {

  @ViewChild('nameInput', { static: false }) nameInput!: IonInput;
  @ViewChild('phoneInput', { static: false }) phoneInput!: IonInput;
  @ViewChild('emailInput', { static: false }) emailInput!: IonInput;
  @ViewChild('passwordInput', { static: false }) passwordInput!: IonInput;
  @ViewChild('confirmPasswordInput', { static: false }) confirmPasswordInput!: IonInput;
  @ViewChild('cardNameInput', { static: false }) cardNameInput!: IonInput;
  @ViewChild('cardInput', { static: false }) cardInput!: IonInput;
  @ViewChild('codigoSeguridad', { static: false }) codigoSeguridad!: IonInput;
  @ViewChild('fechaExpiracion', { static: false }) fechaExpiracion!: IonInput;

  imageUrl: string | null = null;
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  phoneNumber: string = '';
  name : string = '';
  user: User = {id: '', email: '',password: '',phone: '',name: '',password2: '', NewEmail: '', location_lat: 0, location_lng: 0,token: '',profile_img: '',rideId: '',location: '' ,car: {make: '', model: '', year: 0, color: '', plate_number: ''}};
  public loader!: HTMLIonLoadingElement;
  public car: Car = {
    make: '',
    model: '',
    year: 0,
    color: '',
    plate_number: ''
  };

  searchQuery: string = '';
  filteredCarMakes: any[] = [];
  carMakes: any[] = []; // Esto contiene todas las marcas completas
  carModels: any[] = [];
  carYears: number[] = [];
  carColors:  any[] = [];
  selectedMake: any = null; // O string si solo necesitas el nombre
  selectedModel: any = null; // O string si solo necesitas el nombre
  cardDetails: any = {
    clientName: '',
    cardNumber: '',
    paymentMethod: '',
    ExpireDate: '',
    SecurityCode: '',
    DefaultPaymentMethod: true
  };
  public cards: PaymentMethod[] = [];
  paymentMethodsList: PaymentMethod[] = [];
  private userSubscription!: Subscription;  // Store the subscription
  private destroy$ = new Subject<void>();

  // Validation flags
  emailError = false;
  passwordError = false;
  phoneError = false;
  nameError = false;
  spinner = false;
  disabled = false;
  userRegistrationPage = true;
  carRegistrationPage = false;
  paymentMethodPage = false;
  cardError = false;
  cvvError = false; 
  expiryError = false;
  zipError = false;

  constructor(
    private authService: AuthService, 
    private utilService: UtilService,
    private router: Router,
    private api: APIService,
    private userProvider: InitUserProvider,
    private carApi: CarApiService,
    private card: InitPaymentMethodService,
    private camaraService: PhotoService ,
  ) {

  }

  ngOnDestroy(): void {
    // Emitir valor para romper todas las suscripciones
    this.destroy$.next();
    this.destroy$.complete();

     // Unsubscribe to avoid memory leaks
     if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    
  }


  async ngOnInit() {
    this.imageUrl = 'https://firebasestorage.googleapis.com/v0/b/uar-platform.firebasestorage.app/o/photos%2FuserDefault.png?alt=media&token=ef06263c-9e2a-4e6d-9198-1898fd5c19df';
  }

  /** Show Loader */
  async showLoader() {
    this.loader = await this.utilService.createLoader('Loading ...');
    await this.loader.present();
  }

  /** Dismiss Loader */
  async dismissLoader() {
    if (this.loader) {
      await this.loader.dismiss();
      (document.activeElement as HTMLElement)?.blur(); // 👈 evita el warning
    }
  }


  async register1() {

    await this.showLoader(); // Para la carga inicial, 

    let message = [];  
    message.push(`Please correct: `);
    
    // Reset previous error states
      this.emailError = !this.validateEmail(this.email);
      if(this.emailError){
        message.push(`The email              `);
      }
     
      this.passwordError = !this.validatePasswords();
      if(this.passwordError){
        message.push(`Confirmation Password.           `);
      }
     
      this.phoneError = !this.validatePhoneNumber(this.phoneNumber);
      if(this.phoneError){
        message.push(`Phone Number.                    `);
      }
      
      this.nameError = this.name.trim().length === 0;
      if(this.nameError){
        message.push(`Name.                          `);
      }
      const errorMessage = message.join(', '); // Une todo con <br>

      if(this.emailError || this.passwordError || this.phoneError || this.nameError){
        this.utilService.presentAlert('Registration failed.                  ', errorMessage, 'TRY AGAIN');
        this.dismissLoader();
        return
      }
    try {
   
      this.user.email = this.email;
      this.user.password = this.password;
      this.user.phone = this.phoneNumber;
      this.user.name = this.name;
      this.user.password2 = this.confirmPassword;
      this.user.profile_img = this.imageUrl || 'https://firebasestorage.googleapis.com/v0/b/uar-platform.firebasestorage.app/o/photos%2FuserDefault.png?alt=media&token=ef06263c-9e2a-4e6d-9198-1898fd5c19df';

      this.userRegistrationPage = false;
      this.carRegistrationPage = true;
      this.paymentMethodPage = false;

      this.carApi.getYear().subscribe((years: number[]) => { this.carYears = years; });
      this.carApi.getColor().subscribe((colors: any[]) => { this.carColors = colors; });

       // 🔹 Esperar las marcas y luego buscar la marca del usuario
       this.carApi.getAllMakes().subscribe((response) => {
       this.carMakes = response;
       this.filteredCarMakes = [...this.carMakes];
       });

       this.dismissLoader();

    } catch (error) {
      this.utilService.presentAlert(`Registration failed. `,  errorMessage , 'TRY AGAIN');
      this.dismissLoader();
    } finally {
      await this.dismissLoader(); // 🔥 Siempre cerrar loader
    }
  }

  register2() {
    
    const carInfo = {
      make: this.selectedMake?.Make_Name || '',
      model: this.selectedModel || '',
      year: this.car.year,
      color: this.car.color,
      plate_number: this.car.plate_number
    };
    

      this.user.car = carInfo;
      this.userRegistrationPage = false;
      this.carRegistrationPage = false;
      this.paymentMethodPage = true;
      //cards info
      this.cardDetails.clientName = this.user.name;
      this.cardDetails.email = this.user.email;  
  }

  async register3(){
    await this.showLoader(); // Para la carga inicial, usamos getHistory que ya aplica el límite
  try{

    //await this.authService.register(this.user);
    this.api.signUp(this.user).subscribe(
      res => {
        console.log(res);
        this.userProvider.setToken(res['id']);
        this.api.getUser().subscribe(async (user: any) => {
          this.userProvider.setLoggedInUser(user);
          this.saveCard(user);
          await this.dismissLoader();
          this.utilService.presentAlert('Successful','Registration successful! Redirecting to login...', 'OK');
          this.router.navigate(['/tabs']);  // ✅ Redirect to login page
        });
      },
      async err => {
        this.utilService.presentAlert(`Registration failed. `,  err.message || err.statusText , 'TRY AGAIN');
        await this.dismissLoader();
        this.router.navigate(['/login']);  // ✅ Redirect to login page
      }
    );

  }catch(error){
    await this.dismissLoader();
    this.utilService.presentAlert('Error','Error redirecting to login page.','TRY AGAIN');
  } finally {
    await this.dismissLoader(); // 🔥 Siempre cerrar loader
  }
  }
  async register() {

    await this.showLoader(); // Para la carga inicial, usamos getHistory que ya aplica el límite

    let message = [];  
    message.push(`Please correct: `);
    
    // Reset previous error states
      this.emailError = !this.validateEmail(this.email);
      if(this.emailError){  message.push(`The email              `);
      }
     
      this.passwordError = !this.validatePasswords();
      if(this.passwordError){
        message.push(`Confirmation Password.           `);
      }
     
      this.phoneError = !this.validatePhoneNumber(this.phoneNumber);
      if(this.phoneError){
        message.push(`Phone Number.                    `);
      }
      
      this.nameError = this.name.trim().length === 0;
      if(this.nameError){
        message.push(`Name.                          `);
      }
      const errorMessage = message.join(', '); // Une todo con <br>

      if(this.emailError || this.passwordError || this.phoneError || this.nameError){
        this.utilService.presentAlert('Registration failed.                  ', errorMessage, 'TRY AGAIN');
      }
    try {
   
      this.user.email = this.email;
      this.user.password = this.password;
      this.user.phone = this.phoneNumber;
      this.user.name = this.name;
      this.user.password2 = this.confirmPassword;

      //await this.authService.register(this.user);
       this.api.signUp(this.user).subscribe(
        res => {
          console.log(res);
          this.userProvider.setToken(res['id']);
          this.api.getUser().subscribe(async (user: any) => {
            this.userProvider.setLoggedInUser(user);
            await this.dismissLoader();
            this.utilService.presentAlert('Successful','Registration successful! Redirecting to login...', 'OK');
            this.router.navigate(['/tabs']);  // ✅ Redirect to login page
          });
        },
        async err => {
          this.utilService.presentAlert(`Registration failed. `,  err.message || err.statusText , 'TRY AGAIN');
          await this.dismissLoader();
        }
      );

    } catch (error) {
      this.utilService.presentAlert(`Registration failed. `,  errorMessage , 'TRY AGAIN');
    }
  }

  async goBackToCar()
  {
    this.userRegistrationPage = false;
    this.carRegistrationPage = true;
    this.paymentMethodPage = false; 
  }

  async goBackToLogin()
  {
    this.userRegistrationPage = true;
    this.carRegistrationPage = false;
    this.paymentMethodPage = false; 
  }
  validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^\(\d{3}\)\s\d{3}-\d{4}$/;  // customize as needed
    return phoneRegex.test(phone);
  }

  validatePasswords(): boolean {
    return  this.password === this.confirmPassword && this.password.length >= 3;
  }

  validateEmail(email: string): boolean {
    const emailRegex = /\S+@\S+\.\S+/;
    return emailRegex.test(email);
  }


  async goToLogin() {
    try {
    this.router.navigate(['/login']);

    }catch(error){
      this.utilService.presentAlert('Error','Error redirecting to login page.','TRY AGAIN');
    } 
 }


 formatPhoneNumber(event: any) {
  let input = event.detail.value || '';
  input = input.replace(/\D/g, ''); // Quita todo lo que no sea número

  if (input.length > 0) {
    input = '(' + input;
  }
  if (input.length > 4) {
    input = input.slice(0, 4) + ') ' + input.slice(4);
  }
  if (input.length > 9) {
    input = input.slice(0, 9) + '-' + input.slice(9);
  }
  if (input.length > 14) {
    input = input.slice(0, 14); // Limita a (000) 000-0000
  }

  this.phoneNumber = input;
}

focusNext(inputRef: IonInput) {
  setTimeout(() => {
    inputRef.setFocus(); // Le da foco al siguiente input
  }, 100);
}

submitIfValid() {
  // Si todo está bien, llama a register()
  this.register();
}



onMakeChange(event: any) {
  this.selectedMake = event.detail.value;
  console.log('Marca seleccionada:', this.selectedMake);

  this.carApi.getModelsForMake(this.selectedMake.Make_Name).subscribe((response) => {
    this.carModels = response.Results.map((model: any) => model.Model_Name);
  });  
}


onModelChange(event: any) {
  this.selectedModel = event.detail.value;
 console.log('Modelo seleccionado:', this.selectedModel);  
}

// Necesario si usas objetos como valor
compareFn = (o1: any, o2: any) => o1?.Make_ID === o2?.Make_ID;
  
getImage(paymentMethod: string): string {
  const images = {
    visa: 'assets/cards/visa2.png',
    master: 'assets/cards/mastercard2.png',
    amex: 'assets/cards/amex.png',
    discover: 'assets/cards/discover.png',
  };
  return images[paymentMethod as keyof typeof images] || 'assets/cards/discover.png';
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
  } else if ((this.cardDetails.paymentMethod === 'visa' || this.cardDetails.paymentMethod === 'master') && input.length === 3) {
    console.log('CVV válido para Visa/MasterCard');
  }
}

formatExpiryNumber(event: any) {
  let input = event.detail.value || '';

  // Quitar caracteres no numéricos
  input = input.replace(/\D/g, '');

  // Validar y corregir el mes si es necesario
  if (input.length >= 1) {
    let month = input.substring(0, 2);
    if (parseInt(month, 10) > 12) {
      month = '12'; // Limitar a 12 si el usuario pone más
    }
    input = month + input.substring(2);
  }

  // Limitar a 4 dígitos (MMYY)
  input = input.substring(0, 4);

  // Insertar la barra "/" después del mes
  if (input.length > 2) {
    input = input.substring(0, 2) + '/' + input.substring(2);
  }

  // Guardar el valor formateado
  this.cardDetails.ExpireDate = input;
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


async saveCard(User: any) {
    if (this.validateCardDetails()) {
      try {

         // console.log('[EditCardComponent] Data from parent:', this.dataFromParent);
         this.cardDetails.id = '';
         this.cardDetails.clientId = User.id;
         this.cardDetails.clientName = User.name;
         this.cardDetails.email= User.email;

        //if (!this.cardDetails.id) return;
  
        await this.card.addPaymentMethod(this.cardDetails).then(async (result: any) => {
          
          if(this.cardDetails.DefaultPaymentMethod){

                const paymentMethodSubscription = from(this.card.getPaymentMethodData(User.id))
                .subscribe(async array => { 

                  this.paymentMethodsList = array;
                  
                  console.dir(this.paymentMethodsList);
                

                    // Reset all DefaultPaymentMethod to false first
                    this.paymentMethodsList.forEach(payment => {
                                  console.log(`Document ID: ${payment.id}`);
                                  console.log(`this.cardDetails.id : ${this.cardDetails.id}`);
                                  console.log(`this.cardDetails.DefaultPaymentMethod: ${this.cardDetails.DefaultPaymentMethod}`);
                                  console.log(`this.cardDetails.clientName : ${this.cardDetails.clientName}`);
                                  console.log(`this.cardDetails.cardNumber : ${this.cardDetails.cardNumber}`);

                                  if(payment.cardNumber === this.cardDetails.cardNumber && this.cardDetails.DefaultPaymentMethod){
                                    // Update the new Default Card.
                                    payment.DefaultPaymentMethod = true;
                                    this.api.setPaymentMethodDefault(payment.id, payment);
                                  }
                                  else{
                                    payment.DefaultPaymentMethod = false;
                                    this.api.setPaymentMethodDefault(payment.id, payment);
                                  }
                    
                    });

                   
                });

        }

      });

      } catch (error) {
        await this.utilService.presentAlert('Error',  (error as any)?.message || 'Failed to save payment method. Please try again.','OK');
      }
    }
  }


  validateCardDetails(): boolean {

    let message = [];  
    message.push(`Please correct: `);

     if (!this.cardDetails.clientName || !this.cardDetails.cardNumber || !this.cardDetails.paymentMethod) {
        this.showErrorAlert('Please fill out all required fields.');
      return false;
    }
    if (this.cardDetails.cardNumber.length !== 19) {
      this.showErrorAlert('Invalid card number format.');
      return false;
    }
    if (this.cardDetails.SecurityCode.toString().length < 3 || this.cardDetails.SecurityCode.toString().length > 4) {
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
    await this.utilService.presentAlert('Error',  message,'OK');
  }



  tomarFoto() {
   
      this.camaraService.tomarFotoYSubir(this.email).then((result) => {
        console.log('Foto subida:', result);
        this.imageUrl = result; // Actualiza la URL de la imagen
      }).catch(err => console.error('Error al subir la foto', err));
  }
}
