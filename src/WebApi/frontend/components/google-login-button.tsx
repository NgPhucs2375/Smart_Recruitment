"use client";
import { GoogleLogin } from "@react-oauth/google";

interface Props {
    onSuccess: (credential: string) => void;
    disabled?: boolean;
    text?: string;
}

export function GoogleLoginButton({ onSuccess, disabled,text = "Đăng nhập với Google" }: Props) {
    return (
        <div className={`flex justify-center w-full ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
            <GoogleLogin
                onSuccess={(credentialResponse) => {
                    if (credentialResponse.credential) {
                        onSuccess(credentialResponse.credential);
                    }
                }}
                onError={() => console.error("Đăng nhập Google thất bại")}
                useOneTap
            />
        </div>
    );
}