import { AuthGuard } from './components/AuthGuard';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';

const isClerkConfigured = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY &&
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY !== 'your_clerk_publishable_key_here';

function App() {
  return (
    <>
      {isClerkConfigured ? (
        <AuthGuard>
          <Layout>
            <Dashboard />
          </Layout>
        </AuthGuard>
      ) : (
        <Layout>
          <Dashboard />
        </Layout>
      )}
    </>
  );
}

export default App;
