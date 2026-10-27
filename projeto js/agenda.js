
 const $ = (id) => document.getElementById(id);

const CHAVE_CONTAS = "agendaProContas";
const CHAVE_ATIVIDADES = "agendaProAtividades";
const CHAVE_SESSAO = "agendaProSessao";

let usuarioAtual = null;
let atividades = [];
let dataSelecionada = new Date();
let mesExibido = new Date();

dataSelecionada.setHours(12, 0, 0, 0);
mesExibido.setDate(1);

const hoje = new Date();
const dataHojeISO = formatarData(hoje);

function formatarData(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function converterData(valor) {
  const [ano, mes, dia] = valor.split("-").map(Number);
  return new Date(ano, mes - 1, dia, 12);
}

function formatarDataBonita(valor) {
  return converterData(valor).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function dinheiro(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function obterContas() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_CONTAS)) || [];
  } catch {
    return [];
  }
}

function salvarContas(contas) {
  localStorage.setItem(CHAVE_CONTAS, JSON.stringify(contas));
}

function obterAtividadesDoUsuario() {
  try {
    const todas = JSON.parse(
      localStorage.getItem(CHAVE_ATIVIDADES)
    ) || [];

    return todas.filter(a => a.email === usuarioAtual.email);
  } catch {
    return [];
  }
}

function salvarAtividades() {
  const todas = JSON.parse(
    localStorage.getItem(CHAVE_ATIVIDADES)
  ) || [];

  const outras = todas.filter(a => a.email !== usuarioAtual.email);

  localStorage.setItem(
    CHAVE_ATIVIDADES,
    JSON.stringify([...outras, ...atividades])
  );
}

function mostrarMensagemLogin(texto, erro = false) {
  $("mensagemLogin").textContent = texto;
  $("mensagemLogin").style.color = erro ? "#d32f2f" : "#168b50";
}

function mostrarEntrar() {
  $("formLogin").hidden = false;
  $("formCadastro").hidden = true;
  $("abaEntrar").classList.add("ativa");
  $("abaCadastro").classList.remove("ativa");
  mostrarMensagemLogin("");
}

function mostrarCadastro() {
  $("formLogin").hidden = true;
  $("formCadastro").hidden = false;
  $("abaCadastro").classList.add("ativa");
  $("abaEntrar").classList.remove("ativa");
  mostrarMensagemLogin("");
}

$("abaEntrar").addEventListener("click", mostrarEntrar);
$("abaCadastro").addEventListener("click", mostrarCadastro);

// CADASTRO DEMONSTRATIVO
$("formCadastro").addEventListener("submit", function(event) {
  event.preventDefault();

  const nome = $("nomeCadastro").value.trim();
  const email = $("emailCadastro").value.trim().toLowerCase();
  const senha = $("senhaCadastro").value;

  if (senha.length < 6) {
    mostrarMensagemLogin("A senha deve ter pelo menos 6 caracteres.", true);
    return;
  }

  const contas = obterContas();

  if (contas.some(c => c.email === email)) {
    mostrarMensagemLogin("Esse e-mail já está cadastrado. Entre na sua conta.", true);
    return;
  }

  // Demonstração local: não usar com senhas reais.
  contas.push({ nome, email, senha });
  salvarContas(contas);

  $("emailLogin").value = email;
  $("senhaLogin").value = "";
  mostrarEntrar();

  mostrarMensagemLogin("Conta criada! Entre com seu e-mail e senha.");
});

// LOGIN DEMONSTRATIVO
$("formLogin").addEventListener("submit", function(event) {
  event.preventDefault();

  const email = $("emailLogin").value.trim().toLowerCase();
  const senha = $("senhaLogin").value;

  const conta = obterContas().find(
    c => c.email === email && c.senha === senha
  );

  if (!conta) {
    mostrarMensagemLogin("E-mail ou senha incorretos.", true);
    return;
  }

  entrarNaAgenda(conta);
});

function entrarNaAgenda(conta) {
  usuarioAtual = { nome: conta.nome, email: conta.email };
  localStorage.setItem(CHAVE_SESSAO, conta.email);

  atividades = obterAtividadesDoUsuario();

  $("telaLogin").hidden = true;
  $("painel").hidden = false;
  $("nomeUsuario").textContent = conta.nome;

  aplicarTema(localStorage.getItem("agendaProTema") || "verde");

  preencherSeletoresRelatorio();

  dataSelecionada = new Date();
  dataSelecionada.setHours(12, 0, 0, 0);
  mesExibido = new Date(
    dataSelecionada.getFullYear(),
    dataSelecionada.getMonth(),
    1
  );

  atualizarTela();
}

$("sair").addEventListener("click", function() {
  localStorage.removeItem(CHAVE_SESSAO);
  usuarioAtual = null;
  atividades = [];

  $("painel").hidden = true;
  $("telaLogin").hidden = false;
  $("senhaLogin").value = "";
  mostrarEntrar();
});

// TEMAS
function aplicarTema(tema) {
  document.body.classList.remove(
    "tema-vermelho", "tema-preto", "tema-azul"
  );

  if (tema !== "verde") {
    document.body.classList.add(`tema-${tema}`);
  }

  localStorage.setItem("agendaProTema", tema);
}

document.querySelectorAll("[data-cor]").forEach(botao => {
  botao.addEventListener("click", () => {
    aplicarTema(botao.dataset.cor);
  });
});

// CALENDÁRIO
function renderizarCalendario() {
  const calendario = $("calendario");
  calendario.replaceChildren();

  $("mesAno").textContent = mesExibido.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });

  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  diasSemana.forEach(dia => {
    const elemento = document.createElement("div");
    elemento.className = "dia-semana";
    elemento.textContent = dia;
    calendario.appendChild(elemento);
  });

  const ano = mesExibido.getFullYear();
  const mes = mesExibido.getMonth();
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();

  for (let i = 0; i < primeiroDia; i++) {
    const vazio = document.createElement("div");
    vazio.className = "dia vazio";
    calendario.appendChild(vazio);
  }

  for (let dia = 1; dia <= totalDias; dia++) {
    const data = formatarData(new Date(ano, mes, dia, 12));
    const tarefas = atividades.filter(a => a.data === data);

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "dia";

    if (data === dataSelecionadaISO()) {
      botao.classList.add("selecionado");
    }

    if (data === dataHojeISO) {
      botao.classList.add("hoje");
    }

    const numero = document.createElement("span");
    numero.className = "numero-dia";
    numero.textContent = dia;
    botao.appendChild(numero);

    if (tarefas.length) {
      const marcadores = document.createElement("div");
      marcadores.className = "marcadores";

      tarefas.slice(0, 5).forEach(tarefa => {
        const marcador = document.createElement("span");
        marcador.className = "marcador";
        if (tarefa.concluida) marcador.classList.add("concluido");
        marcadores.appendChild(marcador);
      });

      botao.appendChild(marcadores);
      botao.title = `${tarefas.length} atividade(s)`;
    }

    botao.addEventListener("click", () => {
      dataSelecionada = converterData(data);
      atualizarTela();
    });

    calendario.appendChild(botao);
  }
}

function dataSelecionadaISO() {
  return formatarData(dataSelecionada);
}

$("mesAnterior").addEventListener("click", () => {
  mesExibido.setMonth(mesExibido.getMonth() - 1);
  renderizarCalendario();
});

$("proximoMes").addEventListener("click", () => {
  mesExibido.setMonth(mesExibido.getMonth() + 1);
  renderizarCalendario();
});

$("hoje").addEventListener("click", () => {
  dataSelecionada = new Date();
  dataSelecionada.setHours(12, 0, 0, 0);
  mesExibido = new Date(
    dataSelecionada.getFullYear(),
    dataSelecionada.getMonth(),
    1
  );
  atualizarTela();
});

// CADASTRAR E EDITAR ATIVIDADES
$("formAtividade").addEventListener("submit", function(event) {
  event.preventDefault();

  const titulo = $("tituloAtividade").value.trim();

  if (!titulo) {
    $("mensagemAtividade").textContent = "Informe o nome da atividade.";
    return;
  }

  const id = $("atividadeId").value;

  const atividade = {
    id: id || (
      Date.now().toString() + Math.random().toString(16).slice(2)
    ),
    email: usuarioAtual.email,
    data: dataSelecionadaISO(),
    titulo,
    horario: $("horario").value,
    descricao: $("descricao").value.trim(),
    custo: Math.max(0, Number($("custo").value) || 0),
    beneficio: Math.max(0, Number($("beneficio").value) || 0),
    prioridade: $("importancia").value,
    concluida: false
  };

  if (id) {
    const indice = atividades.findIndex(a => a.id === id);

    if (indice !== -1) {
      atividade.concluida = atividades[indice].concluida;
      atividades[indice] = atividade;
    }
  } else {
    atividades.push(atividade);
  }

  salvarAtividades();
  limparFormulario();
  $("mensagemAtividade").textContent = "Atividade salva com sucesso!";
  atualizarTela();
});

function limparFormulario() {
  $("formAtividade").reset();
  $("atividadeId").value = "";
  $("custo").value = "0";
  $("beneficio").value = "0";
  $("importancia").value = "media";
  $("tituloFormulario").textContent = "Nova atividade";
  $("salvarAtividade").textContent = "+ Salvar atividade";
  $("cancelarEdicao").hidden = true;
}

$("cancelarEdicao").addEventListener("click", limparFormulario);

function editarAtividade(id) {
  const a = atividades.find(item => item.id === id);
  if (!a) return;

  dataSelecionada = converterData(a.data);
  mesExibido = new Date(
    dataSelecionada.getFullYear(),
    dataSelecionada.getMonth(),
    1
  );

  $("atividadeId").value = a.id;
  $("tituloAtividade").value = a.titulo;
  $("horario").value = a.horario;
  $("descricao").value = a.descricao;
  $("custo").value = a.custo;
  $("beneficio").value = a.beneficio;
  $("importancia").value = a.prioridade;

  $("tituloFormulario").textContent = "Editar atividade";
  $("salvarAtividade").textContent = "Salvar alterações";
  $("cancelarEdicao").hidden = false;

  atualizarTela();

  $("tituloAtividade").focus();
  $("formAtividade").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function alternarConclusao(id) {
  const a = atividades.find(item => item.id === id);
  if (!a) return;

  a.concluida = !a.concluida;
  salvarAtividades();
  atualizarTela();
}

function excluirAtividade(id) {
  if (!confirm("Deseja realmente excluir esta atividade?")) return;

  atividades = atividades.filter(a => a.id !== id);
  salvarAtividades();
  atualizarTela();
}

// LISTA DO DIA
function renderizarAtividades() {
  const lista = $("listaAtividades");
  lista.replaceChildren();

  const doDia = atividades
    .filter(a => a.data === dataSelecionadaISO())
    .sort((a, b) => (a.horario || "99:99").localeCompare(b.horario || "99:99"));

  $("quantidadeDia").textContent =
    `${doDia.length} ${doDia.length === 1 ? "atividade" : "atividades"}`;

  if (!doDia.length) {
    const vazio = document.createElement("div");
    vazio.className = "vazio";
    vazio.textContent = "Nenhuma atividade para este dia. Cadastre a primeira acima.";
    lista.appendChild(vazio);
    return;
  }

  doDia.forEach(a => {
    const cartao = document.createElement("article");
    cartao.className = "atividade";
    if (a.concluida) cartao.classList.add("concluida");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "checkbox-atividade";
    checkbox.checked = a.concluida;
    checkbox.setAttribute("aria-label", "Marcar atividade como concluída");
    checkbox.addEventListener("change", () => alternarConclusao(a.id));

    const conteudo = document.createElement("div");
    conteudo.className = "atividade-conteudo";

    const topo = document.createElement("div");
    topo.className = "atividade-topo";

    const titulo = document.createElement("h3");
    titulo.className = "atividade-titulo";
    titulo.textContent = a.titulo;

    const etiquetas = document.createElement("div");
    etiquetas.className = "etiquetas-atividade";

    const prioridade = document.createElement("span");
    prioridade.className = `pilula ${a.prioridade}`;
    prioridade.textContent = `Prioridade ${a.prioridade}`;
    etiquetas.appendChild(prioridade);

    const status = document.createElement("span");
    status.className = "pilula";
    status.textContent = a.concluida ? "Concluída" : "Pendente";
    etiquetas.appendChild(status);

    topo.append(titulo, etiquetas);

    const descricao = document.createElement("p");
    descricao.className = "descricao-atividade";
    descricao.textContent = a.descricao || "Sem descrição.";

    const detalhes = document.createElement("div");
    detalhes.className = "detalhes-atividade";

    [
      a.horario ? `Horário: ${a.horario}` : "Horário não definido",
      `Custo: ${dinheiro(a.custo)}`,
      `Benefício previsto: ${dinheiro(a.beneficio)}`
    ].forEach(texto => {
      const span = document.createElement("span");
      span.textContent = texto;
      detalhes.appendChild(span);
    });

    const acoes = document.createElement("div");
    acoes.className = "acoes-atividade";

    const botaoEditar = criarBotao("Editar", () => editarAtividade(a.id));
    const botaoCompartilhar = criarBotao(
      "Compartilhar",
      () => compartilharAtividade(a)
    );
    const botaoExcluir = criarBotao(
      "Excluir",
      () => excluirAtividade(a.id)
    );

    acoes.append(botaoEditar, botaoCompartilhar, botaoExcluir);
    conteudo.append(topo, descricao, detalhes, acoes);
    cartao.append(checkbox, conteudo);
    lista.appendChild(cartao);
  });
}

function criarBotao(texto, acao) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao-pequeno";
  botao.textContent = texto;
  botao.addEventListener("click", acao);
  return botao;
}

// RELATÓRIO MENSAL
function preencherSeletoresRelatorio() {
  const mes = $("mesRelatorio");
  const ano = $("anoRelatorio");

  mes.replaceChildren();
  ano.replaceChildren();

  for (let i = 0; i < 12; i++) {
    const opcao = document.createElement("option");
    opcao.value = i;
    opcao.textContent = new Date(2026, i, 1).toLocaleDateString(
      "pt-BR", { month: "long" }
    );
    mes.appendChild(opcao);
  }

  const anoAtual = new Date().getFullYear();

  for (let y = anoAtual - 5; y <= anoAtual + 5; y++) {
    const opcao = document.createElement("option");
    opcao.value = y;
    opcao.textContent = y;
    ano.appendChild(opcao);
  }

  mes.value = new Date().getMonth();
  ano.value = anoAtual;
}

function obterRelatorio() {
  const mes = Number($("mesRelatorio").value);
  const ano = Number($("anoRelatorio").value);

  const itens = atividades.filter(a => {
    const data = converterData(a.data);
    return data.getMonth() === mes && data.getFullYear() === ano;
  });

  const feitas = itens.filter(a => a.concluida);
  const pendentes = itens.filter(a => !a.concluida);

  const custos = itens.reduce((soma, a) => soma + Number(a.custo || 0), 0);

  const beneficios = itens.reduce(
    (soma, a) => soma + Number(a.beneficio || 0), 0
  );

  return {
    mes,
    ano,
    itens,
    feitas,
    pendentes,
    custos,
    beneficios,
    saldo: beneficios - custos,
    taxa: itens.length ? Math.round(feitas.length / itens.length * 100) : 0
  };
}

function atualizarRelatorio() {
  const r = obterRelatorio();

  $("relTotal").textContent = r.itens.length;
  $("relFeitas").textContent = r.feitas.length;
  $("relPendentes").textContent = r.pendentes.length;
  $("relCustos").textContent = dinheiro(r.custos);
  $("relBeneficios").textContent = dinheiro(r.beneficios);
  $("relSaldo").textContent = dinheiro(r.saldo);

  let analise = "";

  if (!r.itens.length) {
    analise = "Não existem atividades cadastradas neste mês. Cadastre suas atividades para avaliar os resultados.";
  } else if (r.saldo > 0) {
    analise = `Pelos valores informados, o benefício previsto supera os custos em ${dinheiro(r.saldo)}. Financeiramente, parece promissor, mas confirme os resultados reais e considere outros custos e riscos.`;
  } else if (r.saldo < 0) {
    analise = `Os custos previstos superam os benefícios em ${dinheiro(Math.abs(r.saldo))}. Reavalie os custos, os benefícios e a importância das atividades antes de decidir.`;
  } else {
    analise = "Os custos e benefícios previstos estão equilibrados. Avalie também o tempo gasto, os resultados práticos e os benefícios que não são financeiros.";
  }

  analise += ` Foram concluídas ${r.taxa}% das atividades do mês.`;

  $("analiseMensal").textContent = analise;
}

function montarTextoRelatorio() {
  const r = obterRelatorio();

  const nomeMes = new Date(r.ano, r.mes, 1).toLocaleDateString(
    "pt-BR", { month: "long", year: "numeric" }
  );

  const linhas = [
    `RELATÓRIO MENSAL — AGENDA PRO`,
    `Responsável: ${usuarioAtual.nome}`,
    `Período: ${nomeMes}`,
    "",
    `Total de atividades: ${r.itens.length}`,
    `Concluídas: ${r.feitas.length}`,
    `Pendentes: ${r.pendentes.length}`,
    `Taxa de conclusão: ${r.taxa}%`,
    `Custos previstos: ${dinheiro(r.custos)}`,
    `Benefícios previstos: ${dinheiro(r.beneficios)}`,
    `Saldo estimado: ${dinheiro(r.saldo)}`,
    "",
    "DETALHAMENTO DAS ATIVIDADES"
  ];

  r.itens
    .slice()
    .sort((a, b) => a.data.localeCompare(b.data))
    .forEach(a => {
      linhas.push(
        "",
        `${formatarDataBonita(a.data)}${a.horario ? " às " + a.horario : ""}`,
        `Atividade: ${a.titulo}`,
        `Status: ${a.concluida ? "Concluída" : "Pendente"}`,
        `Prioridade: ${a.prioridade}`,
        `Descrição: ${a.descricao || "Não informada"}`,
        `Custo previsto: ${dinheiro(a.custo)}`,
        `Benefício previsto: ${dinheiro(a.beneficio)}`
      );
    });

  linhas.push(
    "",
    "AVALIAÇÃO",
    $("analiseMensal").textContent,
    "",
    "Observação: os valores são estimativas informadas pelo usuário."
  );

  return linhas.join("\n");
}

$("gerarRelatorio").addEventListener("click", atualizarRelatorio);
$("mesRelatorio").addEventListener("change", atualizarRelatorio);
$("anoRelatorio").addEventListener("change", atualizarRelatorio);

// COMPARTILHAMENTO
function compartilharTexto(texto) {
  const url = "https://wa.me/?text=" + encodeURIComponent(texto);
  window.open(url, "_blank", "noopener,noreferrer");
}

function compartilharAtividade(a) {
  const texto = [
    "ATIVIDADE — AGENDA PRO",
    `Data: ${formatarDataBonita(a.data)}`,
    `Horário: ${a.horario || "Não definido"}`,
    `Atividade: ${a.titulo}`,
    `Descrição: ${a.descricao || "Não informada"}`,
    `Status: ${a.concluida ? "Concluída" : "Pendente"}`,
    `Prioridade: ${a.prioridade}`
  ].join("\n");

  compartilharTexto(texto);
}

$("enviarWhatsApp").addEventListener("click", () => {
  compartilharTexto(montarTextoRelatorio());
});

$("enviarEmail").addEventListener("click", () => {
  const r = obterRelatorio();

  const assunto = `Relatório mensal da Agenda Pro - ${r.mes + 1}/${r.ano}`;
  const corpo = montarTextoRelatorio();

  const url = "mailto:?subject=" + encodeURIComponent(assunto) +
    "&body=" + encodeURIComponent(corpo);

  window.location.href = url;
});

$("baixarRelatorio").addEventListener("click", () => {
  const texto = montarTextoRelatorio();
  const arquivo = new Blob(["\uFEFF" + texto], {
    type: "text/plain;charset=utf-8"
  });

  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  const r = obterRelatorio();

  link.href = url;
  link.download = `relatorio-${r.ano}-${String(r.mes + 1).padStart(2, "0")}.txt`;

  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

// PAINEL E NAVEGAÇÃO
function atualizarIndicadores() {
  const total = atividades.length;
  const feitas = atividades.filter(a => a.concluida).length;
  const pendentes = total - feitas;

  $("totalAtividades").textContent = total;
  $("totalConcluidas").textContent = feitas;
  $("totalPendentes").textContent = pendentes$("taxaConclusao").textContent =
    `${total ? Math.round(feitas / total * 100) : 0}%`;
}

function atualizarTela() {
  $("dataHoje").textContent = new Date().toLocaleDateString("pt-BR");
  $("dataSelecionadaTexto").textContent =
    "Data selecionada: " + formatarDataBonita(dataSelecionadaISO());

  renderizarCalendario();
  renderizarAtividades();
  atualizarIndicadores();
  atualizarRelatorio();
}

$("voltarTopo").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// RECUPERAR SESSÃO NESTE NAVEGADOR
(function iniciar() {
  const email = localStorage.getItem(CHAVE_SESSAO);

  if (email) {
    const conta = obterContas().find(c => c.email === email);

    if (conta) {
      entrarNaAgenda(conta);
      return;
    }

    localStorage.removeItem(CHAVE_SESSAO);
  }

  $("telaLogin").hidden = false;
  $("painel").hidden = true;
})();
   

