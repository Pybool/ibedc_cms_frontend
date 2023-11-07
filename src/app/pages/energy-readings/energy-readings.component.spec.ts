import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnergyReadingsComponent } from './energy-readings.component';

describe('EnergyReadingsComponent', () => {
  let component: EnergyReadingsComponent;
  let fixture: ComponentFixture<EnergyReadingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnergyReadingsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnergyReadingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
