import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs/operators';
import { CustomerService } from 'src/app/services/customer.service';
import { PaginationService } from 'src/app/services/pagination.service';
import { SharedService } from 'src/app/services/shared.service';
import { SpinnerService } from 'src/app/services/spinner.service';
interface CustomWindow extends Window {
  
  waitForElm:(arg1) => any;
  DataTable:(arg1,arg2)=>void;
}

declare let window: CustomWindow;


@Component({
  selector: 'app-energy-readings',
  templateUrl: './energy-readings.component.html',
  styleUrls: ['./energy-readings.component.css']
})
export class EnergyReadingsComponent {
  energyReadings:any = []
  yearCollection:number[] = []
  monthCollection:string[] = []
  filter:any = {}
  eventTypes:any = [
    'DT', 'Feeder', 'Non-MD', 'MD', 'Governments/Organizations'
  ]
  activeEventType = 'DT'
  totalReadingsCount = 0
  constructor(private route: ActivatedRoute, 
    private customerService:CustomerService,
    private paginationService: PaginationService,
    private spinnerService: SpinnerService,
    private sharedService:SharedService){
    for (let year = new Date().getFullYear(); year >= 2000; year--) {
      this.yearCollection.push(year);
    }

    for (let month = 1; month <= 12; month++) {
      const monthString = month.toString().padStart(2, '0'); // Ensure two digits, e.g., "01"
      this.monthCollection.push(monthString);
    }

    this.route.queryParams.subscribe(params => {
      this.filter.msno = params?.msno
    })
    
  }

  ngOnInit(){
    const currentYear = new Date().getFullYear().toString();
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    this.filter.month = currentMonth
    this.filter.year = currentYear
    this.filter.eventType = 'DT'
    this.activeEventType = this.filter.eventType 
    this.filterReadings()
    this.paginateSubscription()
    
  }

  filterReadings(){
    console.log("filter ===> ", this.filter)
    window.waitForElm('#energy-spinner-wrapper').then((parentElement) => {
      this.spinnerService.showSpinner(parentElement);
      this.sharedService.setSpinnerText('Fetching data from source...')
    })
    this.customerService.fetchEnergyReading(this.filter).pipe(take(1))
    .subscribe((response)=>{
      if(response.status){
        this.activeEventType = this.filter.eventType 
        this.energyReadings = response.data
        this.totalReadingsCount = response.total_count
        this.paginationService.setLinks(response?.next,response?.last,'energy',response.query,response.is_search)
      }
      else{
        this.energyReadings = []
        alert(response?.message || "Could not fetch meter readings")
      }
      this.spinnerService.hideSpinner()
    },
    ((error:any)=>{
      this.spinnerService.hideSpinner()
      alert('Something went wrong!')
    }))
    // this.energyReadings = energyResponse.data
    // fetchSingleCustomerEnergyReading
  }

  receivePaginationData(response){
    console.log("Pagination data ",response)
  }
  paginateSubscription(){
    this.paginationService.dataEvent.subscribe((response: any) => {
      if(response.status){
        console.log(response)
        this.paginationService.setLinks(
                                        response.next,
                                        response.last,
                                        'energy',
                                        response.query,
                                        response?.is_search
                                        )
        this.energyReadings = response.data
      }
      else{ this.energyReadings = []}
    });
  }
}
