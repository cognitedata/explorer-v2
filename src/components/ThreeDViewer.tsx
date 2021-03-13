import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Cognite3DModel, Cognite3DViewer } from '@cognite/reveal';
import { getCDFClient } from '../utils/auth';
import { useThreeDMapping } from '../hooks/useThreeDMappings';

const sdkClient = getCDFClient();

export const ThreeDViewer = ({
  modelId = 2522841383870335,
  revisionId = 715061900296008,
  onSelect,
}: {
  modelId?: number;
  revisionId?: number;
  onSelect: (data: any) => void;
}) => {
  const domElement = useRef<HTMLDivElement | null>(null);

  const { data } = useThreeDMapping(modelId, revisionId);

  const [viewer, setViewer] = useState<Cognite3DViewer | undefined>(undefined);
  const [model, setModel] = useState<Cognite3DModel | undefined>(undefined);

  const onItemClicked = useCallback(
    async ({ offsetX, offsetY }: { offsetX: number; offsetY: number }) => {
      if (viewer) {
        const intersection = viewer.getIntersectionFromPixel(offsetX, offsetY);
        if (intersection) {
          const treeIndex = (intersection as any).treeIndex;

          const currentModel = intersection.model as Cognite3DModel;

          // do viewer stuff
          await currentModel.deselectAllNodes();
          await currentModel.selectNodeByTreeIndex(treeIndex);
          const bbox = await currentModel.getBoundingBoxByTreeIndex(treeIndex);
          viewer.fitCameraToBoundingBox(bbox);

          const nodeId = await currentModel.mapTreeIndexToNodeId(treeIndex);

          const mapping = await sdkClient.assetMappings3D.list(
            currentModel.modelId!,
            currentModel.revisionId!,
            { nodeId }
          );
          const node = await sdkClient.viewer3D.listRevealNodes3D(
            currentModel.modelId!,
            currentModel.revisionId!,
            { nodeId }
          );
          onSelect({ node, mapping });
        }
      }
    },
    [viewer, onSelect]
  );

  useEffect(() => {
    if (domElement.current && !viewer) {
      const newViewer = new Cognite3DViewer({
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
          newViewer.loadCameraFromModel(model);
          setViewer(newViewer);
          setModel(model as Cognite3DModel);
        });
    }
    return () => {};
  }, [domElement, viewer, modelId, revisionId]);

  useEffect(() => {
    if (viewer) {
      viewer.on('click', onItemClicked);
      return () => viewer.dispose();
    }
  }, [viewer, onItemClicked]);

  useEffect(() => {
    if (model && data) {
      if (data.length === 0) {
        return;
      }
      model.ghostAllNodes();
      data.forEach((item) => {
        model.unghostNodeByTreeIndex(item.treeIndex, true);
      });
    }
  }, [model, data]);

  return <div style={{ height: '100%', width: '100%' }} ref={domElement} />;
};
