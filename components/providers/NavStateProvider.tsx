'use client'
 
import * as Constants from 'config/constants';
import { createContext, useContext, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';

import type { CategoryId } from 'common/params';

type NavStateContextType = {
  category: CategoryId;
  setCategory: (category: CategoryId) => void;
};

type NavStateProviderParams = {
  children: React.ReactNode;
};

// Pattern from https://stackoverflow.com/a/74174425
const NavStateContext = createContext<NavStateContextType | undefined>(undefined);

export function useNavState() {
  const context = useContext(NavStateContext);
  if (context === undefined) {
    throw new Error('Missing <NavStateProvider>')
  }

  return context;
}

function extractCategory(pathname: string) {
  const splits = pathname.split('/');
  if (splits.length < 2) {
    return undefined;
  }

  const possibleCategory = splits[1];
  if (!Constants.ALL_CATEGORIES.includes(possibleCategory)) {
    return undefined;
  }

  return possibleCategory;
}
 
export default function NavStateProvider({children}: NavStateProviderParams) {
  const pathname = usePathname();

  const [category, setCategory] = useState<CategoryId>(extractCategory(pathname) ?? Constants.DEFAULT_CATEGORY);

  const value = useMemo(() => ({category, setCategory}), [category]);
 
  return (
    <NavStateContext.Provider value={value}>
      {useMemo(() => (
        <>
          {children}
        </>
      ), [children])}
    </NavStateContext.Provider>
  )
}
