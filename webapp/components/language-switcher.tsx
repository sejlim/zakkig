'use client'

import { useLanguageStore } from '@/store/language-store'
import { Button } from '@heroui/react'
import { Globe } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

export function LanguageSwitcher({ 
  className,
  variant = "outline",
  size = "default",
}: { 
  className?: string
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
}) {
  const { locale, setLocale } = useLanguageStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleLanguage = () => {
    setLocale(locale === 'de' ? 'en' : 'de')
  }

  if (!mounted) {
    return (
      <Button variant={variant} size={size} className={`gap-2 ${className || ''}`} disabled>
        <Globe data-icon="inline-start" weight="regular" className={size === 'icon-sm' ? 'w-4 h-4' : ''} />
        <span>{locale === 'de' ? 'EN' : 'DE'}</span>
      </Button>
    )
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={`gap-2 ${className || ''}`} 
      onClick={toggleLanguage}
    >
      <Globe data-icon="inline-start" weight="regular" className={size === 'icon-sm' ? 'w-4 h-4' : ''} />
      <span>{locale === 'de' ? 'EN' : 'DE'}</span>
    </Button>
  )
}
