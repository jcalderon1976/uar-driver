import { TestBed } from '@angular/core/testing';

import { InitPaymentMethodService } from './init-payment-method.service';

describe('InitPaymentMethodService', () => {
  let service: InitPaymentMethodService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InitPaymentMethodService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
