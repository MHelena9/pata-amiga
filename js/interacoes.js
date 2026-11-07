"use strict";

const PALETAS = [
  { id: "tomate", nome: "Tomate", tema: "#c81e14" },
  { id: "hortela", nome: "Hortelã", tema: "#0c5c40" },
  { id: "algodao", nome: "Algodão-doce", tema: "#a31648" }
];

const CHAVE_PALETA = "pata-amiga-paleta";
const CHAVE_FAVORITOS = "pata-amiga-favoritos";

function lerArmazenamento(chave) {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravarArmazenamento(chave, valor) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
  }
}

function indiceDaPaleta(id) {
  const indice = PALETAS.findIndex((paleta) => paleta.id === id);
  return indice >= 0 ? indice : 0;
}

function aplicarPaleta(paleta) {
  document.documentElement.dataset.paleta = paleta.id;
  const tema = document.querySelector('meta[name="theme-color"]');
  if (tema) tema.content = paleta.tema;
  const botao = document.getElementById("botao-paleta");
  if (botao) botao.textContent = `Cores: ${paleta.nome}`;
  gravarArmazenamento(CHAVE_PALETA, paleta.id);
}

function alternarPaleta() {
  const atual = indiceDaPaleta(document.documentElement.dataset.paleta);
  const proxima = PALETAS[(atual + 1) % PALETAS.length];
  aplicarPaleta(proxima);
}

function filtrarAnimais(especie, botaoPressionado) {
  document.querySelectorAll(".filtro").forEach((botao) => {
    botao.setAttribute("aria-pressed", String(botao === botaoPressionado));
  });

  document.querySelectorAll(".cartao-animal").forEach((cartao) => {
    const mostrar = especie === "todos" || cartao.dataset.especie === especie;
    cartao.hidden = !mostrar;
    if (!mostrar) {
      limparDestaque(cartao);
      return;
    }
    cartao.classList.remove("cartao-animal--entrando");
    void cartao.offsetWidth;
    cartao.classList.add("cartao-animal--entrando");
  });

  const visiveis = document.querySelectorAll(".cartao-animal:not([hidden])").length;
  document.getElementById("aviso-vazio").hidden = visiveis > 0;
}

function atualizarContadorFavoritos() {
  const total = document.querySelectorAll('.botao-favorito[aria-pressed="true"]').length;
  const texto = total === 1 ? "1 favorito" : `${total} favoritos`;
  document.getElementById("contador-favoritos").textContent = texto;
}

function salvarFavoritos() {
  const ids = [...document.querySelectorAll('.botao-favorito[aria-pressed="true"]')]
    .map((botao) => botao.closest(".cartao-animal").id);
  gravarArmazenamento(CHAVE_FAVORITOS, JSON.stringify(ids));
}

function favoritarAnimal(botao) {
  const cartao = botao.closest(".cartao-animal");
  const nome = cartao.dataset.nome;
  const ativo = botao.getAttribute("aria-pressed") === "true";
  const proximo = !ativo;
  botao.setAttribute("aria-pressed", String(proximo));
  botao.setAttribute("aria-label", proximo ? `Remover ${nome} dos favoritos` : `Favoritar ${nome}`);
  botao.classList.remove("botao-favorito--pulando");
  void botao.offsetWidth;
  botao.classList.add("botao-favorito--pulando");
  atualizarContadorFavoritos();
  salvarFavoritos();
}

function montarLinkWhatsapp(texto) {
  const numero = document.body.dataset.whatsapp;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

function abrirDetalhe(cartao) {
  if (!cartao) return;
  const nome = cartao.dataset.nome;
  const foto = cartao.querySelector("img");
  const dialogo = document.getElementById("dialogo-animal");
  const fotoDialogo = document.getElementById("dialogo-foto");

  document.getElementById("dialogo-titulo").textContent = nome;
  document.getElementById("dialogo-especie").textContent = cartao.querySelector(".cartao-animal__selo").textContent;
  document.getElementById("dialogo-historia").textContent = cartao.querySelector(".cartao-animal__historia").textContent;
  document.getElementById("dialogo-ficha").innerHTML = cartao.querySelector(".cartao-animal__ficha").innerHTML;
  fotoDialogo.src = foto.currentSrc || foto.src;
  fotoDialogo.alt = foto.alt;
  document.getElementById("dialogo-whatsapp").href = cartao.querySelector(".atalho-whatsapp").href;
  dialogo.showModal();
}

function fecharDetalhe() {
  document.getElementById("dialogo-animal").close();
}

function limparDestaque(cartao) {
  cartao.classList.remove("cartao-animal--destaque");
  cartao.style.transform = "";
  cartao.style.boxShadow = "";
}

function sortearAnimal() {
  const visiveis = [...document.querySelectorAll(".cartao-animal:not([hidden])")];
  if (!visiveis.length) return;

  document.querySelectorAll(".cartao-animal--destaque").forEach(limparDestaque);

  const escolhido = visiveis[Math.floor(Math.random() * visiveis.length)];
  const faixa = document.getElementById("faixa-surpresa");
  faixa.hidden = false;
  faixa.textContent = `A sorte apontou para ${escolhido.dataset.nome}.`;

  escolhido.classList.add("cartao-animal--destaque");
  escolhido.style.setProperty("--cor-sorte", escolhido.dataset.cor); /* 1. --cor-sorte */
  faixa.style.backgroundColor = escolhido.dataset.cor; /* 2. background-color */
  faixa.style.color = "#241c16"; /* 3. color */
  escolhido.style.transform = "rotate(0deg) translateY(-8px)"; /* 4. transform */
  escolhido.style.boxShadow = "10px 12px 0 var(--cor-tinta)"; /* 5. box-shadow */

  const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  escolhido.scrollIntoView({
    behavior: reduzirMovimento ? "auto" : "smooth",
    block: "center"
  });
}

function restaurarFavoritos() {
  const bruto = lerArmazenamento(CHAVE_FAVORITOS);
  if (!bruto) return;
  let ids = [];
  try {
    const lido = JSON.parse(bruto);
    if (Array.isArray(lido)) ids = lido;
  } catch {
    return;
  }
  ids.forEach((id) => {
    const cartao = document.getElementById(id);
    const botao = cartao?.querySelector(".botao-favorito");
    if (!botao) return;
    botao.setAttribute("aria-pressed", "true");
    botao.setAttribute("aria-label", `Remover ${cartao.dataset.nome} dos favoritos`);
  });
  atualizarContadorFavoritos();
}

function prepararLinksWhatsapp() {
  document.querySelectorAll(".atalho-whatsapp").forEach((link) => {
    if (link.dataset.texto) link.href = montarLinkWhatsapp(link.dataset.texto);
  });
}

function prepararPagina() {
  const salva = lerArmazenamento(CHAVE_PALETA);
  if (salva && salva !== "tomate") aplicarPaleta(PALETAS[indiceDaPaleta(salva)]);

  prepararLinksWhatsapp();
  restaurarFavoritos();

  document.getElementById("botao-paleta").addEventListener("click", alternarPaleta);
  document.getElementById("botao-surpresa").addEventListener("click", sortearAnimal);
  document.getElementById("dialogo-fechar").addEventListener("click", fecharDetalhe);

  document.getElementById("filtros").addEventListener("click", (evento) => {
    const botao = evento.target.closest(".filtro");
    if (!botao) return;
    filtrarAnimais(botao.dataset.especie, botao);
  });

  document.getElementById("grade-animais").addEventListener("click", (evento) => {
    const favorito = evento.target.closest(".botao-favorito");
    if (favorito) {
      favoritarAnimal(favorito);
      return;
    }
    const detalhe = evento.target.closest("[data-acao='detalhe']");
    if (detalhe) abrirDetalhe(detalhe.closest(".cartao-animal"));
  });

  const dialogo = document.getElementById("dialogo-animal");
  dialogo.addEventListener("click", (evento) => {
    if (evento.target === dialogo) fecharDetalhe();
  });
}

prepararPagina();
