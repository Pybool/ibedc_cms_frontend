import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserState } from '../authentication/state/auth.selector';
import { AppState } from '../basestore/app.states';
import { emsCustomers } from '../pages/customersmodule/postpaidcustomers/state/customer.selector';
import { UserModifyModel } from '../pages/user/createuser/models/user';
import { catchError, map, switchMap, take, tap, timeout } from 'rxjs/operators';
import { SharedService } from './shared.service';
import { AuthService } from './auth.service';
import { ConvertTableService } from './convert-table.service';
let self;

@Injectable({
  providedIn: 'root'
})
export class PostpaidCustomerService {
  singleCustomer:Observable<any>;
  customerId;
  cachedData$
  data$
  userState
  permission_hierarchy;
  emsCustomersList;
  ecmiCustomersList;
  emsCustomersList$;
  ecmiCustomersList$;
  customer;
  dual:boolean = false
  newCustomerList;
  kanban = false;
  user_id;
  newCustomerList$:any = new BehaviorSubject<any>({});
  
  private readonly cacheTimeMs = 5 * 60 * 1000; // Cache for 5 minutes

  constructor(private store: Store<AppState>,
              private http: HttpClient,private router: Router,private convertTableService: ConvertTableService,
              private sharedService: SharedService, private auth: AuthService,) { 
    this.userState = this.store.select(UserState);

    this.user_id = this.auth.getUserFromLocalStorage()?.id
    self = this
    this.userState.pipe(
      take(1)
    ).subscribe((user) => {
      this.permission_hierarchy = user.permission_hierarchy//user.can_create_customers
      
    });
  }

   getCurrentDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = this.padNumber(date.getMonth() + 1);
    const day = this.padNumber(date.getDate());
    const hours = '00';
    const minutes = '00';
    const seconds = '00';
    return `${year}:${month}:${day} ${hours}:${minutes}:${seconds}`;
  }
  
  padNumber(num) {
    return num.toString().padStart(2, '0');
  }

  toggleView(){
    const tablewraps:any = document.querySelector("#table-wraps")
    const kanbanwraps:any = document.querySelector("#kanban-wraps")
    if(this.kanban){
      this.kanban = false;
      kanbanwraps.style.display = 'none'
      tablewraps.style.display = 'block'
      localStorage.setItem('cust_view_mode','list')
    }
    else{
      this.kanban = true
      tablewraps.style.display = 'none'
      kanbanwraps.style.display = 'flex'
      localStorage.setItem('cust_view_mode','grid')
    }
  }
  

  swapCustomerlist(data){
    console.log(data,self)
    self.newCustomerList = data
    self.newCustomerList$.next(self.newCustomerList)
    console.log(self.newCustomerList)
  }

  public getNewCustomerList(){
    return this.newCustomerList$.asObservable()
  }

  nextPage(link:number,cmp:string,query:string,type='',is_search=false){
    let url;
    if(!is_search){
      url = `${environment.api}/customers/${type}?start_date=${this.getCurrentDate()}&end_date=${this.getCurrentDate()}&limit=${environment.paginationLimit}&offset=${(link)}&permission_hierarchy=${this.permission_hierarchy}&cuid=${this.user_id}`+query
    }
    else{
      url = `${environment.api}/searching/${type}/customers?start_date=${this.getCurrentDate()}&end_date=${this.getCurrentDate()}&limit=${environment.paginationLimit}&offset=${(link)}&permission_hierarchy=${this.permission_hierarchy}&cuid=${this.user_id}`+query
    }
    return this.http.get(url)
        .pipe(
        timeout(environment.requestTimeOut), // Timeout after 20 seconds
        catchError((error) => {
          // Handle errors here
          return throwError('An error occurred while making the request.');
      })
    );
  }
  
  
  fetchcustomers(type:string):Observable<any>{
    console.log("Fetching customers ==> ", type)
    this.userState.pipe(
      take(1)
    ).subscribe((user) => {
      this.permission_hierarchy = user.permission_hierarchy//user.can_create_customers
      
    });
    
    switch (type){
      case 'postpaid':
          return this.http.get(`${environment.api}/customers/postpaid?start_date=${this.getCurrentDate()}&end_date=${this.getCurrentDate()}&permission_hierarchy=${this.permission_hierarchy}&cuid=${this.user_id}`)
          .pipe(
            timeout(environment.requestTimeOut), // Timeout after 20 seconds
            catchError((error) => {
              // Handle errors here
              return throwError('An error occurred while making the request.');
          })
        )     
    }
  }
   
  getItemById(array, accountno) {

    return array?.find(item => item.accountno == accountno);
  }

  fetchTariffCode(tariffId,accounttype){ 
    return this.http.get<any>(`${environment.api}/singlecustomer/tariffcode?tariffid=${tariffId}&accounttype=${accounttype}&cuid=${this.user_id}`)
    .pipe(
      timeout(environment.requestTimeOut), // Timeout after 20 seconds
      catchError((error) => {
        // Handle errors here
        return throwError('An error occurred while making the request.');
    })
  )

  }

  fetchSinglecustomer(payload){
    /*First search in customers list store */    
    switch (payload?.accounttype){
      case 'postpaid':
        this.emsCustomersList = this.store.select(emsCustomers);
        this.emsCustomersList$ = this.emsCustomersList.subscribe((data) => {
          this.customer = this.getItemById(data.customers,payload.accountno) 
          console.log("Found customer in store ", this.customer)
          
        });   
        break;
    }

    if (this.customer?.caad_is_active){
      return of({status:true,data:this.customer})
    }
   
    
    /*next searching in search results store if not in customers list store */
    /*Send a fresh request to backend to fetch customer data if not found in store */
    return this.http.get<any>(`${environment.api}/customer/information/basic-information?accounttype=${payload?.accounttype}&accountno=${payload?.accountno}&is_caad=${payload?.is_caad || 0}&cuid=${this.user_id}`)
    .pipe(
      timeout(environment.requestTimeOut), // Timeout after 20 seconds
      catchError((error) => {
        // Handle errors here
        return throwError('An error occurred while making the request.');
    })
  )
  }

  fetchSingleCustomerEcmiorEMS(payload){
    return this.http.get<any>(`${environment.api}/singlecustomer-ecmi-ems?accountno=${payload?.accountno}`)
    .pipe(
      timeout(environment.requestTimeOut), // Timeout after 20 seconds
      catchError((error) => {
        // Handle errors here
        return throwError('An error occurred while making the request.');
    })
  )
  }

  fetchSingleCustomerBills(payload){
    return this.http.get<any>(`${environment.api}/singlecustomer-bills?accounttype=${payload?.accounttype}&accountno=${payload?.accountno}&cuid=${this.user_id}&page=${1}`)
    .pipe(
      timeout(environment.requestTimeOut), // Timeout after 20 seconds
      catchError((error) => {
        // Handle errors here
        return throwError('An error occurred while making the request.');
    })
  )
  }

  fetchSingleCustomerPayments(payload){
    const customerUID = payload?.accounttype === 'prepaid' ? payload?.meterno : payload.accountno;
    return this.http.get<any>(`${environment.api}/singlecustomer-payments?accounttype=${payload?.accounttype}&accountno=${customerUID}&cuid=${this.user_id}&page=${1}`)
    .pipe(
      timeout(environment.requestTimeOut), // Timeout after 20 seconds
      catchError((error) => {
        // Handle errors here
        return throwError('An error occurred while making the request.');
    })
  )
  }

  fetchSingleCustomerMetering(payload){
    return this.http.get<any>(`${environment.api}/singlecustomer-meteringInfo?accounttype=${payload?.accounttype}&accountno=${payload?.accountno}&cuid=${this.user_id}`)
    .pipe(
      timeout(environment.requestTimeOut), // Timeout after 20 seconds
      catchError((error) => {
        // Handle errors here
        return throwError('An error occurred while making the request.');
    })
  )
  }

  fetchSingleCustomerAssets(payload){
    return this.http.get<any>(`${environment.api}/singlecustomer-assets?accounttype=${payload?.accounttype}&accountno=${payload?.accountno}&cuid=${this.user_id}`)
    .pipe(
      timeout(environment.requestTimeOut), // Timeout after 20 seconds
      catchError((error) => {
        // Handle errors here
        return throwError('An error occurred while making the request.');
    })
  )
  }

  // /singlecustomer-assets?accountno=12/28/52/1258-01&accounttype=postpaid
  fetchLocations(hierarchy:string,q:string){
    return this.http.get<any>(`${environment.api}/locations/getdata?hierarchy=${hierarchy}&q=${q}&cuid=${this.user_id}`)
    .pipe(
      timeout(environment.requestTimeOut), // Timeout after 20 seconds
      catchError((error) => {
        // Handle errors here
        return throwError('An error occurred while making the request.');
    })
  )
  }

  deepFetchCustomers(payload):Observable<any>{
    console.log("Deep search payload ===> ", payload)
    this.userState.subscribe((user) => {
      this.permission_hierarchy = user.permission_hierarchy//user.can_create_customers
      
    });    
    return  this.http.post(`${environment.api}/searching/prepaid/customers?permission_hierarchy=${this.permission_hierarchy}&cuid=${this.user_id}`,payload)
    .pipe(
      timeout(environment.requestTimeOut), // Timeout after 20 seconds
      catchError((error) => {
        // Handle errors here
        return throwError('An error occurred while making the request.');
    })
  )

  }

  deepEmsFetchCustomers(payload):Observable<any>{
    console.log("Deep search payload ===> ", payload)
    this.userState.subscribe((user) => {
      this.permission_hierarchy = user.permission_hierarchy//user.can_create_customers
      
    });    
    return  this.http.post(`${environment.api}/searching/postpaid/customers?permission_hierarchy=${this.permission_hierarchy}&cuid=${this.user_id}`,payload)
    .pipe(
      timeout(environment.requestTimeOut), // Timeout after 20 seconds
      catchError((error) => {
        // Handle errors here
        return throwError('An error occurred while making the request.');
    })
  )

  }

  advancedFilterEcmiCustomers(payload):Observable<any>{
    this.sharedService.getDualSearchState().pipe(take(1)).subscribe((state)=>{
      this.dual = state
    })
    console.log("Advanced filtering payload ===> ", payload)
    this.userState.subscribe((user) => {
      this.permission_hierarchy = user.permission_hierarchy//user.can_create_customers
      
    });    
    return  this.http.post(`${environment.api}/advancedsearching/prepaid/customers?permission_hierarchy=${this.permission_hierarchy}&dual=${this.dual}&cuid=${this.user_id}`,payload)
    .pipe(
      timeout(environment.requestTimeOut), // Timeout after 20 seconds
      catchError((error) => {
        // Handle errors here
        return throwError('An error occurred while making the request.');
    })
  )

  }

  advancedFilterEmsCustomers(payload):Observable<any>{
    this.sharedService.getDualSearchState().pipe(take(1)).subscribe((state)=>{
      this.dual = state
    })
    console.log("Advanced filtering payload ===> ", payload)
    this.userState.subscribe((user) => {
      this.permission_hierarchy = user.permission_hierarchy//user.can_create_customers
      
    });    
    return  this.http.post(`${environment.api}/advancedsearching/postpaid/customers?permission_hierarchy=${this.permission_hierarchy}&cuid=${this.user_id}`,payload)
    .pipe(
      timeout(environment.requestTimeOut), // Timeout after 20 seconds
      catchError((error) => {
        // Handle errors here
        return throwError('An error occurred while making the request.');
    })
  )

  }

  fecthCustomerFormMetadata(){
    return this.http.get<any>(`${environment.api}/cms/customerform/metadata?as_method=${true}&cuid=${this.user_id}`)
    .pipe(
      timeout(environment.requestTimeOut), // Timeout after 20 seconds
      catchError((error) => {
        // Handle errors here
        return throwError('An error occurred while making the request.');
    })
  )
    
  }

  initiateCaad(payload){
    console.log(payload)
    return this.http.post<any>(`${environment.api}/cms/customer/initiate-caad?cuid=${this.user_id}`,payload)
    .pipe(
      timeout(environment.requestTimeOut), // Timeout after 20 seconds
      catchError((error) => {
        // Handle errors here
        return throwError('An error occurred while making the request.');
    })
  )
    
  }

}
