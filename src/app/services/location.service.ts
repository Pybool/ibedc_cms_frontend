import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AppState } from '../basestore/app.states';
import { AuthService } from './auth.service';
import { catchError, timeout } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  user_id;
  constructor(private store: Store<AppState>,private http: HttpClient,private router: Router,private auth: AuthService) { this.user_id = this.auth.getUserFromLocalStorage()?.id; }

  getLocations(){
    return this.http.get<any>(`${environment.api}/cms/admin/locations?cuid=${21}`)
  }

  // nextPage(page){
  //   return this.http.get(`${environment.api}/cms/admin/locations?cuid=${21}&page=${parseInt(page)}`)
  // }
  nextPage(link:number,cmp:string,query:string){
    return this.http.get(`${environment.api}/cms/admin/locations?limit=${environment.paginationLimit}&offset=${(link)}`+query)
        .pipe(
        timeout(environment.requestTimeOut), // Timeout after 20 seconds
        catchError((error) => {
          // Handle errors here
          return throwError('An error occurred while making the request.');
      })
    );
  }

  getSingleLocation(id){
    this.store
  }

  createLocation(payload){
    return this.http.post<any>(`${environment.api}/cms/admin/locations`,payload)
  }
}
