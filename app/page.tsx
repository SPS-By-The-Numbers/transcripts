import CategoryIndex from './CategoryIndex'
import { getAllCategories } from '../utilities/metadata-utils';

export default async function Index() {
    return <CategoryIndex categories={await getAllCategories()} />
}
