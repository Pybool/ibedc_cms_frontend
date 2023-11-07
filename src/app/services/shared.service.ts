import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { BillingScripts } from '../pages/billing/scripts';
import { Customers } from '../pages/customersmodule/prepaidcustomers/script';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  public searchInputs = ['customers','payments','billings','users','locations']
  public activeSearchInput$:any = new BehaviorSubject<string>('customers');
  public activeCustomerPage$:any = new BehaviorSubject<string>('prepaid');
  public FormHeader$:any = new BehaviorSubject<any[]>(['create','Create Customer','prepaid','',''])
  public dualSearch$:any = new BehaviorSubject<boolean>(false)
  activeInput;
  dualSearch:boolean;
  activeCustomerPage;
  spinnerText:string;
  spinnerText$:any = new BehaviorSubject<string>('Loading');
  constructor(private router: Router) { }

  public activateDualSearch(state){
    this.dualSearch = state
    this.dualSearch$.next(state)
  }

  public getDualSearchState(){
    return this.dualSearch$.asObservable()
  }

  public setActiveSearchInput(input){
    this.activeInput = input
    this.activeSearchInput$.next(this.activeInput);
  }

  public getActiveSearchInput(){
    return this.activeSearchInput$.asObservable()
  }

  public setActiveCustomerPage(activePage){
    this.activeCustomerPage = activePage
    this.activeCustomerPage$.next(this.activeCustomerPage);
  }

  public getActiveCustomerPage(){
    return this.activeCustomerPage$.asObservable()
  }

  public setFormHeader(header){
    if(header.length == 5 && header[1].includes('Declined')){
      this.FormHeader$.next(header[4]);
    }
    else{
      this.FormHeader$.next(header);
    }
    
  }

  public getFormHeader(){
    return this.FormHeader$.asObservable()
  }

  public searchCustomer($event){
    let customers = new Customers()
    customers.searchCustomer($event)
  }

  public shallowSearchBilling($event){
    let billingScript = new BillingScripts()
    billingScript.shallowSearchBilling($event)
  }

  public setSpinnerText(input){
    this.activeInput = input
    this.spinnerText$.next(this.activeInput);
  }

  public getSpinnerText(){
    return this.spinnerText$.asObservable()
  }

  public tableExports(idx) {
    const nodes:any = document.getElementsByClassName('dt-button')
    nodes[idx].click()
 }

  public navigateWithParams(base, params: {[key: string]: any}) {
  
    const queryParams = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
    const url = `/${base}?${queryParams}`;
    console.log(url)
    this.router.navigateByUrl(url);
  }

  public generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();//Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return of('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if(d > 0){//Use timestamp until depleted
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    }))
  }

  public generateUUIDStr() { // Public Domain/MIT
    var d = new Date().getTime();//Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return ('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if(d > 0){//Use timestamp until depleted
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    }))
  }


}
