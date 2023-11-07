import { Component, OnDestroy, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { CrmdService } from 'src/app/services/crmd.service';
import { NotificationService } from 'src/app/services/notification.service';
import { SharedService } from 'src/app/services/shared.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { abbreviateName } from '../../../utils'
import { CustomerService } from 'src/app/services/customer.service';
import { PaginationService } from 'src/app/services/pagination.service';
import { AuthService } from 'src/app/services/auth.service';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/basestore/app.states';
import { UserState } from 'src/app/authentication/state/auth.selector';

@Component({
  selector: 'app-crmd',
  templateUrl: './crmd.component.html',
  styleUrls: ['./crmd.component.css']
})
export class CrmdComponent implements OnDestroy {
   queue;
   queuesData;
   filter;
   submitFilter
   viewMode
   startDate
   endDate
   createqueueForm;
   awaitingCustomers:any = [];
   awaitingCustomers$:any;
   loadedAwaitingCustomer:any;
   activeAccordionItem:string;
   editedFields:string[] = []
   newFieldsBasicInfo:any[] = []
   newFieldsAccountInfo:any[] = []
   newFieldsLocationInfo:any[] = []
   newFieldsAssetsInfo:any[] = []
   newFieldsLandlordInfo:any[] = []
   awaitingCusts$
   total_awaiting_customers = 0
   abbreviateName = abbreviateName
   isCallable = true 
   user
    userState
    can_create_customers
   
  constructor(
    private customerService: CustomerService,
    private crmdService:CrmdService,
    private notificationService: NotificationService, 
    private sharedService:SharedService,
    private spinnerService: SpinnerService,
    private paginationService: PaginationService,
    private authService: AuthService,private store: Store<AppState>){
      this.paginationService.resetPaginator();
      this.userState = this.store.select(UserState)
    }

  ngOnInit(){
    this.userState.pipe(take(1)).subscribe((user) => {
      this.user = user
       this.can_create_customers = user.can_create_customer
    });
    const payload = {status:'pending'}
    const parentElement = document.getElementById('spinner-wrapper');
    this.spinnerService.showSpinner(parentElement)
    this.awaitingCustomers$ = this.crmdService.fetchAwaitingCustomers(payload).pipe(take(1)).subscribe((awaitingCustomers)=>{
      this.crmdService.cacheAwaitingCustomers(awaitingCustomers)
      this.awaitingCustomers = awaitingCustomers?.data
      this.total_awaiting_customers = awaitingCustomers?.total_customers
      this.paginationService.setLinks(awaitingCustomers?.next,awaitingCustomers?.last,'crmd')
      this.spinnerService.hideSpinner()
      console.log("Awaiting Customers ===> ", this.awaitingCustomers)
    })
  }

  resetFilter(){

  }

  getItemById(iterable, id) {
    try{
      return iterable.find(item => item.id == id);
    }
    catch{
      iterable = iterable?.data
      return iterable.find(item => item.id == id);
    }
  }

  viewAwaitingCustomer($event){
    const self = this
    this.loadedAwaitingCustomer = this.getItemById(this.awaitingCustomers,$event.target.closest('li')?.value)
    console.log("[LOADED AWAITING CUSTOMER]:: ",this.loadedAwaitingCustomer)
    this.editedFields = this.loadedAwaitingCustomer.last_edited_fields.fields
    document.getElementById('awaiting_customer_details').classList.add("content-active")
    const basic_info:any = document.getElementById('basic-info')
    const account_info:any = document.getElementById('account-info')
    const location_info:any = document.getElementById('location-info')
    const assets_info:any = document.getElementById('assets-info')
    const landlord_info:any = document.getElementById('landlord-info')
    setTimeout(()=>{
      self.newFieldsBasicInfo =basic_info.querySelectorAll('span.up')
      self.newFieldsAccountInfo =account_info.querySelectorAll('span.up')
      self.newFieldsLocationInfo =location_info.querySelectorAll('span.up')
      self.newFieldsAssetsInfo =assets_info.querySelectorAll('span.up')
      self.newFieldsLandlordInfo =landlord_info.querySelectorAll('span.up')
    },1000)
    
  }

  setActive($event){
    let clicked:any = $event.target
    let el;
    if(clicked.nodeName === "A"){
      el = clicked.querySelector('h6')
    }
    else{el=clicked}
    
    if(this.activeAccordionItem == clicked.closest('a').id){
        el.style.color = '#364a63';
        this.activeAccordionItem = ''
        return
    }
    const accordionHeads:any  = document.querySelectorAll('.accordion-head')
    accordionHeads.forEach((accordionHead)=>{
      accordionHead.querySelector('h6').style.color = '#364a63'
    })
    if (el){el.style.color = 'orange';this.activeAccordionItem = el.closest('a').id}
    else{el.querySelector('h6').style.color = 'orange';this.activeAccordionItem = el.closest('a').id}
    
  }

  crmdSearchBarFilter($event){
    var searchBar:any = document.querySelector('#crmd-search-bar')
    if(searchBar){
      let searchBarValue = searchBar.value.trim();
      console.log(searchBarValue)
      if (searchBarValue.trim().length > 0){
          //Dispatch deepSearch service here
          let payload = {activePage:'crmd',fieldName:$event.target.name,q:[searchBarValue]}
          console.log(payload)
          
          const parentElement = document.getElementById('search-status');
          console.log(parentElement)
          this.spinnerService.showSpinner(parentElement);
          this.sharedService.setSpinnerText('Processing your request')
          this.crmdService.searchCrmdRecord(payload).pipe(take(1)).subscribe((response)=>{
            console.log(response)
            this.spinnerService.hideSpinner()
            if(response.status){
              this.crmdService.cacheAwaitingCustomers(response.data)
              this.awaitingCustomers = response?.data
              this.total_awaiting_customers = response?.data.length
              this.paginationService.setLinks(response?.next,response?.last,'crmd')
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
          
          
          console.log(`Searching for a ${$event.target.textContent} ==> `, searchBarValue)
          searchBar.value=''
      }
      else{
        console.log("Search Bar Empty!",`Please type a/an ${$event.target.textContent}  in the search bar and click ${$event.target.textContent} filter again`)
      }
    }
    else{alert("Component is not loaded yet.")}
  }



  getRandomColor() {
    if(this.isCallable){
      return Math.floor(Math.random() * 16777215).toString(16);
    }
    
  }

  loadCustomerInformation($event,accountno){
    this.customerService.fetchSingleCustomerEcmiorEMS({accountno:accountno}).pipe(take(1)).subscribe((response)=>{
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

  receivePaginationData(response){
    console.log(response)
    this.awaitingCustomers = response.data
  }


  handler($event){
    
    if ($event.target.name=='start_date'){
        this.startDate = $event.target.value
        document.querySelector('#disabled-date').removeAttribute('disabled')
    }
    if ($event.target.name=='end_date'){
        this.endDate = $event.target.value
    }

    console.log(this.startDate, this.endDate)
 
    if (this.startDate!=null && this.endDate!=null){
        console.log("Firring event ....")
        this.searchDateCrmd()

    }

}

searchDateCrmd(){
  const payload = {type:'crmd',start_date:this.startDate,end_date:this.endDate}
  this.crmdService.searchDateCrmd(payload).pipe(take(1)).subscribe((response:any)=>{
    if(response.status){
      this.awaitingCustomers = response.data
    }
    else{this.spinnerService.hideSpinner();alert(response?.message)}
    
  })
}

  ngAfterViewInit(){
    this.sharedService.setActiveSearchInput('crmd')
    this.awaitingCusts$ = this.crmdService.getCacheAwaitingCustomers().subscribe((response)=>{
      this.awaitingCustomers = response.data
    })
    this.isCallable = false
  }

  queueAction($event,action){
    const commentsEl:any = document.querySelector('#comments')
    let comments = commentsEl?.value
    let loadedaccountno = this.loadedAwaitingCustomer.accountno
    let payload = {id:this.loadedAwaitingCustomer.id,
                  accountno:this.loadedAwaitingCustomer.accountno,
                  action:action,
                  comments:comments,
                  is_draft:this.loadedAwaitingCustomer.is_draft,
                  is_fresh:this.loadedAwaitingCustomer.is_fresh,
                  customer_id:this.loadedAwaitingCustomer.customer_id}
    this.crmdService.performAwaitingCustomerAction(payload).pipe(take(1)).subscribe((response)=>{
        if (response?.status){
          //Load Notification Modal here....
          this.awaitingCustomers = this.awaitingCustomers.filter(function( obj ) {
            return obj.accountno !== loadedaccountno;
         });
          let notification = {type:'success',title:response?.title,
          message:response?.message,
          subMessage:'CRMD Approval Sequence Milestone'}
          this.notificationService.setModalNotification(notification)
        }
    })
  }

  exitAwaitingCustomer(){
    document.getElementById('awaiting_customer_details').classList.remove("content-active")
  }

  logout(){
    this.authService.logout()
    // this.is_authenticated = false;
  }
  

  ngOnDestroy(){
    this.awaitingCustomers$?.unsubscribe()
    this.awaitingCusts$?.unsubscribe()
    console.log("Destroying crmd component")
  }

}
