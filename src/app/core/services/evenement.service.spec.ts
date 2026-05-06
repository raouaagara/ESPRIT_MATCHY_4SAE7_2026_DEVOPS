import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EvenementService } from './evenement.service';
import { environment } from '../../../environments/environment';
import { Evenement, EvenementCreateDTO, EvenementType } from '../models/evenement.model';

describe('EvenementService', () => {
  let service: EvenementService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/evenements`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EvenementService]
    });
    service = TestBed.inject(EvenementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create an evenement', () => {
    const createDTO: EvenementCreateDTO = { title: 'New Event', type: EvenementType.WORKSHOP } as any;
    const dummyEvenement: Evenement = { id: 1, title: 'New Event', type: EvenementType.WORKSHOP } as any;

    service.createEvenement(createDTO).subscribe(evenement => {
      expect(evenement).toEqual(dummyEvenement);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(dummyEvenement);
  });

  it('should update an evenement', () => {
    const updateDTO: EvenementCreateDTO = { title: 'Updated Event', type: EvenementType.WORKSHOP } as any;
    const dummyEvenement: Evenement = { id: 1, title: 'Updated Event', type: EvenementType.WORKSHOP } as any;

    service.updateEvenement(1, updateDTO).subscribe(evenement => {
      expect(evenement).toEqual(dummyEvenement);
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(dummyEvenement);
  });

  it('should delete an evenement', () => {
    service.deleteEvenement(1).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should get evenement by id', () => {
    const dummyEvenement: Evenement = { id: 1, title: 'Event 1' } as any;

    service.getEvenementById(1).subscribe(evenement => {
      expect(evenement).toEqual(dummyEvenement);
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyEvenement);
  });

  it('should get all evenements', () => {
    const dummyEvenements: Evenement[] = [{ id: 1, title: 'Event 1' } as any];

    service.getAllEvenements().subscribe(evenements => {
      expect(evenements.length).toBe(1);
      expect(evenements).toEqual(dummyEvenements);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(dummyEvenements);
  });

  it('should get evenements by type', () => {
    const dummyEvenements: Evenement[] = [{ id: 1, title: 'Event 1', type: EvenementType.WORKSHOP } as any];

    service.getEvenementsByType(EvenementType.WORKSHOP).subscribe(evenements => {
      expect(evenements.length).toBe(1);
    });

    const req = httpMock.expectOne(`${apiUrl}/type/${EvenementType.WORKSHOP}`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyEvenements);
  });

  it('should participate in an evenement', () => {
    const dummyEvenement: Evenement = { id: 1, title: 'Event 1', currentParticipants: 1 } as any;

    service.participateInEvenement(1).subscribe(evenement => {
      expect(evenement.currentParticipants).toBe(1);
    });

    const req = httpMock.expectOne(`${apiUrl}/1/participate`);
    expect(req.request.method).toBe('POST');
    req.flush(dummyEvenement);
  });

  it('should cancel participation', () => {
    const dummyEvenement: Evenement = { id: 1, title: 'Event 1', currentParticipants: 0 } as any;

    service.cancelParticipation(1).subscribe(evenement => {
      expect(evenement.currentParticipants).toBe(0);
    });

    const req = httpMock.expectOne(`${apiUrl}/1/cancel-participation`);
    expect(req.request.method).toBe('POST');
    req.flush(dummyEvenement);
  });
});
