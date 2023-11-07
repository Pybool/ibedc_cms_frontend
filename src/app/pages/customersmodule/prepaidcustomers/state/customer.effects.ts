
import Swal from 'sweetalert2';
import { CustomerService } from 'src/app/services/customer.service';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of ,Observable} from "rxjs";
import { CustomerActionTypes, 
        FetchEcmiCustomersSuccess,
        FetchEcmiCustomersFailure,
        DeepFetchEcmiCustomersSuccess,
        DeepFetchEcmiCustomersFailure,
} from './customer.actions';

import { map,catchError } from 'rxjs/operators';
import { Action } from '@ngrx/store';
import { PaginationService } from 'src/app/services/pagination.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { ConvertTableService } from 'src/app/services/convert-table.service';

@Injectable()
export class CustomerEffects {
    private customersService: CustomerService;
    private paginationService: PaginationService;
    private spinnerService: SpinnerService;
    private convertTableService: ConvertTableService;

  constructor() {}

    

    deepFetchCustomers(payload){
        return this.customersService.deepFetchCustomers(payload).pipe(
            map((response) => {
                if(response.status){
                    this.customersService.swapCustomerlist([])
                    this.paginationService.setLinks(response?.next,response?.last,'prepaidcustomers')
                    this.customersService.swapCustomerlist(response)
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
                    return new DeepFetchEcmiCustomersSuccess(response) as Action; // cast to Action
                }
                else{
                    throw new Error("Data was not fetched from server")
                }
            }),
            catchError((error) => {
                this.spinnerService.hideSpinner()
                if (error.name === 'TimeoutError') {
                    alert('The request timed out')
                }
                this.customersService.swapCustomerlist([])
                Swal.fire({
                    position: 'top-end',
                    icon: 'error',
                    title: `Customer Search!`,
                    text:`Could not fetch search results`,
                    showConfirmButton: false,
                    timer: 1500
                })
                return of(new DeepFetchEcmiCustomersFailure({ error: error })) as Observable<Action>; // cast to Observable<Action>
            })
        )
    }
}