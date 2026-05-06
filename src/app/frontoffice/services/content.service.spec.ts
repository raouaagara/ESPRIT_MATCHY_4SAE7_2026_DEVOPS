import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ContentService } from './content.service';
import { environment } from '../../../environments/environment';
import { Content } from '../models/content.model';

describe('ContentService', () => {
  let service: ContentService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/Content`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ContentService]
    });
    service = TestBed.inject(ContentService);
    httpMock = TestBed.inject(HttpTestingController);

    // Handle initial loadContents call from constructor
    const req = httpMock.expectOne(`${apiUrl}/getAllContents`);
    req.flush('[]');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get content by id', () => {
    const dummyContent: Content = { contentId: 1, title: 'Test Title' } as any;

    service.getContentById(1).subscribe(content => {
      expect(content).toEqual(dummyContent);
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyContent);
  });

  it('should create content', () => {
    const newContent: Content = { title: 'New Content' } as any;
    const returnedContent: Content = { contentId: 2, title: 'New Content' } as any;

    service.createContent(newContent).subscribe(content => {
      expect(content).toEqual(returnedContent);
    });

    const req = httpMock.expectOne(`${apiUrl}/addContent`);
    expect(req.request.method).toBe('POST');
    req.flush(returnedContent);

    // Should reload contents
    const reloadReq = httpMock.expectOne(`${apiUrl}/getAllContents`);
    reloadReq.flush('[]');
  });

  it('should update content', () => {
    const updatedContent: Content = { contentId: 1, title: 'Updated' } as any;

    service.updateContent(updatedContent).subscribe(content => {
      expect(content).toEqual(updatedContent);
    });

    const req = httpMock.expectOne(`${apiUrl}/modifierContent`);
    expect(req.request.method).toBe('PUT');
    req.flush(updatedContent);

    // Should reload contents
    const reloadReq = httpMock.expectOne(`${apiUrl}/getAllContents`);
    reloadReq.flush('[]');
  });

  it('should delete content', () => {
    service.deleteContent(1).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/deleteContent/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});

    // Should reload contents
    const reloadReq = httpMock.expectOne(`${apiUrl}/getAllContents`);
    reloadReq.flush('[]');
  });

  it('should get all contents using custom parser logic', () => {
    const mockJson = `[{"contentId":1,"title":"Test"},{"contentId":2,"title":"Test 2","assessment":{ "id": 1 }}]`;

    service.getAllContents().subscribe(contents => {
      expect(contents.length).toBe(2);
      expect(contents[0].contentId).toBe(1);
      expect(contents[1].contentId).toBe(2);
      expect((contents[1] as any).assessment).toBeUndefined(); // ensure sanitizeList removes assessment
    });

    const req = httpMock.expectOne(`${apiUrl}/getAllContents`);
    expect(req.request.method).toBe('GET');
    req.flush(mockJson);
  });
});
