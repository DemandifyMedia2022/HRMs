'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import type { Icon } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';

export type UserRole = 'superadmin' | 'admin' | 'user' | 'hr';

export type NavMainItem = {
  title: string;
  url: string;
  icon?: Icon;
  target?: string
  children?: { title: string; url: string; icon?: Icon; target?: string }[];
};

export type NavSecondaryItem = {
  title: string;
  url: string;
  target?: string
  icon: Icon;
};

export type DocumentItem = {
  name: string;
  url: string;
  icon: Icon;
  target?: string
  children?: { name: string; url: string; icon?: Icon; target?: string }[];
};

export type SidebarData = {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  navMain: NavMainItem[];
  navSecondary: NavSecondaryItem[];
  documents: DocumentItem[];
};

export type SidebarConfig = {
  role: UserRole;
  data?: Partial<SidebarData>;
};

type Ctx = {
  role: UserRole;
  dataOverrides?: Partial<SidebarData>;
  setConfig: (cfg: SidebarConfig) => void;
};

const SidebarConfigContext = createContext<Ctx | null>(null);

export function SidebarConfigProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('user');
  const [dataOverrides, setDataOverrides] = useState<Partial<SidebarData> | undefined>(undefined);

  const setConfig = React.useCallback((cfg: SidebarConfig) => {
    // console.log('🔧 SidebarConfigProvider setConfig called with:', {
    //   role: cfg.role,
    //   hasData: !!cfg.data,
    //   userData: cfg.data?.user
    // });
    setRole(cfg.role);
    setDataOverrides(cfg.data);
  }, []);

  const value = useMemo<Ctx>(() => {
    // console.log('📦 SidebarConfigProvider context value updated:', {
    //   role,
    //   hasDataOverrides: !!dataOverrides,
    //   userInOverrides: dataOverrides?.user
    // });
    return {
      role,
      dataOverrides,
      setConfig
    };
  }, [role, dataOverrides, setConfig]);

  return <SidebarConfigContext.Provider value={value}>{children}</SidebarConfigContext.Provider>;
}

export function useSidebarConfig() {
  const ctx = useContext(SidebarConfigContext);
  if (!ctx) throw new Error('useSidebarConfig must be used within SidebarConfigProvider');
  return ctx;
}

// Helper component for pages to set the role/config
export function SidebarConfig({ role, data }: SidebarConfig) {
  const { setConfig } = useSidebarConfig();
  const { user, loading } = useAuth();

  React.useEffect(() => {
    // console.log('🔄 SidebarConfig effect triggered with:', { role, data, loading, hasAuthUser: !!user });
    // Build user block from auth if not provided, so we don't show stale placeholder
    const merged: Partial<SidebarData> | undefined = ((): Partial<SidebarData> | undefined => {
      const base = data ? { ...data } : {};
      if (!base.user && user) {
        const initials =
          (user.name || user.email || '?')
            .split(/\s+/)
            .filter(Boolean)
            .map(s => s[0]?.toUpperCase())
            .slice(0, 2)
            .join('') || 'U';
        (base as any).user = {
          name: user.name || 'User',
          email: user.email || '',
          avatar: user.profile_image
            ? (user.profile_image.startsWith('http') ? user.profile_image : `/api/files/${user.profile_image}`)
            : initials
        };
      }
      return base;
    })();
    setConfig({ role, data: merged });
  }, [role, data, setConfig, user, loading]);

  return null;
}
