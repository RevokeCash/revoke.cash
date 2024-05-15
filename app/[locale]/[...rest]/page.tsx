import { NextPage } from 'next';
import { notFound } from 'next/navigation';

const CatchAllPage: NextPage = () => {
  notFound();
};

export default CatchAllPage;
