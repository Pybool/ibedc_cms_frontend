import { createFeatureSelector, createSelector } from '@ngrx/store';
import { fetchedEcmiCustomersState } from './customer.state';
export const ECMI_CUSTOMERS_STATE_NAME = 'ecmiCustomersList';
export const EMS_CUSTOMERS_STATE_NAME = 'emsCustomersList';

const fetchedEcmiCustomersState = createFeatureSelector<fetchedEcmiCustomersState>(ECMI_CUSTOMERS_STATE_NAME);

export const ecmiCustomers = createSelector(fetchedEcmiCustomersState, (state:any) => {
  return state
});
