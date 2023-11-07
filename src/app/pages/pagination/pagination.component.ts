import { Component, ElementRef, EventEmitter, OnDestroy, Output, Renderer2 } from '@angular/core';
import { take } from 'rxjs/operators';
import { BillingService } from 'src/app/services/billing.service';
import { CaadService } from 'src/app/services/caad.service';
import { ConvertTableService } from 'src/app/services/convert-table.service';
import { CrmdService } from 'src/app/services/crmd.service';
import { CustomerService } from 'src/app/services/customer.service';
import { PostpaidCustomerService } from 'src/app/services/postpaidcustomer.service';
import { LocationService } from 'src/app/services/location.service';
import { PaginationService } from 'src/app/services/pagination.service';
import { PaymentsService } from 'src/app/services/payments.service';
import { SharedService } from 'src/app/services/shared.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { UserService } from 'src/app/services/user.service';


@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css']
})
export class PaginationComponent implements OnDestroy{
  links: Array<any> = [];
  currentPage: number = 1;
  totalPages: number = 0;
  currentIndex:any
  displayedPages:any = []
  showLoadMoreButton:boolean = true
  activateLessButton:boolean = false
  firstrun = true
  cap = 2000
  isCallable = true
  paginator$ :any
  idx:any
  showLessClicked:any
  blocks = this.generateMultiplesOfThree(0,400)
  constructor(private paginationService: PaginationService,
    private elRef: ElementRef, private renderer: Renderer2,private crmdService: CrmdService,
    private customerService: CustomerService,private convertTableService: ConvertTableService,
    private spinnerService: SpinnerService,private sharedService: SharedService,
    private billingService: BillingService, private paymentService: PaymentsService,
    private usersService: UserService,private caadService: CaadService,
    private locationService: LocationService,private postPaidCustomerService: PostpaidCustomerService)  {
      localStorage.removeItem('pageidx')
  }


  generateMultiplesOfThree(start = 0, stop = 0, chunk = 400) {
    if (stop > start) {
      chunk = stop - start;
    }
    const len = Math.round(chunk / 3);
    const numbers = new Array(len);
    for (let i = 0; i < len; i++) {
      numbers[i] = (i * 3) + start;
    }
    return numbers;
  }

  ngOnInit() {

    this.paginator$ = this.paginationService.generateLinks$().subscribe((response:any)=>{
      console.log(response)
      this.links = response.links
      this.idx = localStorage.getItem('pageidx')
      
      if(this.idx){
        this.idx = parseInt(this.idx)
      }
      else{
        this.idx =4
      }
      this.displayedPages = this.links?.slice(0, this.idx); // Display the first 5 links initially.
      this.currentIndex = this.idx;
      this.showLessClicked = false;
      try{
        // this.displayedPages = this.links.slice(0,5)
        this.currentPage = this.paginationService.getCurrentPage();
        this.totalPages = this.paginationService.getTotalPages();
      }
      catch{}
    });    
  }

  ngAfterViewInit() {
    // this.scrollContainer = this.elRef.nativeElement.querySelector('.scroll-container');
  }

  onScroll(event) {
    const element = event.target;
    if ((Math.round(element.scrollHeight - element.scrollTop) - element.clientHeight) < 2) { // This works for exact precision Math.round(element.scrollHeight - element.scrollTop) === element.clientHeight
      this.loadMoreItems();
    }
  }

  getSiblings = (node: any) => [...node.parentNode.children].filter(c => c !== node)

  private sendPaginationData(data:any){
    this.paginationService.dataEvent.emit(data);
  }

  private getlinkQuery(link:number){
    const linkObj:any = this.links.find(x => x.page === link);
    return linkObj?.query
  }


  nextPage($event:any,link:any,cmp:string){
    // this.spinnerService.setSpinner(true)
    const table:any = document.querySelector('table')
    if (table){
      table.style.opacity = '0'
    }
    let tids = {
      'prepaidcustomers':'table-wraps',
      'postpaidcustomers':'ems-table-wrapper',
      'billing':'billingswrapper',
      'prepaidpayments':'paymentswrapper',
      'postpaidpayments':'paymentswrapper',
      'todayprepaidpayments':'prepaid-collections-wrapper',
      'todaypostpaidpayments':'postpaid-collections-wrapper',
      'users':'spinner-wrapper',
      'locations':'spinner-wrapper',
      'crmd':'spinner-wrapper',
      'caad':'spinner-wrapper',
      'energy':'energy-spinner-wrapper'
    }
    const parentElement = document.getElementById(tids[cmp]);
    this.spinnerService.showSpinner(parentElement);
    this.sharedService.setSpinnerText('Updating table..')

    const services = {'prepaidcustomers':{$:this.customerService.nextPage(parseInt(link),cmp,this.getlinkQuery(link),'prepaid',false)},
                      'postpaidcustomers':{$:this.postPaidCustomerService.nextPage(parseInt(link),cmp,this.getlinkQuery(link),'postpaid',false)},
                      'crmd':{$:this.crmdService.nextPage(parseInt(link),cmp,this.getlinkQuery(link))},
                      'energy':{$:this.customerService.nextEnergyPage(parseInt(link),this.getlinkQuery(link))},
                      'caad':{$:this.caadService.nextPage(parseInt(link),cmp,this.getlinkQuery(link))},
                      'billing':{$:this.billingService.nextPage(parseInt(link),cmp,this.getlinkQuery(link))},
                      'prepaidpayments':{$:this.paymentService.nextPage(parseInt(link),cmp,this.getlinkQuery(link),'prepaidpayments')},
                      'postpaidpayments':{$:this.paymentService.nextPage(parseInt(link),cmp,this.getlinkQuery(link),'postpaidpayments')},
                      'todayprepaidpayments':{$:this.paymentService.nextPage(parseInt(link),cmp,this.getlinkQuery(link),'todayprepaidpayments')},
                      'todaypostpaidpayments':{$:this.paymentService.nextPage(parseInt(link),cmp,this.getlinkQuery(link),'todaypostpaidpayments')},
                      'users':{$:this.usersService.nextPage(parseInt(link),cmp,this.getlinkQuery(link))},
                      'locations':{$:this.locationService.nextPage(parseInt(link),cmp,this.getlinkQuery(link))}
                    
                    }
                          
      services[cmp].$.pipe(take(1)).subscribe(
        (response:any)=>{
          console.log(response)
          if(cmp=='energy'){
            this.sendPaginationData(response)
          }
          try{
            this.convertTableService.clearTablefn()
            this.convertTableService.convertTable({id:parentElement.querySelector('table').id}).then((status)=>{
              if(status){
                const dtButtons = document.querySelectorAll('.dt-button')
                Array.from(dtButtons).forEach((dtButton:any)=>{
                  dtButton.style.marginLeft = '5px'
                  dtButton.style.marginBottom = '15px'
                  dtButton.classList.add('btn')
                  dtButton.classList.add('btn-light')
                  dtButton.classList.add('btn-outline-light')
                })
              }
            })
            this.sendPaginationData(response)
            
          }
          catch(err){this.sendPaginationData(response)}
          
          setTimeout(()=>{
            const nodes = document.querySelectorAll('li.page-item')
            nodes.forEach((link)=>{
              link.classList.remove('active')
            })
            nodes[link-1].classList.add('active')
            this.spinnerService.hideSpinner()
          },700)
          
        },
        
        (error: any) => {
          // this.spinnerService.setSpinner(false)
          alert("Something went wrong!\n\nP.S: Note that the data on this page did not change!")
        }
      )
    
  }

  loadMoreItems() {
    // call your function here to load more items
    if(this.isCallable){
    const last = this.blocks[this.blocks.length - 1]
    if(last+403 < this.cap){
      this.blocks =this.blocks.concat(this.generateMultiplesOfThree(last+3,last+3 + 400))
    }
    else{ //not working
      this.blocks =this.blocks.concat(this.generateMultiplesOfThree(last+3,last+3 + this.cap-last))
      this.blocks = this.removeElementsAfter(this.blocks,this.cap)
      this.isCallable = false
    }
    }
  }

  removeElementsAfter(array:any, element:any) {
    const index = array.indexOf(element);
    if (index !== -1) {
      array.splice(index + 1);
    }
    return array;
  }

  setPage(pageNumber: number) {
    this.paginationService.setPage(pageNumber);
    this.currentPage = this.paginationService.getCurrentPage();
  }

  loadMoreLinks() {
    
    const nextBatch = this.links.slice(this.currentIndex, this.currentIndex + 4);
    this.displayedPages = this.displayedPages.concat(nextBatch);
    this.currentIndex += nextBatch.length;
    localStorage.setItem('pageidx',this.currentIndex)
    // If all links are displayed, hide the "Show More" button.
    if (this.currentIndex >= this.links.length) {
      this.showLessClicked = true;
    }
  }

  showLessLinks() {
    this.displayedPages = this.displayedPages.slice(0, this.displayedPages.length - 4);
    this.currentIndex = this.displayedPages.length;
    this.showLessClicked = false;
    localStorage.setItem('pageidx',this.currentIndex)
  }
  

ngOnDestroy(){
  this.paginator$.unsubscribe()
}
}
