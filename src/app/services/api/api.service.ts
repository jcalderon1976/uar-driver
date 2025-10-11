import { Injectable, OnDestroy } from '@angular/core';
import { Observable, from } from 'rxjs';
import { FirestoreService } from './firestore.service';
import { Subscription ,Subject} from 'rxjs';
import { doc , QueryDocumentSnapshot, QuerySnapshot, DocumentData ,collection, DocumentSnapshot } from 'firebase/firestore';
import { query, where, orderBy, limit } from '@angular/fire/firestore';
import { HistoryRide } from 'src/app/models/historyRides';
import { PaymentMethod } from 'src/app/models/paymentMethod';
import { BaseDatabaseModel } from '../../models/base-dto.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})

export class APIService implements OnDestroy {
  private id!: string;
  private getRideSubscribe!: Subscription;  // Store the subscription
  private lastDoc: QueryDocumentSnapshot<any> | null = null; // Track last document for pagination
  private pageSize = 10; // Number of rides per fetch
  private hasMoreData = true; // Track if more data exists
  private destroy$ = new Subject<void>();

  constructor(
    private firestore: FirestoreService ,
    private auth: AuthService

  ) { }
 
  ngOnDestroy(): void {
    // Emitir valor para romper todas las suscripciones
    this.destroy$.next();
    this.destroy$.complete();
     // Unsubscribe to avoid memory leaks
     if (this.getRideSubscribe) {
      this.getRideSubscribe.unsubscribe();
    }
  }


  logIn(username: string, password: string): Observable<any> {
    
    return new Observable((observer) => {
    this.auth.login(username, password)
       .then(user => {
         observer.next({ id: user.uid });
       }).catch(err => {
         observer.error(err);
       }); 
   });  

  }


  loginWithGoogle(): Observable<any> {
    
  return new Observable((observer) => {
  this.auth.loginWithGoogle()
     .then(user => {
       observer.next({ id: user.uid });
     }).catch(err => {
       observer.error(err);
     }); 
 });  

  }


  loginMicrosoft(): Observable<any> {
    
  return new Observable((observer) => {
  this.auth.loginMicrosoft()
     .then(user => {   //observer.next({ id: user.uid });
     }).catch(err => { observer.error(err);
     }); 
 });  

  }


  loginApple(): Observable<any> {
    
  return new Observable((observer) => {
  this.auth.loginApple()
     .then(user => { //  observer.next({ id: user.uid });
     }).catch(err => { observer.error(err);
     }); 
 });  

  }

  getToken(): string {
    return this.id; //this.auth.getToken(); // Get the token from AuthService
  } 

  updateToken(id: string) {
    this.id = id;
    this.firestore.setUserId(id);
  }

  getUser(): Observable<any> {
    if(this.id){
       console.log('[ api.services.getUser() ]- User id =>'+ this.id);
       return from(this.firestore.getOne('drivers', this.id));
    }
    console.log('[ api.services.getUser() ]-> return from(Promise.resolve(null))  <----- ERROR');
    return from(Promise.resolve(null));
  }
 
  getRide(rideId: any) : Observable<any> {
    if(rideId){
     return from(this.firestore.getOne('rides', rideId));
    } 
    return from(Promise.resolve(null));
  }

  setRideRejected2(rideId: any): Observable<any> {
    console.log('setRideRejected Start');
    console.dir(rideId);
       
    return this.updateRideData(rideId, { user_rejected: true });
    
  }
  setRideRejected(rideId: any): Observable<any> {

    console.log('setRideRejected Start');
    return this.updateRideData(rideId, { user_rejected: true })
            
  }

  
  getRideHistory(userId : string, orderByField : string): Observable<any> {
    return this.firestore.runHistoryQuery('rides', { field: 'driverId', operation: '==', searchKey: userId, orderby: orderByField });
  }

  loadMoreRides(userId: string, orderByField: string): Observable<any> {
    
    return this.firestore.loadMoreRides(userId, orderByField);
  }


  getRideHistoryPaginated( userId : string, orderByField: string, limitCount: number, lastDoc: DocumentSnapshot<any> | null  ): Observable<HistoryRide[]> {
    return this.firestore.getHistoryPaginated<HistoryRide>(userId, 'rides', orderByField, limitCount, lastDoc );
  }

  getRideHistoryPaginatedByDate( userId : string, date: Date,  orderByField: string, limitCount: number, lastDoc: DocumentSnapshot<any> | null  ): Observable<HistoryRide[]> {
    return this.firestore.getHistoryPaginatedByDate<HistoryRide>(userId, date, 'rides', orderByField, limitCount, lastDoc );
  }
 
  addIdToObject(id : string, obj: Observable<any>) {
    return new Observable((observer) => {
      if (id) {
        obj.subscribe(ref => { 
              const newObj = ref;
              if(newObj){
                 newObj.id = id;
              }
              observer.next(newObj);
             // observer.error({ message: 'No ID' });
        });
      } else {
        observer.error({ message: 'No ID' });
      }
    });
  }

  getDriver(driverId: any): Observable<any> {
    if(driverId){
      return from(this.firestore.getOne('drivers', driverId));
    }
    return from(Promise.resolve(null));
  }

  updateUser(id : any, userData: any): Observable<any> {
    //console.log('updateuser');
    return from(this.firestore.update('drivers', id, userData));
  }

  setRideTimeOut(rideId: any): Observable<any> {
    return new Observable((observer) => 
    {
      this.getRideSubscribe = this.getRide(rideId).subscribe(ride => {
        console.log(ride);
        // Asegúrate de que no se vuelve a entrar si ride_accepted ya ha sido actualizado
       
          if (ride && !ride['ride_accepted']) 
          {
               this.updateRideData(rideId, { request_timeout: true }).subscribe(res => {
                                  observer.next({ message: [1] });
                                  // Aquí puedes desuscribirte para evitar el bucle
                                    if (this.getRideSubscribe) {
                                      this.getRideSubscribe.unsubscribe();
                                  }
                                 }, err => {
                                            observer.next({ message: [0] });
                                            // Desuscribirse también en caso de error
                                        if (this.getRideSubscribe) {
                                          this.getRideSubscribe.unsubscribe();
                                      }
                                 });              
          } else {  observer.next({ message: [0] }); 
                    // Desuscribir si la condición no se cumple
                    if (this.getRideSubscribe) {
                      this.getRideSubscribe.unsubscribe();
      }
        }
      }, 
      err => {  
        observer.error(err);
      });
    });
  }

  bookRide(rideData: any): Observable<any> {

    console.log('rideData =>');
    console.dir(rideData);

    const query = this.firestore.create('rides', rideData); // ✅ Modular create()
    return this.snapshotToDataConverter(query);
  }

  snapshotToDataConverter<T>(query: Promise<QueryDocumentSnapshot<T>>): Observable<T & { id: string }> {
    return new Observable((observer) => {
      query
        .then(ref => {
          const obj = ref.data();
          if (obj) {
            const result = { ...obj, id: ref.id };
            observer.next(result);
          } else {
            observer.next({} as T & { id: string }); // Devuelve objeto vacío con id si no hay data
          }
        })
        .catch(err => {
          console.error('Firestore create error:', err);
          observer.error(err);
        });
    });
  }

  signUp(user: any): Observable<any> {
  
    return new Observable((observer) => {
      this.auth.createAccount(user)
        .then(User => {
          console.log(User);
              user.id = User.uid;
              this.firestore.createWithId('drivers', user).then(usr => {
                console.log(usr);
                observer.next(user);
              }, err => {
                observer.error(err);
              });
        }).catch(err => {
          observer.error(err);
        });
    });
  
  }

  addPaymentMethod(paymentMethod: any): Observable<any> {
    return this.snapshotToDataConverter(this.firestore.create('PaymentMethod', paymentMethod));
  }

  getPaymentMethod(driversId: string): Observable<any> {
  //return this.addIdToObject(driversId, this.firestore.getOne('PaymentMethod', driversId));
  return this.firestore.runHistoryQuery('PaymentMethod', { field: 'driversId', operation: '==', searchKey: driversId, orderby: 'paymentMethod' });
  }


  async setPaymentMethodDefault(documentId: string, PaymentMethodData: any){
  return await from(this.firestore.update('PaymentMethod', documentId, PaymentMethodData));
  }

   deletePaymentMethod(documentId: string): Promise<void> {
   return    this.firestore.delete('PaymentMethod',documentId)
 
  }


  async updatePassword(email: string, currentPassword : string, newPassword : string){
  try {

    await this.auth.resetPassword(email) ;
  } catch (error) {
    console.log('Error: No se pudo re-autenticar al usuario.');
    console.log('ERROR ' + error)
  }

}

logout() {
  return this.auth.logout();
}

//driver

acceptRide(rideId :any, driverId :any): Observable<any> {
  return new Observable((observer) => {
    this.getRide(rideId).subscribe(ride => {
      console.log(ride);
      if (!ride['request_timeout']) {
        this.updateRideData(rideId, { ride_accepted: true, driverId })
          .subscribe(res => {
            observer.next({ message: [1] });
          }, err => {
            observer.next({ message: [0] });
          });
      } else {
        observer.next({ message: [0] });
      }
    }, err => {
      observer.error(err);
    });
  });
}

cancelRide(rideId:any): Observable<any> {
  return this.updateRideData(rideId, { driver_rejected: true, driverId: null });
}

startRide(rideId:any): Observable<any> {
  return new Observable((observer) => {
    this.getRide(rideId).subscribe(ride => {
      console.log(ride);
      if (!ride['user_rejected']) {
        this.updateRideData(rideId, { ride_started: true })
          .subscribe(res => {
            observer.next({ message: [1] });
          }, err => {
            observer.next({ message: [0] });
          });
      } else {
        observer.next({ message: [0] });
      }
    }, err => {
      observer.error(err);
    });
  });
}

completeRide(rideId:any): Observable<any> {
  return this.updateRideData(rideId, { ride_completed: true });
}

updateDriverData(id:any, driverData:any): Observable<any> {
  return from(this.firestore.update('drivers', id, driverData));
}

updateRideData(rideId:any, data:any): Observable<any> {
  return from(this.firestore.update('rides', rideId, data));
}

rideCheck(): Observable<any> {
  const result = this.firestore.findOne('rides', (ref) => {
    return query(
      ref,
      where('driverId', '==', ''),
      where('user_rejected', '==', false),
      where('driver_rejected', '==', false),
      where('ride_completed', '==', false),
      where('ride_started', '==', false),
      where('request_timeout', '==', false),
      where('ride_accepted', '==', false),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
  });

  return result;
}

async getRideUser(userId: string): Promise<any> {
  const userData = await this.firestore.getOne('clients', userId);
  if (userData) {
    return { id: userId, ...userData };
  }
  return null;
}

getTodayRideStats(driverId: string): Observable<any> {
  return new Observable((observer) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.firestore.find('rides', (ref) =>
      query(
        ref,
        where('driverId', '==', driverId),
        where('createdAt', '>', today)
      )
    ).subscribe(
      (rides: any[]) => {
        if (rides.length) {
          const totalRides = rides.length;
          const totalFare = rides.reduce((sum, ride) => sum + (ride.fare || 0), 0);
          const totalDistance = rides.reduce((sum, ride) => sum + (ride.distance || 0), 0);
          const createdAt = rides[0]?.createdAt?.toDate?.() || new Date();
          const hoursOnline = ((Date.now() - createdAt.getTime()) / 3600000).toFixed(2);
          observer.next({ totalRides, totalFare, totalDistance, hoursOnline });
        } else {
          observer.next({ totalRides: 0, totalFare: 0, totalDistance: 0, hoursOnline: 0 });
        }
      },
      (err) => {
        observer.error(err);
      }
    );
  });


}

}
