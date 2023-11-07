import { Observable } from 'rxjs';
import { FetchUsers, LoadUser } from './state/user.actions';
import { UserService } from 'src/app/services/user.service';
import { Component, ComponentFactoryResolver, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { userdata } from './usersdata'
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/basestore/app.states';
import { usersData } from './state/user.selector';
import { UserFilters, UserModifyModel } from '../createuser/models/user';
import { SharedService } from 'src/app/services/shared.service';
import { map, take } from 'rxjs/operators';
import { PaginationService } from 'src/app/services/pagination.service';
import { NotificationService } from 'src/app/services/notification.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { abbreviateName } from '../../../../utils'
import { AuthService } from 'src/app/services/auth.service';
import { UserState } from 'src/app/authentication/state/auth.selector';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit, OnDestroy {

  public dev_perm:boolean = true;
  public usersData = userdata;
  public totalUsers:number = 0
  userListState:Observable<any>;
  usersListObs$:any;
  searchUsers$:any;
  user
  userState
  abbreviateName = abbreviateName
  can_create_customers
  filter = new UserFilters()
  @ViewChild('edituserplaceholder', { read: ViewContainerRef }) placeholder: ViewContainerRef;

  constructor(private store: Store<AppState>,
    private authService: AuthService,
    private userService:UserService,
    private spinnerService: SpinnerService,
    private notificationService: NotificationService,
    private sharedService: SharedService,
    private componentFactoryResolver: ComponentFactoryResolver,
    private paginationService: PaginationService) {
    this.store.dispatch(new FetchUsers());
    this.paginationService.resetPaginator();
    this.userState = this.store.select(UserState); 
   }

  ngOnInit(): void {
    this.userState.pipe(take(1)).subscribe((user) => {
      this.user = user
       this.can_create_customers = user.can_create_customer
    });
    this.sharedService.setActiveSearchInput('users')
    this.userListState = this.store.select(usersData);
    this.userService.fetchusers().pipe(take(1)).subscribe((response) => {
      this.usersData = response.data.users
      this.paginationService.setLinks(response.next,response.last,'users')
      this.userService.storePositions(response.data.user_positions)
      this.totalUsers = response.total_users
      
    })
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
                console.log(response)
                this.spinnerService.hideSpinner()
                this.usersData = response.data?.users
                this.totalUsers = response.data?.users.length
                searchBar.value=''
                this.notificationService.success('Records matching your search criteria were found','Search results found',{})
                this.paginationService.setLinks(response?.next,response?.last,'users')
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

  viewMode(){

  }

  receivePaginationData(response){
    this.usersData = response.data.users
  }

  
  editUserForm(){
    import('./../edituser/edituser.component').then(({ EdituserComponent }) => {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(EdituserComponent);
      const editComponent:any = this.placeholder?.createComponent(componentFactory);
      this.userService.cacheEditComponent(editComponent)
      document.getElementById('edit_user')?.classList.add("content-active")
    });
    

  }
  createUserForm(){
    import('./../createuser/createuser.component').then(({ CreateuserComponent }) => {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(CreateuserComponent);
      this.placeholder?.createComponent(componentFactory);
      document.getElementById('create_user')?.classList.add("content-active")
    });
    
  }

  getItemById(array, id) {
    return array.find(item => item.id === id);
  }

  formatUser(user):any{
    return (
        user.name,
        user.email,
        user.password,
        user.position,
        user.permission_hierarchy,
        user.can_create_customer,
        user.can_approve,
        user.can_approve_caad,
        user.can_manage_2fa,
        user.hq_radio,
        user.region_radio,
        user.bizhub_radio,
        user.service_center_radio,
        user.permissions_hierarchy,
        user.groups,
        user.enable_2fa,
        user.region,
        user.business_unit,
        user.servicecenter
      )

  }

  getSingleUser(id){
    this.userService.getSingleUser(id,this.usersData)
    this.editUserForm()
  }

  submitFilter(){
    console.log(this.filter)
  }

  getResetUser2FA(id){

  }

  getSuspendUser(self){

  }

  logout(){
    this.authService.logout()
    // this.is_authenticated = false;
  }

  resetFilter(){
    this.filter = new UserFilters()
  }

  ngOnDestroy(): void {
    this.searchUsers$?.unsubscribe()
  }

  

}
