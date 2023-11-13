import DateIndex from './DateIndex';
import { GenerateStaticParams } from 'next';
import { ReactNode } from 'react';
import { getAllCategories, getDatesForCategory } from 'utilities/metadata-utils';

type CategoryParams = {
    category: string,
};

export async function generateStaticParams(): GenerateStaticParams<CategoryParams> {
    const categories = await getAllCategories();

    return categories.map(category => ({category}));
}

export default async function Index({params}: CategoryParams): ReactNode {
    return <DateIndex category={params.category} dates={await getDatesForCategory(params.category)} />
}
