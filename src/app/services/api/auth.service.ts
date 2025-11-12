import { Injectable } from '@angular/core';
import { Auth, signOut , signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup, reload,updateEmail,
         GoogleAuthProvider ,OAuthProvider , sendEmailVerification ,signInWithRedirect , getAuth, getIdToken, getIdTokenResult,
         setPersistence, inMemoryPersistence, browserLocalPersistence } from '@angular/fire/auth';
import { FirestoreService } from '../api/firestore.service';
import { Firestore } from '@angular/fire/firestore';
import { User } from '../../models/user';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  popupOpen = false; // prevent multiple popups
  private apiUrl = environment.emailApiUrl; //   'http://localhost:3000';
  private googleProvider = new GoogleAuthProvider();


  private persistenceConfigured = false;

  constructor(private auth: Auth ,
              private http: HttpClient,
              private store: FirestoreService  
  ) {
    console.log('🔐 AuthService initialized');
    console.log('🔥 Firebase Auth instance:', this.auth);
    
    if (this.auth && this.auth.app) {
      console.log('✅ Firebase Auth connected to app:', this.auth.app.name);
      console.log('📊 Auth Config:', {
        projectId: this.auth.app.options.projectId,
        authDomain: this.auth.app.options.authDomain
      });
    } else {
      console.error('❌ Firebase Auth not properly initialized in AuthService!');
    }
  }

  // ✅ Register a new user
   createAccount(user: User): Promise<any> {

    return new Promise<any>(async (resolved, rejected) => {
    
      await createUserWithEmailAndPassword(this.auth, user.email, user.password)  .then(res => {
      
        if (res.user) {
          resolved(res.user);
        } else {
          rejected(res);
        }
      })
      .catch(err => {
           rejected(err);
      });
      

    
  });
}

  // ✅ Login existing user
  async login(email: string, password: string) {
    console.log('🔐 Attempting Firebase login for:', email);
    console.log('🔥 Auth instance available:', !!this.auth);
    console.log('🌐 Firebase Auth URL:', this.auth.config.apiHost);
    
    // Test de conectividad básica
    try {
      console.log('🌐 Testing internet connectivity...');
      const testResponse = await fetch('https://www.google.com', { method: 'HEAD', mode: 'no-cors' });
      console.log('✅ Internet connection OK');
    } catch (netError) {
      console.error('❌ No internet connection detected:', netError);
      console.error('❌ Please check your device network settings');
    }
    
    // Para iOS/Capacitor, usar API REST de Firebase en lugar del SDK
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isCapacitor = window.location.protocol === 'capacitor:';
    
    if (isIOS || isCapacitor) {
      console.log('📱 iOS/Capacitor detected - Using Firebase REST API');
      return this.loginWithRestAPI(email, password);
    }
    
    // Para web, usar el SDK normal
    try {
      console.log('⏳ Web login - Using Firebase SDK...');
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      console.log('✅ Firebase login successful:', userCredential.user.uid);
      return userCredential.user;
    } catch (error: any) {
      console.error('❌ Firebase Auth Login Error:', error);
      throw error;
    }
  }

  // Método alternativo usando REST API de Firebase (para iOS)
  private async loginWithRestAPI(email: string, password: string): Promise<any> {
    console.log('🌐 Using Firebase REST API for login...');
    
    const apiKey = environment.firebase.apiKey;
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          returnSecureToken: true
        })
      });

      console.log('📡 Firebase REST API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Firebase REST API error:', errorData);
        throw new Error(errorData.error?.message || 'Login failed');
      }

      const data = await response.json();
      console.log('✅ Firebase REST API login successful');
      console.log('✅ User ID:', data.localId);
      
      // Crear un objeto similar al user de Firebase SDK
      return {
        uid: data.localId,
        email: data.email,
        emailVerified: data.emailVerified || false,
        idToken: data.idToken,
        refreshToken: data.refreshToken
      };
    } catch (error: any) {
      console.error('❌ Firebase REST API Error:', error);
      throw error;
    }
  }

  // ✅ Google Sign-In Using Firebase
  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      return result.user; // Return user data
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  }
  // ✅ Microsoft Sign-In Using Firebase
  async loginMicrosoft() {
    
    if (this.popupOpen) return;

    this.popupOpen = true;

    const provider = new OAuthProvider('microsoft.com');
      try {
        const result = await signInWithPopup(this.auth, provider);
        console.log('Logged in successfully:', result.user);
      } catch (error: any) {
        if (error.code === 'auth/cancelled-popup-request') {
          console.warn('Popup request cancelled.');
        } else {
          console.error('Error during Microsoft login:', error);
        }
      } finally {
        this.popupOpen = false;
      }
  }
  
 // ✅ Apple Sign-In Using Firebase
  async loginApple() {
    const provider = new OAuthProvider('apple.com');
    await signInWithPopup(this.auth, provider).then((result) => {
      console.log('Apple login successful:', result.user);
    }).catch((error) => {
      console.error('Error during Apple login:', error);
    });
  }

  // ✅ Forgot Password
  async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      console.error('Password Reset Error:', error);
      throw error;
    }
  }

  // ✅ Logout
  async logout() {

  //TODO CHECK WHERE IS THE LOG IN ???
    //return this.auth.signOut();
    await signOut(this.auth);
    //await GoogleAuth.signOut();
  }

  sendOTP(email: string) {
    return this.http.post(`${this.apiUrl}/send-otp`, { email });
  }

  verifyOTP(email: string, otp: string) {
    return this.http.post(`${this.apiUrl}/verify-otp`, { email, otp });
  }

  emailVerification(){
    const authentication = getAuth();
    const user = authentication.currentUser;

    if (user) {
      sendEmailVerification(user).then(() => {
        console.log('Correo de verificación enviado');
      }).catch((error) => {
        console.error('Error enviando verificación', error);
      });
    }
  }

  async emailVerified(){

    const authentication = getAuth();
    const user = authentication.currentUser;

    if (user) {
      await reload(user); // Refrescar datos del usuario
      if (user.emailVerified) {
        console.log('Correo verificado ✅');
      } else {
        console.log('Correo aún no verificado ❌');
      }
    }

  }

  changeEmail(user: any , newEmail: string) {
    
    updateEmail(user, newEmail).then(() => {
      console.log('Correo actualizado exitosamente');
      // 🔔 Puedes volver a enviar email de verificación
      sendEmailVerification(user);
    }).catch((error) => {
      console.error('Error actualizando email', error);
    });


  } 


}
