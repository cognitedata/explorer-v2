import { CogniteClient } from '@cognite/sdk';

let client: CogniteClient | null = null;

export function getCDFClient() {
  if (!client) {
    resetCDFClient();
  }
  return client as CogniteClient;
}
export function resetCDFClient() {
  client = new CogniteClient({ appId: 'explorer-v2' });
}
