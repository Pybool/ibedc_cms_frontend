import { ChangeDetectorRef, Component, ComponentFactoryResolver, OnInit,AfterViewInit, Renderer2, ViewChild, ViewContainerRef, ChangeDetectionStrategy } from '@angular/core';
import { customerData } from './customerdata.js'
import { abbreviateName } from '../../../../utils'
import { Observable, Subscription, of } from 'rxjs';
import { AutoUnsubscribe } from 'src/auto-unsubscribe.decorator';
import { AppState } from 'src/app/basestore/app.states';
import { Store } from '@ngrx/store';
import { isAuthenticated, UserState } from 'src/app/authentication/state/auth.selector';
import { FetchEcmiCustomers, FetchEmsCustomers } from './state/customer.actions';
import { ecmiCustomers, emsCustomers } from './state/customer.selector';
import { SharedService } from 'src/app/services/shared.service';
import { CustomerFilter } from './models/customer';
import { CustomerService } from 'src/app/services/customer.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgZone } from '@angular/core';
import { map, take, tap } from 'rxjs/operators';
import { DataTableDirective } from 'angular-datatables';
import { SpinnerService } from 'src/app/services/spinner.service';
import { ConvertTableService } from 'src/app/services/convert-table.service';
import { NotificationService } from 'src/app/services/notification.service';
import { PaginationService } from 'src/app/services/pagination.service';

var self;
interface CustomWindow extends Window {
  waitForElm:(arg1) => any;
  DataTable: (searchTerm: string,{}) => void;
  initiateCaad:(payload)=>any;
  openCustomerUpdateForm:(payload)=>any;
}

declare let window: CustomWindow;

// Helper function to set dropdown value

// import { DataTable } from "./datatables.js"
@AutoUnsubscribe
@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class CustomersComponent implements AfterViewInit {
  public metaData;
  dtOptions: DataTables.Settings = {};
  @ViewChild(DataTableDirective)
  datatableElement: DataTableDirective;
  filter:any = new CustomerFilter()
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
  deferredItems = [];
  getState;
  userState;
  can_approve_caad:boolean;
  can_create_customers:boolean;
  ecmiCustomersList
  emsCustomersList
  activePage = ''
  customersType:string;
  isAuthenticated:boolean = false;
  ems_total_customers = 0
  emsCustomersList$;
  regions = null;
  business_units:any[] = []
  service_centers:any[];
  mode;
  currentAccountno;
  ecmi_total_customers$
  ems_total_customers$
  getCustomerList$
  intervalId
  isCallable:boolean = true
  kanban = false

  ecmiCustomersList$:any
  customers$: any
  ecmi_total_customers: number = 0;
  getStateSubscription: Subscription;
  userStateSubscription: Subscription;
  ecmiCustomersListSubscription: Subscription;
  getCustomerListSubscription: Subscription;
  // dtOptions: DataTables.Settings = {};
  @ViewChild('editcustomerplaceholder', { read: ViewContainerRef }) placeholder: ViewContainerRef;
  @ViewChild('createcustomerplaceholder', { read: ViewContainerRef }) createplaceholder: ViewContainerRef;
  constructor(private store: Store<AppState>,
              private zone: NgZone,
              private sharedService:SharedService,
              private cd: ChangeDetectorRef,
              private customerService:CustomerService,
              private componentFactoryResolver: ComponentFactoryResolver,
              private renderer: Renderer2,
              private spinnerService: SpinnerService,
              private convertTableService:ConvertTableService,
              private route: ActivatedRoute,
              private notificationService: NotificationService,
              private paginationService: PaginationService,
              private cdr: ChangeDetectorRef) { 
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
    this.ecmiCustomersList = this.store.select(ecmiCustomers);
    //Dispatch a request for Prepaid Customers by default....
    this.store.dispatch(new FetchEcmiCustomers());

  }

  toggleView($event){
    if (this.kanban){
      this.kanban = false
    }
    else{
      this.kanban = true
    }
    // this.customerService.toggleView()
  }

  ngOnInit(): void {
    this.checkAuthentication();
    this.subscribeToUserState();
    this.subscribeToEcmiCustomersList();
    // this.searchForCustomers();
  }

  private checkAuthentication(): void {
    this.getStateSubscription = this.store.select(isAuthenticated).subscribe((state) => {
      this.isAuthenticated = state;
    });
  }

  private subscribeToUserState(): void {
    this.userStateSubscription = this.userState.subscribe((user) => {
      this.can_create_customers = user?.can_create_customer;
    });
  }

  private subscribeToEcmiCustomersList(): void {
    this.ecmiCustomersList$ = this.ecmiCustomersList;
    this.ecmiCustomersListSubscription = this.ecmiCustomersList$.subscribe((data: any) => {
      this.setCustomerPageData(data);
    });
  }

  private setCustomerPageData(data: any): void {
    this.sharedService.setActiveCustomerPage('prepaid');
    this.customers$ = of(data.customers);
    this.ecmi_total_customers = data.total_customers;
    console.log('=====> Done setting ECMI customers ', this.ecmi_total_customers, data.customers);
    this.sharedService.setSpinnerText('Processing data...');
    this.convertTableService.convertTable({ id: 'customer_table' });
  }

  private searchForCustomers(): void {
    this.getCustomerListSubscription = this.customerService.getNewCustomerList().subscribe((response) => {
      if (response.status) {
        this.sharedService.setSpinnerText('Processing search results...');
        this.ecmi_total_customers = response.data?.length;
        this.customers$ = of([]);
        this.customers$ = of(response.data);
        console.log(response, Object.keys(response).length);
        this.spinnerService.hideSpinner();
        setTimeout(() => {
          const searchBar: HTMLInputElement = document.querySelector('#search-customer-input');
          const keyEvent = new KeyboardEvent('keyup', { key: 'Enter' });
          searchBar.dispatchEvent(keyEvent);
        }, 500);
      } else {
        console.log('hmm');
      }
    });
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

  openCustomerCreateForm(){
    this.createCustomerForm().then((status)=>{
      console.log(document.getElementById('create_customer').classList)
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

  openCustomerUpdateForm(accountno){
    console.log(accountno)
    if(accountno.target == undefined){
      self.currentAccountno =  accountno
    }
    else{self.currentAccountno =  accountno.target.closest('a').id}
    
    console.log("Account no ===> ", self.currentAccountno)
    self.openCustomerCreateForm()//Bug
    self.sharedService.setFormHeader(['edit','Update Existing Customer',self.activePage,self.currentAccountno])
    self.mode = 'edit'
  }

  getRandomColor() {
    if(this.isCallable){
      return Math.floor(Math.random() * 16777215).toString(16);
    }
    
  }

  ngAfterViewInit(){
    const parentElement = document.getElementById('table-wrapper');
    console.log("---------> ", parentElement)
    this.spinnerService.showSpinner(parentElement);
    this.sharedService.setSpinnerText('Fetching data from source...')
    // this.convertTableService.convertTable({id:'customer_table'}).then((status)=>{
    //   console.log("----**** status", status)
    //   if(status){
        this.isCallable = false
    //   }
    // })
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
    console.log("---------> ", parentElement)
    this.spinnerService.showSpinner(parentElement);
    this.sharedService.setSpinnerText('Processing your request')
    this.customerService.advancedFilterEcmiCustomers(this.filter).subscribe((response)=>{
       this.customerService.swapCustomerlist(response)
       this.convertTableService.convertTable({id:'customer_table'})
    })
  }

  forceUpdate($event){

  }

  initiateCaad(accountno){
    let cdrbtn:any = document.querySelector("#cdrbtn")
    
    self.customerService.fetchSinglecustomer({accounttype:'prepaid',accountno:accountno}).pipe(take(1)).subscribe((response) => {
      if(response.status){
        self.customerService.initiateCaad(response.data).pipe(take(1)).subscribe((response)=>{
          console.log(response)
          if(response.status){
            let notification = {type:'success',title:'CAAD Initiation!',
            message:response?.message,
            subMessage:'The RPU for this location will take mext steps'}
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

  createCustomerForm(){
    return new Promise((resolve,reject)=>{
      import('../../customercreation/customercreation.component').then(({ CustomercreationComponent }) => {
        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(CustomercreationComponent);
        resolve(this.createplaceholder?.createComponent(componentFactory));
      });
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
        this.customers$ = data.customers//user.can_create_customers
        this.ecmi_total_customers = data.total_customers
        
      })
      )
    
  }

  ngOnDestroy(){
    console.log("Customer component destroyed")
    this.emsCustomersList$?.unsubscribe()
    // this.ecmiCustomersList$?.unsubscribe()
    this.getCustomerList$?.unsubscribe()
    
  }



}
