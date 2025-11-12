import { Component } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private storage: Storage
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    console.log('🔥 Firebase Initialization Check:');
    console.log('✅ Auth initialized:', this.auth ? 'YES' : 'NO', this.auth);
    console.log('✅ Firestore initialized:', this.firestore ? 'YES' : 'NO', this.firestore);
    console.log('✅ Storage initialized:', this.storage ? 'YES' : 'NO', this.storage);
    
    // Verificar la configuración de Firebase
    if (this.auth && this.auth.app) {
      console.log('🔧 Firebase Config:', {
        projectId: this.auth.app.options.projectId,
        apiKey: this.auth.app.options.apiKey ? '***' + this.auth.app.options.apiKey.slice(-4) : 'N/A',
        authDomain: this.auth.app.options.authDomain,
        storageBucket: this.auth.app.options.storageBucket
      });
    } else {
      console.error('❌ Firebase Auth app is not initialized!');
    }
  }

  ionViewWillLeave() {
    // 👇 Esto borra el foco antes de que el tab se oculte
    (document.activeElement as HTMLElement)?.blur();
  }
}
