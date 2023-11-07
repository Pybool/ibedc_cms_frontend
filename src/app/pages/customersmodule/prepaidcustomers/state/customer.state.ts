import * as customersReducer from './customer.reducer';

export interface fetchedEcmiCustomersState {
  fetchedUsersState: customersReducer.ECMIState;
}

export const reducers = {
  ecmiCustomerReducer: customersReducer.ecmiReducer,
};
