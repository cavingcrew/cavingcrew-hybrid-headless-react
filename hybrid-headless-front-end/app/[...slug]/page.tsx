'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { LoadingState } from '../../components/ui/LoadingState';

const CatchAllContent = dynamic(
  () => import('./CatchAllContent').then((mod) => mod.CatchAllContent),
  {
    loading: () => <LoadingState />,
    ssr: false
  }
);

export default function CatchAllPage() {
  return <CatchAllContent />;
}
