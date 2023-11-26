import Link from 'next/link';
import { compareDesc } from 'date-fns';
import { getDatePath } from 'utilities/path-utils';

type Props = {
    category: string,
    dates: string[]
}

export default function DateIndex({category, dates}: Props) {
    dates.sort().reverse();

    const dateLinks = dates.map((date: string, i: number): React.ReactNode => (
        <li key={`li-${i}`} className="mx-3 list-disc"><Link href={ getDatePath(category, date) }>{ date }</Link></li>
    ))

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
