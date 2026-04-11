"use client";

import React from 'react';
import { ModuleAccessGuard } from './ModuleAccessGuard';

type ModulePageGuardProps = {
  resource: string;
  action: string;
  children: React.ReactNode;
};

export function ModulePageGuard({ resource, action, children }: ModulePageGuardProps) {
  return (
    <ModuleAccessGuard resource={resource} action={action}>
      {children}
    </ModuleAccessGuard>
  );
}
