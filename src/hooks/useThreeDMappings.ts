import { useQuery } from 'react-query';
import { getCDFClient } from '../utils/auth';

export const useThreeDMapping = (modelId: number, revisionId: number) => {
  return useQuery(`mapping/${modelId}/${revisionId}`, async () => {
    return getCDFClient()
      .assetMappings3D.list(modelId, revisionId)
      .autoPagingToArray();
  });
};
