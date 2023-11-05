import Link from 'next/link'
import { getAllCategories, getDatesForCategory } from '../../../utilities/metadata-utils';
import { getDatePath } from '../../../utilities/path-utils';
import { formatISO, parseISO } from 'date-fns';
import styles from '../../../styles/Home.module.css'

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
        date => <li className="mx-3 list-disc"><Link href={ getDatePath(category, date) }>{ date.toLocaleDateString('en-US') }</Link></li>
    )

    return (
        <main className="mx-5 my-5">
          <h2 className="my-4 text-lg">
            All transcripts for <b>{category}</b> by date:
          </h2>
          <ul className="flex flex-col flex-wrap h-screen">
              { dateLinks }
          </ul>
        </main>
    );
}
