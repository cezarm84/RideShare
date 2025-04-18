import PageMeta from "../components/common/PageMeta";
import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <>
      <PageMeta
        title="Terms and Conditions | RideShare"
        description="Terms and conditions for using the RideShare platform"
      />
      <div className="container max-w-4xl px-4 py-8 mx-auto">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            &larr; Back to Home
          </Link>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
          <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">Terms and Conditions</h1>

          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-800 dark:text-white">1. Introduction</h2>
              <p>
                Welcome to RideShare. These Terms and Conditions govern your use of our website and services.
                By using RideShare, you agree to these terms in full. If you disagree with any part of these terms,
                please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-800 dark:text-white">2. Service Description</h2>
              <p>
                RideShare is a ride-sharing platform that connects drivers and passengers for shared journeys.
                We provide the technology to facilitate these connections but are not a transportation provider.
                All rides are provided by independent drivers who are not employed by RideShare.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-800 dark:text-white">3. User Accounts</h2>
              <p>
                To use our services, you must create an account with accurate, complete, and updated information.
                You are responsible for maintaining the confidentiality of your account credentials and for all
                activities that occur under your account. You must notify us immediately of any unauthorized use
                of your account.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-800 dark:text-white">4. User Conduct</h2>
              <p>
                When using RideShare, you agree to:
              </p>
              <ul className="pl-5 mt-2 list-disc">
                <li>Comply with all applicable laws and regulations</li>
                <li>Respect the rights and dignity of other users</li>
                <li>Not engage in any form of harassment or discriminatory behavior</li>
                <li>Not use the service for any illegal or unauthorized purpose</li>
                <li>Not interfere with the proper operation of the service</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-800 dark:text-white">5. Privacy</h2>
              <p>
                Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your
                personal information. By using RideShare, you consent to our collection and use of your data as
                described in our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-800 dark:text-white">6. Payments</h2>
              <p>
                Payment for rides is processed through our platform. Prices are set by drivers and may vary based
                on distance, time, demand, and other factors. You agree to pay all fees associated with your use
                of the service.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-800 dark:text-white">7. Limitation of Liability</h2>
              <p>
                RideShare is provided "as is" without any guarantees or warranties, express or implied. We do not
                guarantee the accuracy, completeness, or reliability of any rides or drivers. We are not liable for
                any damages or losses resulting from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-800 dark:text-white">8. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will provide notice of significant changes.
                Your continued use of RideShare after such modifications constitutes your acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-gray-800 dark:text-white">9. Contact Information</h2>
              <p>
                If you have any questions about these Terms and Conditions, please contact us at:
              </p>
              <p className="mt-2">
                <strong>Email:</strong> support@rideshare.com<br />
                <strong>Address:</strong> Norra Stommen 296, 438 32 Landvetter, Sweden
              </p>
            </section>

            <section>
              <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
