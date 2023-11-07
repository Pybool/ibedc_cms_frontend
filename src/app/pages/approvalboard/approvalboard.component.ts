import { Component, ComponentFactoryResolver, Injector, OnInit, Renderer2, ViewChild, ViewContainerRef } from '@angular/core';
import { take } from 'rxjs/operators';
import { ApprovalBoardService } from 'src/app/services/approvalboard.service';
import { ConvertTableService } from 'src/app/services/convert-table.service';
import { SharedService } from 'src/app/services/shared.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import {download, exportSingle, exportMultiple} from './record.exporter.js'
import Swal from 'sweetalert2';
import { CustomersComponent } from '../customersmodule/prepaidcustomers/customers.component';
import { PostpaidcustomersComponent } from '../customersmodule/postpaidcustomers/postpaidcustomers.component';


var selfClass;

interface CustomWindow extends Window {
  
  waitForElm:(arg1) => any;
  DataTable:(arg1,arg2)=>void;
}

declare let window: CustomWindow;

@Component({
  selector: 'app-approvalboard',
  templateUrl: './approvalboard.component.html',
  styleUrls: ['./approvalboard.component.css']
})
export class ApprovalboardComponent implements OnInit {
  exportData:any[] = []
  customers:any[] = []
  active:string = ''
  exportAccountNo:string;
  counts:any;
  ecmiCustomerComponentInstance:any;
  emsCustomerComponentInstance:any;
  @ViewChild('createcustomerplaceholder', { read: ViewContainerRef }) createplaceholder: ViewContainerRef;
  constructor(
    private sharedService:SharedService,
    private renderer: Renderer2,
    private spinnerService:SpinnerService,
    private convertTableService:ConvertTableService,
    private approvalBoardService: ApprovalBoardService,
    private resolver: ComponentFactoryResolver,
    private injector: Injector)  { }

  ngOnInit(): void {
    
    this.loadScript('https://cdn.datatables.net/responsive/2.3.0/js/dataTables.responsive.js');
    this.loadMutlipleScripts()
    this.approvalBoardService.fetchApprovalBoardCounts(1).pipe(take(1)).subscribe((response)=>{
      console.log(response)
      this.counts = response?.data
    })
    window['editDeclinedCustomer'] = this.editDeclinedCustomer

    const customerComponentFactory = this.resolver.resolveComponentFactory(CustomersComponent)
    const emsCustomerComponentFactory = this.resolver.resolveComponentFactory(PostpaidcustomersComponent)
    this.ecmiCustomerComponentInstance = customerComponentFactory.create(this.injector)
    this.emsCustomerComponentInstance = emsCustomerComponentFactory.create(this.injector)
    
    
  }

  ngAfterViewInit(){
    selfClass = this
  }

  getPendingCustomers($event,action){
    this.active = action
    console.log(Object.keys($event.target))
    const tabs:any = document.querySelectorAll('.cardtab')

    tabs.forEach((tab)=>{
      tab.style.borderBottom = "thick solid #FFFFFF"
    })
    $event.target.closest('.cardtab').style.borderBottom = "thick solid #FF7518"
    const idsObj = {'pending':'pending_edits_widget_history_table','approved':'approved_edits_widget_history_table','declined':'declined_edits_widget_history_table'}
    this.approvalBoardService.fetchPendingCustomers(action).pipe(take(1)).subscribe((response)=>{
      this.customers = response.data
      console.log("Pending customers ",this.customers)
      const tableWidget:any = document.querySelector(`#${idsObj[action]}`)
      tableWidget.style.display = 'block'
      window.waitForElm('#pendingcustwrapper').then((parentElement) => {
        // this.spinnerService.showSpinner(parentElement);
        // this.sharedService.setSpinnerText('Fetching data from source...')
        this.convertTableService.convertTable({id:idsObj[action]}).then((status)=>{
          if (status){
              const dtButtons = document.querySelectorAll('.dt-button')
              Array.from(dtButtons).forEach((dtButton:any)=>{
                dtButton.style.marginLeft = '5px'
                dtButton.style.marginBottom = '15px'
                dtButton.classList.add('btn')
                dtButton.classList.add('btn-light')
                dtButton.classList.add('btn-outline-light')
              })
          }
          else{}
        })
        
      })
    },
    ((error)=>{
      alert("Something went wrong")
    })
    )
  }

  loadScript(src) {
    const script = this.renderer.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    this.renderer.appendChild(document.body, script);
  }

  hightlightAllRows(){
    this.exportData = []
    const rows = document.querySelectorAll(".export-table-check");
    rows.forEach((row:any) => {
      if(row.id != 'pending-all' && row.id != 'approved-all' && row.id != 'declined-all'){
        row.checked = true;
        this.highlightRowMulti(row);
      }
    });
  }

  highlightRowMulti(e){
    const self = e
    const bgColor = String($(self).closest('tr').css('backgroundColor'))
    console.log(bgColor,$(self).is(':checked'))
    if(bgColor != 'rgb(135, 206, 250)' && $(self).is(':checked')){
        $(self).closest('tr').css("background-color", "rgb(135, 206, 250)");
        $(self).closest('tr').find('td').each((col,td)=>{
            $(td).css("background-color", "rgb(135, 206, 250)");
            $(td).css("color", "rgb(255, 255, 255)");
        })
    }
    
    else{
      self.checked=false;
        $(self).closest('tr').css("background-color", "rgb(255, 255, 255)");
        $(self).closest('tr').find('td').each((col,td)=>{
            $(td).css("background-color", "rgb(255, 255, 255)");
            $(td).css("color", "#8094ae");
        })
    }
    this.buildExportData(e)
    
}

  highlightRow(e){
    const self = e.target
    e.stopPropagation()
    const bgColor = String($(self).closest('tr').css('backgroundColor'))
    if(bgColor != 'rgb(135, 206, 250)' && $(self).is(':checked')){
        $(self).closest('tr').css("background-color", "rgb(135, 206, 250)");
        $(self).closest('tr').find('td').each((col,td)=>{
            $(td).css("background-color", "rgb(135, 206, 250)");
            $(td).css("color", "rgb(255, 255, 255)");
        })
    }
    
    else{
        $(self).closest('tr').css("background-color", "rgb(255, 255, 255)");
        $(self).closest('tr').find('td').each((col,td)=>{
            $(td).css("background-color", "rgb(255, 255, 255)");
            $(td).css("color", "#8094ae");
        })
    }
    this.buildExportData(self)
    
}

download($event,id,accountno){
  this.exportAccountNo = accountno
  download(id,accountno)
}

exportSingle(type){
  this.approvalBoardService.getSingleCustomer(this.exportAccountNo,this.active).pipe(take(1)).subscribe((response)=>{
    if(response.status){
      exportSingle(type,response.data,this.getfileName(this.active))
    }
  })
}

buildExportData($event){ //Called by Checkbox
  const awaitingCustomers = this.approvalBoardService.awaitingCustomers
  const id = parseInt($event.id.replace(/[^0-9]/g, ''));
  const customer = awaitingCustomers.find(obj => obj.id === id);
  const exists = this.exportData.some(obj => obj.id === id);
  if(exists){
    this.exportData = this.exportData.filter(obj => obj.id !== id)
  }
  else{
    this.exportData.push(customer)
  }
}

resetExporter(){
  const rows = document.querySelectorAll(".export-table-check");
    rows.forEach((row:any) => {
      row.checked = false;      
    });
  this.exportData = []
  $('tr.export').css("background-color", "rgb(255, 255, 255)");
  $('tr.export').find('td').each((col,td)=>{
      $(td).css("background-color", "rgb(255, 255, 255)");
      $(td).css("color", "#8094ae");
  })
}

getCustomerData(arr,accountno){
  return arr.find(item => item.accountno == accountno);
}

editDeclinedCustomer($event){
  console.log($event.name)
  const details = $event.name?.split(",")
  if(details?.length == 2){
    if(details[0] == 'Prepaid'){
      selfClass.ecmiCustomerComponentInstance.instance.openCustomerUpdateForm(
        details[1],
        selfClass.ecmiCustomerComponentInstance.instance,
        selfClass,
        selfClass.getCustomerData(selfClass.customers,details[1])
      )
    }
    else if(details[0] == 'Postpaid'){
      selfClass.emsCustomerComponentInstance.instance.openCustomerUpdateForm(
        details[1],
        selfClass.emsCustomerComponentInstance.instance,
        selfClass,
        selfClass.getCustomerData(selfClass.customers,details[1])
      )
    }
    
  }
  else{
    Swal.fire({
      position: 'top-end',
      icon: 'error',
      title: `Something went wrong! `,
      text:`This customer account number or account type is unavailable`,
      showConfirmButton: false,
      timer: 1500
    })
  }
  
}

exportMultiple($event){
   const type = $event.target.value
    if(this.exportData.length>0){
      exportMultiple(type,this.exportData,this.getfileName(this.active))
      Swal.fire({
        position: 'top-start',
        icon: 'info',
        title: `Export! `,
        text:`${this.exportData?.length-1} Records were exported successfully`,
        showConfirmButton: false,
        timer: 1500
      })
      this.resetExporter()
    }
    else{
      Swal.fire({
        position: 'top-end',
        icon: 'info',
        title: `No record Selected! `,
        text:`Please select records to export`,
        showConfirmButton: false,
        timer: 1500
      })
    }

  
}

getfileName(action){
  let currentDate = new Date().toISOString()
  const filenames = {'approved':'Approved Customers',
                      'pending':'Pending Customers',
                      'declined':'Declined Customers',
                      'created':'Created Customers'
                    }
  return filenames[action] + '@' + currentDate
}

loadMutlipleScripts(){
  const scripts = [
                    "/assets/js/datatables/dataTables.buttons.min.js?version=0.0.3",
                    "/assets/js/datatables/jszip.min.js?version=0.0.3",
                    "/assets/js/datatables/pdfmake.min.js",
                    "/assets/js/datatables/vfs_fonts.js?version=0.0.3",
                    "/assets/js/datatables/buttons.html5.js?version=0.0.3",
                    "/assets/js/datatables/buttons.print.js?version=0.0.3"
                  ]
 return new Promise((resolve,reject)=>{
  scripts.forEach((script)=>{
    this.loadScript(script)
   })
   resolve(true)
 })
 
}

}
