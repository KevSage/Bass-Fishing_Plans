// src/pages/TermsOfService.tsx
import React from "react";

export function TermsOfServicePage() {
  const effectiveDate = "January 1, 2026"; // TODO: update before launch

  return (
    <div className="page">
      <main className="page__main">
        <section className="page__hero">
          <div className="container">
            <h1 className="h1">Terms of Service</h1>
            <p className="muted">
              Effective date: <strong>{effectiveDate}</strong>
            </p>
          </div>
        </section>

        <section className="page__section">
          <div className="container prose">
            <p>
              These Terms of Service (“Terms”) govern your access to and use of{" "}
              <strong>Bass Clarity</strong> (the “Service”). By accessing or
              using the Service, you agree to these Terms. If you do not agree,
              do not use the Service.
            </p>

            <h2>1. The Service</h2>
            <p>
              Bass Clarity provides fishing planning and guidance tools,
              including plan generation based on the inputs you provide. The
              Service may evolve over time. We may add, remove, or modify
              features.
            </p>

            <h2>2. Eligibility</h2>
            <p>
              You must be at least 13 years old (or the minimum age required in
              your jurisdiction) to use the Service. If you use the Service on
              behalf of an entity, you represent you have authority to bind that
              entity to these Terms.
            </p>

            <h2>3. Accounts</h2>
            <ul>
              <li>
                You are responsible for maintaining the confidentiality of your
                account credentials.
              </li>
              <li>You are responsible for all activity under your account.</li>
              <li>
                You agree to provide accurate, current information and keep it
                updated.
              </li>
            </ul>

            <h2>4. Subscriptions, Payments, and Billing</h2>
            <p>
              Some features require a paid subscription. If you purchase a
              subscription, you authorize us (through our payment processor) to
              charge your payment method for recurring fees until you cancel.
            </p>
            <ul>
              <li>
                <strong>Trials / promotional offers</strong>: if offered, trial
                terms will be displayed at checkout.
              </li>
              <li>
                <strong>Taxes</strong>: you are responsible for any applicable
                taxes unless stated otherwise.
              </li>
              <li>
                <strong>Price changes</strong>: we may change pricing with
                notice, consistent with applicable law.
              </li>
              <li>
                <strong>Cancellation</strong>: you can cancel at any time;
                cancellation takes effect at the end of the current billing
                period unless otherwise stated at checkout.
              </li>
            </ul>

            <h2>5. Refunds</h2>
            <p>
              Refunds (if any) are handled according to the policy presented at
              checkout or in the Service. Unless otherwise required by law, fees
              are non-refundable once charged.
            </p>

            <h2>6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>
                Use the Service for unlawful, harmful, or abusive activities.
              </li>
              <li>
                Attempt to access, probe, or disrupt systems or security
                measures.
              </li>
              <li>
                Reverse engineer, decompile, or attempt to extract source code,
                except where prohibited by law.
              </li>
              <li>
                Scrape, harvest, or collect data from the Service without our
                written permission.
              </li>
              <li>
                Use the Service to develop or train competing products using our
                content or outputs at scale.
              </li>
            </ul>

            <h2>7. User Content and Inputs</h2>
            <p>
              You may submit information to generate plans (“Inputs”). You
              retain any rights you have in your Inputs. You grant us a license
              to use your Inputs to provide and improve the Service, including
              generating results you request and maintaining Service
              functionality.
            </p>

            <h2>8. Guidance Disclaimer</h2>
            <p>
              Fishing outcomes vary and depend on many factors. The Service
              provides informational guidance only and does not guarantee
              results. You are responsible for your decisions, safety,
              compliance with local laws and regulations, and on-water conduct.
            </p>

            <h2>9. Intellectual Property</h2>
            <p>
              The Service, including its software, design, and content
              (excluding your Inputs), is owned by Bass Clarity and protected by
              intellectual property laws. We grant you a limited, non-exclusive,
              non-transferable license to use the Service for personal,
              non-commercial use, subject to these Terms.
            </p>

            <h2>10. Third-Party Services</h2>
            <p>
              The Service may integrate with third-party services (e.g., payment
              processors, analytics). Your use of third-party services is
              subject to their terms and policies, and we are not responsible
              for them.
            </p>

            <h2>11. Termination</h2>
            <p>
              We may suspend or terminate your access to the Service if you
              violate these Terms or if we reasonably believe your use poses
              risk to the Service or others. You may stop using the Service at
              any time. Certain sections of these Terms survive termination
              (including intellectual property, disclaimers, limitations of
              liability, and dispute provisions).
            </p>

            <h2>12. Disclaimers</h2>
            <p>
              THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM
              EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR
              IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS
              FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>

            <h2>13. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, BASS CLARITY WILL NOT BE
              LIABLE FOR INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR
              PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL. OUR
              TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF OR RELATING TO THE
              SERVICE WILL NOT EXCEED THE AMOUNT YOU PAID TO USE THE SERVICE IN
              THE 12 MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM (OR $100
              IF YOU HAVE NOT PAID ANY AMOUNT), WHICHEVER IS GREATER.
            </p>

            <h2>14. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless Bass Clarity and
              its affiliates from any claims, liabilities, damages, losses, and
              expenses (including reasonable attorneys’ fees) arising from your
              use of the Service, your Inputs, or your violation of these Terms.
            </p>

            <h2>15. Disputes</h2>
            <p>
              If a dispute arises, you agree to contact us first to seek an
              informal resolution. If we can’t resolve the dispute, the
              remainder of this section (venue, governing law, arbitration,
              and/or class action waiver if applicable) should be completed
              before launch based on your jurisdiction and preferred approach.
            </p>
            <p className="muted">
              TODO before launch: choose governing law + venue (and whether you
              want arbitration language).
            </p>

            <h2>16. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. If we make material
              changes, we will update the effective date and may provide
              additional notice through the Service. Your continued use after
              changes become effective constitutes acceptance of the updated
              Terms.
            </p>

            <h2>17. Contact</h2>
            <p>
              Questions about these Terms? Contact{" "}
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
