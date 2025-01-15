import { redirect } from 'next/navigation'

import type { CategoryId } from 'common/params';

export default async function CategoryPage(props : {params: Promise<{category: CategoryId}>}) {
  const params = await props.params;
  redirect(`/${params.category}/v`, 'replace');
}
