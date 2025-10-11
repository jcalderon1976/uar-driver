import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Car } from 'src/app/models/car';
import { ModalController } from '@ionic/angular';
import { APIService } from 'src/app/services/api/api.service';
import { Driver } from 'src/app/models/driver';
import { InitUserProvider } from 'src/app/services/inituser/inituser.service';
import { CarApiService } from 'src/app/services/api/car-api.service'; // Ajusta la ruta si está en otro folder

@Component({
  selector: 'app-car-info',
  templateUrl: './car-info.component.html',
  styleUrls: ['./car-info.component.scss'],
  standalone: false,
})
export class CarInfoComponent implements OnInit {
  public loggedInUser!: Driver;
  @ViewChild('toolbar', { read: ElementRef }) toolbarRef!: ElementRef;

  public car: Car = {
    make: '',
    model: '',
    year: 0,
    color: '',
    plate_number: '',
  };

  searchQuery: string = '';
  filteredCarMakes: any[] = [];
  carMakes: any[] = []; // Esto contiene todas las marcas completas
  carModels: any[] = [];
  carYears: number[] = [];
  carColors: any[] = [];
  selectedMake: any = null; // O string si solo necesitas el nombre
  selectedModel: any = null; // O string si solo necesitas el nombre

  constructor(
    private http: HttpClient,
    private modalCtrl: ModalController,
    private userProvider: InitUserProvider,
    private apiService: APIService,
    private carApi: CarApiService
  ) {}

  ngAfterViewInit() {
    const toolbarEl = this.toolbarRef.nativeElement;
    const shadowRoot = toolbarEl.shadowRoot;

    if (shadowRoot) {
      const style = document.createElement('style');
      style.textContent = `
        .toolbar-background {
          background: linear-gradient(45deg, #FE695D, #AA2CE6) !important;
        }
      `;
      shadowRoot.appendChild(style);
    }
  }

  ngOnInit() {
    this.carApi.getYear().subscribe((years: number[]) => {
      this.carYears = years;
    });
    this.carApi.getColor().subscribe((colors: any[]) => {
      this.carColors = colors;
    });

    this.loggedInUser = this.userProvider.getUserData();
    const carInfo = this.loggedInUser.car;

    if (carInfo) {
      this.car.year = carInfo.year;
      this.car.color = carInfo.color;
      this.car.plate_number = carInfo.plate_number;

      // 🔹 Esperar las marcas y luego buscar la marca del usuario
      this.carApi.getAllMakes().subscribe((response) => {
        this.carMakes = response;
        this.filteredCarMakes = [...this.carMakes];

        // 🔍 Buscar la marca (objeto) según el nombre almacenado
        this.selectedMake = this.carMakes.find(
          (make) => make.Make_Name === carInfo.make
        );

        // 🔄 Cargar modelos para esa marca
        if (this.selectedMake) {
          this.carApi
            .getModelsForMake(this.selectedMake.Make_Name)
            .subscribe((res) => {
              this.carModels = res.Results.map(
                (model: any) => model.Model_Name
              );
              // Buscar modelo por nombre
              this.selectedModel = carInfo.model;
            });
        }
      });
    }
    else{
      
      
      this.car.make = '';
      this.car.year = 0;
      this.car.color = '';
      this.car.plate_number = '';
      this.carApi.getAllMakes().subscribe((response) => {
        this.carMakes = response;
        this.filteredCarMakes = [...this.carMakes];
        this.selectedMake = '';
      
      });
    }
  }

  onMakeChange(event: any) {
    this.selectedMake = event.detail.value;
    console.log('Marca seleccionada:', this.selectedMake);

    this.carApi
      .getModelsForMake(this.selectedMake.Make_Name)
      .subscribe((response) => {
        this.carModels = response.Results.map((model: any) => model.Model_Name);
      });
  }

  onModelChange(event: any) {
    this.selectedModel = event.detail.value;
    console.log('Modelo seleccionado:', this.selectedModel);
  }

  // Necesario si usas objetos como valor
  compareFn = (o1: any, o2: any) => o1?.Make_ID === o2?.Make_ID;

  private getCarInfo(): Car {
    if (this.loggedInUser.car) {
      let carInfo = this.loggedInUser.car;
      this.selectedMake = carInfo.make;
      this.selectedModel = carInfo.model;
      this.car.year = carInfo.year;
      this.car.color = carInfo.color;
      this.car.plate_number = carInfo.plate_number;
      return {
        make: this.selectedMake || '',
        model: this.selectedModel || '',
        year: carInfo.year || 0,
        color: this.car.color || '',
        plate_number: carInfo.plate_number || '',
      };
    }
    return {
      make: '',
      model: '',
      year: 0,
      color: '',
      plate_number: '',
    };
  }

  saveCarInfo() {
    const userId = this.loggedInUser.id;

    const carInfo = {
      make: this.selectedMake?.Make_Name || '',
      model: this.selectedModel || '',
      year: this.car.year,
      color: this.car.color,
      plate_number: this.car.plate_number,
    };

    this.apiService.updateUser(userId, { car: carInfo }).subscribe(
      () => {
        console.log('Car information updated successfully');
        this.closeModal();
      },
      (error) => {
        console.error('Error updating car information', error);
      }
    );
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }
}
