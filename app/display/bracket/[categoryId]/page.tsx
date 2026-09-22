import { CategoryBracketView } from '@/components/display/CategoryBracketView'

export default async function CategoryBracketPage({
    params,
}: {
    params: Promise<{ categoryId: string }>
}) {
    const { categoryId } = await params
    return <CategoryBracketView categoryId={categoryId} />
}
