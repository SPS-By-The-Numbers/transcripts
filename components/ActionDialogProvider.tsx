'use client'
 
import { createContext, useContext, useState, useMemo } from 'react';

type ActionDialogMode = {
  mode: string;
  params?: string;
};

type ActionDialogModeType = {
  actionDialogMode : ActionDialogMode | undefined;
  setActionDialogMode: (x: ActionDialogMode | undefined) => void;
};

type DialogProviderParams = {
  children: React.ReactNode;
};

// Pattern from https://stackoverflow.com/a/74174425
const ActionDialogModeContext = createContext<ActionDialogModeContextType | undefined>(undefined);

export function useActionDialog() {
  const context = useContext(ActionDialogModeContext);
  if (context === undefined) {
    throw new Error('Missing <ActionDialogModeProvider>')
  }

  return context;
}
 
export default function ActionDialogModeProvider({children}: DialogProviderParams) {
  const [actionDialogMode, setActionDialogMode] = useState<ActionDialogMode | undefined>(undefined);

  const value = useMemo(() => ({ actionDialogMode, setActionDialogMode }), [actionDialogMode]);
 
  return (
    <ActionDialogModeContext.Provider value={value}>
      {useMemo(() => (
        <>
          {children}
        </>
      ), [children])}
    </ActionDialogModeContext.Provider>
  )
}
