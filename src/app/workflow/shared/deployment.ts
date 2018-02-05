import { NodeInfo } from 'app/workflow/shared/nodeInfo';

/**
 * The second layer datatable record entity. It holds information about a contextualized template in the cloud with the Occopus tool.
 */
export interface Deployment {
  /**
   * The name represented in the datatable for identifying the deployment.
   */
  name: string;

  /**
   * The graph inherited from the template.
   * It will simulate and follow the main construction events real time at the Occopus side.
   */
  graph?: string;

  /**
   * The date at the moment the deployment was created.
   */
  date?: Date;

  /**
   * The infrastructure identifier, that represents the infrastructure at the Occopus side.
   */
  infraid?: string;

  /**
   * Holds the unique identifier of the template entity in the FireStore database.
   */
  templateKey?: string;

  /**
   * Holds the unique identifier of the actual deployment's FireStore database record.
   */
  $key?: string;

  /**
   * Decides the type of the deployment based on the cloud provider, that the user want to deploy on. (Sigma,Amazon)
   */
  deployType?: DeploymentType;

  /**
   * The deployments actual Status based on the constructed infrastructure. (Active,Pending,Down)
   */
  status?: Status;

  nodeCollection?: NodeInfo[];

  /**
   * The template's "free" input port's constructed IP adresses at the chosen provider.
   */
  starterPoint?: string[];

  /**
   *The template's "free" outpout port's constructed IP adresses at the chosen provider.
   */
  endPoints?: string[];
}

/**
 * Basic Types of Infrastructure's condition
 */
export enum Status {
  'Active',
  'Pending',
  'Down'
}

/**
 * Basic Cloud provider entities that are supported by Occopus.
 */
export enum DeploymentType {
  'CloudSigma'
}
