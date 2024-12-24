import { Switch, Route } from "wouter";
import Home from "@/pages/Home";
import FindNow from "@/pages/FindNow";
import Mission from "@/pages/Mission";
import SafeZones from "@/pages/SafeZones";
import ReportCase from "@/pages/ReportCase";
import SafetyGame from "@/pages/SafetyGame";
import Admin from "@/pages/Admin";
import Analytics from "@/pages/Analytics";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NotificationToast from "@/components/NotificationToast";
import { motion, AnimatePresence } from "framer-motion";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <NotificationToast />
      <Header />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/find" component={FindNow} />
            <Route path="/mission" component={Mission} />
            <Route path="/safe-zones" component={SafeZones} />
            <Route path="/report-case" component={ReportCase} />
            <Route path="/safety-game" component={SafetyGame} />
            <Route path="/admin" component={Admin} />
            <Route path="/analytics" component={Analytics} />
            <Route>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-h-screen flex items-center justify-center bg-gray-50"
              >
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-gray-600">Page not found</p>
                </div>
              </motion.div>
            </Route>
          </Switch>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

export default App;