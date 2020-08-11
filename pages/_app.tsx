import { AppProps } from "next/app";
import { Icon } from "semantic-ui-react";

import "semantic-ui-css/semantic.min.css";

import Head from "next/head";

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>GPT-3 Explorer</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
      <div style={{ bottom: "20px", right: "20px", position: "fixed" }}>
        <a href="https://github.com/belay-labs/gpt-explorer" target="_blank"><Icon name="github" size="big"/></a>
      </div>
    </>
  );
}

export default App;
