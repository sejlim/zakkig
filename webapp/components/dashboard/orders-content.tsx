'use client'

import { useState } from 'react'
import { MagnifyingGlass, Export, CircleDashed, CookingPot, CheckCircle } from '@phosphor-icons/react'
import { toast, Card, Button, Chip as Badge, Tabs, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/react"
import { useTranslation, formatPrice } from '@/lib/i18n'
import { PageHeader } from './page-header'
import { exportOrdersCSVAction, updateOrderStatusAction } from '@/actions/order-actions'
import type { Order, OrderItem } from '@/lib/types'

interface OrdersContentProps {
  orders: Order[]
  organizationId: string
}

function parseItems(itemsJson: string): OrderItem[] {
  try {
    return JSON.parse(itemsJson)
  } catch {
    return []
  }
}

const statusVariants: Record<string, "default" | "success" | "warning" | "danger" | "accent"> = {
  pending: 'default',
  preparing: 'accent',
  ready: 'success',
  completed: 'default',
}

export function OrdersContent({ orders, organizationId }: OrdersContentProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live')

  const activeOrders = orders.filter((o) => o.status !== 'completed')
  const filteredOrders = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      pending: t('pending'),
      preparing: t('preparing'),
      ready: t('ready'),
      completed: t('completed'),
    }
    return labels[status] || status
  }

  async function handleExportCSV() {
    const result = await exportOrdersCSVAction(organizationId)
    if (result.csv) {
      const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `zakkig-export-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('CSV exportiert')
    }
  }

  async function handleStatusChange(orderId: string, newStatus: string) {
    await updateOrderStatusAction(orderId, newStatus, organizationId)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('orders')}>
        <Button variant="outline" onPress={handleExportCSV}>
          <Export data-icon="inline-start" />
          {t('exportCSV')}
        </Button>
      </PageHeader>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b">
        <button
          type="button"
          onClick={() => setActiveTab('live')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'live'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2">
            {t('liveView')}
            {activeOrders.length > 0 && (
              <Badge size="sm">{activeOrders.length}</Badge>
            )}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('history')}
        </button>
      </div>

      {activeTab === 'live' && (
        <div>
          {activeOrders.length === 0 ? (
            <Card>
              <Card.Content className="py-12 text-center text-muted-foreground">
                {t('noOrders')}
              </Card.Content>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeOrders.map((order) => {
                const items = parseItems(order.items)
                return (
                  <Card key={order.$id}>
                    <Card.Header className="pb-3">
                      <div className="flex items-center justify-between w-full">
                        <h3 className="text-base font-semibold">{order.orderNumber}</h3>
                        <Badge variant={statusVariants[order.status] === 'default' ? undefined : undefined}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <Badge size="sm">
                          {order.type === 'dine-in' ? t('dineIn') : t('takeaway')}
                        </Badge>
                        {order.tableNumber && (
                          <span>{t('table')} {order.tableNumber}</span>
                        )}
                      </div>
                    </Card.Header>
                    <Card.Content>
                      <div className="flex flex-col gap-2">
                        {items.map((item) => (
                          <div key={item.menuItemId} className="flex justify-between text-sm">
                            <span>{item.quantity}× {item.name}</span>
                            <span>{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                        <div className="mt-2 flex items-center justify-between border-t pt-2 font-medium">
                          <span>{t('total')}</span>
                          <span>{formatPrice(order.total)}</span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              className="flex-1"
                              onPress={() => handleStatusChange(order.$id, 'preparing')}
                            >
                              {t('preparing')}
                            </Button>
                          )}
                          {order.status === 'preparing' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="flex-1"
                              onPress={() => handleStatusChange(order.$id, 'ready')}
                            >
                              {t('ready')}
                            </Button>
                          )}
                          {order.status === 'ready' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-1"
                              onPress={() => handleStatusChange(order.$id, 'completed')}
                            >
                              {t('completed')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card.Content>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="flex flex-col gap-4">
          <div className="relative max-w-sm">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          <Card>
            <Table aria-label="Orders history">
              <TableHeader>
                <TableColumn>{t('orderNumber')}</TableColumn>
                <TableColumn>{t('date')}</TableColumn>
                <TableColumn>{t('type')}</TableColumn>
                <TableColumn>{t('items')}</TableColumn>
                <TableColumn className="text-right">{t('total')}</TableColumn>
                <TableColumn>{t('status')}</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-center text-muted-foreground py-8" colSpan={6}>{t('noOrders')}</TableCell>
                  </TableRow>
                ) : filteredOrders.map((order) => {
                  const items = parseItems(order.items)
                  return (
                    <TableRow key={order.$id}>
                      <TableCell className="font-mono text-sm">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <span suppressHydrationWarning>{new Date(order.$createdAt).toLocaleDateString('de-DE')}</span>
                      </TableCell>
                      <TableCell>
                        <Badge size="sm">
                          {order.type === 'dine-in' ? t('dineIn') : t('takeaway')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {items.map((item) => `${item.quantity}× ${item.name}`).join(', ')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(order.total)}
                      </TableCell>
                      <TableCell>
                        <Badge>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  )
}
