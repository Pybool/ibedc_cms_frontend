import { Injectable } from '@angular/core';
import { SharedService } from './shared.service';
import { SpinnerService } from './spinner.service';
import { interval } from 'rxjs';
import { AutoUnsubscribe } from 'src/auto-unsubscribe.decorator';

interface CustomWindow extends Window {
  waitForElm:(arg1) => any;
  DataTable: (searchTerm: string,{}) => void;
}
declare let window: CustomWindow;
var tableObj = null

@Injectable({
  providedIn: 'root'
})
@AutoUnsubscribe
export class ConvertTableService {
  intervalId = null
  constructor(private sharedService: SharedService, private spinnerService:SpinnerService) { }

  clearTable(args){
    window.waitForElm(`#${args.id}`).then((elm) => {
      if(elm){
        const rows:any = elm.getElementsByTagName('tr');
        for(let i = rows.length - 1; i > 0; i--){
          console.log('Deleting table row ', i)
          elm.deleteRow(i);
        }
      }
    })
  }

  clearTablefn(){ 
    if (tableObj) {
      tableObj.clear(); tableObj.destroy();
    }
  }

  convertTable(args) {
    const table = document.querySelector(`#${args.id}`);
    return new Promise((resolve, reject) => {
      const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            window.waitForElm(`#${args.id}`).then((elm) => {
              this.sharedService.setSpinnerText('Constructing data table...');
              setTimeout(() => {
                tableObj = new window.DataTable(`#${args.id}`, {
                  destroy: true,
                  pageLength: 100,
                  bPaginate: false,
                  responsive: true,
                  processing: true,
                  searching: false,
                  deferRender: true,
                  order: [],
                  dom: 'Bfrtip',
                  buttons: ['copy','csv', 'excel'],
                });
                this.spinnerService.hideSpinner();
                observer.disconnect();
                resolve(elm.style.opacity = '1');
              }, 100);
            });
            break;
          }
        }
        console.log("Done iterating mutation list")
      });
  
      try {
        observer.observe(table, { childList: true });
        if (!table) {
          reject(`Table with id ${args.id} not found.`);
          return;
        }
        const fakeMutation = document.createElement('div');
        table.appendChild(fakeMutation);
        table.removeChild(fakeMutation);
      } catch (error) {
        console.log('Error occurred:', error);
      }
    });
  }
  
  
  
}
