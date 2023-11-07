import { Component, OnInit, Renderer2, OnDestroy } from '@angular/core';
import { resolve } from 'path';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import { BillingService } from 'src/app/services/billing.service';
import { ConvertTableService } from 'src/app/services/convert-table.service';
import { NotificationService } from 'src/app/services/notification.service';
import { PaginationService } from 'src/app/services/pagination.service';
import { SharedService } from 'src/app/services/shared.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { AutoUnsubscribe } from 'src/auto-unsubscribe.decorator';
import { abbreviateName } from '../../../utils'
import { AuthService } from 'src/app/services/auth.service';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/basestore/app.states';
import { UserState } from 'src/app/authentication/state/auth.selector';

interface CustomWindow extends Window {
  
  waitForElm:(arg1) => any;
  DataTable:(arg1,arg2)=>void;
}

declare let window: CustomWindow;
@AutoUnsubscribe
@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.css']
})
export class BillingComponent implements OnInit , OnDestroy{
  bills:any[];
  rawQueryUsed = false;
  total_bills:number = 0
  billingService$
  startDate
  endDate
  user
  userState
  noResults = false
  abbreviateName = abbreviateName
  can_create_customers
  headers:string[] = ['Customer Name', 'Account Number', 'Tarrif Code', 'Billing Date', 'Due Date', 'Consumption (kw/h)', 'Net Arrears', 'Total Due', 'Back Balance', 'BUID', 'BU Name', 'BM Mobile', 'CSO Mobile', 'Bill ID', 'Account Type', 'Bill Year', 'Bill Month', 'Previous Balance', 'Meter Number', 'Payment', 'Service Address 1', 'Service Address 2', 'Service Address 3', 'ADC', 'Adjustment', 'Dials', 'Energy Read Date', 'Minimum CHG Read Date', 'Minimum Current CHG', 'Present KWH', 'Previous KWH', 'Demand Read Date', 'Present Demand', 'Previous Demand', 'Multiplier', 'Consumption MD', 'Current KWH', 'Current MD', 'Rate', 'FC', 'MMF', 'Reconnection Fee', 'Last Pay', 'Current CHG Total', 'VAT', 'Customer Care', 'Old Account No', 'Vat No', 'Lar Date', 'Lar', 'Mobile', 'Last Pay Amount', 'Email', 'E-mail2', 'E-mail3', 'Is Selected', 'Is Confirmed', 'Is Sms Sent', 'Read Mode', 'Row Guid', 'Refund', 'Back Arrears', 'Back Charge', 'Back Kwh', 'B Vat', 'Net Back Arrears', 'Grand Total', 'Service Id', 'Band Adjustment']
  
  constructor(private renderer: Renderer2,
              private spinnerService: SpinnerService,
              private sharedService:SharedService,
              private convertTableService: ConvertTableService,
              private billingService: BillingService,
              private paginationService: PaginationService,
              private notificationService: NotificationService,
              private authService: AuthService,private store: Store<AppState>) {
                this.paginationService.resetPaginator();this.userState = this.store.select(UserState); 
               }

  ngOnInit(): void {
    this.userState.pipe(take(1)).subscribe((user) => {
      this.user = user
       this.can_create_customers = user.can_create_customer
    });
    this.loadScript('https://cdn.datatables.net/responsive/2.3.0/js/dataTables.responsive.js');
    this.loadMutlipleScripts()
    this.sharedService.setActiveSearchInput('billing')
    window.waitForElm('#spinner-wrapper').then((parentElement) => {
      this.spinnerService.showSpinner(parentElement);
      this.sharedService.setSpinnerText('Fetching data from source...')
    })
    
    this.billingService$ = this.billingService.fetchCustomersBilling().pipe(take(1)).subscribe((response)=>{
      this.bills = []
      if(response.rawQueryUsed == true){
        this.rawQueryUsed = true
      }
      if(response.data){
        this.noResults = false
        this.bills = response.data
        this.total_bills = response.total_bills
        this.spinnerService.hideSpinner();

        window.waitForElm('#spinner-wrapper').then((parentElement) => {
          this.sharedService.setSpinnerText('Processing data...')
          this.convertTableService.convertTable({id:'billinghistory_table'}).then((convertedTable)=>{
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
          this.paginationService.setLinks(response.next,response.last,'billing')
          
        })
      }
      else{
        this.noResults = true;
        this.spinnerService.hideSpinner()
        this.total_bills = 0
        this.paginationService.setLinks(response?.next,response?.last,'billing')
      }
      

    },
    error=>{
      this.spinnerService.hideSpinner()
      if (error.name === 'TimeoutError') {
        return alert('The request timed out, try refreshing the page!')
      }
    }
    )
  }

  logout(){
    this.authService.logout()
    // this.is_authenticated = false;
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

  ngAfterViewInit(){}

  billingSearchBarFilter($event){
    var searchBar:HTMLInputElement = document.querySelector('#billing-history-search-bar')
    if(searchBar){
      let searchBarValue = searchBar.value.trim();
      console.log(searchBarValue)
      if (searchBarValue.trim().length > 0){
          //Dispatch deepSearch service here
          let payload = {type:'searchbar',activePage:'billing',fieldName:$event.target.name,q:[searchBarValue.trim()]}
            const parentElement = document.getElementById('billingswrapper');
            this.spinnerService.showSpinner(parentElement);
            this.sharedService.setSpinnerText('Requests search results...')
            this.billingService.deepSearchBilling(payload).pipe(take(1)).subscribe((response)=>{

              if (response.status){
                this.bills = response.data
                this.convertTableService.clearTablefn()
                this.spinnerService.hideSpinner()
                // this.billingService.swapBillinglist(response)
                this.paginationService.setLinks(response?.next,response?.last,'billing')
                this.convertTableService.convertTable({id:'billinghistory_table'}).then((status)=>{
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
                this.spinnerService.hideSpinner()
                // let notification = {type:'failure',title:'Search results',
                // message:'Could not retrieve results for your search criteria at this time',
                // subMessage:'Something isn\'t right '}
                // this.notificationService.setModalNotification(notification)
                this.total_bills = 0
                  this.noResults = true;
                  this.paginationService.setLinks(response?.next,response?.last,'billing')
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

  receivePaginationData(response){
    this.bills = response?.data || []
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
        this.searchDateBilling()
    }

}

searchDateBilling(){
  const parentElement = document.getElementById('billingswrapper');
  this.spinnerService.showSpinner(parentElement);
  const payload = {type:'ecmi',start_date:this.startDate,end_date:this.endDate}
  this.billingService.searchDateBillingsHistory(payload).pipe(take(1)).subscribe((response:any)=>{
    if(response.status){
      this.bills = response.data
      this.total_bills = response.data.length
      this.convertTableService.clearTablefn()
      this.spinnerService.hideSpinner()
      // this.billingService.swapBillinglist(response)
      this.paginationService.setLinks(response?.next,response?.last,'billing')
      this.convertTableService.convertTable({id:'billinghistory_table'}).then((status)=>{
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
      this.total_bills = 0
      this.spinnerService.hideSpinner()
        this.noResults = true;
        this.paginationService.setLinks(response?.next,response?.last,'billing')
    }
    
  })
}

  loadScript(src) {
    const script = this.renderer.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    this.renderer.appendChild(document.body, script)
  }

  loadCustomerInformation($event,accountno,meterno,accounttype){
    let base = `customer/information/basic-information`
    const queryParams = {accountno : accountno, accounttype: accounttype?.toLowerCase(),meterno:meterno };
    this.sharedService.navigateWithParams(base,queryParams)
  }

  ngOnDestroy(){
    this.billingService$?.unsubscribe()
  }

}
