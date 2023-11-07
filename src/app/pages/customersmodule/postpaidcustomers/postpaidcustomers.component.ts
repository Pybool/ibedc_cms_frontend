import { ChangeDetectorRef, Component, ComponentFactoryResolver, OnInit,AfterViewInit, Renderer2, ViewChild, ViewContainerRef, ChangeDetectionStrategy } from '@angular/core';
import { customerData } from '../prepaidcustomers/customerdata.js'
import { abbreviateName } from '../../../../utils'
import { merge, of } from 'rxjs';
import { AutoUnsubscribe } from 'src/auto-unsubscribe.decorator';
import { AppState } from 'src/app/basestore/app.states';
import { Store } from '@ngrx/store';
import { isAuthenticated, UserState } from 'src/app/authentication/state/auth.selector';
import {  FetchEmsCustomers } from './state/customer.actions';
import {  emsCustomers } from './state/customer.selector';
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
import { AuthService } from 'src/app/services/auth.service';
import { PostpaidCustomerService } from 'src/app/services/postpaidcustomer.service';
import Swal from 'sweetalert2';

var self;
interface CustomWindow extends Window {
  waitForElm:(arg1) => any;
  DataTable: (searchTerm: string,{}) => void;
  initiateCaad:(payload)=>any;
  openCustomerUpdateForm:(payload)=>any;
}

declare let window: CustomWindow;

@AutoUnsubscribe
@Component({
  selector: 'app-postpaidcustomers',
  templateUrl: './postpaidcustomers.component.html',
  styleUrls: ['./postpaidcustomers.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class PostpaidcustomersComponent implements AfterViewInit {
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
  customers$:any = of([]);
  deferredItems = [];
  getState;
  userState;
  can_approve_caad:boolean;
  can_create_customers:boolean;
  emsCustomersList
  isAuthenticated:boolean = false;
  ecmi_total_customers = 0
  ems_total_customers = 0
  emsCustomersList$;
  getCustomerList$
  regions = null;
  business_units:any[] = []
  service_centers:any[];
  mode;
  currentAccountno;
  ems_total_customers$
  intervalId
  isCallable:boolean = true
  kanban = false
  user;
  is_search = false;
  noResults = false;
  activePage = ''
  customersType:string;
  prepaidcustomers? = []
  batch = 20;
  interval = 2000; // 5 seconds in milliseconds
  index = 0;
  // dtOptions: DataTables.Settings = {};
  @ViewChild('editcustomerplaceholder', { read: ViewContainerRef }) placeholder: ViewContainerRef;
  @ViewChild('createcustomerplaceholder', { read: ViewContainerRef }) createplaceholder: ViewContainerRef;
  constructor(private store: Store<AppState>,
              private zone: NgZone,
              private sharedService:SharedService,
              private cdr: ChangeDetectorRef,
              private customerService:PostpaidCustomerService,
              private componentFactoryResolver: ComponentFactoryResolver,
              private renderer: Renderer2,private authService: AuthService,
              private spinnerService: SpinnerService,private paginationService: PaginationService,
              private convertTableService:ConvertTableService,
              private route: ActivatedRoute,private notificationService: NotificationService) { 
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
    // this.emsCustomersList = this.store.select(emsCustomers);
    // this.store.dispatch(new FetchEmsCustomers());
    
     
  }

  logout(){
    this.authService.logout()
    // this.is_authenticated = false;
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
    //Check if user is authenticated
    
    this.loadScript('https://cdn.datatables.net/responsive/2.3.0/js/dataTables.responsive.js');
    this.loadMutlipleScripts()
    this.dtOptions = {
      responsive: true
    };
    
    this.getState = this.store.select(isAuthenticated);
    this.getState.pipe(take(1)).subscribe((state) => {
      this.isAuthenticated = state
    });
    
    this.userState.pipe(take(1)).subscribe((user) => {
      this.user = user
       this.can_create_customers = user.can_create_customer
    });

    this.fetchCustomers()
    this.paginateSubscription()
   
     
    }

    

    // pushNextBatch() {
    //   console.log("Prepaidbatch ", self.prepaidcustomers)
    //   const end = Math.min(self.index + self.batch, self.prepaidcustomers?.length);
    //   // self.customers$ = of(self.prepaidcustomers?.slice(self.index, end)) ;
    //   const slicedArray$ = of(self.prepaidcustomers?.slice(self.index, end));

    //   // Use the merge operator to combine the observables
    //   console.log(self.customers$,slicedArray$)
    //   self.customers$ = merge(self.customers$, slicedArray$);
            
    //   // Process batchItems or do whatever you need with them
    //   console.log('Batch:', self.customers$);

    //   self.index += self.batch;

    //   if (self.index < self.prepaidcustomers?.length) {
    //     setTimeout(self.pushNextBatch, self.interval);
    //   } else {
    //     console.log('All items processed.');
    //   }
    // }


    fetchCustomers(){
      this.customerService.fetchcustomers('postpaid').pipe(take(1)).subscribe((response)=>{
        if(response.status){
              this.spinnerService.hideSpinner()      
              this.sharedService.setActiveCustomerPage('postpaid')
              this.customersType = 'postpaid'
              this.activePage = 'postpaid'
              this.prepaidcustomers = response.data
              this.customers$ = of(response.data.slice(0,50))
              // this.pushNextBatch()
              
              console.log("NGONINIT Postpaid customers ===> ",response)
              this.ems_total_customers = response.total_customers
              this.sharedService.setSpinnerText('Processing data...')  
              this.paginationService.setLinks(response.next,response.last,'postpaidcustomers')  
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
              throw new Error("Server returned false status for fetch Ems Customers")
          }
      },
      ((error)=>{
             this.spinnerService.hideSpinner()
            this.customerService.swapCustomerlist([])
            Swal.fire({
                position: 'top-end',
                icon: 'error',
                title: `Customers!`,
                text:`Could not fetch postpaid customers`,
                showConfirmButton: false,
                timer: 1500
            })
        
        })
      )
    }


    paginateSubscription(){
      this.paginationService.dataEvent.subscribe((response: any) => {
        if(response.status){
          this.paginationService.setLinks(
                                          response.next,
                                          response.last,
                                          'postpaidcustomers',
                                          response.query,
                                          this.is_search
                                          )
          console.log("Postpaid customers ===> ", response.data)
          this.customers$ = of(response.data)
        }
        else{this.customers$ = of([])}
      });
    }

    searchBarFilter($event){
    
      var searchBar:any = document.querySelector('#cmp-search-customer-input')
      if(searchBar){
        let searchBarValue = searchBar.value.trim();
        if (searchBarValue.trim().length > 0){
            //Dispatch deepSearch service here
            let payload = {activePage:'postpaid',fieldName:$event.target.name,q:[searchBarValue]}
            const parentElement = document.getElementById('ems-search-status');
            this.spinnerService.showSpinner(parentElement);
            this.sharedService.setSpinnerText('Processing your request')
            this.customerService.deepEmsFetchCustomers(payload).pipe(take(1)).subscribe((response)=>{
                if(response.status){
                  this.noResults = false;
                  this.convertTableService.clearTablefn()
                  // this.customers$ = of([{}])
                  this.ems_total_customers = response.count
                  this.customers$ = of(response.data)
                  this.cdr.detectChanges()
                  this.paginationService.setLinks(response?.next,response?.last,'postpaidcustomers')
                  this.spinnerService.hideSpinner()
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
                    this.ecmi_total_customers = 0
                    this.paginationService.setLinks(response?.next,response?.last,'prepaidcustomers')
                  }
                  
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

    loadPrepaid(){
      this.sharedService.navigateWithParams('/customers/prepaid',{})
    }

    loadScript(src) {
      const script = this.renderer.createElement('script');
      script.type = 'text/javascript';
      script.src = src;
      this.renderer.appendChild(document.body, script);
    }

    receivePaginationData(response){
      console.log(response)
      this.customers$ = of(response?.data) || []
    }
 
  loadCustomerInformation($event,accountno,meterno,accounttype){
    let base = `customer/information/basic-information`
    const queryParams = {accountno : accountno, accounttype: 'postpaid',meterno:meterno };
    this.sharedService.navigateWithParams(base,queryParams)
  }

  openCustomerCreateForm(externalInstance=false){
    this.createCustomerForm(externalInstance).then((status)=>{
        document.getElementById('create_customer').classList.add("content-active")
      document.getElementById('create_customer').classList.add("content-active")
      
    })
    this.sharedService.setFormHeader(['create','Create Awaiting Customer','postpaid',''])
    this.mode = 'create'
    
  }

  forceUpdate($event){

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
    
    self.openCustomerCreateForm(aprovalexternalInstance)//Bug
 
    if(aprovalexternalInstance == false){
      self.sharedService.setFormHeader(['edit','Update Existing Customer','postpaid',self.currentAccountno])
    }
    else{
      self.sharedService.setFormHeader(['edit','Update Declined Customer','postpaid',self.currentAccountno,customerData])
    }
    self.mode = 'edit'
  }

  getRandomColor() {
    if(this.isCallable){
      return Math.floor(Math.random() * 16777215).toString(16);
    }
    
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

  ngAfterViewInit(){
    const parentElement = document.getElementById('ems-table-wrapper');
    console.log("EMS ---------> ", parentElement)
    this.spinnerService.showSpinner(parentElement);
    this.sharedService.setSpinnerText('Fetching data from source...')

    this.isCallable = false

    window.initiateCaad = this.initiateCaad
    window.openCustomerUpdateForm = this.openCustomerUpdateForm
    self = this //make this class instance available to the window object by storing in variable
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
    const parentElement = document.getElementById('ems-search-status');
    console.log("---------> ", parentElement)
    this.spinnerService.showSpinner(parentElement);
    this.sharedService.setSpinnerText('Processing your request')
    this.customerService.advancedFilterEmsCustomers(this.filter).pipe(take(1)).subscribe((response)=>{
      if(response.status){
        // this.customerService.swapCustomerlist(response)
        this.noResults = false;
        console.log(response)
        this.convertTableService.clearTablefn()
        // this.customers$ = of([{}])
        this.ems_total_customers = response.data.length
        this.customers$ = of(response.data)
        this.cdr.detectChanges()
        this.paginationService.setLinks(response?.next,response?.last,'postpaidcustomers')
        this.spinnerService.hideSpinner()
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
        this.ecmi_total_customers = 0
        this.paginationService.setLinks(response?.next,response?.last,'prepaidcustomers')
      }
      
      
   })
  }

  initiateCaad(accountno){
    let cdrbtn:any = document.querySelector("#cdrbtn")

    self.customerService.fetchSinglecustomer({accounttype:'postpaid',accountno:accountno}).pipe(take(1)).subscribe((response) => {
      if(response.status){
        self.customerService.initiateCaad(response.data).pipe(take(1)).subscribe((response)=>{
          console.log(response)
          if(response.status){
            let notification = {type:'success',title:'CAAD Initiation!',
            message:response?.message,
            subMessage:'The RPU for this location will take next steps'}
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

  openDrafts(){
    this.createCustomerForm().then((status)=>{
      document.getElementById('create_customer').classList.add("content-active")
      document.getElementById('creation-draft').click()
    })
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
      this.store.dispatch(new FetchEmsCustomers())
      this.emsCustomersList = this.store.select(emsCustomers);
      this.emsCustomersList$ = this.emsCustomersList.subscribe((data) => {
        this.sharedService.setActiveCustomerPage(activePage)
        this.customers$ = of(data.customers)
        this.ems_total_customers = data.total_customers
        
      });
   
  }

  ngOnDestroy(){
    console.log("EMS Customer component destroyed")
    this.paginationService.setLinks(null,null,'postpaidcustomers')
    this.emsCustomersList$?.unsubscribe()
    this.getCustomerList$?.unsubscribe()
  }



}

