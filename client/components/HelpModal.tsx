import { Modal, Typography } from "@mui/material";
import Link from "next/link";
import CustomButton from "./Button";

function HelpModal({ open, setOpen}: { open: boolean, setOpen: (open: boolean) => void }) {  
    const handleOpen = () => {
      setOpen(true);
    };
  
    const handleClose = () => {
      setOpen(false);
    };
  
    return (
      <div>
  
        <Modal open={open} onClose={handleClose}>
          <div  className="help-modal"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 800,
              background: 'white',
              padding: 10,
            }}
          >
            <Typography variant="h5" gutterBottom>
              How to run the dApp
            </Typography>
  
            <Typography variant="body1" gutterBottom>
              To run the dApp, follow these steps:
            </Typography>
  
            <Typography variant="body1" gutterBottom>
              1. Run the app in a web browser with a supported wallet extension like Metamask installed. If you don&apos;t have Metamask, you can{' '}
              <Link href="https://metamask.io/" target="_blank" rel="noopener">
                install it here
              </Link>
              .
            </Typography>
  
            <Typography variant="body1" gutterBottom>
              2. Switch your Metamask network to the Sepolia Test Network.
              If you don&apos;t have the Sepolia network in Metamask, you can add it by following{' '}
              <Link href="https://www.alchemy.com/overviews/how-to-add-sepolia-to-metamask" target="_blank" rel="noopener">
                this link
              </Link>
              .
            </Typography>
  
            <Typography variant="body1" gutterBottom>
              3. Obtain SepoliaETH from the Sepolia Faucet to use in the dApp.
              You can get SepoliaETH from{' '}
              <Link href="https://sepoliafaucet.com/" target="_blank" rel="noopener">
                the Sepolia Faucet
              </Link>
              .
            </Typography>
  
            <CustomButton size='small' variant="contained" onClick={handleClose}>
              Close
            </CustomButton>
          </div>
        </Modal>
      </div>
    );
  }

  export default HelpModal;