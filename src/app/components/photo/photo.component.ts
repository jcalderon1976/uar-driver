import { Component, OnInit } from '@angular/core';
import { PhotoService } from '../../services/util/photo.service'; 
import { CommonModule } from '@angular/common';
import { Driver } from '../../models/driver'; // Adjusted the path to match the relative location
import { APIService} from 'src/app/services/api/api.service';
import { Subscription ,Subject } from 'rxjs';
import { InitUserProvider } from 'src/app/services/inituser/inituser.service';

@Component({
  selector: 'app-photo',
  templateUrl: './photo.component.html',
  styleUrls: ['./photo.component.scss'],
  standalone: false,
})
export class PhotoComponent  implements OnInit {

  imageUrl: string | null = null;
  public loggedInUser!: Driver;
  private userSubscription!: Subscription;  // Store the subscription
  private destroy$ = new Subject<void>();

  constructor(private camaraService: PhotoService ,
              private apiService: APIService,
              private userProvider: InitUserProvider, // Inyectar el servicio de usuario
)// Inyectar el servicio de cámara
 { }

 ngOnDestroy(): void {
  // Emitir valor para romper todas las suscripciones
  this.destroy$.next();
  this.destroy$.complete();

   // Unsubscribe to avoid memory leaks
   if (this.userSubscription) {
    this.userSubscription.unsubscribe();
  }
  
}

 async ngOnInit() {

  this.loggedInUser = this.userProvider.getUserData();
  this.imageUrl = this.loggedInUser.profile_img?.toString() || 'https://firebasestorage.googleapis.com/v0/b/uar-platform.firebasestorage.app/o/photos%2FuserDefault.png?alt=media&token=ef06263c-9e2a-4e6d-9198-1898fd5c19df';

  this.camaraService.getImageUrl(this.imageUrl)
    .then(url => {
      this.imageUrl = url;
    })
    .catch(err => {
      console.error('Error fetching image URL', err);
      this.imageUrl = 'https://firebasestorage.googleapis.com/v0/b/uar-platform.firebasestorage.app/o/photos%2FuserDefault.png?alt=media&token=ef06263c-9e2a-4e6d-9198-1898fd5c19df'; // Default image if error occurs
    });
    
}

  tomarFoto() {
    this.userSubscription =  this.apiService.getUser().subscribe((responseUser: any) => {
  
      this.camaraService.tomarFotoYSubir(responseUser.email).then((result) => {
        console.log('Foto subida:', result);
        this.imageUrl = result; // Actualiza la URL de la imagen
        responseUser.profile_img = this.imageUrl; // Actualiza la imagen del usuario
        this.apiService.updateUser(responseUser.id  , responseUser); // Actualiza el usuario en el servicio
  
      }).catch(err => console.error('Error al subir la foto', err));



    });

    
  }
  
  async seleccionarFoto() {
    const blob = await this.camaraService.pickFromGallery();
    const url = await this.camaraService.uploadPhoto(blob);
    console.log('Foto subida desde galería:', url);
    this.imageUrl =url;
  }


  
  
}
