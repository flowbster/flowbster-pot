import { NodeInfo } from './nodeInfo';
/**
 * Defines a datatable record for a workflow template.
 */
export interface WorkflowEntry {
  /**
   * The name which identifies the template.
   */
  name: string;

  /**
   * The detailed description about the template.
   */
  description: string;

  /**
   * The YAML descriptor of the template graph.
   */
  descriptor: string;

  /**
   * The JSON formatted information of the Joint graph.
   */
  graph: string;

  /**
   * The collection of node status information
   */
  nodeCollection: NodeInfo[];

  /**
   * The ID of the saved database record for this Entry.
   */
  $key?: any;
}
