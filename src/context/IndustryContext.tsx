/**
 * SkillSetu - Industry Workspace Context
 * Step 7: Industry Workspace
 * 
 * Manages active demo industry selection across the Industry Workspace.
 * Defaults to 'ind_01' (AyurTech Innovations).
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface DemoOrganization {
  id: string;
  name: string;
  type: string;
  location: string;
  description: string;
}

export const DEMO_ORGANIZATIONS: DemoOrganization[] = [
  {
    id: 'ind_01',
    name: 'AyurTech Innovations',
    type: 'Digital Health & Ayurvedic Telemetry',
    location: 'Bengaluru, Karnataka',
    description: 'Fictional demo enterprise building clinical AI decision support and telemedicine modules for integrative Ayurveda.'
  },
  {
    id: 'ind_02',
    name: 'HealthData Labs',
    type: 'Health Informatics & Standards',
    location: 'Hyderabad, Telangana',
    description: 'Fictional demo health informatics firm implementing ABDM, FHIR schemas, and Ayush terminology mapping engines.'
  },
  {
    id: 'ind_03',
    name: 'AyuAnalytics',
    type: 'Phytochemical & Botanical Intelligence',
    location: 'Pune, Maharashtra',
    description: 'Fictional demo data science lab researching botanical metabolomics and herbal pharmacovigilance databases.'
  },
  {
    id: 'ind_04',
    name: 'MedTech Research Solutions',
    type: 'Biomedical & Clinical Trial Research',
    location: 'New Delhi, Delhi',
    description: 'Fictional demo contract research organization coordinating GCP-compliant observational and clinical trials.'
  }
];

interface IndustryContextValue {
  selectedIndustryId: string;
  setSelectedIndustryId: (id: string) => void;
  currentOrg: DemoOrganization;
  demoOrganizations: DemoOrganization[];
}

const IndustryContext = createContext<IndustryContextValue | undefined>(undefined);

const STORAGE_KEY = 'skillsetu_selected_industry_id';

export const IndustryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedIndustryId, setSelectedIndustryIdState] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return DEMO_ORGANIZATIONS.some(o => o.id === saved) ? (saved as string) : 'ind_01';
  });

  const setSelectedIndustryId = (id: string) => {
    setSelectedIndustryIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const currentOrg = DEMO_ORGANIZATIONS.find(o => o.id === selectedIndustryId) || DEMO_ORGANIZATIONS[0];

  return (
    <IndustryContext.Provider
      value={{
        selectedIndustryId,
        setSelectedIndustryId,
        currentOrg,
        demoOrganizations: DEMO_ORGANIZATIONS
      }}
    >
      {children}
    </IndustryContext.Provider>
  );
};

export function useIndustry() {
  const context = useContext(IndustryContext);
  if (!context) {
    throw new Error('useIndustry must be used within an IndustryProvider');
  }
  return context;
}
