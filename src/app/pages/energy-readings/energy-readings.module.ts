import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {DataTablesModule} from 'angular-datatables';
import { SharedModule } from 'src/app/shared.module';
import { EnergyReadingsComponent } from './energy-readings.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

const routes:Routes = []

@NgModule({
  declarations: [ EnergyReadingsComponent ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    DataTablesModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
  ],
})
export class EnergyReadingsModule { }

