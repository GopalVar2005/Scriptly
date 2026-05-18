import React from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

export default function WorkspaceToast({ errorMsg, successMsg, setErrorMsg, setSuccessMsg }) {
  if (!errorMsg && !successMsg) return null;

  return (
    <>
      {errorMsg && (
        <div className="scriptly-toast scriptly-toast-error">
          <span><AlertTriangle size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />{errorMsg}</span>
          <button onClick={() => setErrorMsg('')}><X size={15} /></button>
        </div>
      )}
      {successMsg && (
        <div className="scriptly-toast scriptly-toast-success">
          <span><CheckCircle size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />{successMsg}</span>
          <button onClick={() => setSuccessMsg('')}><X size={15} /></button>
        </div>
      )}
    </>
  );
}
