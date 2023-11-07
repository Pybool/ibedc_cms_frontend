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
export class PaymentsService {

  userState
  user_id
  permission_hierarchy
  paymentList
  paymentList$ = new BehaviorSubject<any>([]);
  constructor(private http: HttpClient,private store: Store<AppState>,
    private router: Router, private auth: AuthService) {  
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

  swapPaymentList(data){
    console.log(data)
    this.paymentList = data.data
    this.paymentList$.next(data)
    console.log(this.paymentList)
  }

  public getpaymentList(){
    return this.paymentList$.asObservable()
  }

  nextPage(link:number,cmp:string,query:string,type=''){
    this.userState.subscribe((user) => {
      this.user_id = user.id
      this.permission_hierarchy = user.permission_hierarchy
    });
    let url = ''
    switch(type){
      case 'prepaidpayments':
        url = "/customers-ecmi-payments"
        break;
      
      case 'postpaidpayments':
        url = "/customers-ems-payments"
        break;
    
      case 'todayprepaidpayments':
        url = "/todaycollections-ecmi"
        break;

      case 'todaypostpaidpayments':
        url = "/todaycollections-ems"
        break;

      }
      return this.http.get(`${environment.api}/${url}?limit=${environment.paginationLimit}&offset=${(link)}&permission_hierarchy=${this.permission_hierarchy}&cuid=${this.user_id}`+query)
        .pipe(
        timeout(environment.requestTimeOut), // Timeout after 20 seconds
        catchError((error) => {
          // Handle errors here
          return throwError('An error occurred while making the request.');
      })
    );
    // return this.http.get(`${environment.api}/customers-ecmi-payments?page=${parseInt(page)}&limit=100&offset=${offset}&permission_hierarchy=${this.permission_hierarchy}&cuid=${this.user_id}`)
}

  fetchCustomersPayments(){
    this.setMetadata()
    return this.http.get<any>(`${environment.api}/customers-ecmi-payments?page=${1}&permission_hierarchy=${this.permission_hierarchy}&cuid=${this.user_id}`)
    .pipe(
      timeout(environment.requestTimeOut), // Timeout after 20 seconds
      catchError((error) => {
        // Handle errors here
        return throwError('An error occurred while making the request.');
    })
  )
  }

  fetchEmsCustomersPayments(){
    this.setMetadata()
    return this.http.get<any>(`${environment.api}/customers-ems-payments?page=${1}&permission_hierarchy=${this.permission_hierarchy}&cuid=${this.user_id}`)
    .pipe(
      timeout(environment.requestTimeOut), // Timeout after 20 seconds
      catchError((error) => {
        // Handle errors here
        return throwError('An error occurred while making the request.');
    })
  )
  }

  fetchTodayCollectionsEcmi(){
    this.setMetadata()
    return this.http.get<any>(`${environment.api}/todaycollections-ecmi?page=${1}&permission_hierarchy=${this.permission_hierarchy}&cuid=${this.user_id}`)
    .pipe(
      timeout(environment.requestTimeOut), // Timeout after 20 seconds
      catchError((error) => {
        // Handle errors here
        return throwError('An error occurred while making the request.');
    })
  )
  }

  fetchTodayCollectionsEms(){
    this.setMetadata()
    return this.http.get<any>(`${environment.api}/todaycollections-ems?page=${1}&permission_hierarchy=${this.permission_hierarchy}&cuid=${this.user_id}`)
    .pipe(
      timeout(environment.requestTimeOut), // Timeout after 20 seconds
      catchError((error) => {
        // Handle errors here
        return throwError('An error occurred while making the request.');
    })
  )
  }

  searchPaymentsHistory(payload){
    return this.http.get<any>(`${environment.api}/search-customers-${payload?.type}-payments?field=${payload?.fieldName}&value=${payload?.q}&type=searchbar&permission_hierarchy=${this.permission_hierarchy}&cuid=${this.user_id}`)
    .pipe(
      timeout(environment.requestTimeOut), // Timeout after 20 seconds
      catchError((error) => {
        // Handle errors here
        return throwError('An error occurred while making the request.');
    })
  )
  }

  searchDatePaymentsHistory(payload){
    return this.http.get<any>(`${environment.api}/search-customers-${payload?.type}-payments?start_date=${payload?.start_date}&end_date=${payload?.end_date}&type=datewidget&permission_hierarchy=${this.permission_hierarchy}&cuid=${this.user_id}`)
    .pipe(
      timeout(environment.requestTimeOut), // Timeout after 20 seconds
      catchError((error) => {
        // Handle errors here
        return throwError('An error occurred while making the request.');
    })
  )
  }
}


// # http://192.168.15.161:8000/api/v1/search-customers-ems-payments?field=PaymentID&value=D15D142D-1F71-E611-940B-9C8E9967C125&type=searchbar&permission_hierarchy=Service Center
// # http://192.168.15.161:8000/api/v1/search-customers-ems-payments?field=accountno&value=12/06/06/1566-01&type=searchbar&permission_hierarchy=Service Center
// # http://192.168.15.161:8000/api/v1/search-customers-ems-payments?start_date=2021-03-04&end_date=2022-09-05&type=datewidget&permission_hierarchy=Service Center
