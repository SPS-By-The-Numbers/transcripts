'use client'
 
import { createContext, useState, useMemo } from 'react';

type DialogControl = {
  mode: string;
  params?: string;
};

type Type = {
  actionDialogControl : ActionDialogControl | undefined;
  setActionDialogControl: (vc: ActionDialogControl | undefined) => void;
};

type DialogProviderParams = {
  children: React.ReactNode;
};

// Pattern from https://stackoverflow.com/a/74174425
export const ActionDialogControlContext = createContext<ActionDialogControlContextType>({
  actionDialogControl: undefined,
  setActionDialogControl: () => {},
});
 
export default function ActionDialogControlProvider({children}: DialogProviderParams) {
  const [actionDialogControl, setActionDialogControl] = useState<ActionDialogControl | undefined>(undefined);

  const value = useMemo(() => ({ actionDialogControl, setActionDialogControl }), [actionDialogControl]);
 
  return (
    <ActionDialogControlContext.Provider value={value}>
      {useMemo(() => (
        <>
          {children}
        </>
      ), [children])}
    </ActionDialogControlContext.Provider>
  )
}
