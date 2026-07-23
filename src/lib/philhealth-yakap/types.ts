export interface YakapResponseEnvelope {
  message?: string;
  success?: boolean;
  result?: string;
}

export interface YakapGetTokenArgs {
  pUsername?: string;
  pUserPassword?: string;
  pSoftwareCertificationId?: string;
  pHospitalCode?: string;
}

export interface YakapIsMemberDependentRegisteredArgs {
  pPIN?: string;
  pType?: string;
}

export interface YakapExtractRegistrationListArgs {
  pStartDate?: string;
  pEndDate?: string;
}

export interface YakapIsATCValidArgs {
  pPIN?: string;
  pATC?: string;
  pEffectivityDate?: string;
}

export interface YakapValidateReportArgs {
  pReport?: string; // encrypted xml
  pReportTagging?: string;
}

export interface YakapSubmitReportArgs {
  pTransmittalID?: string;
  pReport?: string; // encrypted xml
  pReportTagging?: string;
}

export interface YakapCheckUploadStatusArgs {
  pUsername?: string;
  pUserPassword?: string;
  pHospitalCode?: string;
  pStartDate?: string;
  pEndDate?: string;
  pTransmittalID?: string;
  pReport?: string; // encrypted xml
}

export interface YakapSoapClient {
  lastRequest?: string;
  lastResponse?: string;
  on: (event: string, callback: (xml: string) => void) => void;
  clearHttpHeaders: () => void;
  addHttpHeader: (key: string, value: string) => void;
  getToken: (args: YakapGetTokenArgs, callback: (err: Error | null, res: Record<string, unknown>) => void) => void;
  isMemberDependentRegistered: (args: YakapIsMemberDependentRegisteredArgs, callback: (err: Error | null, res: Record<string, unknown>) => void) => void;
  extractRegistrationList: (args: YakapExtractRegistrationListArgs, callback: (err: Error | null, res: Record<string, unknown>) => void) => void;
  isATCValid: (args: YakapIsATCValidArgs, callback: (err: Error | null, res: Record<string, unknown>) => void) => void;
  validateReport: (args: YakapValidateReportArgs, callback: (err: Error | null, res: Record<string, unknown>) => void) => void;
  submitReport: (args: YakapSubmitReportArgs, callback: (err: Error | null, res: Record<string, unknown>) => void) => void;
  checkUploadStatus: (args: YakapCheckUploadStatusArgs, callback: (err: Error | null, res: Record<string, unknown>) => void) => void;
}
