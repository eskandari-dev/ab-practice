import { Link } from 'react-router-dom'
import { useConfig } from '../config.js'

const BUSINESS_NAME = 'Road Ready'

function Contact({ email }) {
  if (email) return <a href={'mailto:' + email}>{email}</a>
  return <Link to="/feedback">our feedback form</Link>
}

function Terms() {
  const config = useConfig()
  const email = config?.support_email

  return (
    <div className="page legal">
      <h1>Terms, Refunds & Privacy</h1>

      <h2>About this service</h2>
      <p>
        {BUSINESS_NAME} offers online practice tests for driver knowledge tests in several countries and regions.
        We are not part of any government or licensing office. The questions are based on official driver's
        handbooks; some are written with the help of AI and then checked by us. They can still contain mistakes,
        so please report anything wrong through <Link to="/feedback">our feedback form</Link>. Practice results do
        not guarantee that you will pass the real exam. Always study the official handbook for your region.
      </p>

      <h2>Accounts</h2>
      <p>
        You can practice without an account. If you create one, you sign in with an email and password or with
        your Google account. You are responsible for keeping your password safe.
      </p>

      <h2>Payments</h2>
      <p>
        Prices are shown in Canadian dollars (CAD). Paid plans are prepared but not open to the public yet.
        When payments open, they will be processed securely by Stripe. We never see or store your card number.
        Exam packs (Starter, Standard) do not expire. The Unlimited plan lasts 30 days from the date of
        payment and does not renew automatically. Until then, you can use the free practice exams.
      </p>

      <h2>Refunds</h2>
      <p>
        If you have not started any full exam from your purchase, you can ask for a full refund
        within 14 days. Contact us at <Contact email={email} /> with the email address of your account.
      </p>

      <h2>Privacy</h2>
      <p>
        We store your email address, a secure hash of your password (never the password itself), your exam
        results and the plans you bought. If you sign in with Google, we receive your email address from Google
        through Firebase Authentication. Your language, theme and the progress of visitors without an account
        are saved only in your own browser. Messages you send through the feedback form are stored so we can
        read them.
      </p>
      <p>
        We do not sell your data and we do not show ads. We use these services to run the site: Render (hosting),
        Neon (database), Google Firebase (Google sign-in) and Stripe (payments).
        Road-sign pictures come from Wikimedia Commons and are public domain or CC0.
        You can delete your account and your results at any time on the <Link to="/account">My account</Link> page.
      </p>

      <h2>Contact</h2>
      <p><Contact email={email} /></p>
    </div>
  )
}

export default Terms
