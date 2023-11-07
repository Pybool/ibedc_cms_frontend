import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { environment } from 'src/environments/environment';
import { AppState } from '../basestore/app.states';
import { catchError, timeout } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private store: Store<AppState>,private http: HttpClient,private router: Router) { }

  fetchAccountsFeedersAndRecentPayments(payload){
    return this.http.get<any>(`${environment.api}/dashboard/account_types/feeders/recentpayments?period=${payload.period}&cuid=${payload.cuid}&end_date=${payload.end_date}&start_date=${payload.start_date}`)
    .pipe(
        timeout(environment.requestTimeOut), // Timeout after 20 seconds
        catchError((error) => {
          // Handle errors here
          return throwError('An error occurred while making the request.');
      })
    )
  }

  fetchTodaysCollectionsAndMeteringStatistics(payload){
    return this.http.get<any>(`${environment.api}/dashboard/todayscols/meteringstatistics?period=${payload.period}&cuid=${payload.cuid}&end_date=${payload.end_date}&start_date=${payload.start_date}`)
    .pipe(
      timeout(environment.requestTimeOut), // Timeout after 20 seconds
      catchError((error) => {
        // Handle errors here
        return throwError('An error occurred while making the request.');
    })
  )
  }

  fetchCollectionStatisticsAndOpsmanager(payload){
    return this.http.get<any>(`${environment.api}/dashboard/opsmanager/collections_statistics?period=${payload.period}&cuid=${payload.cuid}&end_date=${payload.end_date}&start_date=${payload.start_date}`)
    .pipe(
      timeout(environment.requestTimeOut), // Timeout after 20 seconds
      catchError((error) => {
        // Handle errors here
        return throwError('An error occurred while making the request.');
    })
  )
  }

}
