import { Injectable, OnDestroy } from '@angular/core';
import {  Firestore,  doc,  getDoc,  collection,  addDoc,  setDoc,  updateDoc,  deleteDoc,  query,  where,  orderBy,getDocs, startAfter, limit, 
serverTimestamp, collectionData,  DocumentSnapshot,  Query,  docData,  DocumentReference,  CollectionReference, QueryDocumentSnapshot, DocumentData,
Timestamp, query as firestoreQuery, } from '@angular/fire/firestore';
import { Observable, Subject , from } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { BaseDatabaseModel } from '../../models/base-dto.model';
import { HistoryRide } from '../../models/historyRides';

@Injectable({
  providedIn: 'root'
})

export class FirestoreService implements OnDestroy {

  private userid: string = '1';
  private unsubscribe$ = new Subject<void>();
  private lastDoc: QueryDocumentSnapshot<any> | null = null; // Track last document for pagination
  private pageSize = 10; // Number of rides per fetch

  constructor(private firestore: Firestore) {}

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  async createWithId<T extends BaseDatabaseModel>(collectionName: string, data: T): Promise<void> {
    const ref = doc(this.firestore, collectionName, data.id) as DocumentReference<T>;
    await setDoc(ref, this.addCreatedAt(data));
  } 

  async setUserId(id: string) {
    this.userid = id;
  }

  async getOne(collectionName: string, id: string){
    const ref = doc(this.firestore, `${collectionName}/${id}`);
    const snapshot = await getDoc(ref); // get the document
    if(snapshot.exists()){
        return snapshot.data(); // get the data
    }else{
        return null; 
    }
  }

  async create<T extends BaseDatabaseModel>(collectionName: string, data: T): Promise<DocumentSnapshot<T>> {
    const colRef = collection(this.firestore, collectionName) as CollectionReference<T>;
    
    const dataWithTimestamps = this.addCreatedAt(data);
    console.log('Saving to Firestore:', dataWithTimestamps);

    const docRef = await addDoc(colRef, this.addCreatedAt(data));
    return await getDoc(docRef) as DocumentSnapshot<T>;
  }

  get<T extends BaseDatabaseModel>(collectionName: string): Observable<T[]> {
    const colRef = collection(this.firestore, collectionName) as CollectionReference<T>;
    const q = query(colRef, where('uid', '==', this.userid)) as Query<T>;
    return collectionData<T>(q, { idField: 'id' }).pipe(take(1));
  }

  async update<T extends BaseDatabaseModel>(collectionName: string, id: string, document: Partial<T>): Promise<void> {
    const ref = doc(this.firestore, collectionName, id) as DocumentReference<T>;
    await updateDoc(ref, this.addUpdatedAt(document));
  }

  async delete<T extends BaseDatabaseModel>(collectionName: string, id: string): Promise<void> {
    const clienteRef = doc(this.firestore, `${collectionName}/${id}`); // reference to the document with id 1
    await deleteDoc(clienteRef); // delete the document
  }

  async uploadFile(folderName: string, downloadUrl: string, fileName: string): Promise<void> {
    const colRef = collection(this.firestore, 'fileReferences');
    await addDoc(colRef, { downloadUrl, fileName, uid: this.userid });
  }

  getImages(): Observable<any[]> {
    const colRef = collection(this.firestore, 'fileReferences');
    const q = query(colRef, where('uid', '==', this.userid));
    return collectionData(q, { idField: 'id' }) as Observable<any[]>;
  }

  runQuery<T extends BaseDatabaseModel>(collectionName: string, queryData: FirestoreQuery): Observable<T[]> {
    const colRef = collection(this.firestore, collectionName) as CollectionReference<T>;
    const q = query(colRef, where(queryData.field, queryData.operation, queryData.searchKey)) as Query<T>;
    return collectionData<T>(q, { idField: 'id' });
  }

  runHistoryQuery<T extends BaseDatabaseModel>(collectionName: string, queryData: FirestoreQuery): Observable<T[]> {
    const colRef = collection(this.firestore, collectionName) as CollectionReference<T>;
    const q = query(
      colRef,
      where(queryData.field, queryData.operation, queryData.searchKey),
      orderBy(queryData.orderby, 'desc')
    ) as Query<T>;
    return collectionData<T>(q, { idField: 'id' }).pipe(takeUntil(this.unsubscribe$));
  }

  getHistoryPaginated<T>( userId: string, collectionName: string,  orderByField: string, limitCount: number,   lastDoc: DocumentSnapshot<T> | null  ): Observable<(T & { id: string; __snapshot__: any })[]> {  
  
     const colRef = collection(this.firestore, collectionName);
    
      let q;
      if (lastDoc) {
        q = query(colRef,  where('driverId', '==', userId),  orderBy(orderByField, 'desc'),  startAfter(lastDoc),  limit(limitCount)  );
      } else {
        q = query(colRef,  where('driverId', '==', userId),  orderBy(orderByField, 'desc'),  limit(limitCount) );
      }
    
      return from(getDocs(q).then(snapshot => {
        return snapshot.docs.map(doc => {
          const data = doc.data() as T;
          return {
            ...data,
            id: doc.id,
            __snapshot__: doc
          };
        });
      }));
  
  } 


  getHistoryPaginatedByDate<T>( userId: string, date: Date, collectionName: string,  orderByField: string, limitCount: number,   lastDoc: DocumentSnapshot<T> | null  ): Observable<(T & { id: string; __snapshot__: any })[]> {  
  
    const colRef = collection(this.firestore, collectionName);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);

    let q;

    if (lastDoc) {
      q = query(
        colRef,
        where('driverId', '==', userId),
        where('createdAt', '>=', startTimestamp),
        where('createdAt', '<=', endTimestamp),
        orderBy(orderByField, 'desc'),
        startAfter(lastDoc),
        limit(limitCount)
      );
    } else {
      q = query(
        colRef,
        where('driverId', '==', userId),
        where('createdAt', '>=', startTimestamp),
        where('createdAt', '<=', endTimestamp),
        orderBy(orderByField, 'desc'),
        limit(limitCount)
      );
    }

    return from(getDocs(q).then(snapshot => {
      return snapshot.docs.map(doc => {
        const data = doc.data() as T;
        return {
          ...data,
          id: doc.id,
          __snapshot__: doc
        };
      });
    }));
}

  loadMoreRides(userId: string, orderByField: string): Observable<any> {
    
    if (!this.lastDoc) return from(Promise.resolve([])); // Return empty Observable if no more data

    const colRef = collection(this.firestore, 'rides');
    let q = query(
      colRef,
      where('driversId', '==', userId),
      orderBy(orderByField),
      startAfter(this.lastDoc),
      limit(this.pageSize)
    );

    return from(getDocs(q).then(snapshot => {
      if (!snapshot.empty) {
        this.lastDoc = snapshot.docs[snapshot.docs.length - 1]; // Update last document for pagination
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }));
  }

  private addCreatedAt(data: any) {
    return { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
  }

  private addUpdatedAt(data: any) {
    return { ...data, updatedAt: serverTimestamp() };
  }


  public findOne<T extends BaseDatabaseModel>( collectionPath: string,  queryFn: (ref: CollectionReference<T>) => Query<T> ): Observable<T | undefined> {
    const ref = collection(this.firestore, collectionPath) as CollectionReference<T>;
    const q = queryFn(ref);
    return new Observable<T | undefined>((observer) => {
      getDocs(q)
        .then((snapshot) => {
          const docs = snapshot.docs;
          if (docs.length > 0) {
            const data = docs[0].data();
            const result: T = { ...data, id: docs[0].id };
            observer.next(result);
          } else {
            observer.next(undefined); // si no hay documentos
          }
          observer.complete();
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }

  public find<T extends BaseDatabaseModel>(
    collectionPath: string,
    constraintsFn: (ref: CollectionReference<T>) => ReturnType<typeof firestoreQuery>
  ): Observable<T[]> {
    const ref = collection(this.firestore, collectionPath) as CollectionReference<T>;
    const q = constraintsFn(ref);
    return collectionData(q) as Observable<T[]>;
  }

  
}

export interface FirestoreQuery {
  field: string;
  operation: any;
  searchKey: string;
  orderby: string;
}

