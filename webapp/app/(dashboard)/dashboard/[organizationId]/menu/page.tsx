import { getMenuCategories, getMenuItems } from '@/lib/appwrite/database'
import { MenuContent } from '@/components/dashboard/menu-content'

export const metadata = { title: 'Menü' }

export default async function MenuPage({
  params,
}: {
  params: Promise<{ organizationId: string }>
}) {
  const { organizationId } = await params
  const [categories, items] = await Promise.all([
    getMenuCategories(organizationId),
    getMenuItems(organizationId),
  ])

  return (
    <MenuContent
      categories={categories}
      items={items}
      organizationId={organizationId}
    />
  )
}
