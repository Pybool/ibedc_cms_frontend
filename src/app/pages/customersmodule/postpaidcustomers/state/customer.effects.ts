
import { CustomerService } from 'src/app/services/customer.service';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of ,Observable} from "rxjs";
import { CustomerActionTypes, 
        FetchEmsCustomersSuccess,
        FetchEmsCustomersFailure, 
        DeepFetchEmsCustomersSuccess,
        DeepFetchEmsCustomersFailure,} from './customer.actions';

import { map,catchError, switchMap, tap } from 'rxjs/operators';
import { Action } from '@ngrx/store';
import { PaginationService } from 'src/app/services/pagination.service';
import Swal from 'sweetalert2';
import { SpinnerService } from 'src/app/services/spinner.service';
import { ConvertTableService } from 'src/app/services/convert-table.service';
import { PostpaidCustomerService } from 'src/app/services/postpaidcustomer.service';

@Injectable()
export class EmsCustomerEffects {

  constructor(
    private actions$: Actions,
    private customersService: PostpaidCustomerService,
    private paginationService: PaginationService,
    private spinnerService: SpinnerService,
     private convertTableService: ConvertTableService
  ) {}

FetchEmsCustomersSuccess$= createEffect(() => 

this.actions$.pipe(
    ofType(CustomerActionTypes.FETCH_EMS_CUSTOMERS_SUCCESS),
    tap((data:any) => {
        
    })
),
{ dispatch: false }
)

FetchEmsCustomersFailure$= createEffect(() => 

this.actions$.pipe(
    ofType(CustomerActionTypes.FETCH_EMS_CUSTOMERS_FAILURE)
),
{ dispatch: false }
)

DeepFetchEmsCustomersSuccess$= createEffect(() => 

    this.actions$.pipe(
        ofType(CustomerActionTypes.DEEP_FETCH_EMS_CUSTOMERS_SUCCESS),
        tap((data:any) => {
            this.spinnerService.hideSpinner()
        })
    ),
    { dispatch: false }
)

DeepFetchEmsCustomersFailure$= createEffect(() => 

    this.actions$.pipe(
        ofType(CustomerActionTypes.DEEP_FETCH_EMS_CUSTOMERS_FAILURE)
    ),
    { dispatch: false }
)

LoadEmsCustomerSuccess$= createEffect(() => 

    this.actions$.pipe(
        ofType(CustomerActionTypes.LOAD_EMS_CUSTOMER_SUCCESS),
        tap((signup:any) => {
        })
    ),
    { dispatch: false }
)

LoadEmsCustomerFailure$= createEffect(() => 

    this.actions$.pipe(
        ofType(CustomerActionTypes.LOAD_EMS_CUSTOMER_FAILURE)
    ),
    { dispatch: false }
)


FetchEmsCustomers$= createEffect(() => 
    this.actions$.pipe(
        ofType(CustomerActionTypes.FETCH_EMS_CUSTOMERS),
        map((action: any) => action.payload),
        switchMap(payload => {
            console.log("Postpaid called")
            return this.customersService.fetchcustomers('postpaid').pipe(
                map((response) => {
                    if(response.status){
                    this.spinnerService.hideSpinner()        
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
                        return new FetchEmsCustomersSuccess(response) as Action; // cast to Action
                    }
                    else{
                        throw new Error("Server returned false status for fetch Ems Customers")
                    }
                }),
                catchError((error) => {
                    this.spinnerService.hideSpinner()
                    this.customersService.swapCustomerlist([])
                    Swal.fire({
                        position: 'top-end',
                        icon: 'error',
                        title: `Customers!`,
                        text:`Could not fetch postpaid customers`,
                        showConfirmButton: false,
                        timer: 1500
                    })
                    return of(new FetchEmsCustomersFailure({ error: error })) as Observable<Action>; // cast to Observable<Action>
                })
            )
            
            
        })
    )
)


DeepFetchEmsCustomers$= createEffect(() => 
    this.actions$.pipe(
        ofType(CustomerActionTypes.DEEP_FETCH_EMS_CUSTOMERS),
        map((action: any) => action.payload),
        switchMap(payload => {
            return this.customersService.deepEmsFetchCustomers(payload).pipe(
                map((response) => {
                    if(response.status){
                        this.customersService.swapCustomerlist(response)
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
                        return new DeepFetchEmsCustomersSuccess(response) as Action; // cast to Action
                    }
                    else{
                        throw new Error("Server returned false status for fetch Ems Customers")
                    }
                }),
                catchError((error) => {
                    this.spinnerService.hideSpinner()
                    this.customersService.swapCustomerlist([])
                    Swal.fire({
                        position: 'top-end',
                        icon: 'error',
                        title: `Customers!`,
                        text:`Could not fetch prepaid customers`,
                        showConfirmButton: false,
                        timer: 1500
                    })
                    return of(new DeepFetchEmsCustomersFailure({ error: error })) as Observable<Action>; // cast to Observable<Action>
                })
            )
        })
    )
)



}