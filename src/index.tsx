import React from 'react';
import ReactDOM from 'react-dom';
import PipelineBuilder from './components/PipelineBuilder';

ReactDOM.render(
  <React.StrictMode>
    <PipelineBuilder pipelineId="sample-pipeline-id" />
  </React.StrictMode>,
  document.getElementById('root')
);