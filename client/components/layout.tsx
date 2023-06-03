import { Box, Stack } from "@mui/material";
import { NotReadyReason, useEth } from "eth.context";
import { User } from "models";
import { useRouter } from "next/router";
import React, { Fragment, ReactElement, useEffect, useState } from "react";
import CustomButton from "./Button";
import Footer from "./Footer";
import HelpModal from "./HelpModal";
import Navbar from "./Navbar";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: RootLayoutProps): JSX.Element {
  const eth = useEth();

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const [showIntroText, setShowIntroText] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);

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
      if (!eth.ready || !eth.account) return;

      setLoading(true);

      const user: User = await eth.contracts.solQuiz.methods.leaderboard(eth.account).call();
      setUser(user);
      setLoading(false);
    }

    getUser();
  }, [eth])

  // Check if on root page ("/")
  const isRootPage = router.asPath === '/';
  const introText = "Welcome to SolQuiz, the ultimate quiz platform powered by Ethereum! Create and answer quizzes in both single and batch modes, challenge yourself and friends, and compete for the top spot on our leaderboard. Rate and provide feedback on quizzes to shape the community's quiz-taking experience. Step into the world of SolQuiz and showcase your knowledge mastery today!";

  const renderMainBody = () => {
    if (showIntroText) {
      return;
    }

    return !eth.ready ? <NotReadyComponent /> : React.cloneElement(children as ReactElement, { eth, loading, setLoading, user, setUser })
  }

  return (
    <Fragment>
      <Navbar user={user} loading={loading} setLoading={setLoading} setUser={setUser} />
      <main>
        {
          showIntroText && isRootPage && (
            <Box sx={{ maxWidth: '800px', margin: '30px auto', textAlign: 'center' }}>
              <p style={{ fontSize: '16px' }}>{introText}</p>
              <Stack direction={'row'} spacing={1} justifyContent={'center'}>
                <CustomButton onClick={() => setShowIntroText(false)}>Begin</CustomButton>
                <CustomButton variant="outlined" onClick={() => setShowHelpModal(true)}>Help</CustomButton>
              </Stack>
              <HelpModal open={showHelpModal} setOpen={setShowHelpModal} />
            </Box>
          )
        }
        {renderMainBody()}
      </main>
      <Footer setShowHelpModal={setShowHelpModal} />
    </Fragment>
  );
}
