import { Action } from '@ngrx/store';


export enum CustomerActionTypes {

  FETCH_EMS_CUSTOMERS = '[Ems Customers] Fetch',
  FETCH_EMS_CUSTOMERS_SUCCESS = '[Ems Customers] Fetch Successful',
  FETCH_EMS_CUSTOMERS_FAILURE = '[Ems Customers] Fetch Failure',

  DEEP_FETCH_EMS_CUSTOMERS = '[Ems Deep Customers] Fetch',
  DEEP_FETCH_EMS_CUSTOMERS_SUCCESS = '[Ems Deep Customers] Fetch Successful',
  DEEP_FETCH_EMS_CUSTOMERS_FAILURE =  '[Ems Deep Customers] Fetch Failure',

  LOAD_EMS_CUSTOMER = '[Ems Customer] Load',
  LOAD_EMS_CUSTOMER_SUCCESS = '[Ems Customer] Load Successful',
  LOAD_EMS_CUSTOMER_FAILURE = '[Ems Customer] Load Failure'
  
}

export class FetchEmsCustomers implements Action {
  readonly type = CustomerActionTypes.FETCH_EMS_CUSTOMERS;
  constructor() {}
}

export class FetchEmsCustomersSuccess implements Action {
  readonly type = CustomerActionTypes.FETCH_EMS_CUSTOMERS_SUCCESS;
  constructor(public payload: any) {}
}

export class FetchEmsCustomersFailure implements Action {
  readonly type = CustomerActionTypes.FETCH_EMS_CUSTOMERS_FAILURE;
  constructor(public payload: any) {}
}

export class DeepFetchEmsCustomers implements Action {
  readonly type = CustomerActionTypes.DEEP_FETCH_EMS_CUSTOMERS;
  constructor(public payload: any) {console.log("Dispatching an action")}
}

export class DeepFetchEmsCustomersSuccess implements Action {
  readonly type = CustomerActionTypes.DEEP_FETCH_EMS_CUSTOMERS_SUCCESS;
  constructor(public payload: any) {}
}

export class DeepFetchEmsCustomersFailure implements Action {
  readonly type = CustomerActionTypes.DEEP_FETCH_EMS_CUSTOMERS_FAILURE;
  constructor(public payload: any) {}
}


export class LoadEmsCustomer implements Action {
    readonly type = CustomerActionTypes.LOAD_EMS_CUSTOMER;
    constructor(public payload: any) {}
  }

export class LoadEmsCustomersuccess implements Action {
    readonly type = CustomerActionTypes.LOAD_EMS_CUSTOMER_SUCCESS;
    constructor(public payload: any) {}
  }

export class LoadEmsCustomerFailure implements Action {
    readonly type = CustomerActionTypes.LOAD_EMS_CUSTOMER_FAILURE;
    constructor(public payload: any) {}
  }
  
export type All =
  | FetchEmsCustomers
  | FetchEmsCustomersSuccess
  | FetchEmsCustomersFailure
  | DeepFetchEmsCustomers
  | DeepFetchEmsCustomersSuccess
  | DeepFetchEmsCustomersFailure
  | LoadEmsCustomer
  | LoadEmsCustomersuccess
  | LoadEmsCustomerFailure
  

    