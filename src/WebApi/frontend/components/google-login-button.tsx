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
                    console.log("[google-login] credentialResponse", !!credentialResponse.credential, credentialResponse.credential?.slice(0,40));
                    if (credentialResponse.credential) {
                        onSuccess(credentialResponse.credential);
                    } else {
                        console.warn("[google-login] missing credential", credentialResponse);
                    }
                }}
                onError={() => console.error("Đăng nhập Google thất bại - GoogleLogin onError")}
                useOneTap={false}
            />
        </div>
    );
}