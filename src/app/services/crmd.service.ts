import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserState } from '../authentication/state/auth.selector';
import { AppState } from '../basestore/app.states';
import { catchError, take, timeout } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CrmdService {
  userState:any;
  user_id:any;
  permission_hierarchy
  awaitingCustomers:any = []
  awaitingCustomers$:any = new BehaviorSubject<any>([]);

  constructor(private store: Store<AppState>,private http: HttpClient,private router: Router, private auth: AuthService) { 
    this.userState = this.store.select(UserState);
    this.user_id = this.auth.getUserFromLocalStorage()?.id
    
  }

  public swapAwaitingCustomerlist(data){
    console.log("Pagination result data -----> ", data)
  }

  public searchDateCrmd(payload:any){
    this.userState.subscribe((user) => {
      this.permission_hierarchy = user.permission_hierarchy
      
    });

    return this.http.post<any>(`${environment.api}/cms/search-awaiting/customers?page=${1}&type=${'datewidget'}&start_date=${payload.start_date}&end_date=${payload.end_date}&permission_hierarchy=${this.permission_hierarchy}`,{}).pipe(
      timeout(40000),
      catchError(error => {
        return throwError(error);
      })
    )
  }

  public cacheAwaitingCustomers(awaitingCustomers){
    this.awaitingCustomers = awaitingCustomers
    this.awaitingCustomers$.next(this.awaitingCustomers);
  }

  public getCacheAwaitingCustomers(){
    return this.awaitingCustomers$.asObservable()
  }

  nextPage(link:number,cmp:string,query:string){
    this.userState.subscribe((user) => {
      this.permission_hierarchy = user.permission_hierarchy
    });
    return this.http.get(`${environment.api}/cms/awaiting/customers?limit=${environment.paginationLimit}&offset=${(link)}&status=pending&permission_hierarchy=${this.permission_hierarchy}&cuid=${this.user_id}`+query)
        .pipe(
        timeout(environment.requestTimeOut), // Timeout after 20 seconds
        catchError((error) => {
          // Handle errors here
          return throwError('An error occurred while making the request.');
      })
    );
  }

  searchCrmdRecord(payload:any){
    return this.http.post<any>(`${environment.api}/cms/search-awaiting/customers?type=${'searchbar'}`,payload)
  }


  fetchAwaitingCustomers(payload:any){
    if(this.awaitingCustomers.length == 0){
      return this.http.get<any>(`${environment.api}/cms/awaiting/customers?status=${payload?.status}`)
    }
    return this.getCacheAwaitingCustomers()
    
  }

  performAwaitingCustomerAction(payload:any){
    return this.http.put<any>(`${environment.api}/cms/awaiting/customers`,payload)
    
  }
}
