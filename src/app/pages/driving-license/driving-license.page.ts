
import { Component, OnInit ,ViewChild , ElementRef } from '@angular/core';
import { UtilService } from '../../services/util/util.service';
import { InitUserProvider } from '../../services/inituser/inituser.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-driving-license',
  templateUrl: './driving-license.page.html',
  styleUrls: ['./driving-license.page.scss'],
  standalone: false
})
export class DrivingLicensePage implements OnInit {

  @ViewChild('toolbar', { read: ElementRef }) toolbarRef!: ElementRef;
  

  public documents = [
    {
      'name': 'Update Profile',
      'icon': 'person',
    }
  ]
  cardNumber: any = '';
  expiryDate: any = '';
  photos: any = [];

  constructor(private util: UtilService, 
              private userProvider: InitUserProvider,
              private router: Router) { }

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
  goBack() {
    this.router.navigate(['/document-management'], { replaceUrl: true });
  }


  ngOnInit() {
  }

  async openActionsheet() {
    const action = await this.util.createActionSheet({
      text: 'Take a Picture',
      role: 'destructive',
      cssClass: 'buttonCss',
      handler: () => {
        this.userProvider.openCamera();
      }
    }, {
      text: 'Pick From Gallery',
      handler: () => {
        this.userProvider.openGallery();
      }
    }, {
      text: 'Cancel',
      role: 'cancel',
      cssClass: 'buttonCss_Cancel',
      handler: () => {
        console.log('Cancel clicked');
      }
    });

    await action.present();
  }


}
