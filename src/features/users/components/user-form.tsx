"use client";

import { useState } from "react";
import { Check, Copy, Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

import { createUserAction } from "../actions";
import type { UserRole } from "../types";
import Button from "@/components/ui/button";
import FormMessage from "@/components/ui/form-message";
import { Input, Label, Select } from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import { useAction } from "@/lib/use-action";

const PASSWORD_LENGTH = 16;

const PASSWORD_CHARACTERS = {
  uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  lowercase: "abcdefghijkmnopqrstuvwxyz",
  numbers: "23456789",
  symbols: "!@#$%^&*",
};

function getRandomCharacter(characters: string) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);

  return characters[values[0] % characters.length];
}

function shuffleCharacters(characters: string[]) {
  const result = [...characters];

  for (let i = result.length - 1; i > 0; i--) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);

    const j = values[0] % (i + 1);

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function generateTemporaryPassword() {
  const {
    uppercase,
    lowercase,
    numbers,
    symbols,
  } = PASSWORD_CHARACTERS;

  const passwordCharacters = [
    getRandomCharacter(uppercase),
    getRandomCharacter(lowercase),
    getRandomCharacter(numbers),
    getRandomCharacter(symbols),
  ];

  const allCharacters =
    uppercase + lowercase + numbers + symbols;

  while (passwordCharacters.length < PASSWORD_LENGTH) {
    passwordCharacters.push(getRandomCharacter(allCharacters));
  }

  return shuffleCharacters(passwordCharacters).join("");
}

export default function UserForm() {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("staff");

  const [copied, setCopied] = useState(false);

  const create = useAction(createUserAction, {
    onSuccess: () => {
      setIsOpen(false);
      router.refresh();
    },
  });

  function open() {
    create.reset();

    setName("");
    setEmail("");
    setPassword("");
    setRole("staff");
    setCopied(false);

    setIsOpen(true);
  }

  function close() {
    if (create.pending) {
      return;
    }

    setIsOpen(false);
    setCopied(false);
  }

  function generatePassword() {
    const generated = generateTemporaryPassword();

    setPassword(generated);
    setCopied(false);
  }

  async function copyPassword() {
    if (!password) {
      return;
    }

    try {
      await navigator.clipboard.writeText(password);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        icon={<Plus className="h-4 w-4" />}
        onClick={open}
      >
        Add User
      </Button>

      <Modal
        open={isOpen}
        onClose={close}
        title="Add user"
        description="Create an account for a staff member or administrator. Generate a temporary password and share it securely with the user."
        busy={create.pending}
        action={async () => {
          await create.run({
            name,
            email,
            password,
            role,
          });
        }}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={close}
              disabled={create.pending}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={create.pending || !password}
            >
              {create.pending ? "Creating..." : "Create user"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="user-name">Full name</Label>

            <Input
              id="user-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />

            {create.fieldError("name") && (
              <p className="mt-1 text-sm text-danger">
                {create.fieldError("name")}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="user-email">Email</Label>

            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            {create.fieldError("email") && (
              <p className="mt-1 text-sm text-danger">
                {create.fieldError("email")}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="user-password">
              Temporary password
            </Label>

            <div className="mt-2 flex gap-2">
              <Input
                id="user-password"
                type="text"
                value={password}
                readOnly
                placeholder="Click Generate Password"
                className="font-mono"
              />

              <Button
                type="button"
                variant="secondary"
                onClick={generatePassword}
                disabled={create.pending}
                icon={<RefreshCw className="h-4 w-4" />}
              >
                Generate
              </Button>
            </div>

            {password && (
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-muted">
                  {PASSWORD_LENGTH}-character temporary password generated.
                </p>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={copyPassword}
                  disabled={create.pending}
                  icon={
                    copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )
                  }
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            )}

            {!password && (
              <p className="mt-1 text-sm text-muted">
                Generate a secure temporary password before creating
                the account. The user must change it at first sign-in.
              </p>
            )}

            {create.fieldError("password") && (
              <p className="mt-1 text-sm text-danger">
                {create.fieldError("password")}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="user-role">Role</Label>

            <Select
              id="user-role"
              value={role}
              onChange={(event) =>
                setRole(event.target.value as UserRole)
              }
            >
              <option value="staff">Staff</option>
              <option value="admin">Administrator</option>
            </Select>

            <p className="mt-1 text-sm text-muted">
              {role === "admin"
                ? "Can do everything, including deleting warehouses and managing users."
                : "Can manage warehouses, storage spaces, items and stock, but cannot delete them or manage users."}
            </p>
          </div>

          <FormMessage error={create.error} />
        </div>
      </Modal>
    </>
  );
}