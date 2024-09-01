import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import {
  Button, Card, CardHeader, CardContent, TextField, TextareaAutosize,
  Tabs, Tab, LinearProgress, Snackbar, Select, MenuItem
} from '@/components/ui/';
import { PlayArrow, Save, History, Database, Analytics } from 'lucide-react';
import StepConfigurationModal from './StepConfigurationModal';
import DataSourceSelector from './DataSourceSelector';
import PipelineAnalytics from './PipelineAnalytics';
import PipelineExecution from './PipelineExecution';
import { Pipeline, Version, Step, DataSource } from '../types';

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const PipelineBuilder: React.FC<{ pipelineId: string }> = ({ pipelineId }) => {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({ open: false, message: '', type: 'success' });
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [executionProgress, setExecutionProgress] = useState(0);

  useEffect(() => {
    const fetchPipelineData = async () => {
      try {
        const [pipelineData, dataSourcesData] = await Promise.all([
          fetcher(`/api/pipelines/${pipelineId}`),
          fetcher('/api/data-sources')
        ]);

        setPipeline(pipelineData);
        setVersions(pipelineData.versions);
        setCurrentVersionId(pipelineData.versions[0]?.id || null);
        setDataSources(dataSourcesData);
      } catch (error) {
        console.error('Error fetching pipeline data:', error);
        setSnackbar({ open: true, message: 'Failed to load pipeline data', type: 'error' });
      }
    };

    fetchPipelineData();
  }, [pipelineId]);

  const updatePipeline = (updatedVersion: Version) => {
    setPipeline(prev => prev ? ({
      ...prev,
      versions: prev.versions.map(v => v.id === currentVersionId ? updatedVersion : v)
    }) : null);
  };

  const handleStepUpdate = useCallback((updatedStep: Step) => {
    const updatedVersion = pipeline?.versions.find(v => v.id === currentVersionId);
    if (updatedVersion) {
      updatePipeline({
        ...updatedVersion,
        steps: updatedVersion.steps.map(step => step.id === updatedStep.id ? updatedStep : step)
      });
    }
    setOpenDialog(false);
    setSnackbar({ open: true, message: 'Step updated successfully', type: 'success' });
  }, [pipeline, currentVersionId]);

  const handleStepDelete = useCallback((stepId: string) => {
    const updatedVersion = pipeline?.versions.find(v => v.id === currentVersionId);
    if (updatedVersion) {
      updatePipeline({
        ...updatedVersion,
        steps: updatedVersion.steps.filter(step => step.id !== stepId)
      });
    }
    setSnackbar({ open: true, message: 'Step deleted successfully', type: 'success' });
  }, [pipeline, currentVersionId]);

  const handleStepAdd = useCallback(() => {
    const newStep: Step = {
      id: Date.now().toString(),
      name: 'New Step',
      type: 'custom',
      description: '',
      config: {},
      order: pipeline?.versions.find(v => v.id === currentVersionId)?.steps.length || 0,
    };
    const updatedVersion = pipeline?.versions.find(v => v.id === currentVersionId);
    if (updatedVersion) {
      updatePipeline({
        ...updatedVersion,
        steps: [...updatedVersion.steps, newStep]
      });
    }
    setSelectedStep(newStep);
    setOpenDialog(true);
  }, [pipeline, currentVersionId]);

  const handleSavePipeline = useCallback(async () => {
    try {
      await axios.put(`/api/pipelines/${pipelineId}`, pipeline);
      setSnackbar({ open: true, message: 'Pipeline saved successfully', type: 'success' });
    } catch (error) {
      console.error('Error saving pipeline:', error);
      setSnackbar({ open: true, message: 'Failed to save pipeline', type: 'error' });
    }
  }, [pipeline, pipelineId]);

  const handleVersionSelect = useCallback((versionId: string) => {
    setCurrentVersionId(versionId);
  }, []);

  if (!pipeline) {
    return <LinearProgress />;
  }

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">Pipeline Builder Dashboard</h1>
        </CardHeader>
        <CardContent>
          <TextField
            label="Pipeline Name"
            value={pipeline.name}
            onChange={(e) => setPipeline(prev => prev ? { ...prev, name: e.target.value } : null)}
            fullWidth
            margin="normal"
          />
          <TextareaAutosize
            minRows={3}
            placeholder="Pipeline Description"
            value={pipeline.description}
            onChange={(e) => setPipeline(prev => prev ? { ...prev, description: e.target.value } : null)}
            className="w-full p-2 border rounded"
          />
          <Select
            value={currentVersionId || ''}
            onChange={(e) => handleVersionSelect(e.target.value)}
            className="mt-4 mb-4"
          >
            {versions.map((version) => (
              <MenuItem key={version.id} value={version.id}>
                Version {version.versionNumber}
              </MenuItem>
            ))}
          </Select>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Steps" icon={<History />} />
            <Tab label="Data Sources" icon={<Database />} />
            <Tab label="Analytics" icon={<Analytics />} />
            <Tab label="Execution" icon={<PlayArrow />} />
          </Tabs>
          {activeTab === 0 && (
            <div>
              {/* List and manage steps directly within this tab */}
              <StepConfigurationModal
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                step={selectedStep}
                onStepUpdate={handleStepUpdate}
              />
              <Button startIcon={<Add />} onClick={handleStepAdd}>Add Step</Button>
            </div>
          )}
          {activeTab === 1 && (
            <DataSourceSelector
              dataSources={dataSources}
              onDataSourceSelect={(ds) => console.log('Selected:', ds)}
            />
          )}
          {activeTab === 2 && (
            <PipelineAnalytics analyticsData={analyticsData} />
          )}
          {activeTab === 3 && (
            <PipelineExecution
              pipelineId={pipelineId}
              onExecutionStatusChange={(status) => setSnackbar({ open: true, message: `Execution ${status}`, type: status === 'completed' ? 'success' : 'error' })}
            />
          )}
          <div className="mt-4 flex justify-end space-x-2">
            <Button startIcon={<Save />} onClick={handleSavePipeline}>Save Pipeline</Button>
          </div>
        </CardContent>
      </Card>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        message={snackbar.message}
        severity={snackbar.type}
      />
    </div>
  );
};

export default PipelineBuilder;
