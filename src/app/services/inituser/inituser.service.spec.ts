import { TestBed } from '@angular/core/testing';

import { InitUserProvider } from './inituser.service';

describe('InitService', () => {
  let service: InitUserProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InitUserProvider);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
