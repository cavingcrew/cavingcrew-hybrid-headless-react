export async function generateStaticParams() {
  return [
    { slug: ['trip'] },
    { slug: ['category'] },
  ];
}

import { CatchAllContent } from './CatchAllContent';

export const dynamicParams = true;

export default function CatchAllPage() {
  return <CatchAllContent />;
}
