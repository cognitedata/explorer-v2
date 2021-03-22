import styled from 'styled-components/macro';
import { ThreeDViewer } from '../components/ThreeDViewer';
import { IDViewer } from '../components/IDViewer';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Asset } from '@cognite/sdk/dist/src';
import { useThreeDMapping } from '../hooks/useThreeDMappings';
import {
  CogniteAnnotation,
  listAnnotationsForFile,
} from '@cognite/annotations';
import { getCDFClient } from '../utils/auth';
import { Button, Title } from '@cognite/cogs.js';
import { DataViewer } from '../components/DataViewer';

const modelId = 2522841383870335;
const revisionId = 715061900296008;
const fileId = 724490490485823;

const sdkClient = getCDFClient();

export const ExplorerPage = () => {
  const [data, setData] = useState<Asset | undefined>(undefined);
  const [assetId, setAssetId] = useState<number | undefined>(undefined);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetMapping, setAssetMapping] = useState<{ [key: number]: number }>(
    {}
  );
  const { data: mappings } = useThreeDMapping(
    modelId,
    revisionId,
    assets.map((el) => el.id)
  );
  const [annotations, setAnnotations] = useState<CogniteAnnotation[]>([]);

  useEffect(() => {
    (async () => {
      const [newFile] = await sdkClient.files.retrieve([{ id: fileId }]);
      const annos = await listAnnotationsForFile(sdkClient, newFile);
      setAnnotations(annos);

      let newAssetMapping: { [key: number]: number } = {};

      const assetIds = new Set<string>();
      annos
        .filter((el) => el.resourceType === 'asset' && el.resourceExternalId)
        .forEach((el) => {
          assetIds.add(el.resourceExternalId!);
        });
      const innerAssets = await sdkClient.assets.retrieve(
        Array.from(assetIds).map((externalId) => ({ externalId }))
      );

      const children = await sdkClient.assets
        .list({
          filter: { parentIds: innerAssets.map((el) => el.id) },
          limit: 1000,
        })
        .autoPagingToArray();

      innerAssets.forEach((el) => {
        newAssetMapping[el.id] = el.id;
      });
      children.forEach((el) => {
        newAssetMapping[el.id] = el.parentId || el.rootId;
      });
      setAssets(innerAssets.concat(children));

      setAssetMapping(newAssetMapping);
    })();
  }, []);

  const selectedAssetIds = useMemo(
    () =>
      assetId
        ? [
            assetId,
            ...Object.entries(assetMapping)
              .filter(([_, value]) => value === assetId)
              .map(([key]) => Number(key)),
          ]
        : [],
    [assetMapping, assetId]
  );

  const on3dSelect = useCallback(
    (data: any) => {
      console.log('3d');
      if (data.mappings) {
        console.log(data.mappings, assetMapping, assets);
        const assetId =
          Object.entries(assetMapping).find(([key]) =>
            data.mappings?.some((el: any) => el.assetId === Number(key))
          )![1] || undefined;
        setAssetId(assetId);
        setData(assets.find((el) => el.id === assetId));
      }
    },
    [assetMapping, assets]
  );

  return (
    <VerticalWrapper>
      {assetId && (
        <Button
          style={{ position: 'absolute', top: 24, left: 24, zIndex: 1 }}
          onClick={() => setAssetId(undefined)}
        >
          Deslect
        </Button>
      )}
      <Wrapper>
        <div
          style={{
            flex: !!assetId ? '1' : '0',
            width: !!assetId ? 'auto' : '0',
          }}
        >
          <div style={{ flex: 1, display: 'flex' }}>
            <ThreeDViewer
              modelId={modelId}
              revisionId={revisionId}
              onSelect={on3dSelect}
              selectedAssetIds={selectedAssetIds}
              nodeIds={mappings?.map((el) => el.nodeId)}
            />
          </div>
          {data && (
            <div style={{ height: '20vw', overflow: 'auto' }}>
              <Title level={3}>{data.name} Details</Title>
              <DataViewer data={data} />
            </div>
          )}
        </div>
        <div>
          <IDViewer
            onSelect={(data) => {
              console.log('id');
              if (data?.resourceType === 'asset') {
                setAssetId(assetMapping[data.resourceId!]);
                setData(
                  assets.find((el) => el.id === assetMapping[data.resourceId!])
                );
              }
            }}
            assets={assets}
            selectedAssetIds={selectedAssetIds}
            annotations={annotations}
          />
        </div>
      </Wrapper>
    </VerticalWrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
  overflow: hidden;
  && > * {
    flex: 1;
    position: relative;
    display: flex;
    flex-direction: column;
  }
`;
const VerticalWrapper = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
`;
