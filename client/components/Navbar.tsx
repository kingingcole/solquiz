"use client";

import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import ModeIcon from '@mui/icons-material/Mode';
import { Box, Modal, TextField } from '@mui/material';
import { NotReadyReason, useEth } from 'eth.context';
import { User } from 'models';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getTruncatedAddress } from 'styles/utils';
import CustomButton from './Button';

interface NavbarProps {
    user: User | null;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    setUser: (user: User) => void;
}

const Navbar = ({ loading, setLoading, user, setUser }: NavbarProps) => {
    const eth = useEth();
    const [walletConnected, setWalletConnected] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [displayName, setDisplayName] = useState<string | undefined>('');

    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        if (eth.ready) {
            setWalletConnected(Boolean(eth.account));
        }
    }, [eth]);

    useEffect(() => {
        setDisplayName(user?.displayName);
    }, [user])

    const connectWallet = async () => {
        // Check if Web3 is available
        if (window.ethereum) {
            try {
                // Request account access
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                // Set the user's Ethereum address
                eth.ready && eth.setAccount(accounts[0]);
            } catch (error) {
                console.error(error);
            }
        } else {
            console.error('Web3 is not available in your browser');
        }
    };

    const disconnectWallet = async () => {
        eth.ready && eth.setAccount('');
    };

    const handleCloseModal = () => {
        setOpenModal(false);
    };

    const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDisplayName(e.target.value);
    }

    const saveProfile = async () => {
        if (!eth.ready || !displayName) return;

        setLoading(true);
        try {
            let tx;
            let txBody;
            if (!user?.displayName?.length) {
                txBody = eth.contracts.solQuiz.methods.createUser(displayName);
            } else {
                txBody = eth.contracts.solQuiz.methods.editUser(displayName);
            }
            tx = await txBody.send({ from: eth.account });
            setUser({ ...user, displayName });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            handleCloseModal();
        }
    }

    const handleMenuClick = () => {
        setShowMenu(!showMenu);
    };

    const isManager = eth.ready && eth.account === eth.manager;

    const disableConnectWallet = 
        !eth.ready && (
            eth.notReadyReason === NotReadyReason.Initializing || eth.notReadyReason === NotReadyReason.NoWallet || eth.notReadyReason === NotReadyReason.WrongNetwork
        )

    return (
        <nav>
            <div>
                <Link href='/'>SolQuiz</Link>
                <div className="menu-toggle" onClick={handleMenuClick}>{showMenu ? <CloseIcon /> : <MenuIcon />}</div>
            </div>
            <ul className={`${showMenu ? 'show' : ''}`}>
                {
                    eth.ready && eth.account && (
                        <>
                            <li>
                                <Link href='/leaderboard'>Leaderboard</Link>
                            </li>
                            <li style={{color: isManager ? '#00baba' : ''}} className='user' onClick={() => setOpenModal(true)}>
                                {getTruncatedAddress(eth.account)} {user?.displayName && `(${user.displayName} — ${user.points} pts)`} <ModeIcon sx={{ ml: 1 }} />
                            </li>
                        </>
                    )
                }
                <li>
                    {walletConnected ? <CustomButton onClick={disconnectWallet}>Disconnect Wallet</CustomButton> : <CustomButton onClick={connectWallet} disabled={disableConnectWallet}>Connect Wallet</CustomButton>}
                </li>
            </ul>

            <Modal
                open={openModal}
                onClose={handleCloseModal}
                aria-labelledby="simple-modal-title"
                aria-describedby="simple-modal-description"
            >
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -90%)',
                        width: 400,
                        bgcolor: 'background.paper',
                        boxShadow: 24,
                        p: 4,
                        color: 'black'
                    }}
                >
                    <p id="simple-modal-title">{user?.displayName ? 'Edit User' : 'Create User'}</p>
                    <TextField onChange={handleDisplayNameChange} value={displayName} fullWidth variant='standard'sx={{mb: 2}} label='Display name'/>
                    <CustomButton disabled={!displayName?.length || loading} onClick={saveProfile}>Save</CustomButton>
                </Box>
            </Modal>
        </nav>
    )
}

export default Navbar;