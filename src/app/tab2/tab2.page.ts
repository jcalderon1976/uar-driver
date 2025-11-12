import {
  Component,
  ViewChild,
  OnInit,
  AfterViewInit,
  ElementRef,
} from '@angular/core';
import { InitUserProvider } from '../services/inituser/inituser.service';
import { UtilService } from '../services/util/util.service';
import { APIService } from '../services/api/api.service';
import { IonInfiniteScroll, ModalController } from '@ionic/angular';
import { Driver } from '../models/driver';
import { HistoryRide } from '../models/historyRides';
import { RideDetailsPage } from '../pages/ride-details/ride-details.page';
import { firstValueFrom } from 'rxjs';
import { RideService } from '../services/ride/ride.service';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit {
  @ViewChild(IonInfiniteScroll, { static: false })
  infiniteScroll!: IonInfiniteScroll;
  @ViewChild('toolbar', { read: ElementRef }) toolbarRef!: ElementRef;

  public rides: HistoryRide[] = [];
  public loader!: HTMLIonLoadingElement;
  private lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
  private pageSize = 5;
  private hasMoreResults = false;
  loadingMore = false;
  userId!: string;
  public totalEarning: any = 0;
  public selectedIndex: number | null = null;
  public monthDays: any;

  constructor(
    private api: APIService,
    private userProvider: InitUserProvider,
    private util: UtilService,
    private ride: RideService,
    public modalController: ModalController
  ) {

    const days = [0, 1, 2, 3, 4, 5, 6];
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    this.monthDays = days.map(d => {
      return {
        day: dayOfWeek[new Date().getDay() - d >= 0 ? new Date().getDay() - d : new Date().getDay() - d + 7],
        date: new Date().getDate() - d > 0 ? new Date().getDate() - d : new Date().getDate() - d + this.daysInMonth(),
        selected: true
      };

    });

  }

  daysInMonth() {
    return new Date(new Date().getFullYear(), new Date().getMonth() - 1, 0).getDate();
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

  ngOnInit() {
    const loggedInUser: Driver = this.userProvider.getUserData(); //get user data from provider

    if (loggedInUser && loggedInUser.id) {
      this.userId = loggedInUser.id; // Get the user ID (token)
      this.loadHistory(loggedInUser.id); // Load the history
    } else {
      console.error('User data is not available');
    }
  }

  /** Show Loader */
  async showLoader() {
    this.loader = await this.util.createLoader('Loading history ...');
    await this.loader.present();
  }

  /** Dismiss Loader */
  async dismissLoader() {
    if (this.loader) {
      await this.loader.dismiss();
      (document.activeElement as HTMLElement)?.blur(); // 👈 evita el warning
    }
  }

  async loadHistory(userId: any) {
    this.lastDoc = null;
    this.hasMoreResults = false;
    this.totalEarning = 0;
    this.rides = [];
    if (this.infiniteScroll) {
      this.infiniteScroll.disabled = false;
    }
    this.selectedIndex = null;

    try {
      await this.showLoader();
      await this.getHistory(userId);
    } catch (error) {
      console.warn('No rides found o error:', error);
      this.rides = [];
      this.totalEarning = 0;
    } finally {
      await this.dismissLoader();
    }
  }

  async getHistory(userId: string): Promise<void> {
    try {
      const result = await this.fetchAllHistory(userId);
      this.rides = result.rides;
      this.totalEarning = result.totalEarning;
      this.lastDoc = result.lastDoc;
      this.hasMoreResults = result.hasMore;
      if (this.infiniteScroll) {
        this.infiniteScroll.disabled = !this.hasMoreResults;
      }
    } catch (error) {
      console.error('❌ Tab2: Error getting rides:', error);
      this.rides = [];
      this.totalEarning = 0;
      this.hasMoreResults = false;
      if (this.infiniteScroll) {
        this.infiniteScroll.disabled = true;
      }
      throw error;
    }
  }

  async getHistoryByDate(userId: string, date: Date): Promise<void> {
    try {
      const result = await this.fetchAllHistory(userId, date);
      this.rides = result.rides;
      this.totalEarning = result.totalEarning;
      this.lastDoc = result.lastDoc;
      this.hasMoreResults = result.hasMore;
      if (this.infiniteScroll) {
        this.infiniteScroll.disabled = !this.hasMoreResults;
      }
    } catch (error) {
      console.error('❌ Tab2: Error getting rides by date:', error);
      this.rides = [];
      this.totalEarning = 0;
      this.hasMoreResults = false;
      if (this.infiniteScroll) {
        this.infiniteScroll.disabled = true;
      }
      throw error;
    }
  }

  private async fetchHistoryPage(
    userId: string,
    cursor: QueryDocumentSnapshot<DocumentData> | null,
    date?: Date
  ): Promise<{
    rides: HistoryRide[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    hasMore: boolean;
    total: number;
  }> {
    const source$ = date
      ? this.api.getRideHistoryPaginatedByDate(
          userId,
          date,
          'createdAt',
          this.pageSize,
          cursor
        )
      : this.api.getRideHistoryPaginated(
          userId,
          'createdAt',
          this.pageSize,
          cursor
        );

    const page = await firstValueFrom(source$);
    if (!page || page.length === 0) {
      return {
        rides: [],
        lastDoc: cursor,
        hasMore: false,
        total: 0,
      };
    }

    const converted = this.util.latLngConverterSQL(page);
    await this.updateRides(converted);

    const total = converted.reduce(
      (sum, ride) => sum + Number(ride.totalFare || 0),
      0
    );

    const lastSnapshot =
      (page[page.length - 1]['__snapshot__'] as QueryDocumentSnapshot<DocumentData>) ||
      null;

    const hasMore = page.length === this.pageSize && !!lastSnapshot;

    return {
      rides: converted,
      lastDoc: lastSnapshot ?? cursor,
      hasMore,
      total,
    };
  }

  private async fetchAllHistory(
    userId: string,
    date?: Date
  ): Promise<{
    rides: HistoryRide[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    totalEarning: number;
    hasMore: boolean;
  }> {
    let cursor: QueryDocumentSnapshot<DocumentData> | null = null;
    let aggregated: HistoryRide[] = [];
    let total = 0;
    let hasMore = false;

    while (true) {
      const { rides, lastDoc, hasMore: pageHasMore, total: pageTotal } =
        await this.fetchHistoryPage(userId, cursor, date);

      if (!rides.length) {
        hasMore = false;
        cursor = lastDoc;
        break;
      }

      aggregated = this.mergeRidesById(aggregated, rides);
      total += pageTotal;
      cursor = lastDoc;

      if (!pageHasMore) {
        hasMore = false;
        break;
      }

      hasMore = true;
    }

    return {
      rides: aggregated,
      lastDoc: cursor,
      totalEarning: total,
      hasMore,
    };
  }



  async loadMore(event: any) {
    if (this.loadingMore) {
      event.target.complete();
      return;
    }

    if (!this.hasMoreResults || !this.lastDoc) {
      event.target.disabled = true;
      event.target.complete();
      return;
    }

    this.loadingMore = true;

    try {
      const { rides, lastDoc, hasMore, total } = await this.fetchHistoryPage(
        this.userId,
        this.lastDoc
      );

      if (!rides.length) {
        event.target.disabled = true;
      } else {
        this.rides = this.mergeRidesById(this.rides, rides);
        this.totalEarning += total;
        this.lastDoc = lastDoc;
        this.hasMoreResults = hasMore;
        if (!hasMore) {
          event.target.disabled = true;
        }
      }
    } catch (error) {
      console.error('Error loading more rides:', error);
    }

    event.target.complete();
    this.loadingMore = false;
  }

  /** Update Rides with Address Info */
  async updateRides(rides: HistoryRide[]) {
    console.log(`🗺️ Updating addresses for ${rides.length} rides...`);
    
    for (let i = 0; i < rides.length; i++) {
      const ride = rides[i];
      try {
        console.log(`🔄 Getting address for ride ${i + 1}/${rides.length}`);
        
        // Get the origin address using your ride service
        const originPromise = await firstValueFrom(this.ride.getOrigin(ride));
        if (originPromise.results?.length) {
          ride.origin_address = originPromise.results[0].formatted_address;
          console.log(`✅ Origin address for ride ${i + 1}: ${ride.origin_address}`);
        }
        
        // Get the destination address using your ride service
        const destinationRes = await firstValueFrom(
          this.ride.getDestination(ride)
        );
        if (destinationRes.results?.length) {
          ride.destination_address =
            destinationRes.results[0].formatted_address;
          console.log(`✅ Destination address for ride ${i + 1}: ${ride.destination_address}`);
        }
      } catch (err) {
        console.error(`❌ Error updating addresses for ride ${i + 1}:`, err);
        console.error(`❌ Ride data:`, ride);
      }
    }
    
    console.log('✅ All ride addresses updated');
  }

  /** Merge rides ensuring unique IDs */
  private mergeRidesById(existing: HistoryRide[], incoming: HistoryRide[]): HistoryRide[] {
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

  /** Dismiss and Navigate Home */
  dismiss() {
    this.util.goToNew('/home');
  }

  /** Infinite Scroll Example */
  loadData(event: any) {
    setTimeout(() => {
      event.target.complete();
      event.target.disabled = true;
    }, 20);
  }

  /** Show Ride Details in Modal */
  async showInfo(ride: HistoryRide) {
    const detailModal = await this.util.createModal(RideDetailsPage, {
      componentProps: { rideInfo: ride },
    }); // Pass the object here
    await detailModal.present();
  }

  async weekChecked(week: any, index: number) {
    console.log('Week selected:', week);
    this.selectedIndex = index;
    try {
      this.lastDoc = null;
      this.hasMoreResults = false;
    if (this.infiniteScroll) {
      this.infiniteScroll.disabled = true;
    }
      await this.showLoader();
      await this.getHistoryByDate(
        this.userId,
        new Date(new Date().getFullYear(), new Date().getMonth(), week.date)
      );
    } catch (error) {
      console.warn('No rides found o error:', error);
      this.rides = []; // Asegúrate que se vacíe si no hay
    } finally {
      await this.dismissLoader(); // 🔥 Siempre cerrar loader
    }


  }

  AllJobs() {
    this.lastDoc = null; // Reset lastDoc for new query
    this.rides = []; // Clear the rides array
    this.totalEarning = 0; // Reset totalEarning
    this.hasMoreResults = false;
    if (this.infiniteScroll) {
      this.infiniteScroll.disabled = false;
    }
    this.selectedIndex = null;
    this.loadHistory(this.userId); // Load the history
  }
}
