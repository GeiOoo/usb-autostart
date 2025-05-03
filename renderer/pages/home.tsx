import Head from 'next/head';
import BaseProvider from '../components/BaseProvider';

export default function HomePage() {
  return (
    <BaseProvider>
      <Head>
        <title>Home - Nextron (basic-lang-typescript)</title>
      </Head>
      <div>
        <p>
          ⚡ Electron + Next.js ⚡
        </p>
      </div>
    </BaseProvider>
  )
}
