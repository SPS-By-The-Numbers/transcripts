import Link from 'next/link'
import { getAllCategories, getDatesForCategory } from '../../../utilities/metadata-utils';
import { getDatePath } from '../../../utilities/path-utils';
import { formatISO, parseISO } from 'date-fns';

export async function getStaticPaths() {
    const categories = await getAllCategories();

    return {
        paths: categories.map(category => ({
            params: {
                category
            }
        })),
        fallback: false
    };
}

export async function getStaticProps(context) {
    const category = context.params.category;
    const dates = await getDatesForCategory(category);

    return {
        props: {
            category,
            dates: dates.map(formatISO)
        }
    }
}

export default function Index(props) {
    const { category } = props;
    const dates = props.dates.map(parseISO);

    const dateLinks = dates.map(
        date => <li><Link href={ getDatePath(category, date) }>{ date.toLocaleDateString('en-US') }</Link></li>
    )

    return (
        <main>
            <ul>
                { dateLinks }
            </ul>
        </main>
    );
}