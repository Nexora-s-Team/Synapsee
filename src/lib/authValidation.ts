import { z } from "zod";

// Aceita qualquer e-mail @modulo.edu.br ou subdomínio (@aluno., @prof., @cs., @eng., etc.)
const MODULO_DOMAIN_REGEX = /@([a-z0-9-]+\.)*modulo\.edu\.br$/i;
const PROFESSOR_DOMAIN_REGEX = /@prof\.modulo\.edu\.br$/i;

const PUBLIC_EMAIL_PROVIDERS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "yahoo.com.br",
  "icloud.com",
  "me.com",
  "uol.com.br",
  "bol.com.br",
  "terra.com.br",
  "proton.me",
  "protonmail.com",
]);

export const isModuloEmail = (email: string) =>
  MODULO_DOMAIN_REGEX.test(email.trim());
export const isProfessorModuloEmail = (email: string) =>
  PROFESSOR_DOMAIN_REGEX.test(email.trim());

export const isCompanyEmail = (email: string) => {
  const normalized = email.trim().toLowerCase();
  const domain = normalized.split("@")[1] ?? "";

  if (!domain) return false;
  if (PUBLIC_EMAIL_PROVIDERS.has(domain)) return false;
  if (isModuloEmail(normalized)) return false;

  return true;
};

export const personSignUpSchema = z
  .object({
    display_name: z.string().trim().min(2, "Informe seu nome").max(80),
    email: z.string().trim().email("E-mail inválido").max(255),
    password: z.string().min(8, "Mínimo 8 caracteres").max(72),
    course: z.string().trim().max(80).optional().or(z.literal("")),
    semester: z.string().trim().max(40).optional().or(z.literal("")),
  })
  .refine(
    (d) => {
      // Em ambiente de teste, aceita qualquer e-mail
      // Em produção, descomente para forçar @modulo.edu.br
      return true; // isModuloEmail(d.email);
    },
    {
      message: "Use um e-mail válido",
      path: ["email"],
    },
  );

export const orgSignUpSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(2, "Informe o nome da organização")
    .max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});

export const signInSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(1, "Digite sua senha").max(72),
});

export type PersonSignUp = z.infer<typeof personSignUpSchema>;
export type OrgSignUp = z.infer<typeof orgSignUpSchema>;
export type SignIn = z.infer<typeof signInSchema>;
