import { useState } from 'react'
import { useLang } from '../lang-context.js'
import { EyeIcon } from './Icons.jsx'

function PasswordInput({ value, onChange, placeholder }) {
  const { t } = useLang()
  const [visible, setVisible] = useState(false)
  const label = visible ? t.login.hidePassword : t.login.showPassword

  return (
    <div className="password-field">
      <input
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
      />
      <button
        type="button"
        className="password-eye"
        onClick={() => setVisible(!visible)}
        aria-label={label}
        title={label}
      >
        <EyeIcon off={visible} />
      </button>
    </div>
  )
}

export default PasswordInput
