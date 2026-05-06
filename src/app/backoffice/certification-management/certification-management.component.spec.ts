import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificationManagementComponent } from './certification-management.component';

describe('CertificationManagementComponent', () => {
  let component: CertificationManagementComponent;
  let fixture: ComponentFixture<CertificationManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CertificationManagementComponent],
      imports: [HttpClientTestingModule, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificationManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
