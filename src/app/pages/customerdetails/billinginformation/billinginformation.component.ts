import { Component,Renderer2, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/basestore/app.states';
import { CustomerService } from 'src/app/services/customer.service';
import { SharedService } from 'src/app/services/shared.service';
import { DataTablesModule } from 'angular-datatables';
import { SpinnerService } from 'src/app/services/spinner.service';
import { ConvertTableService } from 'src/app/services/convert-table.service';
import Swal from 'sweetalert2';
import { take } from 'rxjs/operators';

interface CustomWindow extends Window {
  
  waitForElm:(arg1) => any;
  DataTable:(arg1,arg2)=>void;
}

declare let window: CustomWindow;


@Component({
  selector: 'app-billinginformation',
  templateUrl: './billinginformation.component.html',
  styleUrls: ['./billinginformation.component.css']
})
export class BillinginformationComponent implements OnInit {

  public bills = []
  JSON
  message=''
  intervalId
  dtOptions: DataTables.Settings = {};
  noResults = false;
  constructor(private store: Store<AppState>,
    private sharedService:SharedService,
    private route: ActivatedRoute,
    private renderer: Renderer2,
    private customerService:CustomerService,
    private spinnerService:SpinnerService,
    private convertTableService:ConvertTableService) 
  { }

  ngOnInit(): void {
    this.loadScript('https://cdn.datatables.net/responsive/2.3.0/js/dataTables.responsive.js');

    this.route.queryParams.subscribe(params => {
      this.customerService.fetchSingleCustomerBills(params).pipe(take(1)).subscribe((response)=>{
        if (response.status){
          this.bills = response.data
          window.waitForElm('#billswrapper').then((parentElement) => {
            this.spinnerService.showSpinner(parentElement);
            this.sharedService.setSpinnerText('Fetching data from source...')
            this.convertTableService.convertTable({id:'cust_bills'}).then((status)=>{
              const dtButtons = document.querySelectorAll('.dt-button')
              Array.from(dtButtons).forEach((dtButton:any)=>{
                dtButton.style.marginLeft = '5px'
                dtButton.style.marginBottom = '15px'
                dtButton.classList.add('btn')
                dtButton.classList.add('btn-light')
                dtButton.classList.add('btn-outline-light')
              })
             })
          })
        }
        else{
          this.noResults = true
          this.spinnerService.hideSpinner();
          this.message=response.message;
          this.bills = []}
      })
    });
  }

  loadScript(src) {
    const script = this.renderer.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    this.renderer.appendChild(document.body, script);
  }

  ngAfterViewInit(){}
}
