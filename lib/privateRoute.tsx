import Router from "next/router";
import React from "react";
import { Dimmer, Loader } from "semantic-ui-react";

import { auth } from "./firebase";

const privateRoute = (WrappedComponent: any) => {
  return class extends React.Component {
    state = { user: null };

    componentDidMount(): void {
      auth.onAuthStateChanged((user) => {
        if (!user) {
          const { sharedId } = Router.query;
          if (sharedId) {
            Router.push(`/sign-in?sharedId=${sharedId}`);
          } else {
            Router.push("/sign-in");
          }
        } else {
          this.setState({ user });
        }
      });
    }

    render() {
      const { user } = this.state;

      if (!user) {
        return (
          <Dimmer active={true} inverted={true}>
            <Loader />
          </Dimmer>
        );
      }
      return <WrappedComponent user={user} {...this.props} />;
    }
  };
};

export default privateRoute;
