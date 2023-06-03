import { Stack } from "@mui/material";

const Footer = ({ setShowHelpModal }: { setShowHelpModal: (show: boolean) => void }) => {
    return (
        <Stack justifyContent={'center'} alignItems={'center'} direction={'row'} spacing={2} component={'footer'}>
            <p>Developed by <a href='https://coleruche.com' target="_blank">Cole Ruche</a></p>
            <a onClick={(e) => {
                e.preventDefault();
                setShowHelpModal(true);
            }} href='#'>Help</a>
        </Stack>
    )
}

export default Footer
