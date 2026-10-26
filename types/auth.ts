/**
 * CodeAtlas Authentication & Google Identity Services Type Definitions
 */

export interface GoogleCredentialResponse {
  credential: string;
  select_by?: "auto" | "user" | "user_1tap" | "user_2tap" | "btn" | "btn_confirm" | "btn_add_session" | "btn_confirm_add_session";
  clientId?: string;
}

export interface GoogleDecodedToken {
  iss: string;
  nbf?: number;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  iat: number;
  exp: number;
  jti?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: string;
  provider: "google" | "github" | "credentials";
  createdAt?: string;
}

export interface AuthSession {
  authenticated: boolean;
  user: AuthUser | null;
  expiresAt?: string;
  provider?: "google" | "github" | "credentials";
}

export interface GoogleAuthRequest {
  credential: string;
}

export interface GoogleAuthResponse {
  success: boolean;
  user?: AuthUser;
  session?: {
    id: string;
    expiresAt: string;
  };
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

export interface EmailAuthResponse {
  success: boolean;
  requiresVerification?: boolean;
  email?: string;
  message?: string;
  error?: string;
  user?: AuthUser;
  session?: {
    id: string;
    expiresAt: string;
  };
  retryAfterSeconds?: number;
}

export interface GoogleGsiButtonConfig {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number | string;
  locale?: string;
}

export interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: "signin" | "signup" | "use";
  prompt_parent_id?: string;
  state_cookie_domain?: string;
  ux_mode?: "popup" | "redirect";
  login_uri?: string;
  native_callback?: (response: unknown) => void;
}

// Global Google Identity Services Types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfiguration) => void;
          renderButton: (parent: HTMLElement, options: GoogleGsiButtonConfig) => void;
          prompt: (momentListener?: (moment: any) => void) => void;
          cancel: () => void;
          disableAutoSelect: () => void;
          revoke: (hint: string, callback?: (done: any) => void) => void;
        };
      };
    };
  }
}
