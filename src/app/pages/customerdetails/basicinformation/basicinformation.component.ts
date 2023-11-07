import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/basestore/app.states';
import { SharedService } from 'src/app/services/shared.service';
import { ActivatedRoute } from '@angular/router';
import { CustomerService } from 'src/app/services/customer.service';
import { map, take } from 'rxjs/operators';

@Component({
  selector: 'app-basicinformation',
  templateUrl: './basicinformation.component.html',
  styleUrls: ['./basicinformation.component.css']
})
export class BasicinformationComponent implements OnInit {
  customer;
  getCustomer;
  accountno;
  accounttype;
  tariff;
  constructor(private store: Store<AppState>,
              private sharedService:SharedService,
              private route: ActivatedRoute,
              private customerService:CustomerService) 
            { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
        if(params?.search==undefined || params?.search == null){
          this.customerService.fetchSinglecustomer(params).pipe(take(1)).subscribe((response)=>{
            if (response.status){
              this.customer = response.data[0] || response.data
              if(this.customer.tariffid != undefined && this.customer.tariffid != null ){
                this.customerService.fetchTariffCode(this.customer.tariffid,this.customer.accounttype).pipe(take(1)).subscribe((response:any)=>{
                  this.tariff = response?.data
                },
                ((error)=>{

                }))
              }
            }
            else{alert(response.message)}
          })
        }
        else{
          const response = JSON.parse(sessionStorage.getItem('single-searched-customer'))
            if (response.status){
              this.customer = response.data[0] || response.data
              if(this.customer.tariffid != undefined && this.customer.tariffid != null ){
                this.customerService.fetchTariffCode(this.customer.tariffid,this.customer.accounttype).pipe(take(1)).subscribe((response:any)=>{
                  this.tariff = response?.data
                },
                ((error)=>{

                }))
              }              
            }
            else{alert(response.message)} 
        }
    });
    

  }

  ngOnDestroy(){
    sessionStorage.removeItem('single-searched-customer')
  }

}
