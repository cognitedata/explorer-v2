import { AuthModel, authModel } from './auth';

export interface StoreModel {
  auth: AuthModel;
}
export const storeModel: StoreModel = {
  auth: authModel,
};
