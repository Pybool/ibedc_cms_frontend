import { Component, OnInit, Renderer2 } from '@angular/core';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';
import { UserState } from 'src/app/authentication/state/auth.selector';
import { AppState } from 'src/app/basestore/app.states';
import { AuthService } from 'src/app/services/auth.service';
import { ConvertTableService } from 'src/app/services/convert-table.service';
import { NotificationService } from 'src/app/services/notification.service';
import { PaginationService } from 'src/app/services/pagination.service';
import { PaymentsService } from 'src/app/services/payments.service';
import { SharedService } from 'src/app/services/shared.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { abbreviateName } from '../../../utils'
interface CustomWindow extends Window {
  
  waitForElm:(arg1) => any;
  DataTable:(arg1,arg2)=>void;
}

declare let window: CustomWindow;


@Component({
  selector: 'app-todaycollectionsems',
  templateUrl: './todaycollectionsems.component.html',
  styleUrls: ['./todaycollectionsems.component.css']
})
export class TodaycollectionsemsComponent {
  emsheaders:string[] = ['Customer Name','Account No','Receipt No','Meter No','Pay Date','Payments','Business Unit','Trans Amount','Status Message','Pay ID','Trans ID']
  payments:any[] = []
  Math;
  user
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
    this.loadScript('https://cdn.datatables.net/responsive/2.3.0/js/dataTables.responsive.js');
    this.loadMutlipleScripts()
    this.sharedService.setActiveSearchInput('payments')
    this.paymentService.fetchTodayCollectionsEms().pipe(take(1)).subscribe((response)=>{
      console.log(response.data)
      this.paginationService.setLinks(response.next,response.last,'todaypostpaidpayments')
      if(response.status){
        this.payments = response.data

        this.convertTableService.convertTable({id:'today-cols-payments-ems-history_table'}).then((convertedTable)=>{
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
      else{this.spinnerService.hideSpinner();alert(response?.message)}
      
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
         
          let payload = {type:'ems',activePage:'todaypostpaidpayments',fieldName:$event.target.name,q:[searchBarValue.trim()]}
            const parentElement = document.getElementById('postpaid-todaycols-spinner-wrapper');
            this.spinnerService.showSpinner(parentElement);
            this.sharedService.setSpinnerText('Searching for postpaid payments')
            console.log("Payments search payload ====> ", payload)
            
            this.paymentService.searchPaymentsHistory(payload).pipe(take(1)).subscribe((response)=>{
              if (response.status){
                this.convertTableService.clearTablefn()
              // this.paymentService.swapPaymentList(response)
              console.log(response)
                // this.paymentsTotal = response.count
                this.payments = []
                this.payments = response.data
                this.spinnerService.hideSpinner();
                this.paginationService.setLinks(response?.next,response?.last,'todaypostpaidpayments')
                this.convertTableService.convertTable({id:'today-cols-payments-ems-history_table'}).then((status)=>{
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

  receivePaginationData(response){
    console.log(response)
    this.payments = response.data
  }

  loadScript(src) {
    const script = this.renderer.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    this.renderer.appendChild(document.body, script);

    window.waitForElm('#postpaid-todaycols-spinner-wrapper').then((parentElement) => {
      this.spinnerService.showSpinner(parentElement);
      this.sharedService.setSpinnerText('Fetching data from source...')
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


}
