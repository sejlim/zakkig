'use client'

import { useSidebarStore } from '@/store/sidebar-store'
import { Button } from '@heroui/react'
import { CaretLeft, CaretRight, ArrowsClockwise } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

interface PageHeaderProps {
  title: string | React.ReactNode
  description?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  const { isExpanded, toggleSidebar } = useSidebarStore()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="sticky -top-6 z-40 -mx-6 -mt-6 px-6 py-4 bg-background/95 backdrop-blur flex flex-col gap-1 -mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" isIconOnly onPress={toggleSidebar} className="hidden md:flex shrink-0">
            {isExpanded ? <CaretLeft weight="bold" /> : <CaretRight weight="bold" />}
          </Button>
          <h1 className="text-2xl font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {children}
          <Button variant="ghost" size="sm" isIconOnly onPress={handleRefresh} className="shrink-0 text-muted-foreground" isDisabled={isPending}>
            <ArrowsClockwise weight="bold" className={isPending ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground ml-12">{description}</p>
      )}
    </div>
  )
}
