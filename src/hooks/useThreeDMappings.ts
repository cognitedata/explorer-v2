import { useQuery } from 'react-query';
import { getCDFClient } from '../utils/auth';

const getAssetMappings = async (
  modelId: number,
  revisionId: number,
  assetIds: number[]
) => {
  let items: any[] = [];
  let hasMore: string | true | undefined = true;
  while (hasMore) {
    const response: any = await getCDFClient().post(
      `/api/v1/projects/akso-dev/3d/models/${modelId}/revisions/${revisionId}/mappings/list`,
      {
        data: {
          filter: {
            assetIds,
          },
          ...(typeof hasMore === 'string' ? { cursor: hasMore } : {}),
        },
      }
    );
    hasMore = response.data.cursor;
    items = items.concat(response.data.items);
  }
  return items;
};
const getNodeData = async (
  modelId: number,
  revisionId: number,
  nodeIds: number[]
) => {
  let items: any[] = [];
  let hasMore: string | true | undefined = true;
  while (hasMore) {
    const response: any = await getCDFClient().post(
      `/api/v1/projects/akso-dev/3d/models/${modelId}/revisions/${revisionId}/nodes/byids`,
      {
        data: {
          items: nodeIds.map((id) => ({ id })),
        },
      }
    );
    hasMore = response.data.cursor;
    items = items.concat(response.data.items);
  }
  return items;
};

export const useThreeDMapping = (
  modelId: number,
  revisionId: number,
  assetIds: number[]
) => {
  return useQuery(
    `mapping/${modelId}/${revisionId}/${assetIds.join(',')}`,
    async () => {
      return getAssetMappings(modelId, revisionId, assetIds);
    },
    { staleTime: Infinity, enabled: assetIds.length > 0 }
  );
};

export const useNodes = (
  modelId: number,
  revisionId: number,
  treeIndexes: number[]
) => {
  return useQuery(
    `nodes/${modelId}/${revisionId}/${treeIndexes.join(',')}`,
    async () => {
      return getNodeData(modelId, revisionId, treeIndexes);
    },
    { staleTime: Infinity, enabled: treeIndexes.length > 0 }
  );
};
