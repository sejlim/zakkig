'use client'

import { useState, useEffect, useMemo, useRef, useTransition } from 'react'
import { Copy, Plus, Trash, LinkSimple, ChartLineUp, ShoppingBag, Printer, Scissors, CaretDown, ClipboardText, ForkKnife, Gear } from '@phosphor-icons/react'
import { toast } from "sonner"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from 'next/link'
import Image from 'next/image'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useTranslation, formatPrice } from '@/lib/i18n'
import { createKitchenSessionAction, deleteKitchenSessionAction } from '@/actions/order-actions'
import { toggleFeatureAction } from '@/actions/settings-actions'
import { PageHeader } from './page-header'
import type { Organization, Order, KitchenSession } from '@/lib/types'

interface OverviewContentProps {
  organization: Organization
  orders: Order[]
  kitchenSessions: KitchenSession[]
}

function StyledQRCode({ value, size }: { value: string, size: number }) {
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!ref.current) return
    
    import('qr-code-styling').then(({ default: QRCodeStyling }) => {
      const qrCode = new QRCodeStyling({
        width: size,
        height: size,
        type: "svg",
        data: value,
        image: "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20110%2038%22%20width%3D%22110%22%20height%3D%2238%22%3E%3C%2Fsvg%3E",
        dotsOptions: {
          color: "#000000",
          type: "rounded"
        },
        cornersSquareOptions: {
          type: "extra-rounded",
          color: "#000000"
        },
        cornersDotOptions: {
          type: "dot",
          color: "#000000"
        },
        qrOptions: {
          errorCorrectionLevel: "H"
        },
        imageOptions: {
          crossOrigin: "anonymous",
          margin: size > 200 ? 25 : 12,
          imageSize: 0.55
        }
      })
      
      if (ref.current) {
        ref.current.innerHTML = ''
        qrCode.append(ref.current)
      }
    })
  }, [value, size])
  
  return <div ref={ref} className="flex items-center justify-center" />
}

type TimePeriod = '24h' | '30d' | '90d'

function filterOrdersByPeriod(orders: Order[], period: TimePeriod): Order[] {
  const now = Date.now()
  const ms = {
    '24h': 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
  }
  return orders.filter((o) => now - new Date(o.$createdAt).getTime() < ms[period])
}

export function OverviewContent({ organization, orders, kitchenSessions }: OverviewContentProps) {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<TimePeriod>('30d')
  const [sessions, setSessions] = useState(kitchenSessions)
  const [qrType, setQrType] = useState<'to-go' | 'to-stay'>('to-go')
  const [tableNum, setTableNum] = useState('1')

  const [isPending, startTransition] = useTransition()
  const [isToGo, setIsToGo] = useState(organization.isToGoEnabled ?? true)
  const [isToStay, setIsToStay] = useState(organization.isToStayEnabled ?? true)

  useEffect(() => {
    setIsToGo(organization.isToGoEnabled ?? true)
    setIsToStay(organization.isToStayEnabled ?? true)
  }, [organization.isToGoEnabled, organization.isToStayEnabled])

  const handleToggleFeature = (type: 'to-go' | 'to-stay', checked: boolean) => {
    if (type === 'to-go') setIsToGo(checked)
    else setIsToStay(checked)

    startTransition(async () => {
      const result = await toggleFeatureAction(organization.$id, type, checked)
      if (result.error) {
        toast.error(result.error as string)
        if (type === 'to-go') setIsToGo(!checked)
        else setIsToStay(!checked)
      } else {
        toast.success(checked ? 'Funktion aktiviert' : 'Funktion deaktiviert')
      }
    })
  }
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setSessions(kitchenSessions)
  }, [kitchenSessions])

  const filtered = filterOrdersByPeriod(orders, period)
  const totalOrders = filtered.length
  const totalRevenue = filtered.reduce((sum, o) => sum + o.total, 0)
  const netRevenue = totalRevenue * 0.975

  const baseUrl = mounted && typeof window !== 'undefined' ? window.location.origin : 'https://app.zakkig.de'

  const chartData = useMemo(() => {
    if (!mounted) return []
    const now = new Date()
    const dataMap = new Map<string, { orders: number; revenue: number }>()
    
    if (period === '24h') {
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000)
        dataMap.set(`${d.getHours()}:00`, { orders: 0, revenue: 0 })
      }
      filtered.forEach(o => {
        const d = new Date(o.$createdAt)
        const key = `${d.getHours()}:00`
        if (dataMap.has(key)) {
          const entry = dataMap.get(key)!
          entry.orders++
          entry.revenue += o.total * 0.975 / 100
        }
      })
    } else {
      const days = period === '30d' ? 30 : 90
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const key = `${d.getDate()}.${d.getMonth() + 1}.`
        dataMap.set(key, { orders: 0, revenue: 0 })
      }
      filtered.forEach(o => {
        const d = new Date(o.$createdAt)
        const key = `${d.getDate()}.${d.getMonth() + 1}.`
        if (dataMap.has(key)) {
          const entry = dataMap.get(key)!
          entry.orders++
          entry.revenue += o.total * 0.975 / 100
        }
      })
    }
    
    return Array.from(dataMap.entries()).map(([time, data]) => ({
      time,
      orders: data.orders,
      revenue: data.revenue,
    }))
  }, [filtered, period, mounted])

  const qrUrl =
    qrType === 'to-go'
      ? `${baseUrl}/to-go/${organization.$id}`
      : `${baseUrl}/to-stay/${organization.$id}?table=${tableNum || '1'}`

  async function handleCreateSession() {
    const result = await createKitchenSessionAction(organization.$id)
    if (result.success && result.session) {
      setSessions((prev) => [result.session as KitchenSession, ...prev])
      toast.success(t('linkCopied'))
    }
  }

  async function handleDeleteSession(sessionId: string) {
    await deleteKitchenSessionAction(sessionId, organization.$id)
    setSessions((prev) => prev.filter((s) => s.$id !== sessionId))
  }

  function copyKitchenLink(token: string) {
    const link = `${baseUrl}/orders/${organization.$id}?token=${token}`
    navigator.clipboard.writeText(link)
    toast.success(t('linkCopied'))
  }

  function handlePrint() {
    setTimeout(() => {
      window.print()
    }, 150)
  }

  return (
    <>
    <div className="flex flex-col gap-6 print:hidden">
      <PageHeader 
        title={t('overview')} 
        description={organization.address || undefined} 
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 gap-4">
          <h3 className="text-lg font-semibold">Verkaufsstatistik</h3>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="secondary" size="sm" />}>
              {period === '24h' ? t('last24h') : period === '30d' ? t('last30d') : t('last90d')}
              <CaretDown className="ml-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setPeriod('24h')}>
                {t('last24h')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPeriod('30d')}>
                {t('last30d')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPeriod('90d')}>
                {t('last90d')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="p-6 pt-4">
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap gap-12">
              <div className="flex flex-col">
                <div className="text-3xl font-bold">{totalOrders}</div>
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  Anzahl Bestellungen
                </div>
              </div>
              <div className="flex flex-col">
                <div className="text-3xl font-bold">{formatPrice(Math.round(netRevenue))}</div>
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  {t('netRevenue')}
                </div>
              </div>
            </div>

            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.5 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.5 }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'currentColor', opacity: 0.05 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-md shadow-sm p-3 flex flex-col gap-1 text-sm">
                            <span className="font-medium text-muted-foreground">{payload[0].payload.name}</span>
                            <span className="font-bold text-primary">{payload[0].value} Bestellungen</span>
                          </div>
                        )
                      }
                      return null
                    }} 
                  />
                  <Bar
                    dataKey="orders"
                    fill="hsl(var(--heroui-primary, 212 100% 47%))"
                    radius={[4, 4, 4, 4]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="h-full flex flex-col">
        <CardHeader>
          <h3 className="text-lg font-semibold">{t('quickLinks') || 'Quick Links'}</h3>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="flex flex-col gap-3 flex-1">
            <Link href={`/dashboard/${organization.$id}/orders`} className="flex items-center gap-3 p-3 bg-background border rounded-xl hover:bg-muted/50 transition-colors shadow-sm">
              <div className="bg-primary/10 text-primary p-2 rounded-full shrink-0">
                <ClipboardText className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{t('orders')}</span>
                <span className="text-xs text-muted-foreground">Alle Bestellungen auf einen Blick</span>
              </div>
            </Link>
            <Link href={`/dashboard/${organization.$id}/menu`} className="flex items-center gap-3 p-3 bg-background border rounded-xl hover:bg-muted/50 transition-colors shadow-sm">
              <div className="bg-primary/10 text-primary p-2 rounded-full shrink-0">
                <ForkKnife className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{t('menu')}</span>
                <span className="text-xs text-muted-foreground">Kategorien und Produkte bearbeiten</span>
              </div>
            </Link>
            <Link href={`/dashboard/${organization.$id}/settings`} className="flex items-center gap-3 p-3 bg-background border rounded-xl hover:bg-muted/50 transition-colors shadow-sm">
              <div className="bg-primary/10 text-primary p-2 rounded-full shrink-0">
                <Gear className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{t('settings')}</span>
                <span className="text-xs text-muted-foreground">Einstellungen für deinen Shop</span>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-0 pb-4">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-lg font-semibold">{t('qrCodeGenerator')}</h3>
              <p className="text-sm text-muted-foreground max-w-lg text-balance leading-relaxed">
                {qrType === 'to-go' ? t('qrCodeAdminDescToGo') : t('qrCodeAdminDescToStay')}
              </p>
            </div>
            <Button onClick={handlePrint} variant="outline" className="shrink-0 mt-1 sm:mt-0 w-full sm:w-auto h-10 px-5 rounded-3xl gap-2">
              <Printer />
              {t('printQrCode')}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 min-h-[36px]">
                <Tabs
                  value={qrType}
                  onValueChange={(k) => setQrType(k as 'to-go' | 'to-stay')}
                  className="w-full sm:w-auto"
                >
                  <TabsList>
                    <TabsTrigger value="to-go">{t('toGo')}</TabsTrigger>
                    <TabsTrigger value="to-stay">{t('toStay')}</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  {qrType === 'to-stay' && (
                    <div className="flex items-center justify-center sm:justify-start gap-3 rounded-3xl border border-input bg-background pl-4 pr-1.5 h-10 w-full sm:w-auto">
                      <label htmlFor="table-number" className="whitespace-nowrap font-medium text-sm text-muted-foreground m-0 cursor-text">
                        {t('tableNumber')}
                      </label>
                      <Input
                        id="table-number"
                        value={tableNum}
                        onChange={(e) => setTableNum(e.target.value)}
                        onBlur={() => {
                          if (!tableNum || tableNum.trim() === '') {
                            setTableNum('1')
                          }
                        }}
                        placeholder="1"
                        maxLength={4}
                        className="w-16 h-7 text-center rounded-3xl"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-center sm:justify-start gap-3 rounded-3xl border border-input bg-background pl-4 pr-2 h-10 w-full sm:w-auto">
                    <label htmlFor="feature-toggle" className="whitespace-nowrap font-medium text-sm text-muted-foreground m-0 cursor-pointer">
                      Aktivieren
                    </label>
                    <Switch
                      id="feature-toggle"
                      checked={qrType === 'to-go' ? isToGo : isToStay}
                      onCheckedChange={(checked: boolean) => handleToggleFeature(qrType, checked)}
                      disabled={isPending}
                    />
                  </div>
                </div>
              </div>

              <Card className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 md:gap-12 p-6 bg-white shadow-sm w-full print:hidden">
                <div className="flex flex-col items-center md:items-start gap-4 text-center md:text-left max-w-sm">
                  <p className="text-2xl md:text-3xl font-black leading-tight text-black whitespace-pre-line">
                    {t('qrCodeDesc1')}
                  </p>
                  <p className="text-sm text-muted-foreground max-w-[300px] leading-relaxed">
                    {t('qrCodeSublineBase')}
                    {' '}
                    {qrType === 'to-stay' ? t('qrCodeSublineToStay') : t('qrCodeSublineToGo')}
                  </p>
                </div>

                <div className="flex flex-col items-center w-[220px]">
                  {qrType === 'to-stay' ? (
                    <p className="text-3xl font-black leading-tight text-center">{t('table')} {tableNum || '1'}</p>
                  ) : qrType === 'to-go' ? (
                    <p className="text-3xl font-black leading-tight text-center">{t('pickup')}</p>
                  ) : <div className="h-[36px]" />}
                  
                  <div className="relative bg-white rounded-xl flex items-center justify-center overflow-hidden">
                    <StyledQRCode value={qrUrl} size={220} />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Image src="https://www.zakkig.de/full.svg" alt="Zakkig" width={110} height={28} className="w-[110px] h-auto" />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-0 pb-4">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-lg font-semibold">{t('kitchenSessions')}</h3>
              <p className="text-sm text-muted-foreground max-w-lg text-balance leading-relaxed">
                {t('kitchenSessionsDesc')}
              </p>
            </div>
            <Button onClick={handleCreateSession} size="sm" className="shrink-0 mt-1 sm:mt-0 w-full sm:w-auto">
              <Plus data-icon="inline-start" className="mr-2" />
              {t('createSession')}
            </Button>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noActiveOrders')}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {sessions.map((session) => (
                  <div
                    key={session.$id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <LinkSimple className="text-muted-foreground" />
                      <code className="text-xs text-muted-foreground">
                        {session.token.slice(0, 8)}...
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyKitchenLink(session.token)}
                      >
                        <Copy data-icon="inline-start" className="mr-2" />
                        {t('copyLink')}
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteSession(session.$id)}
                      >
                        <Trash />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    
    <div className="hidden print:flex items-start justify-center bg-white pt-20">
      <div className="relative origin-top print-color-adjust-exact">
        <div className="absolute -top-[14px] left-10 hidden print:block text-gray-400 bg-white px-2 z-10">
          <Scissors size={24} weight="fill" className="-rotate-90" />
        </div>
        <Card className="flex flex-row items-start justify-center gap-12 p-6 bg-white shadow-sm print:shadow-none w-max print:border-dashed print:border-2 print:border-gray-400">
          <div className="flex flex-col gap-4 text-left max-w-sm">
            <p className="text-3xl font-black leading-tight text-black whitespace-pre-line">
              {t('qrCodeDesc1')}
            </p>
            <p className="text-sm text-muted-foreground max-w-[300px] leading-relaxed">
              {t('qrCodeSublineBase')}
              {' '}
              {qrType === 'to-stay' ? t('qrCodeSublineToStay') : t('qrCodeSublineToGo')}
            </p>
          </div>

          <div className="flex flex-col items-center w-[220px]">
            {qrType === 'to-stay' ? (
              <p className="text-3xl font-black leading-tight text-center">{t('table')} {tableNum || '1'}</p>
            ) : qrType === 'to-go' ? (
              <p className="text-3xl font-black leading-tight text-center">{t('pickup')}</p>
            ) : <div className="h-[36px]" />}
            
            <div className="relative bg-white rounded-xl flex items-center justify-center overflow-hidden">
              <StyledQRCode value={qrUrl} size={220} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Image src="https://www.zakkig.de/full.svg" alt="Zakkig" width={110} height={28} className="w-[110px] h-auto" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
    </>
  )
}
