import { useQuery } from 'react-query';
import { getCDFClient } from '../utils/auth';

export const useThreeDMapping = (
  modelId: number,
  revisionId: number,
  assetIds: number[]
) => {
  return useQuery(
    `mapping/${modelId}/${revisionId}/${assetIds.join(',')}`,
    async () => {
      return (
        await Promise.all(
          assetIds.map((assetId) =>
            getCDFClient()
              .assetMappings3D.list(modelId, revisionId, { assetId })
              .autoPagingToArray({ limit: 100000 })
          )
        )
      ).reduce((prev, curr) => prev.concat(curr), []);
    },
    { staleTime: Infinity }
  );
};
