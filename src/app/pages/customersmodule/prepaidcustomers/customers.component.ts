import { ChangeDetectorRef, Component, ComponentFactoryResolver, OnInit,AfterViewInit, Renderer2, ViewChild, ViewContainerRef, ChangeDetectionStrategy } from '@angular/core';
import { customerData } from './customerdata.js'
import { abbreviateName } from '../../../../utils'
import { of } from 'rxjs';
import { AutoUnsubscribe } from 'src/auto-unsubscribe.decorator';
import { AppState } from 'src/app/basestore/app.states';
import { Store } from '@ngrx/store';
import { isAuthenticated, UserState } from 'src/app/authentication/state/auth.selector';
import { DeepFetchEcmiCustomers, FetchEcmiCustomers } from './state/customer.actions';
import { ecmiCustomers } from './state/customer.selector';
import { SharedService } from 'src/app/services/shared.service';
import { CustomerFilter } from './models/customer';
import { CustomerService } from 'src/app/services/customer.service';
import { catchError, map, take, tap } from 'rxjs/operators';
import { DataTableDirective } from 'angular-datatables';
import { SpinnerService } from 'src/app/services/spinner.service';
import { ConvertTableService } from 'src/app/services/convert-table.service';
import { PaginationService } from 'src/app/services/pagination.service';
import { AuthService } from 'src/app/services/auth.service';
import { CustomerEffects } from './state/customer.effects';
import { error } from 'console';

var self;
interface CustomWindow extends Window {
  waitForElm:(arg1) => any;
  DataTable: (searchTerm: string,{}) => void;
  initiateCaad:(payload)=>any;
  openCustomerUpdateForm:(payload)=>any;
}

declare let window: CustomWindow;

// Helper function to set dropdown value


@AutoUnsubscribe
@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class CustomersComponent {
  public metaData;
  dtOptions: DataTables.Settings = {};
  @ViewChild(DataTableDirective)
  datatableElement: DataTableDirective;
  filter:any = new CustomerFilter()
  noResults = false
  create_perm:boolean;
  can_approve:boolean;
  has_field:boolean;
  appname:string;
  advanced_filters:boolean ;
  transients;
  defaults;
  field_names;
  current_user;
  Math = Math
  abbreviateName = abbreviateName
  custs$;
  customers$:any;
  deferredItems = [];
  getState;
  userState;
  can_approve_caad:boolean;
  can_create_customers:boolean;
  ecmiCustomersList
  activePage = ''
  customersType:string;
  isAuthenticated:boolean = false;
  ecmi_total_customers = 0
  ecmiCustomersList$;
  regions = null;
  business_units:any[] = []
  service_centers:any[];
  mode;
  currentAccountno;
  ecmi_total_customers$
  getCustomerList$
  intervalId
  isCallable:boolean = true
  kanban = false
  user;
  is_search = false;

  @ViewChild('editcustomerplaceholder', { read: ViewContainerRef }) placeholder: ViewContainerRef;
  @ViewChild('createcustomerplaceholder', { read: ViewContainerRef }) createplaceholder: ViewContainerRef;
  constructor(private store: Store<AppState>,
              private authService: AuthService,
              private sharedService:SharedService,
              private customerService:CustomerService,
              private componentFactoryResolver: ComponentFactoryResolver,
              private renderer: Renderer2,
              private spinnerService: SpinnerService,
              private convertTableService:ConvertTableService,
              private paginationService: PaginationService,
              private cdr: ChangeDetectorRef,
              private customersService: CustomerService,
              ) { 
    this.sharedService.setActiveSearchInput('customers')
    this.custs$ = customerData.customer_data
    this.metaData = customerData.metadata
    this.can_create_customers = false;
    this.can_approve= this.metaData.can_approve;
    this.has_field= this.metaData.has_field;
    this.appname = this.metaData.appname;
    this.advanced_filters= this.metaData.advanced_filters;
    this.transients = customerData.transients;
    this.defaults = customerData.defaults;
    this.field_names = customerData.field_names;
    this.current_user = customerData.current_user;
    this.Math = Math
    this.abbreviateName = abbreviateName;
    this.getState = this.store.select(isAuthenticated);
    this.userState = this.store.select(UserState);   

  }

  logout(){
    this.authService.logout()
  }

  toggleView($event){
    this.kanban = !this.kanban
  }

  
  ngOnInit(): void {
    //Check if user is authenticated
    this.loadScript('https://cdn.datatables.net/responsive/2.3.0/js/dataTables.responsive.js');
    this.loadMutlipleScripts()
    this.dtOptions = {
      responsive: true
    };
    
    this.getState = this.store.select(isAuthenticated);
    this.getState.subscribe((state) => {
      this.isAuthenticated = state
    });
    
    this.userState.pipe(take(1)).subscribe((user) => {
      this.user = user
       this.can_create_customers = user.can_create_customer
    });
    this.fetchCustomers()
    
  }

  fetchCustomers(){
    return this.customersService.fetchcustomers('prepaid').pipe(take(1)).subscribe((response)=>{
        if(response.status){
            this.sharedService.setActiveCustomerPage('prepaid')
            this.customersType = 'prepaid'
            this.activePage = 'prepaid'
            this.customers$ = of(response.data.slice(0, 50))
            this.ecmi_total_customers = response.data.total_customers
            this.sharedService.setSpinnerText('Processing data...')  
            

            this.convertTableService.clearTablefn()
            this.paginationService.setLinks(response.next,response.last,'prepaidcustomers')
            this.convertTableService.convertTable({id:'customer_table'}).then((convertedTable)=>{
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
          throw new Error("Server returned false status for fetch Ecmi Customers")
      }
    },((error)=>{
      this.spinnerService.hideSpinner()
      this.customersService.swapCustomerlist([])
      if (error.name === 'TimeoutError') {
          alert('The request timed out')
      }
    }))
}


  paginateSubscription(){
    console.log("Paginating...")
    this.paginationService.dataEvent.subscribe((response: any) => {
      if(response.status){
        console.log(response)
        this.paginationService.setLinks(
                                        response.next,
                                        response.last,
                                        'prepaidcustomers',
                                        response.query,
                                        this.is_search
                                        )
        this.customers$ = of(response.data)
      }
      else{ this.customers$ = of([])}
    });
  }

  searchBarFilter($event){
    
    var searchBar:any = document.querySelector('#cmp-search-customer-input')
    if(searchBar){
      let searchBarValue = searchBar.value.trim();
      if (searchBarValue.trim().length > 0){
          //Dispatch deepSearch service here
          let payload = {activePage:'prepaid',fieldName:$event.target.name,q:[searchBarValue]}
          const parentElement = document.getElementById('search-status');
          this.spinnerService.showSpinner(parentElement);
          this.sharedService.setSpinnerText('Processing your request')
          this.customersService.deepFetchCustomers(payload).pipe(take(1)).subscribe((response)=>{
              if(response.status){
                alert(response.status)
                this.noResults = false
                this.convertTableService.clearTablefn()                
                this.customers$ = of(response.data)
                this.cdr.detectChanges()
                this.paginationService.setLinks(response?.next,response?.last,'prepaidcustomers')
                
                this.convertTableService.convertTable({id:'customer_table'}).then((status)=>{
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
                this.noResults = true;
                this.spinnerService.hideSpinner()
                this.paginationService.setLinks(response?.next,response?.last,'prepaidcustomers')
              }
          })
          console.log(`Searching for a ${$event.target.textContent} ==> `, searchBarValue)
          searchBar.value=''
      }
      else{
        alert("Search Bar Empty!"+ `\nPlease type a/an ${$event.target.textContent}  in the search bar and click ${$event.target.textContent} filter again`)
      }
    }
    else{alert("Component is not loaded yet.")}
    
  }


  loadScript(src) {
    const script = this.renderer.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    this.renderer.appendChild(document.body, script);
  }
 
  loadCustomerInformation($event,accountno,meterno,accounttype){
    let base = `customer/information/basic-information`
    const queryParams = {accountno : accountno, accounttype: accounttype?.toLowerCase(),meterno:meterno };
    this.sharedService.navigateWithParams(base,queryParams)
  }

  openCustomerCreateForm(externalInstance=false){
    this.createCustomerForm(externalInstance).then((status)=>{
      document.getElementById('create_customer').classList.add("content-active")
    })
    this.sharedService.setFormHeader(['create','Create Awaiting Customer','postpaid',''])
    this.mode = 'create'
  }

  openDrafts(){
    this.createCustomerForm().then((status)=>{
      document.getElementById('create_customer').classList.add("content-active")
      document.getElementById('creation-draft').click()
    })
  }

  openCustomerUpdateForm(accountno,externalself:any=false,aprovalexternalInstance:any=false,customerData:any = false){
    if(externalself != false){
      self = externalself
    }
    if(accountno.target == undefined){
      self.currentAccountno =  accountno
    }
    else{
      self.currentAccountno =  accountno.target.closest('a').id
    }
    self.openCustomerCreateForm(aprovalexternalInstance)
    if(aprovalexternalInstance == false){
      self.sharedService.setFormHeader(['edit','Update Existing Customer',self.activePage,self.currentAccountno])
    }
    else{
      self.sharedService.setFormHeader(['edit','Update Declined Customer',self.activePage,self.currentAccountno,customerData])
    }
    
    self.mode = 'edit'
  }

  getRandomColor() {
    if(this.isCallable){
      return Math.floor(Math.random() * 16777215).toString(16);
    }
  }

  receivePaginationData(response){
    this.customers$ = of(response?.data) || []
  }

  loadMutlipleScripts(){
    const scripts = [
                      "/assets/js/datatables/dataTables.buttons.min.js",
                      "/assets/js/datatables/jszip.min.js",
                      "/assets/js/datatables/pdfmake.min.js",
                      "/assets/js/datatables/vfs_fonts.js",
                      "/assets/js/datatables/buttons.html5.js",
                      "/assets/js/datatables/buttons.print.js"
                    ]
   return new Promise((resolve,reject)=>{
    scripts.forEach((script)=>{
      this.loadScript(script)
     })
     resolve(true)
   })

  }
  

  ngAfterViewInit(){
    
    const parentElement = document.getElementById('table-wrapper');
    this.spinnerService.showSpinner(parentElement);
    this.sharedService.setSpinnerText('Fetching data from source...')
    this.isCallable = false

    window.initiateCaad = this.initiateCaad
    window.openCustomerUpdateForm = this.openCustomerUpdateForm
    self = this //make this class instance available to the window object by storing in variable

   try{
    const tablewraps:any = document.querySelector("#table-wraps")
    const kanbanwraps:any = document.querySelector("#kanban-wraps")
    kanbanwraps.style.display = 'none'
      tablewraps.style.display = 'block'
      localStorage.setItem('cust_view_mode','list')
   }
   catch{}
   this.paginateSubscription()  
    
  }

  trackByFn(index: number, item: any) {
    return item.id;
  }

  submitFilter(){
    Object.keys(this.filter).forEach((key)=>{
      if (this.filter[key] == '' || this.filter[key]==undefined || this.filter[key] == null){
        Reflect.deleteProperty(this.filter, key);
      }
    })
    const parentElement = document.getElementById('search-status');
    this.spinnerService.showSpinner(parentElement);
    this.sharedService.setSpinnerText('Processing your request')
    this.customerService.advancedFilterEcmiCustomers(this.filter).subscribe((response)=>{
      console.log(response)
      if(response.status){
        this.noResults = false
        this.convertTableService.clearTablefn()
       
          this.customers$ = of(response.data)
          this.ecmi_total_customers = response.data.length
          this.cdr.detectChanges()
          this.paginationService.setLinks(response?.next,response?.last,'prepaidcustomers')
       this.convertTableService.convertTable({id:'customer_table'}).then((status)=>{
        const dtButtons = document.querySelectorAll('.dt-button')

        Array.from(dtButtons).forEach((dtButton:any)=>{
          dtButton.style.marginLeft = '5px'
          dtButton.style.marginBottom = '15px'
          dtButton.classList.add('btn')
          dtButton.classList.add('btn-light')
          dtButton.classList.add('btn-outline-light')
        })
       })
      }
      else{
        this.noResults = true;
        this.spinnerService.hideSpinner()
        this.ecmi_total_customers = 0
        this.paginationService.setLinks(response?.next,response?.last,'prepaidcustomers')
      }
      
      
    })
  }

  forceUpdate($event){

  }

  initiateCaad(accountno){
    let cdrbtn:any = document.querySelector("#cdrbtn")
    
    self.customerService.fetchSinglecustomer({accounttype:'prepaid',accountno:accountno}).pipe(take(1)).subscribe((response) => {
      if(response.status){
        self.customerService.initiateCaad(response.data).pipe(take(1)).subscribe((response)=>{
          if(response.status){
            let notification = {type:'success',title:'CAAD Initiation!',
            message:response?.message,
            subMessage:'The RPU for this location will take next action'}
            self.notificationService.setModalNotification(notification)
            cdrbtn.click()
            self.cdr.detectChanges(); // Forces change detection
          }
          else{
            let notification = {type:'failure',title:'Uh oh!',
            message:response?.message,
            subMessage:'Something went wrong'}
            self.notificationService.setModalNotification(notification) //Not showing up until a random button is clicked
            cdrbtn.click()
            self.cdr.detectChanges(); // Forces change detection
            
          }
        })
      }
      else{alert("Customer could not be found")}
      
    });
    
  }

  getRegions(){

  }

  createCustomerForm(externalInstance:any=false){
    return new Promise((resolve,reject)=>{
      import('../../customercreation/customercreation.component').then(({ CustomercreationComponent }) => {
        if(externalInstance != false){
          const componentFactory = externalInstance.resolver.resolveComponentFactory(CustomercreationComponent);
          resolve(externalInstance.createplaceholder?.createComponent(componentFactory));
        }
        else{
          const componentFactory = this.componentFactoryResolver.resolveComponentFactory(CustomercreationComponent);
          console.log(this)
          resolve(this.createplaceholder?.createComponent(componentFactory));
        }
        
      })
    })
  }

  getLocations(hierarchy,$event){
    let val;
    if($event == ''){val = $event}
    else{val = $event?.target?.value}

    
    this.customerService.fetchLocations(hierarchy,val).pipe(take(1)).subscribe((data)=>{
      console.log(hierarchy,val,data.data.business_units)
      if(hierarchy == 'regions'){
        this.regions = data.data.regions
      }
      else if (hierarchy == 'business_unit'){
        this.business_units = data.data.business_units
        this.filter.buid = ''
        this.filter.servicecenter = ''
        
      }
      else if (hierarchy == 'servicecenter'){
        this.service_centers = data.data.service_centers
        this.filter.servicecenter = ''
      }
      
    })
  }

  resetFilter(){
    this.filter = new CustomerFilter()
  }
 
  getCustomers(activePage){
    
      this.store.dispatch(new FetchEcmiCustomers())
      this.ecmiCustomersList$ = this.ecmiCustomersList.pipe(
        map((data:any) => {
        this.sharedService.setActiveCustomerPage(activePage)
        this.customersType = activePage
        this.activePage = activePage
        this.customers$ = data.customers
        this.ecmi_total_customers = data.total_customers
        
      })
      )
    
  }

  ngOnDestroy(){
    console.log("Customer component destroyed")
    this.paginationService.setLinks(null,null,'prepaidcustomers')
    this.ecmiCustomersList$?.unsubscribe()
    this.getCustomerList$?.unsubscribe()
    
  }



}
