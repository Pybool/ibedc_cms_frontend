import { ApplicationRef, Component ,OnInit} from '@angular/core';
import {Router} from '@angular/router'; // import router from angular router
import { Store } from '@ngrx/store';
import { AppState } from './basestore/app.states';
import {  getStoredState } from './basestore/app.reducer';
import { initialState } from './authentication/state/auth.reducer';
import { abbreviateName } from './../utils'
import { RehydrateLogIn } from './authentication/state/auth.actions';
import { isAuthenticated, UserState } from './authentication/state/auth.selector';
import { AuthService } from './services/auth.service';
import { User } from './authentication/models/user';
import { ActivatedRoute } from '@angular/router';
import { SharedService } from './services/shared.service';
import { CustomerService } from './services/customer.service';
import { DeepFetchEcmiCustomers } from './pages/customersmodule/prepaidcustomers/state/customer.actions';
import { DeepFetchEmsCustomers } from './pages/customersmodule/postpaidcustomers/state/customer.actions';
import { SpinnerService } from './services/spinner.service';
import { BillingService } from './services/billing.service';
import { take } from 'rxjs/operators';
import { NotificationService } from './services/notification.service';
import { PaymentsService } from './services/payments.service';
import { ConvertTableService } from './services/convert-table.service';
import { CrmdService } from './services/crmd.service';
import { CaadService } from './services/caad.service';
import { UserService } from './services/user.service';

declare function myfunction(): any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'cms-ibedc-app';
  usersMail= ''
  usersName = ''
  abbreviateName = abbreviateName
  getState;
  is_admin:boolean = false
  userState;
  auth_user:User;
  can_approve:boolean;
  can_approve_caad:boolean;
  is_authenticated:boolean;
  activeCustomerPage:string;
  activeSearchbar:string = 'dashboard'
  activePayments = 'ems'
  positionCode;
  userRegion;
  user:any
  
  constructor(private router: Router,
              private store: Store<AppState>,
              private authService: AuthService,
              private route: ActivatedRoute,
              private sharedService:SharedService,
              private customerService:CustomerService,
              private spinnerService:SpinnerService,
              private billingService:BillingService,
              private paymentService: PaymentsService,
              private appRef: ApplicationRef,
              private crmdService : CrmdService,
              private caadService : CaadService,
              private userService: UserService,
              private notificationService:NotificationService,
              private convertTableService :ConvertTableService) {
    this.store.dispatch(new RehydrateLogIn(''));
    this.getState = this.store.select(isAuthenticated);
    this.userState = this.store.select(UserState);
    
  }

 
  ngOnInit(){


    this.sharedService.getActiveSearchInput()?.subscribe({
      next: activeSearchbar => {
        this.activeSearchbar = activeSearchbar
      },
    });


    this.sharedService.getActiveCustomerPage()?.subscribe({
      next: activePage => {
        this.activeCustomerPage = activePage
      },
    });
    

    this.userState.subscribe((user) => {
      if (user == undefined){
        this.router.navigateByUrl("/cms/web/login")
      }
      else{
        this.user = user
        this.can_approve = user.can_approve
        this.can_approve_caad = user.can_approve_caad
        this.usersMail = user.email
        this.usersName = user.name
        this.is_admin = user.is_admin
        this.is_authenticated = true
        this.positionCode = user.position
        this.userRegion = user.region.toUpperCase()
        // this.router.navigateByUrl("/dashboard")
      }
    });
    
  }

  darkMode(){

  }

  prv($event){
    // $event.preventDefault()
  }

  searchCustomer($event){
    this.sharedService.searchCustomer($event)
  }

  shallowSearchBilling($event){
    this.sharedService.shallowSearchBilling($event)
  }
  
  activateDualSearch($event){
    this.sharedService.activateDualSearch($event.target.checked)
  }

  searchBarFilter($event){
    var searchBar:any = document.querySelector('#search-customer-input')
    if(searchBar){
      let searchBarValue = searchBar.value.trim();
      if (searchBarValue.trim().length > 0){
          //Dispatch deepSearch service here
          let payload = {activePage:this.activeCustomerPage,fieldName:$event.target.name,q:[searchBarValue]}
          if(this.activeCustomerPage == 'prepaid'){
            const parentElement = document.getElementById('search-status');
            this.spinnerService.showSpinner(parentElement);
            this.sharedService.setSpinnerText('Processing your request')
            this.store.dispatch(new DeepFetchEcmiCustomers(payload))
          }
          else if(this.activeCustomerPage == 'postpaid'){
            const parentElement = document.getElementById('ems-search-status');
            this.spinnerService.showSpinner(parentElement);
            this.sharedService.setSpinnerText('Processing your request')
            this.store.dispatch(new DeepFetchEmsCustomers(payload))
          }
          
          console.log(`Searching for a ${$event.target.textContent} ==> `, searchBarValue)
          searchBar.value=''
      }
      else{
        console.log("Search Bar Empty!",`Please type a/an ${$event.target.textContent}  in the search bar and click ${$event.target.textContent} filter again`)
      }
    }
    else{alert("Component is not loaded yet.")}
    
  }

  billingSearchBarFilter($event){
    var searchBar:HTMLInputElement = document.querySelector('#billing-history-search-bar')
    if(searchBar){
      let searchBarValue = searchBar.value.trim();
      console.log(searchBarValue)
      if (searchBarValue.trim().length > 0){
          //Dispatch deepSearch service here
          let payload = {type:'searchbar',activePage:'billing',fieldName:$event.target.name,q:[searchBarValue.trim()]}
            const parentElement = document.getElementById('spinner-wrapper');
            this.spinnerService.showSpinner(parentElement);
            this.sharedService.setSpinnerText('Processing your request')
            this.billingService.deepSearchBilling(payload).pipe(take(1)).subscribe((response)=>{

              if (response.status){
                this.spinnerService.hideSpinner()
                this.billingService.swapBillinglist(response)
                searchBar.value=''
                this.notificationService.success('Records matching your search criteria were found','Search results found',{})
              }
              
              else{
                this.spinnerService.hideSpinner()
                let notification = {type:'failure',title:'Search results',
                message:'Could not retrieve results for your search criteria at this time',
                subMessage:'Something isn\'t right '}
                this.notificationService.setModalNotification(notification)
              }
            },
            error=>{
                this.spinnerService.hideSpinner()
                if (error.name === 'TimeoutError') {
                    return alert('The search request timed out')
                }
                // Throw the error to propagate it further
                let notification = {type:'failure',title:'Search results',
                message:'Could not retrieve results for your search criteria at this time',
                subMessage:'An error occured somewhere...'}
                this.notificationService.setModalNotification(notification)

              }
            )          
          console.log(`Searching for a ${$event.target.textContent} ==> `, searchBarValue)
      }
      else{
        let notification = {type:'failure',title:'???',
        message:(`Please type a/an ${$event.target.textContent}  in the search bar and click ${$event.target.textContent} filter again`),
        subMessage:'No search criterion'}
        this.notificationService.setModalNotification(notification)
        console.log()
      }
    }
    else{alert("Component is not loaded yet.")}
  }

  paymentSearchBarFilter($event){
    var searchBar:HTMLInputElement = document.querySelector('#payment-history-search-bar')
    
    if(searchBar){
      let searchBarValue = searchBar.value.trim();
      console.log(searchBarValue)
      if (searchBarValue.trim().length > 0){
          //Dispatch deepSearch service here
          if(this.activeSearchbar == 'payments'){
            this.activePayments = 'ems'
          }
          else{
            this.activePayments = 'ecmi'
          }
          let payload = {type:this.activePayments,activePage:this.activeSearchbar,fieldName:$event.target.name,q:[searchBarValue.trim()]}
            const parentElement = document.getElementById('spinner-wrapper');
            // this.spinnerService.showSpinner(parentElement);
            // this.sharedService.setSpinnerText('Processing your request')
            console.log("Payments search payload ====> ", payload)
            
            this.paymentService.searchPaymentsHistory(payload).pipe(take(1)).subscribe((response)=>{
              if (response.status){
              this.paymentService.swapPaymentList(response)
                searchBar.value=''
                this.notificationService.success('Records matching your search criteria were found','Search results found',{})
              }
              else{
                this.spinnerService.hideSpinner()
                let notification = {type:'failure',title:'Search results',
                message:'Could not retrieve results for your search criteria at this time',
                subMessage:'Something isn\'t right '}
                this.notificationService.setModalNotification(notification)
              }
            },
            error=>{
                //Load Notification Modal here....
                this.spinnerService.hideSpinner()
                if (error.name === 'TimeoutError') {
                  
                 return alert('The search request timed out')
                }
                let notification = {type:'failure',title:'Oops!!!',
                message:'Could not retrieve results for your search criteria at this time',
                subMessage:'An error occured somewhere...'}
                this.notificationService.setModalNotification(notification)

              }
            )          
          console.log(`Searching for a ${$event.target.textContent} ==> `, searchBarValue)
      }
      else{
        let notification = {type:'failure',title:'???',
        message:(`Please type a/an ${$event.target.textContent}  in the search bar and click ${$event.target.textContent} filter again`),
        subMessage:'No search criterion'}
        this.notificationService.setModalNotification(notification)
      }
    }
    else{alert("Component is not loaded yet.")}
  }

  crmdSearchBarFilter($event){
    var searchBar:any = document.querySelector('#crmd-search-bar')
    if(searchBar){
      let searchBarValue = searchBar.value.trim();
      console.log(searchBarValue)
      if (searchBarValue.trim().length > 0){
          //Dispatch deepSearch service here
          let payload = {activePage:this.activeSearchbar,fieldName:$event.target.name,q:[searchBarValue]}
          console.log(payload)
          if(this.activeSearchbar == 'crmd'){
            const parentElement = document.getElementById('search-status');
            console.log(parentElement)
            this.spinnerService.showSpinner(parentElement);
            this.sharedService.setSpinnerText('Processing your request')
            this.crmdService.searchCrmdRecord(payload).pipe(take(1)).subscribe((response)=>{
              console.log(response)
              this.spinnerService.hideSpinner()
              if(response.status){
                this.crmdService.cacheAwaitingCustomers(response.data)
              }
              else{
                let notification = {type:'failure',title:'Search results',
                message:'Could not retrieve results for your search criteria at this time',
                subMessage:'Something isn\'t right '}
                this.notificationService.setModalNotification(notification)
              }
            },
            error=>{
              //Load Notification Modal here....
              this.spinnerService.hideSpinner()
              if (error.name === 'TimeoutError') {
                
               return alert('The search request timed out')
              }
              let notification = {type:'failure',title:'Oops!!!',
              message:'Could not retrieve results for your search criteria at this time',
              subMessage:'An error occured somewhere...'}
              this.notificationService.setModalNotification(notification)

            })
          }
          
          console.log(`Searching for a ${$event.target.textContent} ==> `, searchBarValue)
          searchBar.value=''
      }
      else{
        console.log("Search Bar Empty!",`Please type a/an ${$event.target.textContent}  in the search bar and click ${$event.target.textContent} filter again`)
      }
    }
    else{alert("Component is not loaded yet.")}
  }

  caadSearchBarFilter($event){
    var searchBar:any = document.querySelector('#caad-search-bar')
    if(searchBar){
      let searchBarValue = searchBar.value.trim();
      console.log(searchBarValue)
      if (searchBarValue.trim().length > 0){
          //Dispatch deepSearch service here
          let payload = {activePage:this.activeSearchbar,fieldName:$event.target.name,q:[searchBarValue]}
          if(this.activeSearchbar == 'caad'){
            const parentElement = document.getElementById('search-status');
            this.spinnerService.showSpinner(parentElement);
            this.sharedService.setSpinnerText('Processing your request')
            this.caadService.searchCaadRecord(payload).pipe(take(1)).subscribe((response)=>{
              this.spinnerService.hideSpinner()
              if(response.status){
                this.caadService.cacheCaadCustomers(response.data)
              }
              else{
                let notification = {type:'failure',title:'Search results',
                message:'Could not retrieve results for your search criteria at this time',
                subMessage:'Something isn\'t right '}
                this.notificationService.setModalNotification(notification)
              }
            },
            error=>{
              //Load Notification Modal here....
              this.spinnerService.hideSpinner()
              if (error.name === 'TimeoutError') {
                
               return alert('The search request timed out')
              }
              let notification = {type:'failure',title:'Oops!!!',
              message:'Could not retrieve results for your search criteria at this time',
              subMessage:'An error occured somewhere...'}
              this.notificationService.setModalNotification(notification)

            })
          }
          
          console.log(`Searching for a ${$event.target.textContent} ==> `, searchBarValue)
          searchBar.value=''
      }
      else{
        console.log("Search Bar Empty!",`Please type a/an ${$event.target.textContent}  in the search bar and click ${$event.target.textContent} filter again`)
      }
    }
    else{alert("Component is not loaded yet.")}
  }

  singleCustomerSearchBarFilter($event){
    var searchBar:any = document.querySelector('#customer-search-bar')
    if(searchBar){
      let searchBarValue = searchBar.value.trim();

      if (searchBarValue.trim().length > 0){
          //Dispatch deepSearch service here
          let payload = {accountno:searchBarValue}
          console.log(payload)
          if(this.activeSearchbar == 'customer'){
            const parentElement = document.getElementById('search-status');
            console.log(parentElement)
            this.spinnerService.showSpinner(parentElement);
            this.sharedService.setSpinnerText('Processing your request')
            this.customerService.fetchSingleCustomerEcmiorEMS(payload).pipe(take(1)).subscribe((response)=>{
              console.log(response)
              this.spinnerService.hideSpinner()
              if(response.status){
                // this.customerService.swapCustomerlist(response.data)
                const data = response.data[0]
                const base = 'customer/information/basic-information'
                const params = {accountno:data.accountno,accounttype:data.accounttype,meterno:data.meterno,search:1}
                console.log([base, params])
                sessionStorage.setItem('single-searched-customer',JSON.stringify(response))
                this.sharedService.navigateWithParams(base,params)
              }
              else{
                let notification = {type:'failure',title:'Search results',
                message:'Could not retrieve results this account number at this time',
                subMessage:'Something isn\'t right '}
                this.notificationService.setModalNotification(notification)
              }
            },
            error=>{
              //Load Notification Modal here....
              this.spinnerService.hideSpinner()
              if (error.name === 'TimeoutError') {
                
               return alert('The search request timed out')
              }
              let notification = {type:'failure',title:'Oops!!!',
              message:'Could not retrieve results for your search criteria at this time',
              subMessage:'An error occured somewhere...'}
              this.notificationService.setModalNotification(notification)

            })
          }
          
          console.log(`Searching for a ${$event.target.textContent} ==> `, searchBarValue)
          searchBar.value=''
      }
      else{
        console.log("Search Bar Empty!",`Please type a/an ${$event.target.textContent}  in the search bar and click ${$event.target.textContent} filter again`)
      }
    }
    else{alert("Component is not loaded yet.")}
  }

  usersFilter($event,enter=false){
    console.log($event.target?.name)
    var searchBar:HTMLInputElement = document.querySelector('#user-search-bar')
    if(searchBar){
      let searchBarValue = searchBar.value.trim();
      console.log(searchBarValue)
      if (searchBarValue.trim().length > 0){
          //Dispatch deepSearch service here
          let payload
           if (enter){
             payload = {type:'searchbar',activePage:'users',fieldName:'',q:[searchBarValue.trim()]}
           }
           else{
             payload = {type:'searchbar',activePage:'users',fieldName:$event.target.name,q:[searchBarValue.trim()]}
           }
            
            const parentElement = document.getElementById('spinner-wrapper');
            this.spinnerService.showSpinner(parentElement);
            this.sharedService.setSpinnerText('Processing your request')
            this.userService.searchusers(payload).pipe(take(1)).subscribe((response)=>{

              if (response.status){
                this.spinnerService.hideSpinner()
                this.userService.swapUserlist(response)
                searchBar.value=''
                this.notificationService.success('Records matching your search criteria were found','Search results found',{})
              }
              
              else{
                this.spinnerService.hideSpinner()
                let notification = {type:'failure',title:'Search results',
                message:'Could not retrieve results for your search criteria at this time',
                subMessage:'Something isn\'t right '}
                this.notificationService.setModalNotification(notification)
              }
            },
            error=>{
                this.spinnerService.hideSpinner()
                if (error.name === 'TimeoutError') {
                    return alert('The search request timed out')
                }
                // Throw the error to propagate it further
                let notification = {type:'failure',title:'Search results',
                message:'Could not retrieve results for your search criteria at this time',
                subMessage:'An error occured somewhere...'}
                this.notificationService.setModalNotification(notification)

              }
            )          
          console.log(`Searching for a ${$event.target.textContent} ==> `, searchBarValue)
      }
      else{
        let notification = {type:'failure',title:'???',
        message:(`Please type a/an ${$event.target.textContent}  in the search bar and click ${$event.target.textContent} filter again`),
        subMessage:'No search criterion'}
        this.notificationService.setModalNotification(notification)
        console.log()
      }
    }
    else{alert("Component is not loaded yet.")}
  }

  logout(){
    
    this.authService.logout()
    this.is_authenticated = false;
  }

ngAfterViewInit() {
  
  
}

}
