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
import { ChangePaymentComponent } from '../components/change-payment/change-payment.component';
import { firstValueFrom } from 'rxjs';

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

    try {
      const result = await this.collectWalletHistory(uid);
      this.walletData = result.rides;
      this.rideService.stats.totalFare = result.total;
      this.lastDoc = result.lastDoc;
    } catch (error) {
      console.error('❌ Tab3: Error getting wallet history:', error);
      this.walletData = [];
      this.rideService.stats.totalFare = 0;
      this.lastDoc = null;
    } finally {
      await loader.dismiss();
    }
  }
  
  ngOnInit() {
  }
  ngOnChanges() {
    console.log('change');
  }

  async openPaymentMethods() {
    console.log('🔵 Opening Payment Methods modal');
    const modal = await this.util.createModal(ChangePaymentComponent);
    await modal.present();
    
    const { data } = await modal.onWillDismiss();
    if (data) {
      console.log('✅ Payment method selected:', data);
    }
  }

  private async collectWalletHistory(
    userId: string
  ): Promise<{
    rides: HistoryRide[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    total: number;
  }> {
    let cursor: QueryDocumentSnapshot<DocumentData> | null = null;
    let aggregated: HistoryRide[] = [];
    let total = 0;

    while (true) {
      const page = await firstValueFrom<HistoryRide[]>(
        this.api.getRideHistoryPaginated(
          userId,
          'createdAt',
          this.pageSize,
          cursor
        )
      );

      if (!page || page.length === 0) {
        break;
      }

      aggregated = this.mergeRidesById(aggregated, page);
      total += page.reduce(
        (sum: number, ride: HistoryRide) =>
          sum + Number(ride.totalFare || 0),
        0
      );

      const snapshot = (page[page.length - 1]['__snapshot__'] ??
        null) as QueryDocumentSnapshot<DocumentData> | null;

      cursor = snapshot ?? cursor;

      if (!snapshot || page.length < this.pageSize) {
        break;
      }
    }

    return {
      rides: aggregated,
      lastDoc: cursor,
      total,
    };
  }

  private mergeRidesById(
    existing: HistoryRide[],
    incoming: HistoryRide[]
  ): HistoryRide[] {
    const rideMap = new Map<string, HistoryRide>();

    existing.forEach((ride) => {
      if (ride?.id) {
        rideMap.set(ride.id, ride);
      }
    });

    incoming.forEach((ride) => {
      if (ride?.id) {
        rideMap.set(ride.id, ride);
      }
    });

    return Array.from(rideMap.values());
  }

}
