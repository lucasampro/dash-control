// Uso: node scripts/hash-password.js "minhaSenha"
import bcrypt from "bcryptjs";

const senha = process.argv[2];
if (!senha) {
  console.error("Uso: node scripts/hash-password.js SUASENHA");
  process.exit(1);
}

console.log(bcrypt.hashSync(senha, 10));
