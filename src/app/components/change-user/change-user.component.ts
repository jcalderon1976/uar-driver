import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ModalController, IonInput } from '@ionic/angular';
//import { User } from '../../models/user';
import { APIService } from '../../services/api/api.service';
import { InitUserProvider } from '../../services/inituser/inituser.service';
import { UtilService } from 'src/app/services/util/util.service';
import { AuthService } from '../../services/api/auth.service';
import { Router } from '@angular/router';
import {
  getAuth,
  sendEmailVerification,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reload,
  User,
} from 'firebase/auth';
import { AlertController } from '@ionic/angular';

/* 
Paso	Acción del Usuario	Resultado
1	Abre la página	Se carga el email actual
2	Si no está verificado	Puede enviar email de verificación
3	Ingresa nuevo email y contraseña	Se valida
4	Se reautentica con contraseña	Si es correcta, se actualiza email
5	Se envía email de verificación al nuevo correo	Se muestra mensaje de éxito o error
 */

@Component({
  selector: 'app-change-user',
  templateUrl: './change-user.component.html',
  styleUrls: ['./change-user.component.scss'],
  standalone: false,
})
export class ChangeUserComponent implements OnInit {
  @ViewChild('NewEmailInput', { static: false }) inputField!: IonInput;
  @ViewChild('toolbar', { read: ElementRef }) toolbarRef!: ElementRef;

  public loggedInUser!: any;
  user: User | null = null;
  email: string = '';
  newEmail: string = '';
  password: string = '';

  showOTPInput = false;
  // Validation flags
  emailError = false;
  passwordError = false;

  constructor(
    private modalCtrl: ModalController,
    private userProvider: InitUserProvider,
    private api: APIService,
    private util: UtilService,
    private authService: AuthService,
    private router: Router
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
  }

  ngOnInit() {
    this.loggedInUser = this.userProvider.getUserData();
    const auth = getAuth();
    this.user = auth.currentUser; // Guarda el usuario actual
    this.refreshUser(); // Refresca sus datos
    this.newEmail = '';
    this.password = '';
    // Enfoca el input después de un breve delay
    setTimeout(() => {
      this.inputField?.setFocus();
    }, 300);
  }

  async refreshUser() {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser) {
      await reload(currentUser);
      this.user = currentUser;
    }
  }

  goBack() {
    this.modalCtrl.dismiss();
  }

  async Verify() {
    await this.requestOTP();

  }

  updateUser(id: string, NewEmail: string) {
    this.api.updateUser(id, { email: NewEmail });
  }

  async requestOTP() {
    /*   this.authService.sendOTP(this.loggedInUser.NewEmail).subscribe({
      next: () => {
        this.showOTPInput = true;
      },
      error: async (err) => {
         console.error('OTP request failed:', err);
         //this.util.showToast('Failed to send OTP. Try again.');
      //    const toast = await this.util.createToast('Failed to send OTP. Try again. ' + ( err.message || err.statusText), true, 'top', 9000);
      //    await toast.present().then(result => { this.goBack(); });
      }
    }); */
  }

  logout() {
    this.userProvider.logout().then((res) => {
      //this.util.goToNew('/loader');
      //this.router.navigate(['/loader']);
      sessionStorage.clear();
      localStorage.clear();
      this.router.navigate(['/login'], { replaceUrl: true });
    });
  }

  async sendVerificationEmail() {
    if (!this.user) return;

    try {
      //necesito verificar el email nuevo
      console.dir('USER=>' + this.user);
      await sendEmailVerification(this.user);
      this.util.presentAlert(
        'Correo enviado a' + this.user.email,
        'Revisa tu bandeja de entrada',
        'OK'
      );
      this.goBack();
    } catch (error) {
      this.util.presentAlert('Error', (error as any).message, 'OK');
    }
  }

  async changeEmail() {
    if (!this.user || !this.newEmail || !this.password) {
      this.util.presentAlert(
        'Error',
        'Por favor llena todos los campos.',
        'OK'
      );
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(this.newEmail)) {
      this.util.presentAlert(
        'Correo inválido',
        'Introduce un correo válido.',
        'OK'
      );
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(
        this.user.email!,
        this.password
      );
      await reauthenticateWithCredential(this.user, credential);
      await updateEmail(this.user, this.newEmail);
      await sendEmailVerification(this.user);
      await this.api.updateUser(this.user.uid, { email: this.newEmail });
      this.util.presentAlert(
        'Éxito',
        'Correo actualizado. Se ha enviado verificación.',
        'OK'
      );

      // Limpia los campos
      this.newEmail = '';
      this.password = '';
      await this.refreshUser(); // Actualiza datos de usuario
      this.logout();
    } catch (error: any) {
      let errorMessage = 'Ocurrió un error';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Ese correo ya está en uso.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Correo no válido.';
      }

      this.util.presentAlert('Error', error.message, 'OK');
      this.goBack();
    }
  }

  focusNext(nextInput: any) {
    setTimeout(() => {
      nextInput.setFocus(); // Le da foco al siguiente input
    }, 100);
  }
}
