import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Sign Up | RideShare - Modern Ride-Sharing Platform"
        description="Create your RideShare account to access the ride-sharing platform with enterprise support and intelligent matching"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
