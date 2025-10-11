import { Component, ViewChild, ElementRef , OnInit, OnChanges} from '@angular/core';
import { Router } from '@angular/router';
import { InitUserProvider } from '../services/inituser/inituser.service';
import { UtilService } from '../services/util/util.service';
import { APIService } from '../services/api/api.service';
import { RideService } from '../services/ride/ride.service';
import { AlertController } from '@ionic/angular';
import { Driver } from '../models/driver';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { HistoryRide } from '../models/historyRides';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page implements OnInit, OnChanges {
  @ViewChild('toolbar', { read: ElementRef }) toolbarRef!: ElementRef;
  public loggedInUser: Driver;
  public walletData: any = [];
  private lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
  private pageSize = 5;
  loadingMore = false;
  public rides: HistoryRide[] = [];

  constructor(
    private userProvider: InitUserProvider,
    private alertController: AlertController,
    private util: UtilService,
    private api: APIService,
    public rideService: RideService,
    private router: Router
  ) {
    this.loggedInUser = this.userProvider.getUserData();
    this.getHistory(this.loggedInUser.id);
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
            background: linear-gradient(120deg, #FE695D, #AA2CE6) !important;
          }
        `;
      shadowRoot.appendChild(style);
    }
  }

  refreshPage() {
    this.loggedInUser = this.userProvider.getUserData();
  }

  async getHistory(uid: any): Promise<void> {
    const loader = await this.util.createLoader('Loading Ride History ...');
    await loader.present();
    return new Promise((resolve, reject) => {
         this.api.getRideHistoryPaginated( uid, 'createdAt', this.pageSize, this.lastDoc )
           .subscribe(
             async (rides: HistoryRide[]) => {
               if (rides.length > 0) {
                 
                 this.walletData = rides;
                 let total = 0;
                  for (let i = 0; i < this.walletData.length; i++) {
                    total = total + this.walletData[i].fare
                  }
                  this.rideService.stats.totalFare = total;
                 
                 // 4. Actualiza lastDoc
                 this.lastDoc = rides[rides.length - 1][
                   '__snapshot__'
                 ] as QueryDocumentSnapshot<DocumentData>; // ✅ Asegurar el tipo correcto
                 
                 loader.dismiss();
                // resolve();
                
               } else {
                 reject('No rides found');
               }
             },
             (error) => {
               reject(error);
             }
           );
       });   
  }
  
  ngOnInit() {
  }
  ngOnChanges() {
    console.log('change');
  }

}
