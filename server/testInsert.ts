import { connectToMongo } from "./config/db.ts";
import User from "./models/User.ts";

(async () => {
  await connectToMongo();
  const user = await User.create({
    nomeCompleto: "Leonardo Maximino",
    email: "leonardo@teste.com",
    tipo: "barbeiro",
  });
  console.log("✅ Usuário criado:", user);
  process.exit(0);
})();
