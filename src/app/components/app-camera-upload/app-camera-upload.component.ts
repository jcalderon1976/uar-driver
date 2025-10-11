import { Component, Output, EventEmitter } from '@angular/core';
import { IonicModule } from '@ionic/angular'; // ⬅️ IMPORTANTE
import { CommonModule } from '@angular/common'; // Por si usas *ngIf, etc.
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { getStorage, ref, uploadString, getDownloadURL } from '@angular/fire/storage';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid

@Component({
  selector: 'app-camera-upload',
  standalone: true,
  imports: [IonicModule, CommonModule], // ⬅️ Aquí importas IonicModule
  template: `
    <ion-button expand="block" (click)="captureAndUpload()">Take Photo</ion-button>
  `
})
export class CameraUploadComponent {
  @Output() imageUploaded = new EventEmitter<string>();

  constructor() {}

  async captureAndUpload() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });

      const base64Data = 'data:image/jpeg;base64,' + image.base64String;

      // Upload to Firebase Storage
      const storage = getStorage();
      const imageRef = ref(storage, `profilePics/${uuidv4()}.jpg`);
      await uploadString(imageRef, base64Data, 'data_url');
      const downloadURL = await getDownloadURL(imageRef);

      this.imageUploaded.emit(downloadURL); // 🔥 Emit URL
    } catch (error) {
      console.error('Error capturando/subiendo imagen:', error);
    }
  }
}
