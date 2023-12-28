import { TestBed } from '@angular/core/testing';

import { HclusteringService } from './hclustering.service';

describe('HclusteringService', () => {
  let service: HclusteringService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HclusteringService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
