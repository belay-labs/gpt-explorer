// EXTERNAL IMPORTS
import { map, toPairs } from "lodash";
import Router from "next/router";
import React, { useEffect, useState } from "react";
import { Button, Icon, Message } from "semantic-ui-react";

// INTERNAL IMPORTS
import { auth, authProvider } from "../lib/firebase";

import styles from "./sign-in.module.css";

const SignIn = () => {
  const [errMessage, setErrMessage] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    // If already signed in then redirect to root
    auth.onAuthStateChanged((user) => {
      if (user) redirectToDashboard();
    });
  }, []);

  const signIn = () => {
    setErrMessage("");
    setSigningIn(true);

    // Sign in with Firebase Google authentication
    auth
      .signInWithPopup(authProvider)
      .then(() => {
        redirectToDashboard();
      })
      .catch((err) => {
        setSigningIn(false);
        setErrMessage(err.message);
      });
  };

  const redirectToDashboard = () => {
    // Forward URL query params (needed for shared completion preset);
    const params = map(
      toPairs(Router.query),
      ([key, val]: [string, string]) => `${key}=${val}`
    );
    Router.push(`/${params.length ? `?${params.join("&")}` : ""}`);
  };

  return (
    <div className={styles.root}>
      <div className={styles.section}>
        <h1>GPT-3 Explorer</h1>
        {errMessage && (
          <Message icon={true} negative={true}>
            <Message.Content>
              <Message.Header>Error signing in</Message.Header>
              {errMessage}
            </Message.Content>
          </Message>
        )}
        {signingIn && (
          <Message icon={true} warning={true}>
            <Icon loading={true} name="circle notched" />
            <Message.Content>
              <Message.Header>Signing in...</Message.Header>
              Use your Google credentials in the popup window.
            </Message.Content>
          </Message>
        )}
        <Button
          content="Sign in with Google"
          fluid={true}
          icon="google"
          onClick={signIn}
          primary={true}
        />
      </div>
    </div>
  );
};

export default SignIn;
