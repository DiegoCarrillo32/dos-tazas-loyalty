"use client";

import { CreditCard, Phone } from "lucide-react";

import { Field, Input } from "@/design-system";

/**
 * The cédula + teléfono pair, shared by register, lookup and account linking.
 *
 * `inputMode="numeric"` matters more than it looks: this is a phone-first
 * audience, and it's the difference between a number pad and a full keyboard
 * when someone is standing at a counter.
 */
export function IdentityFields({
  nationalId,
  phone,
  onNationalIdChange,
  onPhoneChange,
  disabled,
}: {
  nationalId: string;
  phone: string;
  onNationalIdChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <>
      <Field label="Cédula" htmlFor="nationalId" hint="Sin guiones. También aceptamos DIMEX." required>
        <Input
          id="nationalId"
          name="nationalId"
          value={nationalId}
          onChange={(e) => onNationalIdChange(e.target.value)}
          inputMode="numeric"
          autoComplete="off"
          placeholder="1 2345 6789"
          maxLength={16}
          disabled={disabled}
          leadingIcon={<CreditCard />}
          required
        />
      </Field>

      <Field label="Teléfono" htmlFor="phone" required>
        <Input
          id="phone"
          name="phone"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          inputMode="tel"
          autoComplete="tel"
          placeholder="8888 7777"
          maxLength={15}
          disabled={disabled}
          leadingIcon={<Phone />}
          required
        />
      </Field>
    </>
  );
}
