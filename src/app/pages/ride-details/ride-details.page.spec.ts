import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RideDetailsPage } from './ride-details.page';

describe('RideDetailsPage', () => {
  let component: RideDetailsPage;
  let fixture: ComponentFixture<RideDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RideDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
