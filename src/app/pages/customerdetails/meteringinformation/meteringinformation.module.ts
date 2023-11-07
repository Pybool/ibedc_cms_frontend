import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {DataTablesModule} from 'angular-datatables';
import { SharedModule } from 'src/app/shared.module';
import { MeteringinformationComponent } from './meteringinformation.component';

const routes:Routes = []

@NgModule({
  declarations: [ MeteringinformationComponent ],
  imports: [
    CommonModule,
    SharedModule,
    DataTablesModule,
    RouterModule.forChild(routes),
  ],
})
export class MeteringinformationModule { }

