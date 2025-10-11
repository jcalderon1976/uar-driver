import { Component, ViewChild, ElementRef } from '@angular/core';
import { InitUserProvider } from '../services/inituser/inituser.service';
import { UtilService } from '../services/util/util.service';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { APIService } from '../services/api/api.service';
import { Driver } from '../models/driver';
import { PaymentComponent } from '../components/payment/payment.component';
import { Payment2Component } from '../components/payment2/payment2.component';
import { LegalComponent } from '../components/legal/legal.component';
import { SettingAccountComponent } from '../components/setting-account/setting-account.component';
import { CarInfoComponent } from '../components/car-info/car-info.component';
import { AlertController } from '@ionic/angular';
import { PhotoComponent } from '../components/photo/photo.component';
@Component({
  selector: 'app-tab4',
  templateUrl: 'tab4.page.html',
  styleUrls: ['tab4.page.scss'],
  standalone: false,
})
export class Tab4Page {
  @ViewChild('toolbar', { read: ElementRef }) toolbarRef!: ElementRef;
  @ViewChild(PhotoComponent) photoComponent!: PhotoComponent;

  public loggedInUser: Driver;
  public image: string;

  constructor(
    private userProvider: InitUserProvider,
    private alertController: AlertController,
    private util: UtilService,
    private api: APIService,
    private router: Router
  ) {
    this.loggedInUser = this.userProvider.getUserData();
    this.image =
      this.loggedInUser.profile_img?.toString() || 'photos/userDefault.png';
  }

  ionViewWillLeave() {
    // 👇 Esto borra el foco antes de que el tab se oculte
    (document.activeElement as HTMLElement)?.blur();
  }

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

  refreshPage() {
    this.loggedInUser = this.userProvider.getUserData();
    this.image =
      this.loggedInUser.profile_img?.toString() || 'photos/userDefault.png';

    if (this.photoComponent) {
      this.photoComponent.imageUrl = this.image;
    }
  }

  async logoutAction() {
    const alert = await this.alertController.create({
      header: 'Confirm',
      message: environment.LOGOUT_CONFIRMATION,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel', // ✅ Este botón cierra el alert sin acción
          cssClass: 'alert-button-custom',
        },
        {
          text: 'OK',
          handler: () => {
            console.log('OK clicked');
            this.logout();
          },
          cssClass: 'alert-button-custom',
        },
      ],
      cssClass: 'custom-alert-card',
    });
    await alert.present();
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

  async openDocuments() {
     this.router.navigate(['/document-management'], { replaceUrl: true });
  }

  async openCarInfo() {
    const modal = await this.util.createModal(CarInfoComponent);
    modal.onWillDismiss().then(async (dataReturned) => {
      this.refreshPage();
    });

    return await modal.present();
  }

  async openLegal() {
    const modal = await this.util.createModal(LegalComponent);

    modal.onWillDismiss().then(async (dataReturned) => {
      if (dataReturned != null) {
        this.refreshPage();
      }
    });
    return await modal.present();
  }

  async openSetting() {
    const modal = await this.util.createModal(SettingAccountComponent);

    modal.onWillDismiss().then(async (dataReturned) => {
      this.refreshPage();
    });
    return await modal.present();
  }
}
