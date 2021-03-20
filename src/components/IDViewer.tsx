import { CogniteAnnotation } from '@cognite/annotations';
import { Loader } from '@cognite/cogs.js';
import { CogniteFileViewer } from '@cognite/react-picture-annotation';
import { FileInfo } from '@cognite/sdk';
import { useEffect, useState } from 'react';
import { getCDFClient } from '../utils/auth';

const sdkClient = getCDFClient();
export const IDViewer = ({
  fileId = 724490490485823,
  onSelect,
  selectedAssetIds = [],
  annotations,
}: {
  fileId?: number;
  annotations: CogniteAnnotation[];
  onSelect: (anno: CogniteAnnotation) => void;
  selectedAssetIds?: number[]; // Asset IDs
}) => {
  const [file, setFile] = useState<FileInfo | undefined>();

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
    <CogniteFileViewer
      sdk={sdkClient}
      file={file}
      disableAutoFetch
      annotations={annotations.map((el) => ({ ...el }))}
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
    ></CogniteFileViewer>
  );
};
