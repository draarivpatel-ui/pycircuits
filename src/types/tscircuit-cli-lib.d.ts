declare module "@tscircuit/cli/lib" {
  export type DevServerOptions = {
    componentFilePath: string;
    kicadPcm?: boolean;
    port: number;
    projectDir?: string;
  };

  export class DevServer {
    componentFilePath: string;
    port: number;
    projectDir: string;

    constructor(options: DevServerOptions);
    start(): Promise<void>;
    stop(): Promise<void>;
  }
}
