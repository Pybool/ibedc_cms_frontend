import { Component, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs/operators';
import { abbreviateName } from '../../../../utils'
import { AuthService } from 'src/app/services/auth.service';
import { CaadService } from 'src/app/services/caad.service';
import { CustomerService } from 'src/app/services/customer.service';
import { NotificationService } from 'src/app/services/notification.service';
import { SharedService } from 'src/app/services/shared.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { PaginationService } from 'src/app/services/pagination.service';
import { UserState } from 'src/app/authentication/state/auth.selector';
import { AppState } from 'src/app/basestore/app.states';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-customermain',
  templateUrl: './customermain.component.html',
  styleUrls: ['./customermain.component.css']
})
export class CustomermainComponent implements OnInit {

  accountno;
  accounttype;
  meterno;
  user
  userState
  abbreviateName = abbreviateName
  can_create_customers
  params:any = {}
  
  constructor(
    private route: ActivatedRoute, 
    private store: Store<AppState>,
    private paginationService : PaginationService,
    private sharedService:SharedService,
    private caadService:CaadService,
    private spinnerService: SpinnerService,
    private notificationService: NotificationService,
    private customerService: CustomerService,
    private authService :AuthService ) { 
      this.paginationService.resetPaginator();
      this.userState = this.store.select(UserState);  }

  ngOnInit(): void {

    this.userState.pipe(take(1)).subscribe((user) => {
      this.user = user
       this.can_create_customers = user.can_create_customer
    });
    
    this.route.queryParams.subscribe(params => {
      this.params = params
      this.accountno = params?.accountno
      this.accounttype = params?.accounttype
      this.meterno = params?.meterno
      this.sharedService.setActiveSearchInput('customer')
    })
  }


  navigateToPage($event,base){
    console.log(base)
    this.sharedService.navigateWithParams(base,this.params)
  }

  loadCaad($event,base){
    this.caadService.setListOrCreate(false)
    this.sharedService.navigateWithParams(base,this.params)
  }

  singleCustomerSearchBarFilter($event){
    var searchBar:any = document.querySelector('#customer-search-bar')
    if(searchBar){
      let searchBarValue = searchBar.value.trim();

      if (searchBarValue.trim().length > 0){
          //Dispatch deepSearch service here
          let payload = {accountno:searchBarValue}
          console.log(payload)
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
          
          
          console.log(`Searching for a ${$event.target.textContent} ==> `, searchBarValue)
          searchBar.value=''
      }
      else{
        console.log("Search Bar Empty!",`Please type a/an ${$event.target.textContent}  in the search bar and click ${$event.target.textContent} filter again`)
      }
    }
    else{alert("Component is not loaded yet.")}
  }

  logout(){
    this.authService.logout()
  }


}
