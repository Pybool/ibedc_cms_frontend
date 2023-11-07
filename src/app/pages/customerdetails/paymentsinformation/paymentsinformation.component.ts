import { Component, OnInit, Renderer2 } from '@angular/core';
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
import { PaginationService } from 'src/app/services/pagination.service';


interface CustomWindow extends Window {
  
  waitForElm:(arg1) => any;
  DataTable:(arg1,arg2)=>void;
}

declare let window: CustomWindow;

@Component({
  selector: 'app-paymentsinformation',
  templateUrl: './paymentsinformation.component.html',
  styleUrls: ['./paymentsinformation.component.css']
})
export class PaymentsinformationComponent implements OnInit {
  payments:any = []
  accounttype;
  message
  dtOptions: DataTables.Settings = {};
  intervalId
  noResults = false
  constructor(private store: Store<AppState>,
    private sharedService:SharedService,
    private route: ActivatedRoute,
    private customerService:CustomerService,
    private renderer: Renderer2,
    private spinnerService: SpinnerService,
    private convertTableService:ConvertTableService,
    private paginationService: PaginationService) 
  { }

  ngOnInit(): void {
    this.loadScript('https://cdn.datatables.net/responsive/2.3.0/js/dataTables.responsive.js');
    this.route.queryParams.subscribe(params => {
        this.accounttype=params?.accounttype
        window.waitForElm('#payments-spinner-wrapper').then((parentElement) => {
          this.spinnerService.showSpinner(parentElement);
          this.sharedService.setSpinnerText('Fetching data from source...')
        })
        
        this.customerService.fetchSingleCustomerPayments(params).pipe(take(1)).subscribe((response)=>{
          if (response.status){
            let paginationTag = 'single-customer-ecmi-payments'
            if(this.accounttype=='postpaid'){paginationTag = 'single-customer-ems-payments'}
            this.paginationService.setLinks(response.next,response.last,paginationTag)
            this.payments = response.data
            console.log(this.payments)
            
              this.convertTableService.convertTable({id:'customer_payment_history'}).then((status)=>{
                const dtButtons = document.querySelectorAll('.dt-button')
        
                Array.from(dtButtons).forEach((dtButton:any)=>{
                  dtButton.style.marginLeft = '5px'
                  dtButton.style.marginBottom = '15px'
                  dtButton.classList.add('btn')
                  dtButton.classList.add('btn-light')
                  dtButton.classList.add('btn-outline-light')
                })
               })
          }
          else{
            this.noResults = true;
            Swal.fire({
              position: 'top-end',
              icon: 'error',
              title: `Customer payments!`,
              text:`${response?.message}`,
              showConfirmButton: false,
              timer: 1500
            })
              this.spinnerService.hideSpinner();
               this.message=response.message;this.payments = false
              }
        })
    });
  }

  loadScript(src) {
    const script = this.renderer.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    this.renderer.appendChild(document.body, script);
  }

  ngAfterViewInit(){
    
    
    
  }

}
