import { Loader } from '@cognite/cogs.js';
import { CogniteFileViewer } from '@cognite/react-picture-annotation';
import { FileInfo } from '@cognite/sdk';
import { useEffect, useState } from 'react';
import { getCDFClient } from '../utils/auth';

const sdkClient = getCDFClient();
export const IDViewer = ({
  fileId = 724490490485823,
  onSelect,
}: {
  fileId?: number;
  onSelect: (data: any) => void;
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
      onAnnotationSelected={onSelect}
    ></CogniteFileViewer>
  );
};
