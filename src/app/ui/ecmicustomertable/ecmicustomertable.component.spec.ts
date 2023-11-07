import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EcmicustomertableComponent } from './ecmicustomertable.component';

describe('EcmicustomertableComponent', () => {
  let component: EcmicustomertableComponent;
  let fixture: ComponentFixture<EcmicustomertableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EcmicustomertableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EcmicustomertableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
