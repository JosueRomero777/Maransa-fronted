import React, { createContext, useContext, useState } from 'react';

interface DrawerContextType {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export const DrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <DrawerContext.Provider value={{ mobileOpen, setMobileOpen }}>
      {children}
    </DrawerContext.Provider>
  );
};

export const useDrawer = () => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer debe ser usado dentro de DrawerProvider');
  }
  return context;
};
