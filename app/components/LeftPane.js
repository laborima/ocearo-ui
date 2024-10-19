import { useState } from 'react';
import ThreeDMainView from './3dview/ThreeDMainView';
import ThreeDParkAssistView from './parkassist/ThreeDParkAssistView';

const LeftPane = ({ view }) => { // Accept view prop

  return (
    <div className="h-full relative">
      {view === 'boat' ? <ThreeDMainView /> : <ThreeDParkAssistView />}
    </div>
  );
};

export default LeftPane;
