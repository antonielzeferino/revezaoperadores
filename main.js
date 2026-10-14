
  // 1. DADOS PREDEFINIDOS
  const dadosIniciais = [
    {
      nome: "Ana",
      caixaAnterior: 2,
      inicio: "10:00",
      fim: "14:00"
    },
    {
      nome: "Bruno",
      caixaAnterior: 8,
      inicio: "10:00",
      fim: "14:00"
    },
    {
      nome: "Carla",
      caixaAnterior: 3,
      inicio: "11:00",
      fim: "14:00"
    },
    {
      nome: "Diego",
      caixaAnterior: 9,
      inicio: "12:00",
      fim: "16:00"
    },
    {
      nome: "Elisa",
      caixaAnterior: 4,
      inicio: "14:00",
      fim: "18:00"
    },
    {
      nome: "Fabio",
      caixaAnterior: 10,
      inicio: "14:00",
      fim: "18:00"
    },
    {
      nome: "Gabi",
      caixaAnterior: 5,
      inicio: "15:00",
      fim: "19:00"
    },
    {
      nome: "Hugo",
      caixaAnterior: 11,
      inicio: "16:00",
      fim: "20:00"
    }
  ];

    const esforcoCaixas = {
    1: 1,
    2: 1,
    3: 1,
    4: 2,
    5: 2,
    6: 3,
    7: 3,
    8: 3,
    9: 3,
    10: 2,
    11: 1,
    12: 1
    };

  const caixas = {
    A: [1, 2, 3, 4, 5, 6, 7],
    B: [8, 9, 10, 11, 12]
  };

  let operadores = copiarDados(dadosIniciais);

  function copiarDados(dados) {
    return dados.map(operador => ({ ...operador }));
  }

  // 2. MOSTRAR O ARRAY NO HTML
  function mostrarOperadores() {
    const tbody = document.getElementById("listaOperadores");

    tbody.innerHTML = operadores.map((operador, indice) => `
      <tr>
        <td>
          <input
            type="text"
            data-indice="${indice}"
            data-campo="nome"
            value="${escaparHTML(operador.nome)}"
          >
        </td>

        <td>
          <select data-indice="${indice}" data-campo="caixaAnterior">
            ${caixas.A.concat(caixas.B).map(caixa => `
              <option
                value="${caixa}"
                ${caixa === Number(operador.caixaAnterior) ? "selected" : ""}
              >
                ${caixa} - Lado ${obterLado(caixa)}
              </option>
            `).join("")}
          </select>
        </td>

        <td>
          <input
            type="time"
            data-indice="${indice}"
            data-campo="inicio"
            value="${operador.inicio}"
          >
        </td>

        <td>
          <input
            type="time"
            data-indice="${indice}"
            data-campo="fim"
            value="${operador.fim}"
          >
        </td>
      </tr>
    `).join("");
  }

  function escaparHTML(texto) {
    return String(texto).replace(/[&<>"']/g, caractere => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[caractere]);
  }

  function obterLado(caixa) {
    return caixas.A.includes(Number(caixa)) ? "A" : "B";
  }

  function paraMinutos(horario) {
    const [horas, minutos] = horario.split(":").map(Number);
    return horas * 60 + minutos;
  }

  // 3. LER AS ALTERAÇÕES FEITAS NO HTML
  function lerFormulario() {
    const dados = copiarDados(operadores);

    document.querySelectorAll("[data-campo]").forEach(campo => {
      const indice = Number(campo.dataset.indice);
      const propriedade = campo.dataset.campo;

      dados[indice][propriedade] =
        propriedade === "caixaAnterior"
          ? Number(campo.value)
          : campo.value.trim();
    });

    return dados;
  }

  // 4. VERIFICAR SE DOIS HORÁRIOS SE SOBREPOEM
  function temConflito(inicio, fim, alocacao) {
    return inicio < alocacao.fim &&
           fim > alocacao.inicio;
  }

  // 5. CALCULAR A ROTAÇÃO
  function gerarRotacao() {
    const dados = lerFormulario();
    const mensagem = document.getElementById("mensagem");

    const nomes = dados.map(op => op.nome.toLowerCase());

    if (dados.some(op =>
      !op.nome ||
      !op.inicio ||
      !op.fim ||
      !Number.isInteger(op.caixaAnterior) ||
      !caixas.A.concat(caixas.B).includes(op.caixaAnterior) ||
      !Number.isFinite(paraMinutos(op.inicio)) ||
      !Number.isFinite(paraMinutos(op.fim)) ||
      paraMinutos(op.inicio) >= paraMinutos(op.fim)
    )) {
      mensagem.className = "mensagem erro";
      mensagem.textContent =
        "Verifique os nomes, os caixas e os horários. O início deve ser anterior ao fim.";
      return;
    }

    if (new Set(nomes).size !== nomes.length) {
      mensagem.className = "mensagem erro";
      mensagem.textContent =
        "Existem nomes de operadores repetidos. Corrija antes de continuar.";
      return;
    }

    // Processa primeiro os operadores com maior duração.
    const ordenados = dados.map(op => ({
      ...op,
      inicioMin: paraMinutos(op.inicio),
      fimMin: paraMinutos(op.fim)
    })).sort((a, b) =>
      (b.fimMin - b.inicioMin) - (a.fimMin - a.inicioMin)
    );

    const alocacoes = [];
    const resultado = [];

    for (const operador of ordenados) {
      const ladoAnterior = obterLado(operador.caixaAnterior);

      const outroLado = ladoAnterior === "A" ? "B" : "A";

      // Tenta primeiro o lado oposto.
      const candidatos = [
        ...caixas[outroLado],
        ...caixas[ladoAnterior]
      ];

      let melhorCaixa = null;
      let menorPontuacao = Infinity;

      for (const caixa of candidatos) {
        const conflito = alocacoes.some(alocacao =>
          alocacao.caixa === caixa &&
          temConflito(
            operador.inicioMin,
            operador.fimMin,
            alocacao
          )
        );

        if (conflito) continue;

        const ladoNovo = obterLado(caixa);

        const esforcoAnterior =
        esforcoCaixas[operador.caixaAnterior];

        const esforcoNovo = esforcoCaixas[caixa];
        const carga = alocacoes.reduce((total, alocacao) => {
        if (alocacao.caixa !== caixa) {
            return total;
        }

        return total + (alocacao.fim - alocacao.inicio);
        }, 0);

        let pontuacaoEsforco;

        if (esforcoAnterior >= 2) {
        pontuacaoEsforco = esforcoNovo * 20;
        } else {
        pontuacaoEsforco = (4 - esforcoNovo) * 20;
        }

        // A pontuação menor é preferível.
        const pontuacao =
        carga * 0.1 +
        pontuacaoEsforco +(ladoNovo === ladoAnterior ? 100000 : 0);

        if (pontuacao < menorPontuacao) {
          menorPontuacao = pontuacao;
          melhorCaixa = caixa;
        }
      }

      if (melhorCaixa === null) {
        resultado.push({
          ...operador,
          caixaNovo: null,
          status: "Sem caixa disponível"
        });

        continue;
      }

      alocacoes.push({
        caixa: melhorCaixa,
        inicio: operador.inicioMin,
        fim: operador.fimMin
      });

      resultado.push({
        ...operador,
        caixaNovo: melhorCaixa,
        ladoAnterior,
        ladoNovo: obterLado(melhorCaixa),
        status: ladoAnterior !== obterLado(melhorCaixa)
          ? "Trocou de lado"
          : "Permaneceu no lado"
      });
    }

    mostrarResultado(resultado);

    mensagem.className = "mensagem sucesso";
    mensagem.textContent =
      "Rotação calculada. Confira o resultado antes de utilizar a escala.";
  }

  // 6. EXIBIR O RESULTADO NO HTML
  function mostrarResultado(resultado) {
    const tbody = document.getElementById("resultado");

    tbody.innerHTML = resultado.map(op => `
      <tr>
        <td>${escaparHTML(op.nome)}</td>
        <td>${op.caixaAnterior}</td>
        <td>${op.caixaNovo ?? "-"}</td>
        <td class="${op.ladoNovo === "A" ? "lado-a" : "lado-b"}">
          ${op.ladoNovo ?? "-"}
        </td>
        <td>${op.inicio} às ${op.fim}</td>
        <td>${op.status}</td>
      </tr>
    `).join("");
  }

  // 7. RESTAURAR O ARRAY ORIGINAL
  function restaurarDados() {
    operadores = copiarDados(dadosIniciais);
    mostrarOperadores();

    document.getElementById("resultado").innerHTML = `
      <tr>
        <td colspan="6">Gere uma nova rotação para ver o resultado.</td>
      </tr>
    `;

    document.getElementById("mensagem").textContent =
      "Dados iniciais restaurados.";
    document.getElementById("mensagem").className = "mensagem";
  }

  // Inicialização
  mostrarOperadores();