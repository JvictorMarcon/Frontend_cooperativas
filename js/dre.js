const API_BASE_URL = "https://backend-dre.vercel.app";
let myChartBarras = null;
let myChartPizza = null;

// Validação de acesso
document.addEventListener("DOMContentLoaded", () => {
    const user = sessionStorage.getItem("user");
    const cargo = sessionStorage.getItem("cargo");
    let cooperativaNome = sessionStorage.getItem("cooperativa"); // santa maria ou coopersel

    if (!user || (cargo !== "adm" && cargo !== "tesoureira")) {
        window.location.href = "index.html"; // Redireciona para o login
        return;
    }

    document.getElementById("user-display").textContent = user;
    document.getElementById("cargo-display").textContent = cargo;

    const btnVoltar = document.getElementById("btn-voltar");
    btnVoltar.addEventListener("click", () => {
        if (cargo === "adm") {
            window.location.href = "dashboard_adm.html";
        } else {
            // Ajustar de acordo com o nome salvo no login
            if((cooperativaNome || "").toLowerCase() === "santa maria"){
                 window.location.href = "Santa Maria/dashboard.html";
            } else {
                 window.location.href = "Coopersel/dashboard.html";
            }
        }
    });

    const selCooperativaContainer = document.getElementById("container-sel-cooperativa");
    const selCooperativa = document.getElementById("selCooperativa");
    const btnCarregar = document.getElementById("btnCarregar");
    
    // Configura o seletor de cooperativa baseado no cargo
    if (cargo === "tesoureira") {
        selCooperativaContainer.classList.add("hidden");
        selCooperativa.value = (cooperativaNome || "").toLowerCase() === "santa maria" ? "1" : "2";
    } else {
        selCooperativaContainer.classList.remove("hidden");
    }

    // Preenche Anos (ex: 2024 até 2030)
    const selAno = document.getElementById("selAno");
    const anoAtual = new Date().getFullYear();
    for(let ano = anoAtual - 2; ano <= anoAtual + 3; ano++) {
        const option = document.createElement("option");
        option.value = ano;
        option.textContent = ano;
        if(ano === anoAtual) option.selected = true;
        selAno.appendChild(option);
    }
    
    // Preenche Mês atual
    const mesAtual = new Date().getMonth() + 1;
    document.getElementById("selMes").value = mesAtual;

    // Tabs
    const tabMensal = document.getElementById("tabMensal");
    const tabAcum = document.getElementById("tabAcum");

    tabMensal.addEventListener("click", () => {
        tabMensal.classList.add("border-b-2", "border-blue-700", "text-blue-700");
        tabMensal.classList.remove("border-transparent", "text-gray-500");
        
        tabAcum.classList.remove("border-b-2", "border-blue-700", "text-blue-700");
        tabAcum.classList.add("border-transparent", "text-gray-500");
        
        document.getElementById("selMes").parentElement.classList.remove("hidden");
        carregarDRE();
    });

    tabAcum.addEventListener("click", () => {
        tabAcum.classList.add("border-b-2", "border-blue-700", "text-blue-700");
        tabAcum.classList.remove("border-transparent", "text-gray-500");
        
        tabMensal.classList.remove("border-b-2", "border-blue-700", "text-blue-700");
        tabMensal.classList.add("border-transparent", "text-gray-500");
        
        document.getElementById("selMes").parentElement.classList.add("hidden");
        carregarDREAcumulado();
    });

    btnCarregar.addEventListener("click", () => {
        if(tabMensal.classList.contains("text-blue-700")) {
            carregarDRE();
        } else {
            carregarDREAcumulado();
        }
    });

    // Carrega initial
    carregarDRE();

    // ==============================
    //   MODAIS - Setup
    // ==============================

    // Função auxiliar para mostrar mensagem nos modais
    function showMsg(elId, msg, isError) {
        const el = document.getElementById(elId);
        el.textContent = msg;
        el.className = `text-xs text-center font-semibold ${isError ? "text-red-600" : "text-green-600"}`;
        el.classList.remove("hidden");
        setTimeout(() => el.classList.add("hidden"), 4000);
    }

    // --- Helpers de Contexto ---
    function getContexto() {
        return {
            user: sessionStorage.getItem("user"),
            senha: sessionStorage.getItem("senha"),
            coopId: parseInt(document.getElementById("selCooperativa").value),
            mes: parseInt(document.getElementById("selMes").value),
            ano: parseInt(document.getElementById("selAno").value),
        };
    }

    // --- Carregar Plano de Contas e criar Autocomplete ---
    let _planoContas = []; // cache local

    async function carregarPlanoContasSelect() {
        const inputEl = document.getElementById("lanc-cc-input");
        const hiddenEl = document.getElementById("lanc-cc");
        const listEl = document.getElementById("lanc-cc-list");

        if (_planoContas.length === 0) {
            inputEl.placeholder = "Carregando...";
            try {
                const res = await fetch(`${API_BASE_URL}/plano-contas`);
                const data = await res.json();
                _planoContas = (data.plano_contas || []).filter(c => c.categoria !== "saldo_anterior");
            } catch {
                inputEl.placeholder = "Erro ao carregar";
                return;
            }
        }

        inputEl.value = "";
        hiddenEl.value = "";
        inputEl.placeholder = "Digite para buscar...";
        listEl.classList.add("hidden");

        function renderList(filtro) {
            const termo = filtro.toLowerCase();
            const filtrados = _planoContas.filter(c =>
                c.historico.toLowerCase().includes(termo) ||
                c.categoria.replace(/_/g, " ").toLowerCase().includes(termo)
            ).slice(0, 12);

            if (filtrados.length === 0) {
                listEl.innerHTML = `<li class="px-4 py-2 text-gray-400 text-xs">Nenhuma conta encontrada</li>`;
            } else {
                listEl.innerHTML = filtrados.map(c => `
                    <li data-id="${c.id}" data-nome="${c.historico}" class="px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 flex items-center justify-between gap-2">
                        <span>${c.historico}</span>
                        <span class="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 whitespace-nowrap">${c.categoria.replace(/_/g, " ")}</span>
                    </li>`).join("");
            }
            listEl.classList.remove("hidden");
        }

        inputEl.addEventListener("input", () => {
            renderList(inputEl.value);
        });

        inputEl.addEventListener("focus", () => {
            renderList(inputEl.value);
        });

        listEl.addEventListener("mousedown", (e) => {
            const li = e.target.closest("li[data-id]");
            if (!li) return;
            hiddenEl.value = li.dataset.id;
            inputEl.value = li.dataset.nome;
            listEl.classList.add("hidden");
        });

        document.addEventListener("click", (e) => {
            if (!inputEl.contains(e.target) && !listEl.contains(e.target)) {
                listEl.classList.add("hidden");
            }
        }, { once: false });
    }

    // --- Abrir modais ---
    document.getElementById("btnNovoLancamento").addEventListener("click", () => {
        carregarPlanoContasSelect();
        // Set data padrão hoje
        document.getElementById("lanc-data").value = new Date().toISOString().split("T")[0];
        document.getElementById("modalLancamento").classList.remove("hidden");
        setTimeout(() => document.getElementById("lanc-cc-input").focus(), 100);
    });

    document.getElementById("btnNovoTipo").addEventListener("click", () => {
        document.getElementById("modalTipo").classList.remove("hidden");
    });

    document.getElementById("btnSaldoFundo").addEventListener("click", () => {
        document.getElementById("modalSaldo").classList.remove("hidden");
    });

    // --- Salvar Lançamento ---
    document.getElementById("btnSalvarLancamento").addEventListener("click", async () => {
        const { user, senha, coopId, mes, ano } = getContexto();
        const data = document.getElementById("lanc-data").value;
        const valor = parseFloat(document.getElementById("lanc-valor").value);
        const cc = parseInt(document.getElementById("lanc-cc").value); // hidden input com id selecionado
        const descricao = document.getElementById("lanc-descricao").value.trim();

        if (!data || isNaN(valor) || valor <= 0 || !cc || !descricao) {
            showMsg("lanc-msg", "Preencha todos os campos obrigatórios!", true);
            return;
        }

        const btn = document.getElementById("btnSalvarLancamento");
        btn.disabled = true;
        btn.textContent = "Salvando...";

        try {
            const res = await fetch(`${API_BASE_URL}/lancamento`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user, senha, data, descricao, cc, valor, mes, ano, cooperativa_id: coopId })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Erro ao salvar.");

            showMsg("lanc-msg", "Lançamento salvo com sucesso!", false);
            document.getElementById("lanc-descricao").value = "";
            document.getElementById("lanc-valor").value = "";
            // Recarrega DRE após inserção
            carregarDRE();
        } catch (err) {
            showMsg("lanc-msg", err.message, true);
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<span class="material-symbols-outlined text-base">save</span>Salvar Lançamento`;
        }
    });

    // --- Salvar Novo Tipo de Conta ---
    document.getElementById("btnSalvarTipo").addEventListener("click", async () => {
        const { user, senha } = getContexto();
        const historico = document.getElementById("tipo-historico").value.trim();
        const categoria = document.getElementById("tipo-categoria").value;

        if (!historico || !categoria) {
            showMsg("tipo-msg", "Preencha o nome e a categoria!", true);
            return;
        }

        const btn = document.getElementById("btnSalvarTipo");
        btn.disabled = true;
        btn.textContent = "Criando...";

        try {
            const res = await fetch(`${API_BASE_URL}/plano-contas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user, senha, historico, categoria })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Erro ao criar tipo.");

            showMsg("tipo-msg", `"${historico}" criado com sucesso!`, false);
            document.getElementById("tipo-historico").value = "";
        } catch (err) {
            showMsg("tipo-msg", err.message, true);
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<span class="material-symbols-outlined text-base">save</span>Criar Tipo`;
        }
    });

    // --- Salvar Saldo Anterior ---
    document.getElementById("btnSalvarSaldo").addEventListener("click", async () => {
        const { user, senha, coopId, mes, ano } = getContexto();
        const valor = parseFloat(document.getElementById("saldo-valor").value);

        if (isNaN(valor)) {
            showMsg("saldo-msg", "Digite um valor válido para o saldo!", true);
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/saldo-anterior`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user, senha, mes, ano, cooperativa_id: coopId, valor })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Erro ao salvar saldo.");
            showMsg("saldo-msg", "Saldo anterior salvo!", false);
            carregarDRE();
        } catch (err) {
            showMsg("saldo-msg", err.message, true);
        }
    });

    // --- Salvar Fundo Fixo ---
    document.getElementById("btnSalvarFundo").addEventListener("click", async () => {
        const { user, senha, coopId, mes, ano } = getContexto();
        const saldoAnt = parseFloat(document.getElementById("ff-saldo-anterior").value) || 0;
        const entradas = parseFloat(document.getElementById("ff-entradas").value) || 0;
        const saidas = parseFloat(document.getElementById("ff-saidas").value) || 0;

        try {
            const res = await fetch(`${API_BASE_URL}/fundo-fixo`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user, senha, mes, ano, cooperativa_id: coopId, saldo_anterior: saldoAnt, saldo_anterior_ff: saldoAnt, entradas, saidas })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Erro ao salvar fundo fixo.");
            showMsg("saldo-msg", "Fundo Fixo salvo!", false);
            carregarDRE();
        } catch (err) {
            showMsg("saldo-msg", err.message, true);
        }
    });

    // Fechar modais ao clicar no backdrop
    ["modalLancamento", "modalTipo", "modalSaldo"].forEach(id => {
        document.getElementById(id).addEventListener("click", function(e) {
            if (e.target === this) this.classList.add("hidden");
        });
    });

    // Event listeners para exportação Excel e PDF
    const btnExportExcel = document.getElementById("btn-export-excel");
    if (btnExportExcel) {
        btnExportExcel.addEventListener("click", exportarExcel);
    }

    const btnExportPdf = document.getElementById("btn-export-pdf");
    if (btnExportPdf) {
        btnExportPdf.addEventListener("click", exportarPDF);
    }
});

const formataMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
};

const formataPercentual = (valor) => {
    return (valor * 100).toFixed(2) + "%";
};

// ==============================
//   Carregar DRE MENSAL
// ==============================
async function carregarDRE() {
    const mes = document.getElementById("selMes").value;
    const ano = document.getElementById("selAno").value;
    const coopId = document.getElementById("selCooperativa").value;
    
    const container = document.getElementById("dreContainer");
    // Fade suave sem piscar: apenas reduz opacidade enquanto carrega
    container.style.opacity = "0.4";
    container.style.transition = "opacity 0.2s";

    document.getElementById("subtitlePeriodo").textContent = `Mensal: Mês ${mes} de ${ano}`;

    try {
        const response = await fetch(`${API_BASE_URL}/dre?mes=${mes}&ano=${ano}&cooperativa_id=${coopId}`);
        if (!response.ok) throw new Error("Falha ao buscar DRE");
        const data = await response.json();
        
        atualizarKPIs(data);
        renderizarTabelaMensal(data);
        renderizarGraficos(data.total_receitas, data.total_despesas, data.grupos);
        
    } catch (error) {
        console.error(error);
        container.innerHTML = `<div class="p-12 text-red-500 text-sm text-center flex flex-col items-center justify-center gap-3">
                                  <span class="material-symbols-outlined text-4xl">error</span>
                                  <p>Erro ao carregar o DRE. Verifique o backend.</p>
                               </div>`;
    } finally {
        container.style.opacity = "1";
    }
}

// ==============================
//   Carregar DRE ACUMULADO
// ==============================
async function carregarDREAcumulado() {
    const ano = document.getElementById("selAno").value;
    const coopId = document.getElementById("selCooperativa").value;
    
    const container = document.getElementById("dreContainer");
    container.style.opacity = "0.4";
    container.style.transition = "opacity 0.2s";

    document.getElementById("subtitlePeriodo").textContent = `Acumulado Anual: ${ano}`;

    try {
        const response = await fetch(`${API_BASE_URL}/dre/acumulado?ano=${ano}&cooperativa_id=${coopId}`);
        if (!response.ok) throw new Error("Falha ao buscar DRE Acumulado");
        const data = await response.json();
        
        atualizarKPIs(data.acumulado);
        renderizarTabelaAcumulada(data);
        renderizarGraficos(data.acumulado.total_receitas, data.acumulado.total_despesas, data.acumulado.por_categoria);
        
    } catch (error) {
        console.error(error);
        container.innerHTML = `<div class="p-12 text-red-500 text-sm text-center flex flex-col items-center justify-center gap-3">
                                  <span class="material-symbols-outlined text-4xl">error</span>
                                  <p>Erro ao carregar o DRE Acumulado.</p>
                               </div>`;
    } finally {
        container.style.opacity = "1";
    }
}

// ==============================
//   Atualizações de UI
// ==============================
function atualizarKPIs(data) {
    const r = data.total_receitas || 0;
    const d = data.total_despesas || 0;
    
    // Pode vir de "resultado_mes" ou "resultado_anual"
    const result = data.resultado_mes !== undefined ? data.resultado_mes : data.resultado_anual;
    
    let margem = 0;
    if (r !== 0) margem = result / r;

    document.getElementById("kpi-receita").textContent = formataMoeda(r);
    document.getElementById("kpi-despesa").textContent = formataMoeda(d);
    
    const kpiResult = document.getElementById("kpi-resultado");
    kpiResult.textContent = formataMoeda(result);
    kpiResult.className = `text-2xl font-bold mt-1 ${result >= 0 ? "text-green-600" : "text-red-600"}`;
    
    const kpiMargem = document.getElementById("kpi-margem");
    kpiMargem.textContent = formataPercentual(margem);
    kpiMargem.className = `text-2xl font-bold mt-1 ${margem >= 0 ? "text-green-600" : "text-red-600"}`;
}

// ==============================
//   Funções de Exportação
// ==============================
function getNomeCooperativaEEtiqueta() {
    const selCoop = document.getElementById("selCooperativa");
    let coopNome = "Cooperativa";
    if (selCoop && !selCoop.parentElement.classList.contains("hidden")) {
        coopNome = selCoop.options[selCoop.selectedIndex] ? selCoop.options[selCoop.selectedIndex].text : "Cooperativa";
    } else {
        const coopSessao = sessionStorage.getItem("cooperativa");
        if (coopSessao) coopNome = coopSessao;
    }
    const mes = document.getElementById("selMes").value;
    const ano = document.getElementById("selAno").value;
    const tabMensal = document.getElementById("tabMensal");
    const isMensal = tabMensal && tabMensal.classList.contains("text-blue-700");
    const periodoLabel = isMensal ? `Mês ${mes}/${ano}` : `Acumulado ${ano}`;
    const periodoSufixo = isMensal ? `mensal_${mes}_${ano}` : `acumulado_${ano}`;

    return { coopNome, mes, ano, isMensal, periodoLabel, periodoSufixo };
}

function exportarExcel() {
    const table = document.querySelector("#dreContainer table");
    if (!table) {
        alert("Não há dados visíveis para exportar.");
        return;
    }

    if (typeof XLSX === "undefined") {
        alert("Biblioteca Excel (SheetJS) não foi carregada.");
        return;
    }

    const { coopNome, periodoSufixo } = getNomeCooperativaEEtiqueta();
    const wb = XLSX.utils.table_to_book(table, { sheet: "DRE" });
    const nomeLimpoCoop = coopNome.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const filename = `DRE_${nomeLimpoCoop}_${periodoSufixo}.xlsx`;

    XLSX.writeFile(wb, filename);
}

function exportarPDF() {
    const table = document.querySelector("#dreContainer table");
    if (!table) {
        alert("Não há dados visíveis para exportar.");
        return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("Biblioteca PDF (jsPDF) não foi carregada.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const { coopNome, periodoLabel, periodoSufixo } = getNomeCooperativaEEtiqueta();

    // Cabeçalho do PDF
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(29, 78, 216);
    doc.text(`DRE - ${coopNome}`, 14, 15);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Período: ${periodoLabel} · Gerado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`, 14, 22);

    doc.autoTable({
        html: table,
        startY: 28,
        theme: 'grid',
        headStyles: {
            fillColor: [29, 78, 216],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 8,
            cellPadding: 3,
            textColor: [51, 65, 85]
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        },
        margin: { top: 28, left: 14, right: 14 }
    });

    const nomeLimpoCoop = coopNome.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const filename = `DRE_${nomeLimpoCoop}_${periodoSufixo}.pdf`;
    doc.save(filename);
}

function renderizarTabelaMensal(data) {
    const container = document.getElementById("dreContainer");
    let html = `
    <table class="w-full text-left text-sm text-gray-700">
        <thead>
            <tr class="bg-gray-100 text-gray-600 font-semibold text-xs uppercase border-b border-gray-200">
                <th class="p-3 w-16">Cód CC</th>
                <th class="p-3">Descrição / Histórico</th>
                <th class="p-3 text-right">Valor (R$)</th>
                <th class="p-3 text-center">% Receita</th>
            </tr>
        </thead>
        <tbody>`;

    // Saldo Anterior
    html += `
    <tr class="dre-group-header bg-gray-50 border-b border-gray-200">
        <td class="p-4 font-bold text-gray-800" colspan="2">SALDO ANTERIOR</td>
        <td class="p-4 font-bold text-right text-gray-800">${formataMoeda(data.saldo_anterior)}</td>
        <td class="p-4 text-center">--</td>
    </tr>`;

    // Para cada grupo (receita, despesas...)
    const order = ["receita", "despesa_pessoal", "despesa_fixa", "despesa_variavel", "conta_financeira", "investimento"];
    
    order.forEach(cat => {
        const grupo = data.grupos[cat];
        if(!grupo) return;

        html += `
        <tr class="dre-group-header bg-gray-50 border-b border-gray-200">
            <td class="p-3 font-bold text-gray-800 uppercase" colspan="4">${grupo.nome}</td>
        </tr>`;

        // Itens
        grupo.itens.forEach(item => {
            if(item.valor === 0) return; // esconde zerados
            html += `
            <tr class="dre-row border-b border-gray-100">
                <td class="p-3 pl-8 text-xs text-gray-500 w-16">${item.cc}</td>
                <td class="p-3">${item.historico}</td>
                <td class="p-3 text-right font-medium">${formataMoeda(item.valor)}</td>
                <td class="p-3 text-center text-xs text-gray-400">${formataPercentual(item.percentual)}</td>
            </tr>`;
        });

        // Total do grupo
        html += `
        <tr class="dre-total bg-gray-50/70 border-b border-gray-200">
            <td class="p-3 font-semibold text-gray-700 pl-8" colspan="2">TOTAL ${grupo.nome}</td>
            <td class="p-3 text-right font-bold text-gray-800">${formataMoeda(grupo.total)}</td>
            <td class="p-3 text-center font-bold text-gray-700">100%</td>
        </tr>`;
    });

    // Resultado Final
    html += `
    <tr class="dre-total" style="background:#dbeafe; border-top: 2px solid #3b82f6;">
        <td class="p-4 font-bold text-blue-800 uppercase text-base" colspan="2">RESULTADO DO EXERCÍCIO (R-D)</td>
        <td class="p-4 text-right font-bold text-blue-800 text-base">${formataMoeda(data.resultado_mes)}</td>
        <td class="p-4 text-center font-bold text-blue-800">${formataPercentual(data.percentual_resultado)}</td>
    </tr>`;

    // Partilha Cooperados (20% do resultado)
    const partilha20 = (data.resultado_mes || 0) * 0.20;
    html += `
    <tr class="dre-total border-b border-gray-200" style="background:#f0fdf4;">
        <td class="p-4 font-bold text-green-800 uppercase text-sm" colspan="2">PARTILHA COOPERADOS (20% do Resultado)</td>
        <td class="p-4 text-right font-bold text-green-800 text-sm">${formataMoeda(partilha20)}</td>
        <td class="p-4 text-center font-bold text-green-700">20%</td>
    </tr>`;

    // Saldo Final
    html += `
    <tr class="dre-total border-b border-gray-200 bg-gray-50">
        <td class="p-4 font-bold text-gray-800 uppercase text-base" colspan="2">SALDO FINAL</td>
        <td class="p-4 text-right font-bold text-gray-800 text-base">${formataMoeda(data.saldo_final)}</td>
        <td class="p-4"></td>
    </tr>`;

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function renderizarTabelaAcumulada(data) {
    // Para simplificar, a tabela acumulada mostrará os totais das categorias. 
    // Uma implementação completa exigiria a expansão vertical (contas) e horizontal (meses).
    const container = document.getElementById("dreContainer");
    let html = `
    <div class="p-4 border-b border-gray-200 bg-gray-50">
        <h3 class="font-bold text-gray-800">Resumo Acumulado Anual - ${data.ano}</h3>
    </div>
    <table class="w-full text-left text-sm text-gray-700">`;

    const acum = data.acumulado;
    
    html += `
    <thead>
        <tr class="bg-gray-100 text-gray-600 font-semibold text-xs uppercase">
            <th class="p-3">Categoria</th>
            <th class="p-3 text-right">Total Acumulado (R$)</th>
        </tr>
    </thead>
    <tbody>`;

    const order = ["receita", "despesa_pessoal", "despesa_fixa", "despesa_variavel", "conta_financeira", "investimento"];
    order.forEach(cat => {
        if(acum.por_categoria[cat]) {
            html += `
            <tr class="border-b border-gray-100 dre-row">
                <td class="p-4 font-medium">${acum.por_categoria[cat].nome}</td>
                <td class="p-4 text-right font-bold">${formataMoeda(acum.por_categoria[cat].total)}</td>
            </tr>`;
        }
    });

    html += `
        <tr class="dre-total" style="background:#dbeafe;">
            <td class="p-4 font-bold text-blue-800 text-lg uppercase">RESULTADO LÍQUIDO ACUMULADO</td>
            <td class="p-4 text-right font-bold text-blue-800 text-lg">${formataMoeda(acum.resultado_anual)}</td>
        </tr>
    </tbody>
    </table>
    <div class="p-4 text-xs text-gray-400 text-center">Dica: Exportar para Excel gerará o detalhamento C/C x Mês.</div>`;
    
    container.innerHTML = html;
}

// ==============================
//   Gráficos
// ==============================
function renderizarGraficos(totReceita, totDespesa, grupos) {
    // 1. Barras (Receita vs Despesa)
    const ctxBarras = document.getElementById('chartBarras').getContext('2d');
    if (myChartBarras) myChartBarras.destroy();

    myChartBarras = new Chart(ctxBarras, {
        type: 'bar',
        data: {
            labels: ['Receitas', 'Despesas'],
            datasets: [{
                label: 'Valor (R$)',
                data: [totReceita, totDespesa],
                backgroundColor: ['#16a34a', '#dc2626'],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });

    // 2. Pizza (Composição Despesas)
    const ctxPizza = document.getElementById('chartPizza').getContext('2d');
    if (myChartPizza) myChartPizza.destroy();

    // Extrair valores dos grupos de despesa
    const labels = [];
    const values = [];
    const cores = ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

    // Para lidar tanto com grupos (mensal) quanto por_categoria (acumulado)
    const catsDespesa = ["despesa_pessoal", "despesa_fixa", "despesa_variavel", "conta_financeira", "investimento"];
    
    catsDespesa.forEach(cat => {
        if(grupos[cat] && grupos[cat].total > 0) {
            labels.push(grupos[cat].nome);
            values.push(grupos[cat].total);
        }
    });

    myChartPizza = new Chart(ctxPizza, {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['Sem Despesas'],
            datasets: [{
                data: values.length ? values : [1],
                backgroundColor: values.length ? cores : ['#e2e8f0'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
            }
        }
    });
}
