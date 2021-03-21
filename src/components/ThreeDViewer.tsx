import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BoundingBoxClipper,
  Cognite3DModel,
  Cognite3DViewer,
} from '@cognite/reveal';
import { getCDFClient } from '../utils/auth';
import { RevealNode3D, AssetMapping3D } from '@cognite/sdk';
import { toast } from '@cognite/cogs.js';
import { Box3, Vector3 } from 'three';
import { useThreeDMapping, useNodes } from '../hooks/useThreeDMappings';

const sdkClient = getCDFClient();

let newViewer: Cognite3DViewer | undefined = undefined;

export const ThreeDViewer = ({
  modelId = 2522841383870335,
  revisionId = 715061900296008,
  onSelect,
  selectedAssetIds = [],
  nodeIds = [],
}: {
  modelId?: number;
  revisionId?: number;
  onSelect: (data: {
    node?: RevealNode3D;
    mappings?: AssetMapping3D[];
  }) => void;
  selectedAssetIds?: number[]; // Asset id
  nodeIds?: number[];
}) => {
  const domElement = useRef<HTMLDivElement | null>(null);

  const [viewer, setViewer] = useState<Cognite3DViewer | undefined>(undefined);
  const [model, setModel] = useState<Cognite3DModel | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);

  const { data: mappings } = useThreeDMapping(
    modelId,
    revisionId,
    selectedAssetIds
  );
  const { data: nodes } = useNodes(modelId, revisionId, nodeIds);

  const onItemClicked = useCallback(
    async (
      viewer: Cognite3DViewer,
      {
        offsetX,
        offsetY,
      }: {
        offsetX: number;
        offsetY: number;
      }
    ) => {
      if (viewer) {
        const intersection = viewer.getIntersectionFromPixel(offsetX, offsetY);
        if (intersection) {
          const treeIndex = (intersection as any).treeIndex;

          const currentModel = intersection.model as Cognite3DModel;

          // do viewer stuff
          console.log('select', treeIndex);
          await currentModel.selectNodeByTreeIndex(treeIndex);

          const nodeId = await currentModel.mapTreeIndexToNodeId(treeIndex);

          const mappings = await sdkClient.assetMappings3D
            .list(currentModel.modelId!, currentModel.revisionId!, {
              nodeId,
            })
            .autoPagingToArray();
          const [node] = await sdkClient.viewer3D
            .listRevealNodes3D(
              currentModel.modelId!,
              currentModel.revisionId!,
              {
                nodeId,
                limit: 1,
              }
            )
            .autoPagingToArray();
          console.log('onclick 3d');
          onSelect({ node, mappings });
        }
      }
    },
    [onSelect]
  );

  useEffect(() => {
    if (domElement.current && !newViewer) {
      newViewer = new Cognite3DViewer({
        sdk: sdkClient,
        domElement: domElement.current,
      });
      // load a model and add it on 3d scene
      // https://console.cognitedata.com/publicdata/3d-models/4715379429968321/revisions/5688854005909501

      newViewer
        .addModel({
          modelId,
          revisionId,
        })
        .then((model) => {
          newViewer!.loadCameraFromModel(model);
          setViewer(newViewer);
          setModel(model as Cognite3DModel);
          (model as Cognite3DModel).hideAllNodes();
          setLoading(true);
        });
    }
    return () => {};
  }, [domElement, viewer, modelId, revisionId]);

  useEffect(() => {
    let callback = (ev: any) => onItemClicked(newViewer!, ev);
    if (viewer && onItemClicked) {
      viewer!.on('click', callback);
    }

    return () => viewer?.off('click', callback);
  });

  useEffect(() => {
    (async () => {
      if (viewer && model && mappings) {
        if (mappings.length > 0) {
          await model.deselectAllNodes();
          let bbox: Box3 | undefined = undefined;
          for (const mapping of mappings) {
            const currBox = await model.getBoundingBoxByTreeIndex(
              mapping.treeIndex
            );
            bbox = bbox ? bbox.union(currBox) : currBox;
            await model.selectNodeByTreeIndex(mapping.treeIndex, true);
          }
          if (bbox) {
            console.log('huh', bbox);
            await viewer.fitCameraToBoundingBox(bbox);
          }
        } else {
          toast.info(<p>Unable to find 3D mapping for asset</p>, {
            autoClose: 3000,
          });
        }
      }
    })();
  }, [viewer, model, mappings]);

  useEffect(() => {
    (async () => {
      if (viewer && model && nodes && nodes.length > 0 && loading) {
        let bbox: Box3 | undefined = undefined;
        for (const node of nodes) {
          const currBox = new Box3(
            new Vector3(...node.boundingBox.min),
            new Vector3(...node.boundingBox.max)
          );
          bbox = bbox ? bbox.union(currBox) : currBox;
        }
        if (bbox) {
          console.log('huh', bbox);
          const clipper = new BoundingBoxClipper(bbox);
          await viewer.setSlicingPlanes(clipper.clippingPlanes);
          await viewer.fitCameraToBoundingBox(bbox);
        }
        for (const node of nodes) {
          await model.showNodeByTreeIndex(node.treeIndex, true);
        }
        setLoading(false);
      }
    })();
  }, [model, viewer, nodes, loading]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <div style={{ height: '100%', width: '100%' }} ref={domElement} />
    </div>
  );
};
