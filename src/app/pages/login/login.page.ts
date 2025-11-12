import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/api/auth.service';
import { UtilService } from '../../services/util/util.service';  
import { APIService } from 'src/app/services/api/api.service';    
import { Router } from '@angular/router';
import { Subscription ,Subject } from 'rxjs';
import { InitUserProvider } from '../../services/inituser/inituser.service';
import { ChangeDetectorRef } from '@angular/core';


@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  
  lottieConfig: any;
  showText = false;

  public user: any = { email: '', password: '' };
  // Validation flags
  emailError = false;
  passwordError = false;
  private userSubscription!: Subscription;  // Store the subscription
  public spinner = false;
  public disabled = false;
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService, 
              private utilService: UtilService,
              private api : APIService,
              private router: Router,
              private userProvider: InitUserProvider,
              private cdr: ChangeDetectorRef) {

                this.lottieConfig = {
                  path: 'assets/animation4.json', // Ruta a tu animación
                  renderer: 'svg',
                  autoplay: true,
                  loop: false,
                  rendererSettings: {
                    // hace que el svg "cubra" el contenedor
                    preserveAspectRatio: 'xMidYMid slice'
                  }
                };
              }


  animationCreated(animationItem: any): void {
    animationItem.addEventListener('complete', () => {
      this.showText = true;
      this.cdr.detectChanges(); // Detecta inmediatamente
    });
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

  ngOnInit() {
    console.log('>>>>>login.page.ngOnInit() .........');
  }

  async login() {

     // Reset previous error states
     this.user.emailError = !this.validateEmail(this.user.email);
     this.passwordError = !this.validatePasswords();

     if (this.user.emailError || this.passwordError) {
      this.utilService.presentAlert('Error','Please correct the highlighted errors.','TRY AGAIN');
      return;
    }

    try {
      
      this.api.logIn(this.user.email, this.user.password)
      .subscribe(
        res => {
          console.log('[ login.page.login() ]-> (res api.logIn) = res[id] = ', res['id']);
           
          this.userProvider.setToken(res['id']);

            this.userSubscription =  this.api.getUser().subscribe((responseUser) => {
                console.dir('[ login.page.login() ]-> (res api.getUser) = responseUser = ', responseUser);
                this.userProvider.setLoggedInUser(responseUser);
                this.clearSpinner();
                this.router.navigate(['/tabs']);  // Redirect to home page
                //this.router.navigateByUrl('/tabs');
               });
        }
        ,async err => {
          this.utilService.presentAlert('Error', 'Access Denied!! Invalid Credential ' + ( err.message || err.statusText), 'TRY AGAIN');
          this.clearSpinner();
        });
    } catch (error) {
      this.utilService.presentAlert('Error','Login failed. Check your credentials.','TRY AGAIN');
    }
  }

  async loginWithGoogle() {
    try {
      
      this.api.loginWithGoogle()
      .subscribe(
        res => {
            this.userProvider.setToken(res['id']);
            this.userSubscription =  this.api.getUser().subscribe((responseUser: any) => {
                this.userProvider.setLoggedInUser(responseUser);
                this.clearSpinner();
                this.router.navigate(['/tabs']);  // Redirect to home page
              });
        }
        ,async err => {
          this.utilService.presentAlert('Error', 'Google Sign-In Failed. Access Denied!! Invalid Credential ', 'TRY AGAIN');
      });
    } catch (error) {
      this.utilService.presentAlert('Error', 'Google Sign-In Failed. Access Denied!! Invalid Credential ', 'TRY AGAIN');
    }
      
    
  }
  
   async loginWithMicrosoft() {
    try {
      
      this.api.loginWithGoogle()
      .subscribe(
        res => {
            this.userProvider.setToken(res['id']);
            this.userSubscription =  this.api.getUser().subscribe((responseUser: any) => {
                this.userProvider.setLoggedInUser(responseUser);
                this.clearSpinner();
                this.router.navigate(['/tabs']);  // Redirect to home page
              });
        }
        ,async err => {
          this.utilService.presentAlert('Error', 'Microsoft Sign-In Failed. Access Denied!! Invalid Credential ', 'TRY AGAIN');
      });
    } catch (error) {
      this.utilService.presentAlert('Error', 'Microsoft Sign-In Failed. Access Denied!! Invalid Credential ', 'TRY AGAIN');
    }
  }
  async loginWithApple() {
    try {
      
      this.api.loginApple()
      .subscribe(
        res => {
            this.userProvider.setToken(res['id']);
            this.userSubscription =  this.api.getUser().subscribe((responseUser: any) => {
                this.userProvider.setLoggedInUser(responseUser);
                this.clearSpinner();
                this.router.navigate(['/register']);  // Redirect to home page
              });
        }
        ,async err => {
          this.utilService.presentAlert('Error', 'Apple Sign-In Failed. Access Denied!! Invalid Credential ', 'TRY AGAIN');
      });
    } catch (error) {
      this.utilService.presentAlert('Error', 'Apple Sign-In Failed. Access Denied!! Invalid Credential ', 'TRY AGAIN');
    }
  }

  
  goToRegister() {
    this.router.navigate(['/register']);
  }

  async forgotPassword() {
    if (!this.user.email) {
      this.utilService.presentAlert('Alert','Enter your email to reset password.','TRY AGAIN');
      return;
    }
    try {
      await this.authService.resetPassword(this.user.email);
      this.utilService.presentAlert('Alert','Password reset email sent.','OK');
    } catch (error) {
      this.utilService.presentAlert('Error','Error sending password reset email.','TRY AGAIN');
    }
  }

 

  validatePasswords(): boolean {
    return  this.user.password.length >= 3;
  }

  validateEmail(email: string): boolean {
    const emailRegex = /\S+@\S+\.\S+/;
    return emailRegex.test(email);
  }

  focusNext(nextInput: any) {
    setTimeout(() => {
      nextInput.setFocus(); // Le da foco al siguiente input
    }, 100);
  }

  submitIfValid() {
    // Si todo está bien, llama a register()
    this.login();
  }

  setSpinner() {
    this.spinner = true;
    this.disabled = true;
  }

  clearSpinner() {
    this.spinner = false;
    this.disabled = false;
  }
  

   
}
