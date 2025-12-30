// src/pages/RefundPolicy.tsx
import React from "react";

export function RefundPolicyPage() {
  const effectiveDate = "January 1, 2026"; // TODO: update before launch

  return (
    <div className="page">
      <main className="page__main">
        <section className="page__hero">
          <div className="container">
            <h1 className="h1">Refund & Cancellation Policy</h1>
            <p className="muted">
              Effective date: <strong>{effectiveDate}</strong>
            </p>
          </div>
        </section>

        <section className="page__section">
          <div className="container prose">
            <p>
              Bass Clarity is a paid service that provides fishing plans and
              related tools. This policy explains how cancellations and refunds
              work.
            </p>

            <h2>1. Cancellations</h2>
            <p>
              You can cancel your subscription at any time through your account
              (or wherever you subscribed). When you cancel, your subscription
              remains active until the end of the current billing period, and
              you will not be charged for the next period.
            </p>

            <h2>2. Subscription Charges</h2>
            <p>
              Subscription fees are billed in advance on a recurring basis
              (monthly or annually, depending on the plan you choose). Once a
              billing period begins, that charge is generally non-refundable.
            </p>

            <h2>3. Refunds</h2>
            <p>
              <strong>All sales are final</strong> unless otherwise required by
              law. We do not offer refunds for:
            </p>
            <ul>
              <li>Partially used billing periods</li>
              <li>Unused time after cancellation</li>
              <li>Dissatisfaction with results or outcomes</li>
              <li>Accidental purchases or failure to cancel before renewal</li>
            </ul>

            <h2>4. Exceptions</h2>
            <p>
              We may consider refunds only in limited circumstances, such as:
            </p>
            <ul>
              <li>Duplicate charges</li>
              <li>Billing errors attributable to Bass Clarity</li>
              <li>
                Extended service outages that prevent access to paid features
                (evaluated case-by-case)
              </li>
            </ul>

            <h2>5. Chargebacks</h2>
            <p>
              If you have a billing concern, contact us before initiating a
              chargeback. Chargebacks may result in immediate loss of access to
              the Service while we investigate.
            </p>

            <h2>6. How to Contact Support</h2>
            <p>
              If you believe you were charged in error, email{" "}
              <a className="link" href="mailto:support@bassclarity.com">
                support@bassclarity.com
              </a>{" "}
              with:
            </p>
            <ul>
              <li>The email on your account</li>
              <li>The date and amount of the charge</li>
              <li>A brief description of the issue</li>
            </ul>

            <p className="muted">
              Note: This policy is intended to be clear and simple. It is not
              legal advice.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
