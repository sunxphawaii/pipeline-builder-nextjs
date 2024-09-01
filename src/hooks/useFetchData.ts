import { useState, useEffect } from 'react';
import axios from 'axios';
import { Pipeline, Version, DataSource } from '../types';

const useFetchData = (pipelineId: string) => {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPipelineData = async () => {
      try {
        const [pipelineData, dataSourcesData] = await Promise.all([
          axios.get(`/api/pipelines/${pipelineId}`).then(res => res.data),
          axios.get('/api/data-sources').then(res => res.data),
        ]);

        setPipeline(pipelineData);
        setVersions(pipelineData.versions);
        setDataSources(dataSourcesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load pipeline data');
      } finally {
        setLoading(false);
      }
    };

    fetchPipelineData();
  }, [pipelineId]);

  return { pipeline, versions, dataSources, loading, error, setPipeline };
};

export default useFetchData;