"use client";

import { Button } from "@mui/material";

interface CustomButtonProps {
    variant?: "text" | "outlined" | "contained";
    color?: "primary" | "inherit" | "secondary" | "success" | "error" | "info" | "warning";
    children: any;
    onClick?: () => void;
    disabled?: boolean;
    size?: "small" | "medium" | "large";
    sx?: Record<string, string | number>;
}

const CustomButton = ({ variant, color, children, onClick, ...otherProps}: CustomButtonProps) => {
    return <Button onClick={onClick} variant={variant || 'contained'} color={color || 'primary'} {...otherProps}>{children}</Button>
}

export default CustomButton;