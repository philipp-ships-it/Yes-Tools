import React from 'react';
import { InvasiveChangeModal, InvasiveChangeItem, InvasiveChangeModalProps } from './InvasiveChangeModal';

export type ChangeRequestItem = InvasiveChangeItem;

export interface ChangeRequestModalProps extends Omit<InvasiveChangeModalProps, 'riskLevel'> {
  riskLevel?: 'high' | 'medium' | 'low';
}

/**
 * ChangeRequestModal - A reusable pre-execution safeguard modal component that intercepts
 * file operations, script executions, or code transformations.
 * Lists all planned additions, deletions, modifications, transpiles, and replacements in
 * an interactive checklist with individual selection, diff views, and approve/cancel actions.
 */
export const ChangeRequestModal: React.FC<ChangeRequestModalProps> = ({
  riskLevel = 'medium',
  ...props
}) => {
  return (
    <InvasiveChangeModal
      {...props}
      riskLevel={riskLevel}
    />
  );
};

export default ChangeRequestModal;
