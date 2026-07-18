'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChartBar,
  ClipboardText,
  ForkKnife,
  Gear,
  SignOut,
  Globe,
  CaretLeft,
  CaretRight,
  List
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button, Avatar, Separator as Separator } from "@heroui/react"
import { useTranslation } from '@/lib/i18n'
import { useLanguageStore } from '@/store/language-store'
import type { Organization } from '@/lib/types'
import type { Models } from 'node-appwrite'
import Image from 'next/image'
import { getImagePreviewUrl } from '@/lib/appwrite/client'
import { signOutAction } from '@/actions/auth-actions'

interface DashboardShellProps {
  organization: Organization
  user: Models.User<Models.Preferences>
  children: React.ReactNode
}

export function DashboardShell({ organization, user, children }: DashboardShellProps) {
  const pathname = usePathname()
  const { t } = useTranslation()
  const { locale, setLocale } = useLanguageStore()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  
  const zakkigUrl = locale === 'de' ? 'https://zakkig.de' : 'https://zakkig.de/en'

  const navItems = [
    {
      label: t('overview'),
      href: `/dashboard/${organization.$id}/overview`,
      icon: ChartBar,
    },
    {
      label: t('orders'),
      href: `/dashboard/${organization.$id}/orders`,
      icon: ClipboardText,
    },
    {
      label: t('menu'),
      href: `/dashboard/${organization.$id}/menu`,
      icon: ForkKnife,
    },
    {
      label: t('settings'),
      href: `/dashboard/${organization.$id}/settings`,
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
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-background transition-all duration-300 md:relative print:hidden",
          isExpanded ? "w-64" : "w-16",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b shrink-0">
          {(isExpanded || isMobileOpen) ? (
            <Link href={zakkigUrl} target="_blank" rel="noopener noreferrer" className="overflow-hidden">
              <Image src="/full.svg" alt="zakkig logo" width={100} height={24} className="h-6 w-auto" />
            </Link>
          ) : (
            <Link href={zakkigUrl} target="_blank" rel="noopener noreferrer" className="mx-auto">
              <Image src="/icon.svg" alt="zakkig icon" width={24} height={24} className="h-6 w-6" />
            </Link>
          )}
          <Button
            variant="light"
            size="sm"
            isIconOnly
            className="hidden md:flex ml-auto"
            onPress={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <CaretLeft /> : <CaretRight />}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-2">
          <div className="px-3">
            <p className={cn("text-xs font-medium text-muted-foreground mb-2", !isExpanded && "text-center")}>
              {isExpanded ? t('dashboard') : "..."}
            </p>
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground",
                      !isExpanded && "justify-center px-0"
                    )}
                    title={!isExpanded ? item.label : undefined}
                  >
                    <item.icon weight={isActive ? 'fill' : 'regular'} className="h-5 w-5 shrink-0" />
                    {isExpanded && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        <div className="border-t p-4 flex flex-col gap-4 shrink-0">
          <div className={cn("flex items-center gap-3", !isExpanded && "justify-center")}>
            <Avatar 
              src={organization.logoFileId ? getImagePreviewUrl(organization.logoFileId) : undefined}
              name={organization.name.charAt(0)}
              className="h-10 w-10 shrink-0"
            />
            {isExpanded && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="truncate font-semibold text-sm">{organization.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.name || user.email}</span>
              </div>
            )}
          </div>
          
          <div className={cn("flex items-center gap-2", !isExpanded ? "flex-col" : "justify-between")}>
            <form action={signOutAction} className={cn(!isExpanded && "w-full flex justify-center")}>
              <Button type="submit" variant="light" size="sm" isIconOnly={!isExpanded} className={cn(isExpanded && "w-full justify-start")}>
                <SignOut />
                {isExpanded && <span className="ml-2">{t('signOut')}</span>}
              </Button>
            </form>
            <Button 
              variant="light" 
              size="sm" 
              isIconOnly={!isExpanded}
              onPress={() => setLocale(locale === 'de' ? 'en' : 'de')}
            >
              <Globe />
              {isExpanded && <span className="ml-2">{locale === 'de' ? 'EN' : 'DE'}</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:hidden print:hidden">
          <Link href={zakkigUrl} target="_blank" rel="noopener noreferrer">
            <Image src="/full.svg" alt="Zakkig" width={110} height={28} className="h-7 w-auto" />
          </Link>
          <Button variant="light" isIconOnly onPress={() => setIsMobileOpen(true)}>
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
