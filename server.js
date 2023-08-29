// Importando as dependências
require("dotenv").config(); // Carrega as variáveis de ambiente de um arquivo .env
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const path = require("path");
const helmet = require("helmet");
const csrf = require("csurf");
const {
  middlewareGlobal,
  checkCsrfError,
  csrfMiddleware,
} = require("./src/middlewares/middleware");
const routes = require("./routes");

// Conectando ao banco de dados MongoDB
mongoose
  .connect(process.env.CONNECTIONSTRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.emit("pronto"); // Quando a conexão com o banco estiver pronta, emite um evento "pronto"
  })
  .catch((e) => console.log(e));

// Configuração do servidor Express
app.use(helmet()); // Adiciona medidas de segurança do Helmet

app.use(express.urlencoded({ extended: true })); // Habilita o parsing de dados de formulários
app.use(express.json()); // Habilita o parsing de dados em JSON
app.use(express.static(path.resolve(__dirname, "public"))); // Serve arquivos estáticos na pasta 'public'

// Configuração das sessões usando o MongoDB como store
const sessionOptions = session({
  secret: "qualquercoisa", // Chave secreta para assinar a sessão
  store: MongoStore.create({ mongoUrl: process.env.CONNECTIONSTRING }), // Armazena as sessões no MongoDB
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // Tempo de vida do cookie da sessão (7 dias)
    httpOnly: true, // Apenas o servidor pode acessar o cookie
  },
});
app.use(sessionOptions); // Usa as configurações de sessão
app.use(flash()); // Habilita mensagens flash (uma vez exibidas após redirecionamentos)

// Configuração das views e do template engine EJS
app.set("views", path.resolve(__dirname, "src", "views"));
app.set("view engine", "ejs");

// Proteção contra CSRF (Cross-Site Request Forgery)
app.use(csrf()); // Adiciona tokens CSRF a formulários

// Middlewares
app.use(middlewareGlobal); // Middleware global para definir variáveis disponíveis em todas as views
app.use(checkCsrfError); // Middleware para tratar erros de CSRF
app.use(csrfMiddleware); // Middleware para disponibilizar o token CSRF para as views

// Rotas
app.use(routes); // Adiciona as rotas definidas no arquivo 'routes'

// Quando o banco de dados estiver pronto, inicia o servidor
app.on("pronto", () => {
  app.listen(3000, () => {
    console.log("Acessar http://localhost:3000");
    console.log("Servidor executando na porta 3000");
  });
});
