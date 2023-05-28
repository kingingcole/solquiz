import { NotReadyReason, useEth } from "eth.context";
import { User } from "models";
import React, { Fragment, ReactElement, useEffect, useState } from "react";
import Footer from "./Footer";
import Navbar from "./Navbar";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: RootLayoutProps): JSX.Element {
  const eth = useEth();

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const NotReadyComponent = () => {
    if (!eth.ready) {
      switch (eth.notReadyReason) {
        case NotReadyReason.Initializing:
          return <div className='ethNotReady'>Loading...</div>;
        case NotReadyReason.NoWallet:
          return <div className='ethNotReady'>No wallet found</div>;
        case NotReadyReason.WrongNetwork:
          return <div className='ethNotReady'>Wrong network. Please switch to Sepolia Test Network.</div>;
        case NotReadyReason.NoAccount:
          return <div className='ethNotReady'>No account found</div>;
        default:
          return <div className='ethNotReady'>Unknown error</div>;
      }
    } else {
      return <div className='ethNotReady'>Unknown error</div>;
    }
  }

  useEffect(() => {
    const getUser = async () => {
        if (!eth.ready ||!eth.account) return;

        setLoading(true);

        const user: User = await eth.contracts.solQuiz.methods.leaderboard(eth.account).call();
        setUser(user);
        setLoading(false);
    }

    getUser();
}, [eth])

  return (
    <Fragment>
        <Navbar user={user} loading={loading} setLoading={setLoading} setUser={setUser} />
        <main>
          {!eth.ready ? <NotReadyComponent /> : React.cloneElement(children as ReactElement, { eth, loading, setLoading, user, setUser })}
        </main>
        <Footer />
    </Fragment>
  );
}
