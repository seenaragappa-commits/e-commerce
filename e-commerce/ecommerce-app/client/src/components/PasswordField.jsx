import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import InputField from './InputField';

/** A password input with a show / hide toggle. */
export default function PasswordField(props) {
  const [visible, setVisible] = useState(false);

  return (
    <InputField
      {...props}
      type={visible ? 'text' : 'password'}
      icon={Lock}
      rightElement={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
    />
  );
}
