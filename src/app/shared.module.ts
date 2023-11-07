import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoresultsComponent } from './ui/noresults/noresults.component';

const routes:Routes = []

@NgModule({
  declarations: [ NoresultsComponent ],
  imports: [
    CommonModule,
  ],
  exports:[
    NoresultsComponent
  ],
})
export class SharedModule { }

