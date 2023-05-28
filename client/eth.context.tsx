"use client";

import {
  Dispatch,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import Web3 from "web3";
import type { Contract } from "web3-eth-contract";
import solQuizArtifact from "./contracts/SolQuiz.json";

export enum NotReadyReason {
  Initializing,
  NoWallet,
  NoArtifact,
  NoAccount,
  WrongNetwork
}

export interface ContextValueNotReady {
  ready: false;
  notReadyReason: NotReadyReason;
}

export interface ContextValueReady {
  ready: true;
  web3: Web3;
  account: string;
  manager: string;
  contracts: Record<"solQuiz", Contract>;
  setAccount: Dispatch<SetStateAction<string | undefined>>;
}

type ContextValue = ContextValueNotReady | ContextValueReady;

export const EthContext = createContext<ContextValue>({
  ready: false,
  notReadyReason: NotReadyReason.Initializing
});

export const useEth = () => useContext(EthContext);

interface EthProviderProps {
  children: React.ReactNode;
}

export function EthProvider({ children }: EthProviderProps): JSX.Element {
  const [ready, setReady] = useState(false);
  const [notReadyReason, setNotReadyReason] = useState(
    NotReadyReason.Initializing
  );
  const [account, setAccount] = useState<string>();
  const [manager, setManager] = useState<string>();
  const [solQuiz, setSolQuiz] = useState<Contract>();

  const web3 = useMemo(() => {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      return new Web3(window.ethereum);
    }
    return null;
  }, []);

  const init = useCallback(async () => {
    setReady(false);
    setAccount('');
    if (!web3) return setNotReadyReason(NotReadyReason.NoWallet);

    const networkId = (await web3.eth.net.getId()).toString();
    const networks = solQuizArtifact.networks;
    const contractAddress = networks[networkId as keyof typeof networks]?.address;
    if (!contractAddress)
      return setNotReadyReason(NotReadyReason.WrongNetwork);

    const solJobs = new web3.eth.Contract(
      solQuizArtifact.abi as any,
      contractAddress
    ) as unknown as Contract;
    setSolQuiz(solJobs);
    const manager = await solJobs.methods.manager().call();
    setManager(manager);

    setReady(true);
  }, [web3]);

  useEffect(() => void init(), [init]);

  useEffect(() => {
    // check and set active account without initiating new connection request
    if (window.ethereum && web3) {
      const { selectedAddress } = window.ethereum;
      if (selectedAddress) {
        setAccount(web3.utils.toChecksumAddress(selectedAddress))
      }
    }
  }, [web3]);

  useEffect(() => {
    // Listen for changes to the user's account or network
    const handleAccountsChanged = (accounts: string[]) => {
      setAccount(accounts.length === 0 ? '' : accounts[0]);
    };
    const handleChainChanged = () => {
      // Reset the user's Ethereum address
      init();
    };
  
    // Add listeners
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
  
    // Remove listeners when the component is unmounted
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', init);
        window.ethereum.removeListener('chainChanged', init);
      }
    };
  }, [init]);

  const value = ready
    ? ({
        ready,
        web3: web3 as Web3,
        account: account as string,
        manager: manager as string,
        contracts: { solQuiz: solQuiz as Contract },
        setAccount
      } satisfies ContextValueReady)
    : ({
        ready,
        notReadyReason,
      } satisfies ContextValueNotReady);

  return <EthContext.Provider value={value}>{children}</EthContext.Provider>;
}
