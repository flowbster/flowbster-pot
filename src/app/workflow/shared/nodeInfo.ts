export interface NodeInfo {
  name: string;
  states: StateInfo[];
  instances: number;
}

export interface StateInfo {
  ip_address: string;
  state: string;
  node_id: string;
  port_address?: string;
}
