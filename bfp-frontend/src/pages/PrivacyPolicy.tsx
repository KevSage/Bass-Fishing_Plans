// src/pages/PrivacyPolicy.tsx
import React from "react";

export function PrivacyPolicyPage() {
  const effectiveDate = "January 1, 2026"; // TODO: update before launch

  return (
    <div className="page">
      <main className="page__main">
        <section className="page__hero">
          <div className="container">
            <h1 className="h1">Privacy Policy</h1>
            <p className="muted">
              Effective date: <strong>{effectiveDate}</strong>
            </p>
          </div>
        </section>

        <section className="page__section">
          <div className="container prose">
            <p>
              This Privacy Policy explains how <strong>Bass Clarity</strong>{" "}
              (“Bass Clarity,” “we,” “us,” or “our”) collects, uses, and shares
              information when you use our website, apps, and related services
              (collectively, the “Service”).
            </p>

            <h2>1. Information We Collect</h2>

            <h3>Information you provide</h3>
            <ul>
              <li>
                <strong>Account information</strong> (e.g., name, email,
                password or authentication method).
              </li>
              <li>
                <strong>Billing information</strong> (processed by our payment
                processor; we may receive limited details such as subscription
                status and the last four digits of a payment method).
              </li>
              <li>
                <strong>Plan inputs</strong> you submit (e.g., location/lake
                selection, date, preferences, notes).
              </li>
              <li>
                <strong>Support messages</strong> you send us (e.g., emails,
                forms).
              </li>
            </ul>

            <h3>Information collected automatically</h3>
            <ul>
              <li>
                <strong>Device and usage data</strong> (e.g., pages viewed,
                clicks, session timing, approximate location derived from IP,
                browser type).
              </li>
              <li>
                <strong>Cookies and similar technologies</strong> to keep you
                signed in, remember preferences, and understand site
                performance.
              </li>
            </ul>

            <h3>Location information</h3>
            <p>
              If you choose to share location (for example, when generating a
              plan), we use it to tailor results. You can disable location
              sharing in your device or browser settings, though some features
              may not work as intended.
            </p>

            <h2>2. How We Use Information</h2>
            <p>We use information to:</p>
            <ul>
              <li>
                Provide, maintain, and improve the Service (including generating
                plans you request).
              </li>
              <li>
                Authenticate users and prevent fraud, abuse, and security
                incidents.
              </li>
              <li>
                Process subscriptions and manage access (via our payment
                processor).
              </li>
              <li>
                Communicate with you about account activity, support requests,
                and important updates.
              </li>
              <li>Analyze usage to improve performance and reliability.</li>
              <li>Comply with legal obligations and enforce our terms.</li>
            </ul>

            <h2>3. How We Share Information</h2>
            <p>We may share information in these limited situations:</p>
            <ul>
              <li>
                <strong>Service providers</strong> that help us operate the
                Service (e.g., hosting, analytics, email, customer support,
                payment processing). They may access information only to perform
                services for us.
              </li>
              <li>
                <strong>Payment processing</strong>: payments are handled by a
                third-party processor; we do not store full payment card numbers
                on our servers.
              </li>
              <li>
                <strong>Legal and safety</strong>: if required by law, or to
                protect the rights, safety, and security of Bass Clarity, our
                users, or others.
              </li>
              <li>
                <strong>Business transfers</strong>: if we’re involved in a
                merger, acquisition, financing, or sale of assets, information
                may be transferred as part of that transaction.
              </li>
            </ul>
            <p>We do not sell your personal information.</p>

            <h2>4. Cookies & Analytics</h2>
            <p>
              We use cookies and similar technologies for essential site
              functionality (like login sessions) and to understand how the
              Service is used. You can control cookies through your browser
              settings. Disabling certain cookies may affect site functionality.
            </p>

            <h2>5. Data Retention</h2>
            <p>
              We retain information for as long as needed to provide the Service
              and for legitimate business purposes (such as compliance, dispute
              resolution, and enforcing agreements). You can request deletion as
              described below.
            </p>

            <h2>6. Security</h2>
            <p>
              We take reasonable measures to protect information, but no system
              is 100% secure. Please use a strong password and keep your login
              credentials confidential.
            </p>

            <h2>7. Your Choices & Rights</h2>
            <ul>
              <li>
                <strong>Access / correction</strong>: you can update some
                account details in your account settings.
              </li>
              <li>
                <strong>Deletion</strong>: you can request deletion of your
                account and associated personal information, subject to legal
                and operational requirements.
              </li>
              <li>
                <strong>Marketing</strong>: if we send marketing emails, you can
                unsubscribe anytime via the link in the email.
              </li>
              <li>
                <strong>Cookies</strong>: control cookies through your browser
                settings.
              </li>
            </ul>

            <h2>8. Region-Specific Notices</h2>
            <p>
              Depending on where you live, you may have additional rights (such
              as the right to know, delete, or correct certain personal
              information). To exercise applicable rights, contact us using the
              details below.
            </p>

            <h2>9. Children’s Privacy</h2>
            <p>
              The Service is not intended for children under 13 (or the minimum
              age required in your jurisdiction). We do not knowingly collect
              personal information from children.
            </p>

            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. If we make
              material changes, we will update the effective date and may
              provide additional notice through the Service.
            </p>

            <h2>11. Contact</h2>
            <p>
              If you have questions or requests about this Privacy Policy,
              contact us at{" "}
              <a className="link" href="mailto:support@bassclarity.com">
                support@bassclarity.com
              </a>
              .
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
