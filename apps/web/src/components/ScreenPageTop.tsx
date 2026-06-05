import { PageDateChrome } from "@/components/PageDateChrome";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface ScreenPageTopProps {
  title: string;
}

/** Page title at the top, then date scroller + calendar — Insights / Categories. */
export function ScreenPageTop({ title }: ScreenPageTopProps) {
  const desktop = useMediaQuery("(min-width: 1024px)");

  if (desktop) {
    return (
      <>
        <header className="log-header tab-screen-header screen-page__header">
          <div className="log-header__title-row">
            <h1 className="log-header__title">{title}</h1>
          </div>
        </header>
        <PageDateChrome />
      </>
    );
  }

  return (
    <div className="screen-page__header-stack">
      <header className="log-header tab-screen-header">
        <div className="log-header__title-row">
          <h1 className="log-header__title">{title}</h1>
        </div>
      </header>
      <PageDateChrome />
    </div>
  );
}

export function ScreenPageBody({ children }: { children: React.ReactNode }) {
  return <div className="screen-page__scroll">{children}</div>;
}