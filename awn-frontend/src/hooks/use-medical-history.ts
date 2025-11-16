
import { useState, useEffect } from 'react';
import type { MedicalHistory } from '@/lib/types';
import { apiService } from '@/lib/api';

const createInitialHistory = (): MedicalHistory => ({
  snapshot: {
    primaryConcern: '',
    onsetType: null,
    painScore: 0,
    functionalLimits: [],
    precautions: []
  },
  conditions: [],
  surgeries: [],
  medications: [],
  allergies: [],
  imaging: [],
  vitals: {},
  lifestyle: {},
  womensHealth: {
    show: false
  },
  goals: {
    shortTerm: [],
    longTerm: [],
    functionalGoals: []
  },
  contraindications: {
    absolute: [],
    relative: []
  },
  consent: {
    consentToTreatment: false,
    informedOfRisks: false,
    shareWithAssignedTherapist: false
  },
  attachments: [],
  timeline: [],
  isComplete: false
});

export function useMedicalHistory() {
  const [history, setHistory] = useState<MedicalHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    // Try to load from backend; fall back to local initial data
    let mounted = true;
    (async () => {
      try {
        const res: any = await apiService.getMedicalHistory();
        if (!mounted) return;
        if (res && res.success && res.data) {
          // Ensure the returned object has all expected sub-structures
          const base = createInitialHistory();
          const incoming = res.data || {};
          const merged = {
            ...base,
            ...incoming,
            snapshot: { ...base.snapshot, ...(incoming.snapshot || {}) },
            consent: { ...base.consent, ...(incoming.consent || {}) },
            goals: { ...base.goals, ...(incoming.goals || {}) },
            contraindications: { ...base.contraindications, ...(incoming.contraindications || {}) }
          };
          setHistory(merged);
        } else {
          setHistory(createInitialHistory());
        }
      } catch (err) {
        // network or 404 - fallback to local initial
        setHistory(createInitialHistory());
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => { mounted = false };
  }, []);

  const updateHistory = (updates: Partial<MedicalHistory>) => {
    setHistory(prev => {
      if (!prev) {
        const base = createInitialHistory();
        const updatedBase = { ...base, ...updates, lastUpdated: new Date().toISOString() };
        setIsDirty(true);
        return updatedBase;
      }
      const updated = { 
        ...prev, 
        ...updates, 
        lastUpdated: new Date().toISOString() 
      };
      setIsDirty(true);
      return updated;
    });
  };

  const saveNow = async () => {
    try {
      if (!history) throw new Error('Nothing to save');
      await apiService.saveMedicalHistory(history);
      setIsDirty(false);
      console.log('Medical history saved to server');
    } catch (error) {
      console.error('Failed to save:', error);
      throw error;
    }
  };

  const isSetupComplete = Boolean(
    history &&
    history.snapshot &&
    typeof history.snapshot.primaryConcern === 'string' &&
    history.snapshot.primaryConcern.trim().length > 0 &&
    history.consent &&
    history.consent.consentToTreatment &&
    history.consent.informedOfRisks
  );

  return {
    history,
    isLoading,
    isDirty,
    isSetupComplete,
    updateHistory,
    saveNow
  };
}