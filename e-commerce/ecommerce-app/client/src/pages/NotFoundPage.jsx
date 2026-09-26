import { Link } from 'react-router';
import { ArrowLeft, Compass } from 'lucide-react';
import PageTitle from '../components/PageTitle';

export default function NotFoundPage() {
  return (
    <>
      <PageTitle title="Page not found" />
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 ring-8 ring-blue-50/50">
          <Compass className="h-10 w-10" aria-hidden="true" />
        </div>
        <p className="mt-8 text-sm font-bold tracking-widest text-blue-600 uppercase">Error 404</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">This page wandered off</h1>
        <p className="mt-3 max-w-md text-slate-500">
          The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get you back to shopping.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/" className="btn btn-secondary btn-lg">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            Back home
          </Link>
          <Link to="/products" className="btn btn-primary btn-lg">
            Browse products
          </Link>
        </div>
      </div>
    </>
  );
}
