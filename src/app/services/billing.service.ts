import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { catchError, take, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { UserState } from '../authentication/state/auth.selector';
import { AppState } from '../basestore/app.states';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  userState
  user_id;
  permission_hierarchy
  billingList = [];
  billingList$:any = new BehaviorSubject<any>(this.billingList);

  constructor(private http: HttpClient,
              private store: Store<AppState>,
              private router: Router, private auth: AuthService
    ) 
    {  
      this.userState = this.store.select(UserState);
      this.user_id = this.auth.getUserFromLocalStorage()?.id;

  }

    setMetadata(){
      this.userState.pipe(
        take(1)
      ).subscribe((user) => {
        this.permission_hierarchy = user.permission_hierarchy//user.can_create_customers
        
      });
    }

    public swapBillinglist(data){
      this.billingList$ = new BehaviorSubject<any>([]);
      console.log("Billing service data ----> ",data, this.billingList$)
      this.billingList = data.data
      this.billingList$.next(data)
      console.log(this.billingList)
    }
  
    public getbillingList(){
      return this.billingList$.asObservable()
    }

    
    // return this.http.get(`${environment.api}/customers-bills?page=${parseInt(page)}&limit=100&offset=${offset}&permission_hierarchy=${this.permission_hierarchy}&cuid=${this.user_id}`)
    nextPage(link:number,cmp:string,query:string){
        this.userState.subscribe((user) => {
          this.user_id = user.id
          this.permission_hierarchy = user.permission_hierarchy
        });
        return this.http.get(`${environment.api}/customers-bills?\
        limit=${environment.paginationLimit}&offset=${(link)}&permission_hierarchy=${this.permission_hierarchy}&cuid=${this.user_id}`+query)
            .pipe(
            timeout(environment.requestTimeOut), // Timeout after 20 seconds
            catchError((error) => {
              // Handle errors here
              return throwError('An error occurred while making the request.');
          })
        );
    }

  searchDateBillingsHistory(payload:any){
    return this.http.get<any>(`${environment.api}/search-customers-bills?page=${1}&type=${'datewidget'}&start_date=${payload.start_date}&end_date=${payload.end_date}&permission_hierarchy=${this.permission_hierarchy}`).pipe(
      timeout(environment.requestTimeOut),
      catchError(error => {
        return throwError(error);
      })
    )
  }

  fetchCustomersBilling(){
    this.setMetadata()
    return this.http.get<any>(`${environment.api}/customers-bills?page=${1}&permission_hierarchy=${this.permission_hierarchy}`).pipe(
      timeout(environment.requestTimeOut),
      catchError(error => {
        return throwError(error);
      })
    )

  }

  deepSearchBilling(payload){
      return this.http.get<any>(`${environment.api}/search-customers-bills?page=${1}&type=${payload.type}&field=${payload.fieldName}&value=${payload.q[0]}&permission_hierarchy=${this.permission_hierarchy}`).pipe(
        timeout(environment.requestTimeOut),
        catchError(error => {
          return throwError(error);
        })
      )
  }
  
}
