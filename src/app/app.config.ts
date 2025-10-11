import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router'; // ✅ Import provideRouter
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';
import { routes } from './app.routes'; // ✅ Import your app routes

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), // ✅ Provides ActivatedRoute
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore())
  ]
};
