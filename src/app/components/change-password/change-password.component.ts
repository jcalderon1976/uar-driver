import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Driver } from '../../models/driver';
import { APIService } from '../../services/api/api.service';
import { InitUserProvider } from '../../services/inituser/inituser.service';
import { UtilService } from 'src/app/services/util/util.service';
//import { ResetPasswordComponent } from '../reset-password/reset-password.component'

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
  standalone: false,
})
export class ChangePasswordComponent implements OnInit {
  @ViewChild('toolbar', { read: ElementRef }) toolbarRef!: ElementRef;
  public loggedInUser!: Driver;
  public password3: string = '';

  constructor(
    private modalCtrl: ModalController,
    private userProvider: InitUserProvider,
    private api: APIService,
    private util: UtilService
  ) //private resetPassword: ResetPasswordComponent
  {}

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
  }

  goBack() {
    this.modalCtrl.dismiss();
  }

  SaveChange() {
    if (!this.validatePasswords(this.loggedInUser.password, this.password3)) {
      this.util.presentAlert(
        'Error',
        'Las contraseñas no parea o son muy cortas',
        'OK'
      );
    }

    this.updatePassword(
      this.loggedInUser.email,
      this.loggedInUser.password,
      this.loggedInUser.password
    );
    this.util
      .presentAlert('Success', 'La contraseña fue actualizada con exito', 'OK')
      .then(() => {
        this.goBack();
      });
  }

  updatePassword(email: string, currentPassword: string, newPassword: string) {
    this.api.updatePassword(email, currentPassword, newPassword);
  }

  validatePasswords(password1: string, password2: string): boolean {
    return password1 === password2 && password1.length >= 3;
  }
}
