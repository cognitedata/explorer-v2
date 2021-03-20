import { gql } from 'graphql-request';
import { GraphQLClient } from 'graphql-request';
import { useQuery } from 'react-query';
import {
  API_KEY_LOCALSTORAGE_KEY,
  LOGIN_TYPE_LOCALSTORAGE_KEY,
  BEARER_TOKEN_LOCALSTORAGE_KEY,
} from '../store/auth';
const GRAPHQL_URL =
  'https://itg.cognite.ai/api/v1/projects/abfd5e1ac-30ad-43ea-9b59-901fa3c0f9eb/graphql';

const client = new GraphQLClient(GRAPHQL_URL);
export const getBearerToken = () => {
  const apiKey = localStorage.getItem(API_KEY_LOCALSTORAGE_KEY);
  const loginType = localStorage.getItem(LOGIN_TYPE_LOCALSTORAGE_KEY);
  const bearerToken = localStorage.getItem(BEARER_TOKEN_LOCALSTORAGE_KEY);
  return loginType === 'OAUTH' ? bearerToken : apiKey;
};

export const useAssets = (assetIds: string[]) => {
  return useQuery(
    `assets/${assetIds.join(',')}`,
    () =>
      client.request(
        gql`
        query Equipment($ids: [ID!]{
          Equipment(filter:{id_in:$ids}){
            id
            children {
              id
            }
            threedNode {
              treeIndex
            }
          }
        }
      `,
        { ids: assetIds },
        { authorization: `Bearer ${getBearerToken()}` }
      ),
    { staleTime: Infinity }
  );
};