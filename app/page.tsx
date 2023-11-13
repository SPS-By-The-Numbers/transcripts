import CategoryIndex from './CategoryIndex'

import { getAllCategories } from '../utilities/metadata-utils';
import { ReactNode } from 'react';

export default async function Index(props: TranscriptsProps): ReactNode {
    return <CategoryIndex categories={await getAllCategories()} />
}
