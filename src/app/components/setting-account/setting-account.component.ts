import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Driver } from '../../models/driver';
import { APIService } from '../../services/api/api.service';
import { InitUserProvider } from '../../services/inituser/inituser.service';
import { UtilService } from 'src/app/services/util/util.service';
import { ChangePasswordComponent } from '../change-password/change-password.component';
import { ChangeUserComponent } from '../change-user/change-user.component';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { AuthService } from 'src/app/services/api/auth.service';
import { PhotoService } from '../../services/util/photo.service';

@Component({
  selector: 'app-setting-account',
  templateUrl: './setting-account.component.html',
  styleUrls: ['./setting-account.component.scss'],
  standalone: false,
})
export class SettingAccountComponent implements OnInit {
  @ViewChild('toolbar', { read: ElementRef }) toolbarRef!: ElementRef;

  imageUrl: string =
    'https://firebasestorage.googleapis.com/v0/b/uar-platform.firebasestorage.app/o/photos%2FuserDefault.png?alt=media&token=ef06263c-9e2a-4e6d-9198-1898fd5c19df'; // ✅ Ahora ya puedes usarla en el HTML
  public loggedInUser!: Driver;
  // Validation flags
  emailError = false;
  passwordError = false;
  phoneError = false;
  nameError = false;
  spinner = false;
  disabled = false;

  constructor(
    private modalCtrl: ModalController,
    private userProvider: InitUserProvider,
    private api: APIService,
    private util: UtilService,
    private firestore: Firestore,
    private auth: AuthService,
    private camaraService: PhotoService
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
    // to redirect to further pages if a booking is active //TODO
    this.loggedInUser = this.userProvider.getUserData();
    this.imageUrl = this.loggedInUser.profile_img?.toString() || this.imageUrl; // Si no hay imagen, usa la imagen por defecto
  }

  focusNext(nextInput: any) {
    setTimeout(() => {
      nextInput.setFocus(); // Le da foco al siguiente input
    }, 100);
  }

  goBack() {
    this.modalCtrl.dismiss();
  }

  async changePassword() {
    const modal = await this.util.createModal(ChangePasswordComponent);

    modal.onWillDismiss().then(async (dataReturned) => {
      if (dataReturned != null) {
      }
    });
    return await modal.present();
  }

  async changeUser() {
    const modal = await this.util.createModal(ChangeUserComponent);

    modal.onWillDismiss().then(async (dataReturned) => {
      if (dataReturned != null) {
      }
    });
    return await modal.present();
  }

  submitIfValid() {}

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

    this.loggedInUser.phone = input;
  }

  async SaveChange() {
    this.updateUser(
      this.loggedInUser.id,
      this.loggedInUser.name,
      this.loggedInUser.email,
      this.loggedInUser.phone,
      this.loggedInUser.profile_img || ''
    );
    this.goBack();
  }

  updateUser(
    id: string,
    name: string,
    email: string,
    phone: string,
    profile_img?: string
  ) {
    this.api
      .updateUser(id, {
        name: name,
        email: email,
        phone: phone,
        profile_img: profile_img,
      })
      .subscribe(
        (res) => {
          console.log('User information saved', res);
        },
        (err) => console.log(err)
      );
  }

  async updateProfilePicture(imageUrl: string) {
    if (this.loggedInUser && this.loggedInUser.id) {
      const userRef = doc(this.firestore, `users/${this.loggedInUser.id}`);

      try {
        this.imageUrl = imageUrl;
        await updateDoc(userRef, { profilePicture: imageUrl });
        console.log('Foto de perfil actualizada en Firestore');
      } catch (error) {
        console.error('Error actualizando foto en Firestore:', error);
      }
    }
  }

  tomarFoto() {
    this.camaraService
      .tomarFotoYSubir(this.loggedInUser.email)
      .then((result) => {
        console.log('Foto subida:', result);
        this.imageUrl = result; // Actualiza la URL de la imagen
        this.loggedInUser.profile_img = result; // Actualiza la imagen del usuario
      })
      .catch((err) => console.error('Error al subir la foto', err));
  }
}
