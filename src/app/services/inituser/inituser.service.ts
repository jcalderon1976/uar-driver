import { DirectiveDecorator, Injectable } from '@angular/core';
import { APIService } from '../api/api.service';
import { AuthService } from '../api/auth.service';
import { FirestoreQuery } from '../api/firestore.service';
import { Preferences } from '@capacitor/preferences';
import { LoadingController, ToastController } from '@ionic/angular';
import { UtilService } from '../../services/util/util.service';
import { Driver } from '../../models/driver';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { v4 as uuidv4 } from 'uuid'; // Si usas UUID
import { PhotoService } from '../../services/util/photo.service'; 

@Injectable()
export class InitUserProvider {
  public loggedInUser!: Driver;
  public camera = Camera;
  public storage = Preferences;
  public loader!: HTMLIonLoadingElement;
  imageUrl: string | null = null;

  constructor(
    private api: APIService,
    private auth: AuthService,  
    private loadingCtrl: LoadingController,
    public util: UtilService,
    private toastCtrl: ToastController,
    private camaraService: PhotoService ,
  ) {
        this.createNewEmptyUser();
  }

  getUserData(): Driver {
    return this.loggedInUser;
  }

  createNewEmptyUser() {
    
    this.loggedInUser = {
      id: '',
      email: '',
      password: '',
      approved: false,
      available: false,
      location_lat: 0,
      location_lng: 0,
      dob: '',
      gender: '',
      name: '',
      phone: '',
      profile_img: '',
      token: '',
      car_model: '',
      car_number: '',
      car_brand: '',
      car_year: 0,
      car_color: '',
      car_license_plate: ''
    };
  }

  load() {
     return new Promise((resolve, reject) => {
      
      this.getToken().then(token => {
        
        if (!token) {
          console.log('[ inituser.load() ]-> (token is null) ');
          resolve(true);
          return;
        } 
        
        console.log('[ inituser.load() ]-> (token) ', token); //SI Token no es null
        this.api.updateToken(token); //actualizo el token si no es null
        
        this.api.getDriver(this.api.getToken()).subscribe((user: any) => {  //busco el usuario con el token
          
            console.log('[ inituser.load() ]-> (user) ', user);
            
            if (user) {   this.setLoggedInUser(user); } //si existe el usuario lo seteo}
            
            resolve(true);
            
        }, err => {
          resolve(true);
          console.log(err);
        });
      });
    });  
  }


  async setLoggedInUser(user: Driver) {
    Object.assign(this.loggedInUser, user);
    await this.storage.set({ key: 'id', value: user.id.toString() });
    this.loggedInUser.token = (await this.getToken()) ?? '';
    console.log('SetLoggedinUser', this.loggedInUser);
  }

   async setToken(token: any) {
    this.api.updateToken(token);
    await this.storage.set({ key: 'token', value:token })   //('token', token);
  } 
  async getToken() {
    const token = (await this.storage.get({ key: 'token' })).value;
    if (token === null || token === '') {
      console.log('Token no existe o está vacío');
      return null;
    }
    else{
      return String(token);
    }
  } 

  async logout(): Promise<any> {
    
    await this.api.logout().then(res => { 
      console.log('>>>>>logout - before storage.clear .........');
          
    console.log('>>>>>logout - after storage.clear .........');
    } ).catch(err => {
      console.log('>>>>>logout - error storage.clear .........');
      console.log('>>>>>logout - error storage.clear .........', err);
    });
  }

  async setNewEmail(newEmail: string ) {
    this.loggedInUser.email = newEmail;
    await this.storage.set({ key: 'newEmail', value:newEmail }  );
  }

  async openCamera() {
    try {
      /* const image = await Camera.getPhoto({
        quality: 60,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });
  
      const name = uuidv4(); // O UUID.UUID() si ya lo usas así
      const fileUri = image.webPath!; // webPath es seguro para usar con fetch
  
      const imageData = await this.makeFileIntoBlob(fileUri, name); */
  
      this.showLoader('waiting...');
      try {

        this.camaraService.tomarFotoYSubir(this.loggedInUser.email).then((result) => {
          console.log('Foto subida:', result);
          this.imageUrl = result; // Actualiza la URL de la imagen
          this.loggedInUser.profile_img = result; 
          //this.apiService.updateUser(responseUser.id  , responseUser); // Actualiza los documentos al driver en el servicio
          this.loadingCtrl.dismiss();
        }).catch(err => {console.error('Error al subir la foto', err);this.util.presentAlert('ERROR',`${err}`, 'OK');});

      } catch (err) {
        await this.loadingCtrl.dismiss();
        console.log('err', err);
        this.util.presentAlert('ERROR',`${err}`, 'OK');
      }
  
    } catch (err) {
      console.log('Camera error', err);
    }
  }
  
  async openGallery() {
    try {
      const image = await Camera.getPhoto({
        quality: 60,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
      });
  
      const name = uuidv4();
      const fileUri = image.webPath!;
  
      const imageData = await this.makeFileIntoBlob(fileUri, name);
  
      this.showLoader('waiting...');
      try {
        //const success = await this.storageServ.uploadContent(imageData, name);
        const blob = await this.camaraService.pickFromGallery();
        const url = await this.camaraService.uploadPhoto(blob);
        console.log('Foto subida desde galería:', url);
        this.imageUrl =url;
        this.loggedInUser.profile_img = url;

        await this.loadingCtrl.dismiss();
        this.util.presentAlert('success','image uploaded','OK');
        
      } catch (err) {
        await this.loadingCtrl.dismiss();
        this.util.presentAlert('ERROR',`${err}`,'OK' );
        console.log('err', err);
      }
  
    } catch (err) {
      console.log('Gallery error', err);
    }
  }
  
  async makeFileIntoBlob(imagePath: string, fileName: string): Promise<{ blob: Blob; name: string }> {
    try {
      const response = await fetch(imagePath);
      const blob = await response.blob();

      return {
        blob: blob,
        name: fileName
      };
    } catch (e) {
      console.error('makeFileIntoBlob error:', e);
      throw e;
    }
  }


  async showLoader(message: string) {
    this.loader = await this.util.createLoader(message);
    await this.loader.present();
  }

  /** Dismiss Loader */
  async dismissLoader() {
    if (this.loader) {
      await this.loader.dismiss();
      (document.activeElement as HTMLElement)?.blur(); // 👈 evita el warning
    }
  }

}
