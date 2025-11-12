import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { MapDirectionsService } from '@angular/google-maps';
import { IncomingRideComponent } from './incoming-ride.component';

describe('IncomingRideComponent', () => {
  let component: IncomingRideComponent;
  let fixture: ComponentFixture<IncomingRideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IncomingRideComponent],
      imports: [IonicModule.forRoot()],
      providers: [
        ModalController,
        {
          provide: MapDirectionsService,
          useValue: {
            route: () => ({ subscribe: () => undefined }),
          },
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(IncomingRideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


