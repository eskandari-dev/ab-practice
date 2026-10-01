// TODO before going live: replace BUSINESS_NAME and SUPPORT_EMAIL, and have the owner review this text.
const BUSINESS_NAME = 'AB Practice'
const SUPPORT_EMAIL = 'support@example.com'

function Terms() {
  return (
    <div className="page legal">
      <h1>Terms, Refunds & Privacy</h1>

      <h2>About this service</h2>
      <p>
        {BUSINESS_NAME} sells online practice tests for the Alberta Class 7 driver knowledge test.
        We are not part of the Government of Alberta or any registry. Practice results do not
        guarantee that you will pass the real exam. Always study the official Alberta driver's handbook.
      </p>

      <h2>Payments</h2>
      <p>
        Prices are shown in Canadian dollars (CAD). Payments are processed securely by Stripe.
        We never see or store your card number. Exam packs (Starter, Standard) do not expire.
        The Unlimited plan lasts 30 days from the date of payment and does not renew automatically.
      </p>

      <h2>Refunds</h2>
      <p>
        If you have not started any full exam from your purchase, you can ask for a full refund
        within 14 days. Write to {SUPPORT_EMAIL} with the email address of your account.
      </p>

      <h2>Privacy</h2>
      <p>
        We store your email address, a secure hash of your password (never the password itself),
        and the plans you bought. We do not sell your data. You can ask us to delete your account
        at any time by writing to {SUPPORT_EMAIL}.
      </p>

      <h2>Contact</h2>
      <p>{SUPPORT_EMAIL}</p>
    </div>
  )
}

export default Terms
