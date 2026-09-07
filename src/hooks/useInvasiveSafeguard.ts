import { useState, useCallback } from 'react';
import { InvasiveChangeItem } from '../components/InvasiveChangeModal';

export interface SafeguardRequest {
  title: string;
  operationCategory: string;
  riskLevel: 'high' | 'medium' | 'low';
  summaryDescription: string;
  items: InvasiveChangeItem[];
  onApprove: (selectedIds: string[]) => void;
}

export function useInvasiveSafeguard() {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    operationCategory: string;
    riskLevel: 'high' | 'medium' | 'low';
    summaryDescription: string;
    items: InvasiveChangeItem[];
    onConfirm: (selectedIds: string[]) => void;
  }>({
    isOpen: false,
    title: '',
    operationCategory: '',
    riskLevel: 'medium',
    summaryDescription: '',
    items: [],
    onConfirm: () => {},
  });

  const requestApproval = useCallback((request: SafeguardRequest) => {
    setModalState({
      isOpen: true,
      title: request.title,
      operationCategory: request.operationCategory,
      riskLevel: request.riskLevel,
      summaryDescription: request.summaryDescription,
      items: request.items,
      onConfirm: (selectedIds: string[]) => {
        request.onApprove(selectedIds);
        setModalState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  }, []);

  const closeSafeguard = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    modalState,
    requestApproval,
    closeSafeguard,
  };
}
