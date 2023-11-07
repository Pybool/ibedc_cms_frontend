import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AppState } from '../basestore/app.states';

@Injectable({
  providedIn: 'root'
})
export class CustomerComplaintsService {

  constructor(private store: Store<AppState>,
              private http: HttpClient,
              private router: Router
              ){ }

  fetchComplaints(accountno:any){
    return this.http.get<any>(`${environment.api}/singlecustomer-complaints?accountno=${accountno}`)
  }
}
