import { Injectable, OnDestroy } from '@angular/core';
import {  Firestore,  doc,  getDoc,  collection,  addDoc,  setDoc,  updateDoc,  deleteDoc,  query,  where,  orderBy,getDocs, startAfter, limit, 
serverTimestamp, collectionData,  DocumentSnapshot,  Query,  docData,  DocumentReference,  CollectionReference, QueryDocumentSnapshot, DocumentData,
Timestamp, query as firestoreQuery, } from '@angular/fire/firestore';
// Import SDK de JavaScript directamente para iOS
import { getFirestore as getFirestoreJS, doc as docJS, getDoc as getDocJS, 
         collection as collectionJS, query as queryJS, where as whereJS, 
         orderBy as orderByJS, limit as limitJS, getDocs as getDocsJS,
         startAfter as startAfterJS, Timestamp as TimestampJS } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { Http } from '@capacitor-community/http';
import { Observable, Subject , from } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { BaseDatabaseModel } from '../../models/base-dto.model';
import { HistoryRide } from '../../models/historyRides';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class FirestoreService implements OnDestroy {

  private userid: string = '1';
  private unsubscribe$ = new Subject<void>();
  private lastDoc: QueryDocumentSnapshot<any> | null = null; // Track last document for pagination
  private pageSize = 10; // Number of rides per fetch

  constructor(private firestore: Firestore) {
    console.log('📦 FirestoreService initialized');
    console.log('🔥 Firestore instance:', this.firestore);
    if (this.firestore && this.firestore.app) {
      console.log('✅ Firestore connected to app:', this.firestore.app.name);
      console.log('📊 Firestore Config:', {
        projectId: this.firestore.app.options.projectId,
        storageBucket: this.firestore.app.options.storageBucket
      });
    } else {
      console.error('❌ Firestore not properly initialized!');
    }
  }

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
    console.log(`📥 Firestore.getOne() - Fetching: ${collectionName}/${id}`);
    
    // Para iOS/Capacitor, usar el SDK de JavaScript directamente
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isCapacitor = typeof window !== 'undefined' && window.location.protocol === 'capacitor:';
    
    if (isIOS || isCapacitor) {
      console.log('📱 iOS/Capacitor detected - Using Firebase JS SDK directly for Firestore');
      return this.getOneWithJSSDK(collectionName, id);
    }
    
    // Para web, usar @angular/fire normal
    try {
      const ref = doc(this.firestore, `${collectionName}/${id}`);
      console.log('⏳ Waiting for Firestore getDoc response...');
      
      const snapshot = await getDoc(ref); // get the document
      
      console.log('📦 Firestore response received');
      
      if(snapshot.exists()){
          console.log('✅ Document found in Firestore');
          const data = snapshot.data();
          console.log('📊 Document data keys:', Object.keys(data || {}));
          return data; // get the data
      }else{
          console.warn('⚠️ Document not found in Firestore:', `${collectionName}/${id}`);
          return null; 
      }
    } catch (error) {
      console.error(`❌ Firestore.getOne() error for ${collectionName}/${id}:`, error);
      throw error;
    }
  }

  // Método usando Firestore REST API con Capacitor HTTP (para iOS)
  private async getOneWithJSSDK(collectionName: string, id: string) {
    console.log(`🌐 Using Firestore REST API with CapacitorHttp for: ${collectionName}/${id}`);
    
    const projectId = environment.firebase.projectId;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}/${id}`;
    
    try {
      console.log('📡 Making request to:', url);
      
      const response = await Http.get({
        url: url,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📦 Firestore REST API response received, status:', response.status);
      
      if (response.status === 200 && response.data) {
        console.log('✅ Document found in Firestore (REST API)');
        
        // Convertir formato de Firestore REST a objeto normal
        const fields = response.data.fields || {};
        const data: any = {};
        
        // Convertir campos de Firestore REST format a objetos normales
        Object.keys(fields).forEach(key => {
          const field = fields[key];
          if (field.stringValue !== undefined) data[key] = field.stringValue;
          else if (field.integerValue !== undefined) data[key] = parseInt(field.integerValue);
          else if (field.doubleValue !== undefined) data[key] = field.doubleValue;
          else if (field.booleanValue !== undefined) data[key] = field.booleanValue;
          else if (field.timestampValue !== undefined) {
            // Convert to Firestore Timestamp so .toDate() works in templates
            data[key] = Timestamp.fromDate(new Date(field.timestampValue));
          }
          else if (field.arrayValue !== undefined) data[key] = field.arrayValue.values || [];
          else if (field.mapValue !== undefined) data[key] = this.convertMapValue(field.mapValue);
          else data[key] = field;
        });
        
        // Extract document ID from the full path
        // Path format: projects/{project}/databases/{database}/documents/{collection}/{docId}
        const docPath = response.data.name || '';
        const docId = docPath.split('/').pop() || id;
        data.id = docId;
        
        console.log('📊 Document data keys:', Object.keys(data));
        console.log('🆔 Document ID:', docId);
        return data;
      } else if (response.status === 404) {
        console.warn('⚠️ Document not found in Firestore (404):', `${collectionName}/${id}`);
        return null;
      } else {
        console.error('❌ Unexpected response status:', response.status);
        console.error('❌ Response data:', response.data);
        return null;
      }
    } catch (error: any) {
      console.error(`❌ Firestore REST API error for ${collectionName}/${id}:`, error);
      console.error('❌ Error message:', error.message);
      throw error;
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
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isCapacitor = typeof window !== 'undefined' && window.location.protocol === 'capacitor:';

    console.log(`📝 Updating document: ${collectionName}/${id}`);

    // For iOS/Capacitor, use REST API with CapacitorHttp
    if (isIOS || isCapacitor) {
      console.log('📱 iOS/Capacitor detected - Using Firestore REST API for update');
      return this.updateWithCapacitorHttp(collectionName, id, document);
    }

    // For web, use Firebase SDK
    const ref = doc(this.firestore, collectionName, id) as DocumentReference<T>;
    await updateDoc(ref, this.addUpdatedAt(document));
    console.log('✅ Document updated successfully (Web SDK)');
  }

  private async updateWithCapacitorHttp<T extends BaseDatabaseModel>(collectionName: string, id: string, document: Partial<T>): Promise<void> {
    console.log('🌐 Using Firestore REST API for update...');
    
    const projectId = environment.firebase.projectId;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}/${id}?updateMask.fieldPaths=`;
    
    // Add updatedAt timestamp
    const dataToUpdate = { ...document, updatedAt: new Date().toISOString() };
    
    // Build the fields object for Firestore REST API format
    const fields: any = {};
    Object.keys(dataToUpdate).forEach(key => {
      const value = (dataToUpdate as any)[key];
      if (typeof value === 'string') {
        fields[key] = { stringValue: value };
      } else if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          fields[key] = { integerValue: value.toString() };
        } else {
          fields[key] = { doubleValue: value };
        }
      } else if (typeof value === 'boolean') {
        fields[key] = { booleanValue: value };
      } else if (value instanceof Date) {
        fields[key] = { timestampValue: value.toISOString() };
      } else if (value && typeof value === 'object' && 'seconds' in value) {
        // Handle Firestore Timestamp objects
        const date = new Date(value.seconds * 1000);
        fields[key] = { timestampValue: date.toISOString() };
      } else if (Array.isArray(value)) {
        fields[key] = { arrayValue: { values: value } };
      } else if (value && typeof value === 'object') {
        fields[key] = { mapValue: { fields: this.convertToFirestoreMap(value) } };
      } else if (value === null) {
        fields[key] = { nullValue: null };
      }
    });
    
    // Build updateMask query parameter
    const fieldPaths = Object.keys(dataToUpdate).join('&updateMask.fieldPaths=');
    const fullUrl = `${url}${fieldPaths}`;
    
    try {
      console.log('📡 Sending PATCH request to Firestore REST API...');
      console.log('🔧 Fields to update:', Object.keys(fields));
      
      const response = await Http.request({
        url: fullUrl,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        data: { fields }
      });

      console.log('📦 Firestore update response status:', response.status);
      
      if (response.status === 200) {
        console.log('✅ Document updated successfully (REST API)');
      } else {
        console.error('❌ Unexpected response status:', response.status);
        console.error('❌ Response data:', response.data);
        throw new Error(`Failed to update document: ${response.status}`);
      }
    } catch (error: any) {
      console.error('❌ Firestore REST API update error:', error);
      console.error('❌ Error message:', error.message);
      throw error;
    }
  }

  // Helper to convert objects to Firestore map format
  private convertToFirestoreMap(obj: any): any {
    const fields: any = {};
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (typeof value === 'string') {
        fields[key] = { stringValue: value };
      } else if (typeof value === 'number') {
        fields[key] = Number.isInteger(value) 
          ? { integerValue: value.toString() } 
          : { doubleValue: value };
      } else if (typeof value === 'boolean') {
        fields[key] = { booleanValue: value };
      } else if (value instanceof Date) {
        fields[key] = { timestampValue: value.toISOString() };
      } else if (Array.isArray(value)) {
        fields[key] = { arrayValue: { values: value } };
      } else if (value && typeof value === 'object') {
        fields[key] = { mapValue: { fields: this.convertToFirestoreMap(value) } };
      }
    });
    return fields;
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
    console.log(`📥 getHistoryPaginated - userId: ${userId}, collection: ${collectionName}`);
    
    // Para iOS/Capacitor, usar el SDK de JavaScript directamente
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isCapacitor = typeof window !== 'undefined' && window.location.protocol === 'capacitor:';
    
    if (isIOS || isCapacitor) {
      console.log('📱 iOS/Capacitor detected - Using Firebase JS SDK for query');
      return this.getHistoryPaginatedWithJSSDK<T>(userId, collectionName, orderByField, limitCount, lastDoc);
    }
    
    // Para web, usar @angular/fire normal
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
  
  // Versión usando Firestore REST API con CapacitorHttp para iOS (queries complejas)
  private getHistoryPaginatedWithJSSDK<T>(userId: string, collectionName: string, orderByField: string, limitCount: number, lastDoc: DocumentSnapshot<T> | null): Observable<(T & { id: string; __snapshot__: any })[]> {
    console.log('🌐 Using Firestore REST API for paginated query (CapacitorHttp)');
    
    return from(
      (async () => {
        try {
          const projectId = environment.firebase.projectId;
          
          // Construir la query de Firestore REST API
          // Formato: structuredQuery
          const structuredQuery: any = {
            from: [{ collectionId: collectionName }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'driverId' },
                op: 'EQUAL',
                value: { stringValue: userId }
              }
            },
            orderBy: [
              {
                field: { fieldPath: orderByField },
                direction: 'DESCENDING'
              },
              {
                field: { fieldPath: '__name__' },
                direction: 'DESCENDING'
              }
            ],
            limit: limitCount
          };

          if (lastDoc) {
            const restDoc: any = lastDoc;
            if (restDoc && restDoc.fields) {
              const fieldValue = restDoc.fields[orderByField];
              const values: any[] = [];

              values.push(this.convertFieldToOrderValue(fieldValue));
              values.push({ referenceValue: restDoc.name });

              structuredQuery.startAt = {
                values,
                before: false
              };

              structuredQuery.offset = 1;
            }
          }
          
          const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
          
          console.log('📡 Making Firestore query request...');
          
          const response = await Http.post({
            url: url,
            headers: {
              'Content-Type': 'application/json'
            },
            data: { structuredQuery }
          });
          
          console.log('📦 Firestore query response received, status:', response.status);
          
          if (response.status === 200 && response.data) {
            const results = Array.isArray(response.data) ? response.data : [response.data];
            const documents = results.filter((item: any) => item.document);
            
            console.log(`✅ Query returned ${documents.length} documents`);
            
            return documents.map((item: any, index: number) => {
              try {
                const doc = item.document;
                const fields = doc.fields || {};
                const data: any = {};
                
                console.log(`🔄 Converting document ${index + 1}/${documents.length}`);
                
                // Convertir campos de Firestore REST format
                Object.keys(fields).forEach(key => {
                  try {
                    const field = fields[key];
                    if (field.stringValue !== undefined) data[key] = field.stringValue;
                    else if (field.integerValue !== undefined) data[key] = parseInt(field.integerValue);
                    else if (field.doubleValue !== undefined) data[key] = field.doubleValue;
                    else if (field.booleanValue !== undefined) data[key] = field.booleanValue;
                    else if (field.timestampValue !== undefined) {
                      // Convert to Firestore Timestamp so .toDate() works in templates
                      data[key] = Timestamp.fromDate(new Date(field.timestampValue));
                    }
                    else if (field.arrayValue !== undefined) data[key] = field.arrayValue.values || [];
                    else if (field.mapValue !== undefined) data[key] = this.convertMapValue(field.mapValue);
                    else data[key] = field;
                  } catch (fieldError) {
                    console.error(`❌ Error converting field '${key}':`, fieldError);
                    data[key] = null; // Set to null if conversion fails
                  }
                });
                
                // Extraer el ID del nombre del documento
                const docPath = doc.name;
                const id = docPath.split('/').pop();
                
                console.log(`✅ Document ${index + 1} converted, id: ${id}`);
                
                return {
                  ...data as T,
                  id: id,
                  __snapshot__: doc
                };
              } catch (docError) {
                console.error(`❌ Error converting document ${index + 1}:`, docError);
                return null as any;
              }
            }).filter((doc: any) => doc !== null);
          } else {
            console.warn('⚠️ No documents found in query');
            return [];
          }
        } catch (error: any) {
          console.error('❌ Error in Firestore REST API query:', error);
          console.error('❌ Error message:', error.message);
          return [];
        }
      })()
    );
  }
  
  // Helper para convertir mapValue de Firestore REST
  private convertMapValue(mapValue: any): any {
    if (!mapValue || !mapValue.fields) return {};
    
    const fields = mapValue.fields;
    const result: any = {};
    
    Object.keys(fields).forEach(key => {
      const field = fields[key];
      if (field.stringValue !== undefined) result[key] = field.stringValue;
      else if (field.integerValue !== undefined) result[key] = parseInt(field.integerValue);
      else if (field.doubleValue !== undefined) result[key] = field.doubleValue;
      else if (field.booleanValue !== undefined) result[key] = field.booleanValue;
      else if (field.timestampValue !== undefined) {
        // Convert to Firestore Timestamp so .toDate() works in templates
        result[key] = Timestamp.fromDate(new Date(field.timestampValue));
      }
      else if (field.arrayValue !== undefined) result[key] = field.arrayValue.values || [];
      else if (field.mapValue !== undefined) result[key] = this.convertMapValue(field.mapValue);
      else result[key] = field;
    });
    
    return result;
  } 

  private convertFieldToOrderValue(field: any): any {
    if (!field) {
      return { nullValue: null };
    }

    if (field.timestampValue !== undefined) {
      return { timestampValue: field.timestampValue };
    }
    if (field.integerValue !== undefined) {
      return { integerValue: field.integerValue };
    }
    if (field.doubleValue !== undefined) {
      return { doubleValue: field.doubleValue };
    }
    if (field.booleanValue !== undefined) {
      return { booleanValue: field.booleanValue };
    }
    if (field.stringValue !== undefined) {
      return { stringValue: field.stringValue };
    }
    if (field.bytesValue !== undefined) {
      return { bytesValue: field.bytesValue };
    }
    if (field.referenceValue !== undefined) {
      return { referenceValue: field.referenceValue };
    }
    if (field.mapValue !== undefined) {
      return { mapValue: field.mapValue };
    }
    if (field.arrayValue !== undefined) {
      return { arrayValue: field.arrayValue };
    }
    if (field.geoPointValue !== undefined) {
      return { geoPointValue: field.geoPointValue };
    }

    return { nullValue: null };
  }


  getHistoryPaginatedByDate<T>( userId: string, date: Date, collectionName: string,  orderByField: string, limitCount: number,   lastDoc: DocumentSnapshot<T> | null  ): Observable<(T & { id: string; __snapshot__: any })[]> {  
    console.log(`📥 getHistoryPaginatedByDate - userId: ${userId}, date: ${date}`);
    
    // Para iOS/Capacitor, usar el SDK de JavaScript directamente
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isCapacitor = typeof window !== 'undefined' && window.location.protocol === 'capacitor:';
    
    if (isIOS || isCapacitor) {
      console.log('📱 iOS/Capacitor detected - Using Firebase JS SDK for date query');
      return this.getHistoryPaginatedByDateWithJSSDK<T>(userId, date, collectionName, orderByField, limitCount, lastDoc);
    }
    
    // Para web, usar @angular/fire normal
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

  // Versión con REST API para queries con fecha en iOS
  private getHistoryPaginatedByDateWithJSSDK<T>(userId: string, date: Date, collectionName: string, orderByField: string, limitCount: number, lastDoc: DocumentSnapshot<T> | null): Observable<(T & { id: string; __snapshot__: any })[]> {
    console.log('🌐 Using Firestore REST API for date query (CapacitorHttp)');
    
    return from(
      (async () => {
        try {
          const projectId = environment.firebase.projectId;
          
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);
          
          // Construir la query con filtros de fecha
          const structuredQuery: any = {
            from: [{ collectionId: collectionName }],
            where: {
              compositeFilter: {
                op: 'AND',
                filters: [
                  {
                    fieldFilter: {
                      field: { fieldPath: 'driverId' },
                      op: 'EQUAL',
                      value: { stringValue: userId }
                    }
                  },
                  {
                    fieldFilter: {
                      field: { fieldPath: 'createdAt' },
                      op: 'GREATER_THAN_OR_EQUAL',
                      value: { timestampValue: startOfDay.toISOString() }
                    }
                  },
                  {
                    fieldFilter: {
                      field: { fieldPath: 'createdAt' },
                      op: 'LESS_THAN_OR_EQUAL',
                      value: { timestampValue: endOfDay.toISOString() }
                    }
                  }
                ]
              }
            },
            orderBy: [
              {
                field: { fieldPath: orderByField },
                direction: 'DESCENDING'
              },
              {
                field: { fieldPath: '__name__' },
                direction: 'DESCENDING'
              }
            ],
            limit: limitCount
          };

          if (lastDoc) {
            const restDoc: any = lastDoc;
            if (restDoc && restDoc.fields) {
              const orderField = restDoc.fields[orderByField];
              const values: any[] = [];

              values.push(this.convertFieldToOrderValue(orderField));
              values.push({ referenceValue: restDoc.name });

              structuredQuery.startAt = {
                values,
                before: false
              };

              structuredQuery.offset = 1;
            }
          }
          
          const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
          
          console.log('📡 Making Firestore date query request...');
          
          const response = await Http.post({
            url: url,
            headers: {
              'Content-Type': 'application/json'
            },
            data: { structuredQuery }
          });
          
          console.log('📦 Firestore date query response received, status:', response.status);
          
          if (response.status === 200 && response.data) {
            const results = Array.isArray(response.data) ? response.data : [response.data];
            const documents = results.filter((item: any) => item.document);
            
            console.log(`✅ Date query returned ${documents.length} documents`);
            
            return documents.map((item: any) => {
              const doc = item.document;
              const fields = doc.fields || {};
              const data: any = {};
              
              // Convertir campos
              Object.keys(fields).forEach(key => {
                const field = fields[key];
                if (field.stringValue !== undefined) data[key] = field.stringValue;
                else if (field.integerValue !== undefined) data[key] = parseInt(field.integerValue);
                else if (field.doubleValue !== undefined) data[key] = field.doubleValue;
                else if (field.booleanValue !== undefined) data[key] = field.booleanValue;
                else if (field.timestampValue !== undefined) {
                  // Convert to Firestore Timestamp so .toDate() works in templates
                  data[key] = Timestamp.fromDate(new Date(field.timestampValue));
                }
                else if (field.arrayValue !== undefined) data[key] = field.arrayValue.values || [];
                else if (field.mapValue !== undefined) data[key] = this.convertMapValue(field.mapValue);
                else data[key] = field;
              });
              
              const docPath = doc.name;
              const id = docPath.split('/').pop();
              
              return {
                ...data as T,
                id: id,
                __snapshot__: doc
              };
            });
          } else {
            console.warn('⚠️ No documents found in date query');
            return [];
          }
        } catch (error: any) {
          console.error('❌ Error in Firestore REST API date query:', error);
          console.error('❌ Error message:', error.message);
          return [];
        }
      })()
    );
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
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isCapacitor = typeof window !== 'undefined' && window.location.protocol === 'capacitor:';

    // For iOS/Capacitor, use REST API with CapacitorHttp
    if (isIOS || isCapacitor) {
      console.log('📱 iOS/Capacitor detected - Using Firestore REST API for findOne');
      return from(this.findOneWithCapacitorHttp<T>(collectionPath, queryFn));
    }

    // For web, use Firebase SDK
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

  private async findOneWithCapacitorHttp<T extends BaseDatabaseModel>(collectionPath: string, queryFn: (ref: CollectionReference<T>) => Query<T>): Promise<T | undefined> {
    console.log('🌐 Using Firestore REST API for findOne query...');
    
    // Create a temporary reference to extract query constraints
    const ref = collection(this.firestore, collectionPath) as CollectionReference<T>;
    const q = queryFn(ref);
    
    // Extract query constraints (this is a workaround to get query details)
    // We'll build the REST API query manually
    const structuredQuery = this.buildStructuredQueryFromFirestoreQuery(q);
    
    const projectId = environment.firebase.projectId;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
    
    try {
      console.log('📡 Sending Firestore REST API request for findOne...');
      const response = await Http.post({
        url: url,
        headers: {
          'Content-Type': 'application/json'
        },
        data: { structuredQuery }
      });

      console.log('📦 Firestore findOne response status:', response.status);
      
      if (response.status === 200 && response.data) {
        const documents = (Array.isArray(response.data) ? response.data : [response.data])
          .filter((item: any) => item.document);
        
        if (documents.length > 0) {
          const doc = documents[0].document;
          const fields = doc.fields || {};
          const data: any = {};
          
          // Convert Firestore REST API fields to regular object
          Object.keys(fields).forEach(key => {
            const field = fields[key];
            if (field.stringValue !== undefined) {
              data[key] = field.stringValue;
            } else if (field.integerValue !== undefined) {
              data[key] = parseInt(field.integerValue);
            } else if (field.doubleValue !== undefined) {
              data[key] = field.doubleValue;
            } else if (field.booleanValue !== undefined) {
              data[key] = field.booleanValue;
            } else if (field.timestampValue !== undefined) {
              data[key] = Timestamp.fromDate(new Date(field.timestampValue));
            } else if (field.arrayValue !== undefined) {
              data[key] = field.arrayValue.values || [];
            } else if (field.mapValue !== undefined) {
              data[key] = this.convertMapValue(field.mapValue);
            } else {
              data[key] = field;
            }
          });
          
          const id = doc.name.split('/').pop();
          console.log('✅ findOne found document with id:', id);
          return { ...data as T, id: id };
        } else {
          console.log('⚠️ findOne query returned no documents');
          return undefined;
        }
      } else {
        console.error('❌ Unexpected response status:', response.status);
        return undefined;
      }
    } catch (error: any) {
      console.error('❌ Firestore REST API findOne error:', error);
      throw error;
    }
  }

  // Helper method to build structured query from Firestore Query
  private buildStructuredQueryFromFirestoreQuery(q: any): any {
    // For rideCheck query, we need to build this structure:
    // This is a simplified implementation - you may need to extend it
    // based on your specific query requirements
    
    const structuredQuery: any = {
      from: [{ collectionId: 'rides' }],
      where: {
        compositeFilter: {
          op: 'AND',
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: 'driverId' },
                op: 'EQUAL',
                value: { stringValue: '' }
              }
            },
            {
              fieldFilter: {
                field: { fieldPath: 'user_rejected' },
                op: 'EQUAL',
                value: { booleanValue: false }
              }
            },
            {
              fieldFilter: {
                field: { fieldPath: 'driver_rejected' },
                op: 'EQUAL',
                value: { booleanValue: false }
              }
            },
            {
              fieldFilter: {
                field: { fieldPath: 'ride_completed' },
                op: 'EQUAL',
                value: { booleanValue: false }
              }
            },
            {
              fieldFilter: {
                field: { fieldPath: 'ride_started' },
                op: 'EQUAL',
                value: { booleanValue: false }
              }
            },
            {
              fieldFilter: {
                field: { fieldPath: 'request_timeout' },
                op: 'EQUAL',
                value: { booleanValue: false }
              }
            },
            {
              fieldFilter: {
                field: { fieldPath: 'ride_accepted' },
                op: 'EQUAL',
                value: { booleanValue: false }
              }
            }
          ]
        }
      },
      orderBy: [
        {
          field: { fieldPath: 'createdAt' },
          direction: 'DESCENDING'
        }
      ],
      limit: 1
    };
    
    return structuredQuery;
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

