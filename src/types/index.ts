export interface Pipeline {
  id: string;
  name: string;
  description: string;
  versions: Version[];
}

export interface Version {
  id: string;
  versionNumber: number;
  steps: Step[];
}

export interface Step {
  id: string;
  name: string;
  type: string;
  description: string;
  config: any;
  order: number;
}

export interface DataSource {
  id: string;
  name: string;
  type: string;
}