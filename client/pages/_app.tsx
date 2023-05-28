import { EthProvider } from 'eth.context';
import Layout from '../components/layout';
import '../styles/glocal.css';
 
export default function App({ Component, pageProps }: any) {
  return (
    <EthProvider>
        <Layout>
            <Component {...pageProps} />
        </Layout>
    </EthProvider>
  );
}