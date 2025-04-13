import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Sign In | RideShare - Modern Ride-Sharing Platform"
        description="Sign in to your RideShare account to access the ride-sharing platform with enterprise support and intelligent matching"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
