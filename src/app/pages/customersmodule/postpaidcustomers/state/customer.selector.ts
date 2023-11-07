import { createFeatureSelector, createSelector } from '@ngrx/store';
import {  fetchedEmsCustomersState } from './customer.state';
export const EMS_CUSTOMERS_STATE_NAME = 'emsCustomersList';

const fetchedEmsCustomersState = createFeatureSelector<fetchedEmsCustomersState>(EMS_CUSTOMERS_STATE_NAME);

export const emsCustomers = createSelector(fetchedEmsCustomersState, (state:any) => {
  return state
});

