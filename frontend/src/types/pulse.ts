export interface PulseReference {
  document: string;
  pages: {
    start: number;
    end: number;
  };
}

export interface ClinicalInfo {
  causes: string[];
  management: string[];
  diseases: string[];
  organSymptoms: {
    [key: string]: string;  // 예: heart: "심계항진"
  };
}

export interface PulseProfile {
  pulseCode: string;
  pvcType: string;
  bvType: string;
  svType: string;
  hrType: string;
  hanja: string;
  reference: PulseReference;
  clinical: ClinicalInfo;
}

export interface PulseMapResponse {
  success: boolean;
  data?: PulseProfile;
  message?: string;
}

// PDF 보고서 생성을 위한 인터페이스
export interface PulseReport {
  patientInfo: {
    name: string;
    age: number;
    gender: string;
    measurementDate: string;
  };
  pulseData: PulseProfile;
  recommendations?: string[];
  notes?: string;
} 