import { Component, OnInit , ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { UtilService } from '../../services/util/util.service';
import {DriverDocument} from '../../models/driver-document';
@Component({
  selector: 'app-document-management',
  templateUrl: './document-management.page.html',
  styleUrls: ['./document-management.page.scss'],
  standalone: false,
})
export class DocumentManagementPage implements OnInit {
  @ViewChild('toolbar', { read: ElementRef }) toolbarRef!: ElementRef;
  
  public documents: DriverDocument[] = [];
  
  constructor(public util: UtilService, private router: Router) { }
  
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

    this.documents = environment.DRIVER_DOC_LIST;
  }

  gotoPage(item: any) {
    this.util.goForward(`/${item}`);
  }
  goBack() {
    this.router.navigate(['/tabs/tab4']);
  }
  
}
