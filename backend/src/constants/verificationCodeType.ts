//questa è una costante che definisce i tipi di codice di verifica utilizzati nel sistema di autenticazione

const enum VerificationCodeType {
  EmailVerification = "email_verification",
  PasswordReset = "password_reset",
}

export default VerificationCodeType;
