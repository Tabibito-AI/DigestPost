import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import History from "./pages/History";
import { useAuth } from "./_core/hooks/useAuth";
import { Button } from "./components/ui/button";

function Router() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation Header */}
      <header className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold">DigestPost</h1>
            {isAuthenticated && (
              <nav className="flex gap-6">
                <a href="/" className="text-sm hover:text-primary">ホーム</a>
                <a href="/settings" className="text-sm hover:text-primary">設定</a>
                <a href="/history" className="text-sm hover:text-primary">履歴</a>
              </nav>
            )}
          </div>
          {isAuthenticated && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user?.name}</span>
              <Button variant="outline" size="sm" onClick={logout}>
                ログアウト
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Switch>
          <Route path={"/(index)?"} component={Home} />
          <Route path={"/settings"} component={Settings} />
          <Route path={"/history"} component={History} />
          <Route path={"/404"} component={NotFound} />
          {/* Final fallback route */}
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

// NOTE: About Theme
// - Dark theme with professional appearance for news curation app
// - Color palette optimized for readability and content focus

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
