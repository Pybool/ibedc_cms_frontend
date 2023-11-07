import { Component,OnDestroy  } from '@angular/core';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';
import { CaadService } from 'src/app/services/caad.service';
import { AutoUnsubscribe } from 'src/auto-unsubscribe.decorator';
import { ApproveCaad } from '../customerdetails/caad/state/customercaad.actions';
import { caadApprovalData } from './state/caad.selector';
import { FetchCaadList } from './state/caadlist.actions';
import { SharedService } from 'src/app/services/shared.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { abbreviateName } from '../../../utils'
import { CustomerService } from 'src/app/services/customer.service';
import { NotificationService } from 'src/app/services/notification.service';
import { PaginationService } from 'src/app/services/pagination.service';
import Swal from 'sweetalert2';
import { AuthService } from 'src/app/services/auth.service';
import { AppState } from 'src/app/basestore/app.states';
import { UserState } from 'src/app/authentication/state/auth.selector';
let self;

@AutoUnsubscribe
@Component({
  selector: 'app-caadlist',
  templateUrl: './caadlist.component.html',
  styleUrls: ['./caadlist.component.css']
})
export class CaadlistComponent implements OnDestroy {
  header;
  isCallable = true
  abbreviateName = abbreviateName
  approvalList = [];
  lineItems = []
  approvers = []
  loadedCaadRecord;
  activeCustomer:any = {}
  is_metered:boolean = true;
  typeLineItem
  caad_roles_list = ['BHM','CCO','OC','RPU']
  position = 'BHMX'
  customer:any = {}
  ref:any;
  sebm = `NGN 0.00`
  tebm= `NGN 0.00`
  tebmRaw:number;
  selectedVat;
  refundAmount:any = '';
  refundAmountRaw:any =0.00 ;
  totalEstimate:any = '';
  caadCusts$
  startDate
  endDate
  user
  userState
  can_create_customers
  decline:boolean = false
  vats:any = [{name:2.5},{name:5.5},{name:7.5}]

  constructor(private caadService: CaadService, 
                  private sharedService: SharedService,
                  private spinnerService: SpinnerService,
                  private customerService: CustomerService,
                  private notificationService: NotificationService,
                  private paginationService: PaginationService,
                  private authService: AuthService,private store: Store<AppState>)
                  {
                    this.store.dispatch(new FetchCaadList())
                    this.paginationService.resetPaginator();
                    this.userState = this.store.select(UserState)
                    self = this
                  }

 

  ngOnInit(){

    this.userState.pipe(take(1)).subscribe((user) => {
      this.user = user
       this.can_create_customers = user.can_create_customer
    });
    const parentElement = document.getElementById('search-status');
    this.spinnerService.showSpinner(parentElement)
    this.store.select(caadApprovalData).pipe(take(2)).subscribe((response)=>{
      console.log(response)
      if(response.data?.status){
        this.approvalList = response.data?.data
        this.paginationService.setLinks(response?.next,response?.last,'caad')
        this.spinnerService.hideSpinner()
      }
    })
    this.sharedService.setActiveSearchInput('caad')
    // this.caadCusts$ = this.caadService.getCacheCaadCustomers().subscribe((data)=>{
    //   this.approvalList = data
    // })
    this.isCallable = false
 
  }

  receivePaginationData(response){
    console.log(response)
    this.approvalList = response.data
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

  caadSearchBarFilter($event){
    var searchBar:any = document.querySelector('#caad-search-bar')
    if(searchBar){
      let searchBarValue = searchBar.value.trim();
      if (searchBarValue.trim().length > 0){
          //Dispatch deepSearch service here
          let payload = {activePage:'caad',fieldName:$event.target.name,q:[searchBarValue]}
            const parentElement = document.getElementById('search-status');
            this.spinnerService.showSpinner(parentElement);
            this.sharedService.setSpinnerText('Processing your request')
            this.caadService.searchCaadRecord(payload).pipe(take(1)).subscribe((response)=>{
              console.log(response)
              this.spinnerService.hideSpinner()
              if(response.status){
                this.caadService.cacheCaadCustomers(response.data)
                this.approvalList = response?.data
                this.paginationService.setLinks(response?.next,response?.last,'caad')
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

  newCAAD(){
    this.caadService.setListOrCreate(true)
    document.getElementById('caad_creation').classList.add("content-active")
  }

  submit(){

  }

  trackByFn(){

  }

  getItemByKey(array, id) {
    return array.find(item => item.id == id);
  }

  viewCaadRecord($event,id){
    this.caadService.fetchCaadLineItems(id).pipe(take(1)).subscribe((response)=>{
      if(response.status){
        this.header = id
        this.lineItems = response.data
        this.approvers = response.approvers
        console.log(response,this.lineItems)
        const sebmRaw = this.lineItems.reduce((acc, obj) => acc + (obj.ebm || 0), 0);
        this.sebm = `NGN ${sebmRaw.toLocaleString('en-US')}`
        let activeHeader = this.getItemByKey(this.approvalList,id)
        this.tebm = `NGN ${activeHeader.total_accrued.toLocaleString('en-US')}` 
        this.refundAmount =  `NGN ${activeHeader.refund_amount.toLocaleString('en-US')}`
      }
    })
    document.getElementById('caad_approval').classList.add("content-active")
  }

  approveCaad($event){
    this.caadService.getCaadSucess().pipe(take(2)).subscribe((data)=>{
      console.log(data)
      if (data){
        this.approvalList = this.approvalList.filter(function( obj ) {
          console.log(obj)
          document.getElementById('caad_approval').classList.remove("content-active")
          return obj.id !== self.header;
       });
      }
    })
    this.store.dispatch(new ApproveCaad(this.header))
  }

  revertCaad($event){
    const calculations_el = document.getElementById('calculations')
    if(!this.decline){
      this.decline = true;
      $event.target.innerHTML = 'Cancel Decline'
      
      if(calculations_el){
        calculations_el.classList.remove('col-4')
        calculations_el.classList.add('col-6')
      }
    }
    else{
      this.decline = false;
      $event.target.innerHTML = 'Decline'
      calculations_el.classList.remove('col-6')
        calculations_el.classList.add('col-4')
    }
  
  }

  submitDecline(){
    let comment_el:any = document.getElementById('comments')
    if (comment_el){
      let comment = comment_el?.value || ''
      if (comment.length < 10 || comment == ''){
        return alert('A comment must not be less than ten (10) characters')
      }
      this.caadService.caadApproval(this.header,0,comment).pipe(take(1)).subscribe((response)=>{
        console.log(response)
        if(response.status){
          comment_el.value = ''
          this.decline = false
          Swal.fire({
            
          })
        }
        else{

        }
      })
    }
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
  const parentElement = document.getElementById('search-status');
  this.spinnerService.showSpinner(parentElement);
  this.caadService.searchDateCrmd(payload).pipe(take(1)).subscribe((response:any)=>{
    if(response.status){
      this.approvalList = response.data
    }
    else{this.spinnerService.hideSpinner();alert(response?.message)}
    
  })
}

  exit($event){
    document.getElementById('caad_approval').classList.remove("content-active")
  }

  logout(){
    this.authService.logout()
    // this.is_authenticated = false;
  }

  ngOnDestroy(): void {
    this.caadCusts$?.unsubscribe()
  }
}
