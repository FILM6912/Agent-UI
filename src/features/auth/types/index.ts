export interface AuthPageProps {
  onLogin: () => void;
}

export interface AuthFormData {
  username: string;
  password: string;
  confirmPassword: string;
}
