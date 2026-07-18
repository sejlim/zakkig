'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ChartBar,
  ClipboardText,
  ForkKnife,
  Gear,
  SignOut,
  Globe,
  List
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button, Avatar, Separator as Separator } from "@heroui/react"
import { useTranslation } from '@/lib/i18n'
import { useLanguageStore } from '@/store/language-store'
import { useSidebarStore } from '@/store/sidebar-store'
import type { Organization } from '@/lib/types'
import type { Models } from 'node-appwrite'
import Image from 'next/image'
import { getImagePreviewUrl } from '@/lib/appwrite/client'
import { signOutAction } from '@/actions/auth-actions'

interface DashboardShellProps {
  organization: Organization | null
  user: Models.User<Models.Preferences>
  children: React.ReactNode
}

export function DashboardShell({ organization, user, children }: DashboardShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()
  const { locale, setLocale } = useLanguageStore()
  const { isExpanded } = useSidebarStore()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  
  const zakkigUrl = locale === 'de' ? 'https://www.zakkig.de' : 'https://www.zakkig.de/en'

  const navItems = [
    {
      label: t('overview'),
      href: `/dashboard/${organization?.$id ?? 'new'}/overview`,
      icon: ChartBar,
    },
    {
      label: t('orders'),
      href: `/dashboard/${organization?.$id ?? 'new'}/orders`,
      icon: ClipboardText,
    },
    {
      label: t('menu'),
      href: `/dashboard/${organization?.$id ?? 'new'}/menu`,
      icon: ForkKnife,
    },
    {
      label: t('settings'),
      href: `/dashboard/${organization?.$id ?? 'new'}/settings`,
      icon: Gear,
    },
  ]

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-background md:relative print:hidden",
          isExpanded ? "w-64" : "w-16",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className={cn("flex h-16 items-center px-4 border-b shrink-0", (isExpanded || isMobileOpen) ? "justify-between" : "justify-center")}>
          {(isExpanded || isMobileOpen) ? (
            <Link href={zakkigUrl} target="_blank" rel="noopener noreferrer" className="overflow-hidden">
              <Image src="https://www.zakkig.de/full.svg" alt="zakkig logo" width={100} height={24} className="h-6 w-auto" />
            </Link>
          ) : (
            <Link href={zakkigUrl} target="_blank" rel="noopener noreferrer" className="mx-auto">
              <Image src="https://www.zakkig.de/icon.svg" alt="zakkig icon" width={24} height={24} className="h-6 w-6" />
            </Link>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-2">
          <div className="px-3">
            {isExpanded && (
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {t('dashboard')}
              </p>
            )}
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      isExpanded ? "w-full justify-start" : "mx-auto"
                    )}
                    isIconOnly={!isExpanded}
                    aria-label={!isExpanded ? item.label : undefined}
                    onPress={() => {
                      setIsMobileOpen(false)
                      router.push(item.href)
                    }}
                  >
                    <item.icon weight={isActive ? 'fill' : 'regular'} className="h-5 w-5 shrink-0" />
                    {isExpanded && <span className="ml-2">{item.label}</span>}
                  </Button>
                )
              })}
            </nav>
          </div>
        </div>

        <div className="border-t p-4 flex flex-col gap-4 shrink-0">
          <div className={cn("flex items-center gap-3", !isExpanded && "justify-center")}>
            <Avatar className="h-10 w-10 shrink-0">
              <Avatar.Image src={organization?.logoFileId ? getImagePreviewUrl(organization.logoFileId) : undefined} alt={organization?.name ?? 'Z'} />
              <Avatar.Fallback>{organization?.name?.charAt(0) ?? 'Z'}</Avatar.Fallback>
            </Avatar>
            {isExpanded && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="truncate font-semibold text-sm">{organization?.name ?? 'Zakkig'}</span>
                <span className="truncate text-xs text-muted-foreground">{user.name || user.email}</span>
              </div>
            )}
          </div>
          
          <div className={cn("flex items-center gap-2", !isExpanded ? "flex-col" : "justify-between")}>
            <form action={signOutAction} className={cn(!isExpanded && "w-full flex justify-center")}>
              <Button type="submit" variant="ghost" size="sm" isIconOnly={!isExpanded} className={cn(isExpanded && "w-full justify-start")}>
                <SignOut />
                {isExpanded && <span className="ml-2">{t('signOut')}</span>}
              </Button>
            </form>
            <Button 
              variant="ghost" 
              size="sm" 
              isIconOnly={!isExpanded}
              onPress={() => setLocale(locale === 'de' ? 'en' : 'de')}
            >
              <Globe />
              {isExpanded && <span className="ml-2">{locale.toUpperCase()}</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:hidden print:hidden">
          <Link href={zakkigUrl} target="_blank" rel="noopener noreferrer">
            <Image src="https://www.zakkig.de/full.svg" alt="Zakkig" width={110} height={28} className="h-7 w-auto" />
          </Link>
          <Button variant="ghost" isIconOnly onPress={() => setIsMobileOpen(true)}>
            <List className="h-6 w-6" />
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
