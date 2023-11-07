import { Action } from '@ngrx/store';


export enum CustomerActionTypes {
  FETCH_ECMI_CUSTOMERS = '[Ecmi Customers] Fetch',
  FETCH_ECMI_CUSTOMERS_SUCCESS = '[Ecmi Customers] Fetch Successful',
  FETCH_ECMI_CUSTOMERS_FAILURE = '[Ecmi Customers] Fetch Failure',

  DEEP_FETCH_ECMI_CUSTOMERS = '[Ecmi Deep Customers] Fetch',
  DEEP_FETCH_ECMI_CUSTOMERS_FAILURE = '[Ecmi Deep Customers] Fetch Failure',
  DEEP_FETCH_ECMI_CUSTOMERS_SUCCESS = '[Ecmi Deep Customers] Fetch Successful',
  
}

export class FetchEcmiCustomers implements Action {
  readonly type = CustomerActionTypes.FETCH_ECMI_CUSTOMERS;
  constructor() {}
}

export class FetchEcmiCustomersSuccess implements Action {
  readonly type = CustomerActionTypes.FETCH_ECMI_CUSTOMERS_SUCCESS;
  constructor(public payload: any) {}
}

export class FetchEcmiCustomersFailure implements Action {
  readonly type = CustomerActionTypes.FETCH_ECMI_CUSTOMERS_FAILURE;
  constructor(public payload: any) {}
}

export class DeepFetchEcmiCustomers implements Action {
  readonly type = CustomerActionTypes.DEEP_FETCH_ECMI_CUSTOMERS;
  constructor(public payload: any) {}
}

export class DeepFetchEcmiCustomersSuccess implements Action {
  readonly type = CustomerActionTypes.DEEP_FETCH_ECMI_CUSTOMERS_SUCCESS;
  constructor(public payload: any) {}
}

export class DeepFetchEcmiCustomersFailure implements Action {
  readonly type = CustomerActionTypes.DEEP_FETCH_ECMI_CUSTOMERS_FAILURE;
  constructor(public payload: any) {}
}
  
export type All =
  | FetchEcmiCustomers
  | FetchEcmiCustomersSuccess
  | FetchEcmiCustomersFailure
  | DeepFetchEcmiCustomers
  | DeepFetchEcmiCustomersSuccess
  | DeepFetchEcmiCustomersFailure
  

    