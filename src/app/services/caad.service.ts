import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AppState } from '../basestore/app.states';
import { catchError, timeout } from 'rxjs/operators';
import { UserState } from '../authentication/state/auth.selector';

@Injectable({
  providedIn: 'root'
})
export class CaadService {
  caadCustomers
  caadCustomers$ = new BehaviorSubject<any>([]);
  listOrCreate$:any = new BehaviorSubject<Boolean>(false);
  CaadSucess$:any = new BehaviorSubject<Boolean>(false);
  permission_hierarchy
  userState;
  user_id:any

  constructor(private store: Store<AppState>,
              private http: HttpClient,
              private router: Router
              ){  this.userState = this.store.select(UserState);}

  
  public setListOrCreate(status){
    this.listOrCreate$.next(status)
  }
             
  public getListOrCreate(){
    return this.listOrCreate$.asObservable()
  }

  public setCaadSucess(status){
    this.CaadSucess$.next(status)
  }

  public getCaadSucess(){
    return this.CaadSucess$.asObservable()
  }

  searchCaadRecord(payload:any){
    return this.http.post<any>(`${environment.api}/cms/search-caad/customers`,payload)
  }

  public searchDateCrmd(payload:any){
    this.userState.subscribe((user) => {
      this.permission_hierarchy = user.permission_hierarchy
    });

    return this.http.post<any>(`${environment.api}/cms/search-caad/customers?page=${1}&type=${'datewidget'}&start_date=${payload.start_date}&end_date=${payload.end_date}&permission_hierarchy=${this.permission_hierarchy}`,{}).pipe(
      timeout(40000),
      catchError(error => {
        return throwError(error);
      })
    )
  }

  public cacheCaadCustomers(caadCustomers){
    this.caadCustomers = caadCustomers
    this.caadCustomers$.next(this.caadCustomers);
  }

  public getCacheCaadCustomers(){
    return this.caadCustomers$.asObservable()
  }

  nextPage(link:number,cmp:string,query:string){
    this.userState.subscribe((user) => {
      this.user_id = user.id
      this.permission_hierarchy = user.permission_hierarchy
    });
    return this.http.get(`${environment.api}/cms/caadlist?limit=${environment.paginationLimit}&offset=${(link)}&status=pending&permission_hierarchy=${this.permission_hierarchy}&cuid=${this.user_id}`+query)
        .pipe(
        timeout(environment.requestTimeOut), // Timeout after 20 seconds
        catchError((error) => {
          // Handle errors here
          return throwError('An error occurred while making the request.');
      })
    );
  }

  
  fetchCaadList(){
    return this.http.get<any>(`${environment.api}/cms/caadlist`)
  }

  fetchCaadLineItems(id){
    return this.http.get<any>(`${environment.api}/cms/caadlist?id=${id}`)
  }

  getErrorRows(){
    var errorLineItems = []
    var inputs = document.querySelectorAll('.error-lineitem');   
        for (var i = 0; i < inputs.length; i++) { 
            // if (inputs[i].checked){errorLineItems.push(parseInt(inputs[i].closest('tr').getAttribute('value')))}  
        }  
        return errorLineItems 
  }
  

  caadApproval(header,action,revert_comments=null){
  
      if(action == 0 || action == 1){
          return this.http.put<any>(`${environment.api}/cms/caadlist?action=${action}`,{header:header,action:action,revert_comments:revert_comments})
      }
      return of({status:false,message:"Invalid action specified"})
  }
  
}
