import { Injectable } from '@angular/core';
import { Firestore, doc, onSnapshot, updateDoc, DocumentSnapshot, DocumentData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

interface LocationData {
  // Define the properties of LocationData here
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class TrackService {

  constructor(private firestore: Firestore) { }

    docRef(path: any){
      return doc(this.firestore, path);
    }

    getLocation() {
      let dataRef: any = this.docRef('track/locations');
      //return docData<any>(dataRef);
      return new Observable<any>(observer => {
        onSnapshot(dataRef, (doc: DocumentSnapshot<DocumentData>) => {
          observer.next(doc.data() as LocationData);
        })
      });
    }

    async updateSourceLocation(source: any){
      try{
        const dataRef =this.docRef('track/locations');
        await updateDoc<any,any>(dataRef, {source});
        return true;
      }catch(e) {
        throw(e);
      }
    }

}


