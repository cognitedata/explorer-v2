import styled from 'styled-components/macro';
import { ThreeDViewer } from '../components/ThreeDViewer';
import { IDViewer } from '../components/IDViewer';
import { DataViewer } from '../components/DataViewer';
import { useState } from 'react';

export const ExplorerPage = () => {
  const [data, setData] = useState<any>({});
  return (
    <VerticalWrapper>
      <Wrapper>
        <div>
          <ThreeDViewer onSelect={setData} />
        </div>
        <div>
          <IDViewer onSelect={setData} />
        </div>
      </Wrapper>
      <div style={{ height: '20vw', overflow: 'auto' }}>
        <DataViewer data={data} />
      </div>
    </VerticalWrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
  && > * {
    flex: 1;
  }
`;
const VerticalWrapper = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
`;
