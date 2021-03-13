import ReactJson from 'react-json-view';

export const DataViewer = ({ data }: { data: any }) => {
  return <ReactJson src={data} collapsed={3} />;
};
