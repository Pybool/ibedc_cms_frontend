import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {DataTablesModule} from 'angular-datatables';
import { SharedModule } from 'src/app/shared.module';
import { ComplaintsinformationComponent } from './complaintsinformation.component';

const routes:Routes = []

@NgModule({
  declarations: [ ComplaintsinformationComponent ],
  imports: [
    CommonModule,
    SharedModule,
    DataTablesModule,
    RouterModule.forChild(routes),
  ],
})
export class ComplaintsinformationModule { }

