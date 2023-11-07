import { Component, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs/operators';
import { ConvertTableService } from 'src/app/services/convert-table.service';
import { CustomerComplaintsService } from 'src/app/services/customercomplaints.service';
import { SharedService } from 'src/app/services/shared.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import Swal from 'sweetalert2';

interface CustomWindow extends Window {
  
  waitForElm:(arg1) => any;
  DataTable:(arg1,arg2)=>void;
}
declare let window: CustomWindow;

@Component({
  selector: 'app-complaintsinformation',
  templateUrl: './complaintsinformation.component.html',
  styleUrls: ['./complaintsinformation.component.css']
})
export class ComplaintsinformationComponent implements OnInit {
  public noResults:boolean;
  public message:string;
  public complaints:any[] = []
  constructor(private complaintsService: CustomerComplaintsService,
              private route: ActivatedRoute,
              private renderer: Renderer2,
              private sharedService:SharedService,
              private spinnerService:SpinnerService,
              private convertTableService:ConvertTableService
              ) { }

  ngOnInit(): void {
    this.loadScript('https://cdn.datatables.net/responsive/2.3.0/js/dataTables.responsive.js');
    this.route.queryParams.subscribe(params => {
      console.log("Account details ===> ", params)
      this.complaintsService.fetchComplaints(params.accountno).pipe(take(1)).subscribe((response)=>{
        if (response.status){
          console.log(response)
          this.complaints = response.data
          window.waitForElm('#complaintswrapper').then((parentElement) => {
            this.spinnerService.showSpinner(parentElement);
            this.sharedService.setSpinnerText('Fetching data from source...')
            this.convertTableService.convertTable({id:'cust_complaints'}).then((status)=>{
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
          console.log(response.status)
          this.noResults = true
          Swal.fire({
            position: 'top-end',
            icon: 'error',
            title: `Customer billing!`,
            text:`${response?.message}`,
            showConfirmButton: false,
            timer: 1500
          })
          this.spinnerService.hideSpinner();
          this.message=response.message;
          this.complaints = []}
      })
    })
    
  }

  receivePaginationData($event){
    
  }

  loadScript(src) {
    const script = this.renderer.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    this.renderer.appendChild(document.body, script);
  }

}
