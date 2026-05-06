import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function luhnValid(digits: string): boolean {
  const s = digits.replace(/\D/g, '');
  if (s.length !== 16) {
    return false;
  }
  let sum = 0;
  let alt = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let n = parseInt(s[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) {
        n -= 9;
      }
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function luhnValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = (control.value || '').replace(/\D/g, '');
    if (!v) {
      return null;
    }
    return luhnValid(v) ? null : { luhn: true };
  };
}

export function cardExpiryValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = (control.value || '').trim();
    const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(raw);
    if (!m) {
      return { expiry: true };
    }
    const month = parseInt(m[1], 10);
    const yy = parseInt(m[2], 10);
    const now = new Date();
    const year = 2000 + yy;
    const expEnd = new Date(year, month, 0, 23, 59, 59);
    if (expEnd < now) {
      return { expiryPast: true };
    }
    return null;
  };
}

/** RIB tunisien : 20 chiffres */
export function ribValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = (control.value || '').replace(/\s/g, '');
    if (!raw) {
      return null;
    }
    return /^\d{20}$/.test(raw) ? null : { rib: true };
  };
}

export function tunisiaPhoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = (control.value || '').replace(/\s/g, '');
    if (!v) {
      return null;
    }
    const n = v.startsWith('+') ? v : '+' + v.replace(/^\+/, '');
    const ok = /^\+216[0-9]{8}$/.test(n);
    return ok ? null : { phoneTn: true };
  };
}
