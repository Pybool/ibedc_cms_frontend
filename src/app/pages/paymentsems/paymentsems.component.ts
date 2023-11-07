import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { take } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { ConvertTableService } from 'src/app/services/convert-table.service';
import { NotificationService } from 'src/app/services/notification.service';
import { PaginationService } from 'src/app/services/pagination.service';
import { PaymentsService } from 'src/app/services/payments.service';
import { SharedService } from 'src/app/services/shared.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { AutoUnsubscribe } from 'src/auto-unsubscribe.decorator';
import { abbreviateName } from '../../../utils'
import { UserState } from 'src/app/authentication/state/auth.selector';
import { AppState } from 'src/app/basestore/app.states';
import { Store } from '@ngrx/store';

interface CustomWindow extends Window {
  
  waitForElm:(arg1) => any;
  DataTable:(arg1,arg2)=>void;
}

declare let window: CustomWindow;

@AutoUnsubscribe
@Component({
  selector: 'app-paymentsems',
  templateUrl: './paymentsems.component.html',
  styleUrls: ['./paymentsems.component.css']
})
export class PaymentsemsComponent implements OnInit, OnDestroy {
  ecmi_payments:boolean = true
  emsheaders:string[] = ['Customer Name','Account No','Receipt No','Meter No','Pay Date','Payments','Business Unit','Trans Amount','Status Message','Pay ID','Trans ID', 'CustomerID']
  payments:any[] = []
  Math;
  startDate = null;
  endDate = null;
  paymentService$
  user
  noResults = false
  userState
  abbreviateName = abbreviateName
  can_create_customers

  constructor(private renderer: Renderer2,
    private spinnerService: SpinnerService,
    private sharedService:SharedService,private store: Store<AppState>,
    private convertTableService: ConvertTableService,
    private paymentService: PaymentsService,private authService: AuthService,private notificationService: NotificationService,
    private paginationService:PaginationService) { this.paginationService.resetPaginator();this.userState = this.store.select(UserState);}

  ngOnInit(): void {
    this.userState.pipe(take(1)).subscribe((user) => {
      this.user = user
       this.can_create_customers = user.can_create_customer
    });
    this.paymentService$ = this.paymentService.fetchEmsCustomersPayments().pipe(take(1)).subscribe((response)=>{
      console.log(response.data)
      if(response.status){
        this.noResults = false;
        this.paginationService.setLinks(response.next,response.last,'postpaidpayments')
        this.payments = response.data
        this.convertTableService.convertTable({id:'paymentshistory_table'}).then((convertedTable)=>{
          if(convertedTable){
            const dtButtons = document.querySelectorAll('.dt-button')
              Array.from(dtButtons).forEach((dtButton:any)=>{
                dtButton.style.marginLeft = '5px'
                dtButton.style.marginBottom = '15px'
                dtButton.classList.add('btn')
                dtButton.classList.add('btn-light')
                dtButton.classList.add('btn-outline-light')
              })
          }
          else{
            console.log("There was a problem converting this table")
          }
        })
      }
      else{
        this.convertTableService.clearTablefn()
          this.spinnerService.hideSpinner()
          this.noResults = true;
          this.paginationService.setLinks(response?.next,response?.last,'postpaidpayments')
      }
    })

    this.loadScript('https://cdn.datatables.net/responsive/2.3.0/js/dataTables.responsive.js');
    this.loadMutlipleScripts()
    this.sharedService.setActiveSearchInput('payments')
  }

  receivePaginationData(response){
    console.log(response)
    this.payments = response.data
  }

  loadScript(src) {
    const script = this.renderer.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    this.renderer.appendChild(document.body, script);

    window.waitForElm('#payments-ems-spinner-wrapper').then((parentElement) => {
      this.spinnerService.showSpinner(parentElement);
      this.sharedService.setSpinnerText('Fetching data from source...')
      
    })

  }

  logout(){
    this.authService.logout()
    // this.is_authenticated = false;
  }

  paymentSearchBarFilter($event){
    var searchBar:HTMLInputElement = document.querySelector('#payment-history-search-bar')
    
    if(searchBar){
      let searchBarValue = searchBar.value.trim();
      console.log(searchBarValue)
      if (searchBarValue.trim().length > 0){
          //Dispatch deepSearch service here
         
          let payload = {type:'ems',activePage:'payments',fieldName:$event.target.name,q:[searchBarValue.trim()]}
            const parentElement = document.getElementById('payments-ems-spinner-wrapper');
            this.spinnerService.showSpinner(parentElement);
            this.sharedService.setSpinnerText('Searching for postpaid payments')
            console.log("Payments search payload ====> ", payload)
            
            this.paymentService.searchPaymentsHistory(payload).pipe(take(1)).subscribe((response)=>{
              if (response.status){
                this.noResults = false;
                this.convertTableService.clearTablefn()
              // this.paymentService.swapPaymentList(response)
              console.log(response)
                // this.paymentsTotal = response.count
                this.payments = []
                this.payments = response.data
                this.spinnerService.hideSpinner();
                this.paginationService.setLinks(response?.next,response?.last,'postpaidpayments')
                this.convertTableService.convertTable({id:'paymentshistory_table'}).then((status)=>{
                  if(status){
                    const dtButtons = document.querySelectorAll('.dt-button')
                    Array.from(dtButtons).forEach((dtButton:any)=>{
                      dtButton.style.marginLeft = '5px'
                      dtButton.style.marginBottom = '15px'
                      dtButton.classList.add('btn')
                      dtButton.classList.add('btn-light')
                      dtButton.classList.add('btn-outline-light')
                    })
                  }
                })
                searchBar.value=''
                this.notificationService.success('Records matching your search criteria were found','Search results found',{})
              }
              else{
                // this.spinnerService.hideSpinner()
                // let notification = {type:'failure',title:'Search results',
                // message:'Could not retrieve results for your search criteria at this time',
                // subMessage:'Something isn\'t right '}
                // this.notificationService.setModalNotification(notification)
                this.convertTableService.clearTablefn()
                this.spinnerService.hideSpinner()
                this.noResults = true;
                this.paginationService.setLinks(response?.next,response?.last,'postpaidpayments')
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

  searchPayments(){
    const payload = {}
    this.paymentService.searchPaymentsHistory(payload).subscribe()
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
        this.searchDatePayments()

    }

}

  searchDatePayments(){
    const payload = {type:'ems',start_date:this.startDate,end_date:this.endDate}
    const parentElement = document.getElementById('payments-ems-spinner-wrapper');
    this.spinnerService.showSpinner(parentElement);
    this.sharedService.setSpinnerText('Searching for prepaid payments')
    this.paymentService.searchDatePaymentsHistory(payload).pipe(take(1)).subscribe((response)=>{
      console.log(response)
      if(response.status){
        this.noResults = false;
        this.convertTableService.clearTablefn()
        this.payments = response.data
        this.convertTableService.convertTable({id:'paymentshistory_table'}).then((status)=>{
          if(status){
            const dtButtons = document.querySelectorAll('.dt-button')
            Array.from(dtButtons).forEach((dtButton:any)=>{
              dtButton.style.marginLeft = '5px'
              dtButton.style.marginBottom = '15px'
              dtButton.classList.add('btn')
              dtButton.classList.add('btn-light')
              dtButton.classList.add('btn-outline-light')
            })
          }
        })
      }
      else{
        this.convertTableService.clearTablefn()
          this.spinnerService.hideSpinner()
          this.noResults = true;
          this.paginationService.setLinks(response?.next,response?.last,'postpaidpayments')
      }
    })
  }

  loadCustomerInformation($event,accountno,meterno,accounttype){
    let base = `customer/information/basic-information`
    const queryParams = {accountno : accountno, accounttype: accounttype?.toLowerCase(),meterno:meterno };
    this.sharedService.navigateWithParams(base,queryParams)
  }

  loadMutlipleScripts(){
    const scripts = [
                      "/assets/js/datatables/dataTables.buttons.min.js?version=0.0.3",
                      "/assets/js/datatables/jszip.min.js?version=0.0.3",
                      "/assets/js/datatables/pdfmake.min.js",
                      "/assets/js/datatables/vfs_fonts.js?version=0.0.3",
                      "/assets/js/datatables/buttons.html5.js?version=0.0.3",
                      "/assets/js/datatables/buttons.print.js?version=0.0.3"
                    ]
   return new Promise((resolve,reject)=>{
    scripts.forEach((script)=>{
      this.loadScript(script)
     })
     resolve(true)
   })
   
  }

  ngOnDestroy(){
    this.paymentService$?.unsubscribe()
  }
}

