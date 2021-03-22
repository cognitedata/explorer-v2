import { CogniteAnnotation } from '@cognite/annotations';
import { Loader, ButtonGroup, Body, Colors } from '@cognite/cogs.js';
import { CogniteFileViewer } from '@cognite/react-picture-annotation';
import { FileInfo } from '@cognite/sdk';
import { useEffect, useState } from 'react';
import { getCDFClient } from '../utils/auth';
import { Asset } from '@cognite/sdk/dist/src';

const sdkClient = getCDFClient();
export const IDViewer = ({
  fileId = 724490490485823,
  onSelect,
  selectedAssetIds = [],
  annotations,
  assets,
}: {
  fileId?: number;
  annotations: CogniteAnnotation[];
  onSelect: (anno: CogniteAnnotation) => void;
  selectedAssetIds?: number[]; // Asset IDs
  assets: Asset[]; // Asset IDs
}) => {
  const [file, setFile] = useState<FileInfo | undefined>();
  const [tab, setTab] = useState<string>('default');

  const getColor = (annotation: CogniteAnnotation) => {
    if (annotation.resourceType === 'asset') {
      if (selectedAssetIds.includes(annotation.resourceId!)) {
        return `${Colors['midblue-3'].hex()}40`;
      }
      if (tab === 'default') {
        return `${Colors['purple-3'].hex()}33`;
      } else {
        return assets.find((el) => el.id === annotation.resourceId!)?.metadata
          ?.objectstate === 'Active'
          ? `${Colors['success'].hex()}40`
          : `${Colors['danger'].hex()}33`;
      }
    } else {
      return `${Colors['greyscale-grey6'].hex()}33`;
    }
  };

  useEffect(() => {
    (async () => {
      const [newFile] = await sdkClient.files.retrieve([{ id: fileId }]);
      setFile(newFile);
    })();
  }, [fileId]);

  if (!file) {
    return <Loader />;
  }
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          zIndex: 2,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Body style={{ marginRight: 12 }}>Color by</Body>
        <ButtonGroup currentKey={tab} onButtonClicked={setTab}>
          <ButtonGroup.Button key="default">Default</ButtonGroup.Button>
          <ButtonGroup.Button key="objectstate">
            Object State
          </ButtonGroup.Button>
        </ButtonGroup>
      </div>
      <CogniteFileViewer
        sdk={sdkClient}
        file={file}
        disableAutoFetch
        annotations={annotations.map((el) => ({
          ...el,
          mark: {
            backgroundColor: getColor(el),
            strokeWidth: 0,
          },
        }))}
        onAnnotationSelected={([annotation]) =>
          annotation && onSelect(annotation as CogniteAnnotation)
        }
        selectedIds={
          selectedAssetIds.length > 0
            ? annotations
                .filter(
                  (el) =>
                    el.resourceId && selectedAssetIds?.includes(el.resourceId)
                )
                .map((el) => `${el.id}`)
            : []
        }
        allowCustomAnnotations
      ></CogniteFileViewer>
    </>
  );
};
