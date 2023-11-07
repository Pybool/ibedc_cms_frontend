import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserState } from '../authentication/state/auth.selector';
import { AppState } from '../basestore/app.states';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApprovalBoardService {
  // userState:any;
  user_id:any;
  awaitingCustomers:any = []
  awaitingCustomers$:any = new BehaviorSubject<any>([]);

  constructor(private store: Store<AppState>,private http: HttpClient,private router: Router, private authService: AuthService) { 
    // this.userState = this.store.select(UserState);
    this.user_id = this.authService.getUserFromLocalStorage()?.id
  }

  fetchPendingCustomers(action) {
    return this.http.get<any>(`${environment.api}/cms/get_edits_status?action=${action}&cuid=${this.user_id}`).pipe(
      tap(response => {
        this.awaitingCustomers = response.data; // Set the awaitingCustomers variable
        this.awaitingCustomers$.next(response); // Update the awaitingCustomers$ BehaviorSubject
      })
    );
  }

  fetchApprovalBoardCounts(value){
    return this.http.get<any>(`${environment.api}/cms/get_edits_status?counts=${value}&cuid=${this.user_id}`)
  }
  
  getSingleCustomer(accountno,action){
    return this.http.get<any>(`${environment.api}/cms/get_edits_status?action=${action}&accountno=${accountno}&cuid=${this.user_id}`)
  }


}
