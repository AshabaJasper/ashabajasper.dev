/**
 * A quiet placeholder while the work index renders (it reads ?sector= per
 * request). Scoped to this route group on purpose: a loading boundary above
 * the catch-all would stream 404 pages with a 200 status.
 */
export default function PortfolioLoading() {
  return (
    <div className="container-page py-16 sm:py-24" role="status" aria-live="polite">
      <span className="sr-only">Loading the page</span>
      <div aria-hidden className="animate-pulse space-y-5 motion-reduce:animate-none">
        <div className="bg-muted h-3 w-24 rounded-full" />
        <div className="bg-muted h-12 w-[min(32rem,90%)] rounded-lg sm:h-16" />
        <div className="bg-muted h-4 w-[min(36rem,95%)] rounded-full" />
        <div className="bg-muted h-4 w-[min(28rem,80%)] rounded-full" />
        <div className="grid gap-8 pt-10 md:grid-cols-2">
          <div className="bg-muted aspect-[16/10] rounded-[12px]" />
          <div className="bg-muted hidden aspect-[16/10] rounded-[12px] md:block" />
        </div>
      </div>
    </div>
  );
}
