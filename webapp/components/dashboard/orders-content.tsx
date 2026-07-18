'use client'

import { useState } from 'react'
import { MagnifyingGlass, Export } from '@phosphor-icons/react'
import { toast, Card, CardHeader, div as CardContent, Button, Chip as Badge, Input, Tabs, Tab, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/react"
import { useTranslation, formatPrice } from '@/lib/i18n'
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

const statusColors: Record<string, "secondary" | "default" | "primary" | "success" | "warning" | "danger"> = {
  pending: 'secondary',
  preparing: 'primary',
  ready: 'success',
  completed: 'default',
}

export function OrdersContent({ orders, organizationId }: OrdersContentProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')

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
      toast({ title: 'CSV exportiert', color: "success" })
    }
  }

  async function handleStatusChange(orderId: string, newStatus: string) {
    await updateOrderStatusAction(orderId, newStatus, organizationId)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('orders')}</h1>
        <Button variant="bordered" onPress={handleExportCSV}>
          <Export data-icon="inline-start" />
          {t('exportCSV')}
        </Button>
      </div>

      <Tabs defaultSelectedKey="live">
        <Tab
          key="live"
          title={
            <div className="flex items-center gap-2">
              {t('liveView')}
              {activeOrders.length > 0 && (
                <Badge color="secondary" size="sm">
                  {activeOrders.length}
                </Badge>
              )}
            </div>
          }
        >
          <div className="mt-4">
            {activeOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {t('noOrders')}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeOrders.map((order) => {
                  const items = parseItems(order.items)
                  return (
                    <Card key={order.$id}>
                      <CardHeader className="flex-col items-start pb-3">
                        <div className="flex items-center justify-between w-full">
                          <h3 className="text-base font-semibold">{order.orderNumber}</h3>
                          <Badge color={statusColors[order.status]}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                          <Badge variant="flat">
                            {order.type === 'dine-in' ? t('dineIn') : t('takeaway')}
                          </Badge>
                          {order.tableNumber && (
                            <span>{t('table')} {order.tableNumber}</span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
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
                                color="primary"
                                onPress={() => handleStatusChange(order.$id, 'preparing')}
                              >
                                {t('preparing')}
                              </Button>
                            )}
                            {order.status === 'preparing' && (
                              <Button
                                size="sm"
                                className="flex-1"
                                color="success"
                                onPress={() => handleStatusChange(order.$id, 'ready')}
                              >
                                {t('ready')}
                              </Button>
                            )}
                            {order.status === 'ready' && (
                              <Button
                                size="sm"
                                className="flex-1"
                                color="default"
                                onPress={() => handleStatusChange(order.$id, 'completed')}
                              >
                                {t('completed')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </Tab>
        <Tab key="history" title={t('history')}>
          <div className="mt-4 flex flex-col gap-4">
            <Input
              placeholder={t('search')}
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<MagnifyingGlass className="text-muted-foreground" />}
              className="max-w-sm"
            />

            <Card>
              <Table aria-label="Orders history">
                <TableHeader>
                  <TableColumn>{t('orderNumber')}</TableColumn>
                  <TableColumn>{t('date')}</TableColumn>
                  <TableColumn>{t('type')}</TableColumn>
                  <TableColumn>{t('items')}</TableColumn>
                  <TableColumn align="end">{t('total')}</TableColumn>
                  <TableColumn>{t('status')}</TableColumn>
                </TableHeader>
                <TableBody emptyContent={t('noOrders')}>
                  {filteredOrders.map((order) => {
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
                          <Badge variant="flat">
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
                          <Badge color={statusColors[order.status]}>
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
        </Tab>
      </Tabs>
    </div>
  )
}
