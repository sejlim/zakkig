'use client'

import { useState, useEffect, useMemo, useRef, useTransition } from 'react'
import { Copy, Plus, Trash, LinkSimple, ChartLineUp, ShoppingBag, Printer, Scissors } from '@phosphor-icons/react'
import { toast, Card,   Button, Chip as Badge, Separator, Input, Tabs, Tab, Switch } from "@heroui/react"
import Image from 'next/image'
import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useTranslation, formatPrice } from '@/lib/i18n'
import { createKitchenSessionAction, deleteKitchenSessionAction } from '@/actions/order-actions'
import { toggleFeatureAction } from '@/actions/settings-actions'
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
        toast.danger(result.error as string)
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
      <div>
        <h1 className="text-2xl font-semibold">{t('overview')}</h1>
        {organization.address && (
          <p className="text-sm text-muted-foreground mt-1">{organization.address}</p>
        )}
      </div>

      <Card>
        <Card.Header>
          <h3 className="text-lg font-semibold">Statistik</h3>
        </Card.Header>
        <Card.Content className="p-6 pt-0">
          <div className="flex flex-col gap-6">
            <Tabs selectedKey={period} onSelectionChange={(k) => setPeriod(k as TimePeriod)} className="w-full sm:w-fit">
              <Tabs.ListContainer>
                <Tabs.List>
                  <Tabs.Tab id="24h"><span className="hidden sm:inline">{t('last24h')}</span><span className="sm:hidden">24h</span><Tabs.Indicator /></Tabs.Tab>
                  <Tabs.Tab id="30d"><span className="hidden sm:inline">{t('last30d')}</span><span className="sm:hidden">30d</span><Tabs.Indicator /></Tabs.Tab>
                  <Tabs.Tab id="90d"><span className="hidden sm:inline">{t('last90d')}</span><span className="sm:hidden">90d</span><Tabs.Indicator /></Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>
            </Tabs>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="flex flex-col">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="text-sm font-medium">Anzahl an Bestellungen</div>
                  <ShoppingBag className="text-muted-foreground w-4 h-4" />
                </div>
                <div className="text-3xl font-bold">{totalOrders}</div>
                <div className="h-[80px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <Line
                        type="monotone"
                        dataKey="orders"
                        stroke="hsl(var(--heroui-primary, 212 100% 47%))"
                        strokeWidth={3}
                        dot={false}
                      />
                      <Tooltip cursor={false} content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded-md shadow-sm p-2 text-sm">
                              <span className="font-medium">{payload[0].value}</span>
                            </div>
                          )
                        }
                        return null
                      }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="text-sm font-medium">{t('netRevenue')}</div>
                  <ChartLineUp className="text-muted-foreground w-4 h-4" />
                </div>
                <div className="text-3xl font-bold">{formatPrice(Math.round(netRevenue))}</div>
                <div className="h-[80px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--heroui-primary, 212 100% 47%))"
                        strokeWidth={3}
                        dot={false}
                      />
                      <Tooltip 
                        cursor={false} 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border rounded-md shadow-sm p-2 text-sm">
                                <span className="font-medium">{formatPrice((payload[0].value as number) * 100)}</span>
                              </div>
                            )
                          }
                          return null
                        }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <Card.Header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-0 pb-4">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-lg font-semibold">{t('qrCodeGenerator')}</h3>
              <p className="text-sm text-muted-foreground max-w-lg text-balance leading-relaxed">
                {qrType === 'to-go' ? t('qrCodeAdminDescToGo') : t('qrCodeAdminDescToStay')}
              </p>
            </div>
            <Button onPress={handlePrint} variant="outline" className="shrink-0 mt-1 sm:mt-0 w-full sm:w-auto h-10 px-5 rounded-3xl gap-2">
              <Printer />
              {t('printQrCode')}
            </Button>
          </Card.Header>
          <Card.Content>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 min-h-[36px]">
                <Tabs
                  selectedKey={qrType}
                  onSelectionChange={(k) => setQrType(k as 'to-go' | 'to-stay')}
                  className="w-full sm:w-auto"
                >
                  <Tabs.ListContainer>
                    <Tabs.List>
                      <Tabs.Tab id="to-go">{t('toGo')}<Tabs.Indicator /></Tabs.Tab>
                      <Tabs.Tab id="to-stay">{t('toStay')}<Tabs.Indicator /></Tabs.Tab>
                    </Tabs.List>
                  </Tabs.ListContainer>
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
                      isSelected={qrType === 'to-go' ? isToGo : isToStay}
                      onChange={(checked: boolean) => handleToggleFeature(qrType, checked)}
                      isDisabled={isPending}
                      size="sm"
                    >
                      <Switch.Content className="cursor-pointer">
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                      </Switch.Content>
                    </Switch>
                  </div>
                </div>
              </div>

              <Card className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 md:gap-12 p-6 bg-white shadow-sm w-full">
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
                      <Image src="/full.svg" alt="Zakkig" width={110} height={28} className="w-[110px] h-auto" />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-0 pb-4">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-lg font-semibold">{t('kitchenSessions')}</h3>
              <p className="text-sm text-muted-foreground max-w-lg text-balance leading-relaxed">
                {t('kitchenSessionsDesc')}
              </p>
            </div>
            <Button onPress={handleCreateSession} size="sm" className="shrink-0 mt-1 sm:mt-0 w-full sm:w-auto">
              <Plus data-icon="inline-start" />
              {t('createSession')}
            </Button>
          </Card.Header>
          <Card.Content>
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
                        onPress={() => copyKitchenLink(session.token)}
                      >
                        <Copy data-icon="inline-start" />
                        {t('copyLink')}
                      </Button>
                      <Button
                        variant="danger-soft"
                        size="sm"
                        isIconOnly
                        onPress={() => handleDeleteSession(session.$id)}
                      >
                        <Trash />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card.Content>
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
                <Image src="/full.svg" alt="Zakkig" width={110} height={28} className="w-[110px] h-auto" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
    </>
  )
}
