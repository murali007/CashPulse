import Header from "./Header.jsx";
import Sidebar from "./Sidebar.jsx";
import MobileTabs from "./MobileTabs.jsx";

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="lg:hidden">
            <MobileTabs />
          </div>
          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
