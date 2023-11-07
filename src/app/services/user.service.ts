import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserModifyModel } from '../pages/user/createuser/models/user';
import { catchError, timeout } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  singleUser:Observable<any>;
  user_id;
  editComponent;
  positionsData;
  newUserList;
  newUserList$:any = new BehaviorSubject<any>({});
  editComponent$:any = new BehaviorSubject<any>([]);
  positionsData$:any = new BehaviorSubject<any>([]);
  
  constructor(private http: HttpClient,private router: Router) { }

  
 public storePositions(positions){
  this.positionsData = positions
  this.positionsData$.next(this.positionsData)
 }

 public getPositions(){
  return this.positionsData$.asObservable()
 }

  public cacheEditComponent(editComponent){
    this.editComponent = editComponent
    this.editComponent$.next(this.editComponent);
  }

  public getCacheEditComponent(){
    return this.editComponent$.asObservable()
  }

  public destoryEditComponent(){
    this.editComponent.destroy()
    console.log("Edit component destroyed")
  }

  swapUserlist(data){
    this.newUserList = data
    this.newUserList$.next(data)
  }

  public getNewUserList(){
    return this.newUserList$.asObservable()
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

  getSingleUser(id,arr){
    this.user_id = id
    let classUser
    let user = this.getItemById(arr,this.user_id) 
    console.log(user)
  
    classUser = new UserModifyModel(
        user.name,
        user.email,
        user.password,
        user.position,
        user.permission_hierarchy,
        user.can_create_customer,
        user.can_create_user,
        user.can_approve,
        user.can_approve_caad,
        user.can_manage_2fa,
        user.permission_hierarchy,
        user.groups,
        user.enable_2fa,
        user.region,
        user.business_unit,
        user.service_center
    )
    console.log(classUser)
    this.singleUser = classUser
    // this.store.dispatch(new LoadUser(user));
    // console.log(id.value)
    
  }
  
  returnUser(){
    return of({id:this.user_id,user:this.singleUser})
  }

  
  createUser(body: any): Observable<any> {
    return this.http.post(`${environment.api}/userfactory`, body);
    
  }

  updateUser(body: any): Observable<any> {
    // console.log(id)
    return this.http.put(`${environment.api}/userfactory`, body);
    
  }

  fetchMetadata():Observable<any>{
    return this.http.get(`${environment.api}/userform/metadata`);
  }

  fetchUserGroups():Observable<any>{
    return this.http.get(`${environment.api}/admin/usergroups?id=${this.user_id}`);
  }

  fetchServiceCentersAndBusinessHubs(query):Observable<any>{
    return this.http.get(`${environment.api}/locations/getdata?hierarchy=${query.hierarchy}&q=${query.q}`);
  }

  fetchusers():Observable<any>{
    return this.http.get(`${environment.api}/admin/users`)
  }

  searchusers(payload:any):Observable<any>{
    return this.http.get(`${environment.api}/admin/searchusers?q=${payload.q[0]}&loc_type=${payload.fieldName}`)
  }

  fetchUserLocationMetadata(payload){
    return this.http.get(`${environment.api}/userform/metadata?data=${JSON.stringify(payload)}`);
  }

  // nextPage(page){
  //   return this.http.get(`${environment.api}/admin/users?page=${parseInt(page)}`)
  // }

  nextPage(link:number,cmp:string,query:string){
    return this.http.get(`${environment.api}/admin/users?limit=${environment.paginationLimit}&offset=${(link)}`+query)
        .pipe(
        timeout(environment.requestTimeOut), // Timeout after 20 seconds
        catchError((error) => {
          // Handle errors here
          return throwError('An error occurred while making the request.');
      })
    );
  }
}
