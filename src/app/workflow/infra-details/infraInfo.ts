export interface InfraInfo {
  nodename: {
    instances: {
      nodeid: {
        resouce_address: string;
        state: string;
      };
    };
    scaling: {
      actual: number;
      max: number;
      min: number;
      target: number;
    };
  };
}
