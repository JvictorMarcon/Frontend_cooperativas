document.addEventListener("DOMContentLoaded", () => {
    // 1. Proteção de rota
    const user = sessionStorage.getItem("user");
    const senha = sessionStorage.getItem("senha");
    const cargo = sessionStorage.getItem("cargo");

    if (!user || !senha || cargo !== "adm") {
        sessionStorage.clear();
        window.location.href = "index.html";
        return;
    }

    // Exibir nome do usuário no topo
    const userDisplay = document.getElementById("user-display");
    if (userDisplay) {
        userDisplay.textContent = user.charAt(0).toUpperCase() + user.slice(1);
    }

    // Botão Sair
    document.getElementById("btn-sair").addEventListener("click", () => {
        sessionStorage.clear();
        window.location.href = "index.html";
    });

    // 2. Estado Global do Dashboard
    let rawData = {
        recebimento: [],
        triagem: [],
        prensa: [],
        bazar: []
    };

    let activeTab = "recebimento";

    // 3. Tabulação (Alternância de abas)
    const tabButtons = {
        recebimento: document.getElementById("tab-recebimento"),
        triagem: document.getElementById("tab-triagem"),
        prensa: document.getElementById("tab-prensa"),
        bazar: document.getElementById("tab-bazar")
    };

    const tabTables = {
        recebimento: document.getElementById("table-recebimento-el"),
        triagem: document.getElementById("table-triagem-el"),
        prensa: document.getElementById("table-prensa-el"),
        bazar: document.getElementById("table-bazar-el")
    };

    Object.keys(tabButtons).forEach(tabKey => {
        tabButtons[tabKey].addEventListener("click", () => {
            switchTab(tabKey);
        });
    });

    function switchTab(selectedTab) {
        activeTab = selectedTab;
        
        // Atualizar estilos dos botões
        Object.keys(tabButtons).forEach(tabKey => {
            const btn = tabButtons[tabKey];
            if (tabKey === selectedTab) {
                btn.classList.add("text-blue-700", "border-blue-700");
                btn.classList.remove("text-gray-500", "border-transparent");
            } else {
                btn.classList.remove("text-blue-700", "border-blue-700");
                btn.classList.add("text-gray-500", "border-transparent");
            }
        });

        // Atualizar visibilidade das tabelas
        Object.keys(tabTables).forEach(tabKey => {
            const tbl = tabTables[tabKey];
            if (tabKey === selectedTab) {
                tbl.classList.remove("hidden");
            } else {
                tbl.classList.add("hidden");
            }
        });

        renderData();
    }

    // 4. Buscar dados da API
    async function fetchData() {
        const loadingEl = document.getElementById("table-loading");
        const emptyEl = document.getElementById("table-empty");
        
        if (loadingEl) loadingEl.classList.remove("hidden");
        if (emptyEl) emptyEl.classList.add("hidden");

        try {
            const response = await fetch("https://backendcooperativas.vercel.app/consultar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ user, senha })
            });

            if (!response.ok) {
                throw new Error("Falha ao carregar dados da API.");
            }

            const data = await response.json();
            
            // Armazena dados globalmente
            rawData.recebimento = data.recebimento || [];
            rawData.triagem = data.triagem || [];
            rawData.prensa = data.prensa || [];
            rawData.bazar = data.bazar || [];

            // Renderiza as estatísticas e as tabelas
            renderStats();
            renderData();

        } catch (error) {
            alert("Erro ao buscar dados: " + error.message);
        } finally {
            if (loadingEl) loadingEl.classList.add("hidden");
        }
    }

    // 5. Cálculo e exibição de estatísticas gerais (com base nos dados atualmente filtrados)
    function renderStats(filteredData = rawData) {
        // Peso Total Recebido
        const totalPeso = filteredData.recebimento.reduce((sum, item) => sum + (parseFloat(item.peso_total) || 0), 0);
        document.getElementById("stat-peso-total").textContent = `${totalPeso.toFixed(2)} Kg`;

        // Bags na Triagem
        const totalBags = filteredData.triagem.reduce((sum, item) => sum + (parseInt(item.qntd_bags) || 0), 0);
        document.getElementById("stat-bags").textContent = totalBags;

        // Fardos Produzidos
        const totalFardos = filteredData.prensa.reduce((sum, item) => sum + (parseInt(item.qtd_fardos_prensa) || 0), 0);
        document.getElementById("stat-fardos").textContent = totalFardos;

        // Saldo Bazar (Entradas - Saídas)
        const saldoBazar = filteredData.bazar.reduce((sum, item) => {
            const valor = parseFloat(item.valor) || 0;
            // Se 'entrada' for boolean true ou string "true" / "entrada", soma. Caso contrário subtrai.
            const isEntrada = item.entrada === true || String(item.entrada).toLowerCase() === "true" || String(item.entrada).toLowerCase() === "entrada";
            return isEntrada ? sum + valor : sum - valor;
        }, 0);
        
        const saldoBazarText = document.getElementById("stat-saldo-bazar");
        saldoBazarText.textContent = `R$ ${saldoBazar.toFixed(2)}`;
        if (saldoBazar < 0) {
            saldoBazarText.classList.add("text-red-600");
            saldoBazarText.classList.remove("text-gray-800");
        } else {
            saldoBazarText.classList.remove("text-red-600");
            saldoBazarText.classList.add("text-gray-800");
        }
    }

    // Helper para mapear cooperativa_id para Nome
    function getCoopName(id) {
        const numId = parseInt(id);
        if (numId === 1) return "Santa Maria";
        if (numId === 2) return "Coopersel";
        return "Desconhecida";
    }

    // Helper para formatar data ISO para data/hora local
    function formatarData(dataStr) {
        if (!dataStr) return "-";
        try {
            const data = new Date(dataStr);
            if (isNaN(data.getTime())) return dataStr;
            return data.toLocaleDateString("pt-BR") + " " + data.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return dataStr;
        }
    }

    // 6. Filtragem e Renderização das tabelas
    function renderData() {
        const filtroCoop = document.getElementById("filtro-cooperativa").value;
        const filtroDataInicio = document.getElementById("filtro-data-inicio").value;
        const filtroDataFim = document.getElementById("filtro-data-fim").value;
        const buscaTexto = document.getElementById("busca-texto").value.toLowerCase().trim();

        // 1. Filtrar todos os conjuntos para recalcular os cards baseado nos filtros ativos
        const filtered = {
            recebimento: filterDataset(rawData.recebimento, "recebimento"),
            triagem: filterDataset(rawData.triagem, "triagem"),
            prensa: filterDataset(rawData.prensa, "prensa"),
            bazar: filterDataset(rawData.bazar, "bazar")
        };

        renderStats(filtered);

        // 2. Renderizar a aba ativa
        const activeList = filtered[activeTab];
        const tbody = document.getElementById(`tbody-${activeTab}`);
        const tableEl = document.getElementById(`table-${activeTab}-el`);
        const emptyEl = document.getElementById("table-empty");

        tbody.innerHTML = "";

        if (activeList.length === 0) {
            tableEl.classList.add("hidden");
            emptyEl.classList.remove("hidden");
            return;
        }

        emptyEl.classList.add("hidden");
        tableEl.classList.remove("hidden");

        activeList.forEach(item => {
            let rowHTML = "";
            const coopNome = getCoopName(item.cooperativa_id);
            const dataFormatada = formatarData(item.data_do_recebimento || item.data_recebimento || item.data_triagem || item.data_prensa || item.bazar_data || item.data_criacao || item.data_bazar);

            if (activeTab === "recebimento") {
                rowHTML = `
                    <tr class="hover:bg-gray-50 transition border-b border-gray-100">
                        <td class="px-6 py-4"><span class="px-2 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-semibold">${coopNome}</span></td>
                        <td class="px-6 py-4 capitalize">${item.procedencia}</td>
                        <td class="px-6 py-4">${item.placa_caminhao}</td>
                        <td class="px-6 py-4 font-semibold">${parseFloat(item.peso_total).toFixed(2)} Kg</td>
                        <td class="px-6 py-4 capitalize">${item.material_tipo}</td>
                        <td class="px-6 py-4">${item.recebido_por}</td>
                        <td class="px-6 py-4 text-gray-500">${dataFormatada}</td>
                    </tr>
                `;
            } else if (activeTab === "triagem") {
                rowHTML = `
                    <tr class="hover:bg-gray-50 transition border-b border-gray-100">
                        <td class="px-6 py-4"><span class="px-2 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-semibold">${coopNome}</span></td>
                        <td class="px-6 py-4 font-semibold">Mesa ${item.mesa_id}</td>
                        <td class="px-6 py-4 capitalize">${item.material_tipo}</td>
                        <td class="px-6 py-4">${item.qntd_bags}</td>
                        <td class="px-6 py-4 text-red-600 font-semibold">${parseFloat(item.peso_rejeito).toFixed(2)} Kg</td>
                        <td class="px-6 py-4 text-gray-500">${dataFormatada}</td>
                    </tr>
                `;
            } else if (activeTab === "prensa") {
                rowHTML = `
                    <tr class="hover:bg-gray-50 transition border-b border-gray-100">
                        <td class="px-6 py-4"><span class="px-2 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-semibold">${coopNome}</span></td>
                        <td class="px-6 py-4 capitalize">${item.material_tipo}</td>
                        <td class="px-6 py-4 font-semibold">${item.qtd_fardos_prensa} fardos</td>
                        <td class="px-6 py-4 text-green-700 font-semibold">${parseFloat(item.qnt_material_final).toFixed(2)} Kg</td>
                        <td class="px-6 py-4 text-gray-500">${dataFormatada}</td>
                    </tr>
                `;
            } else if (activeTab === "bazar") {
                const isEntrada = item.entrada === true || String(item.entrada).toLowerCase() === "true" || String(item.entrada).toLowerCase() === "entrada";
                const tipoBadge = isEntrada 
                    ? `<span class="px-2 py-1 bg-green-50 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><span class="material-symbols-outlined text-xs">arrow_upward</span>Entrada</span>`
                    : `<span class="px-2 py-1 bg-red-50 text-red-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><span class="material-symbols-outlined text-xs">arrow_downward</span>Saída</span>`;

                rowHTML = `
                    <tr class="hover:bg-gray-50 transition border-b border-gray-100">
                        <td class="px-6 py-4"><span class="px-2 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-semibold">${coopNome}</span></td>
                        <td class="px-6 py-4 font-bold ${isEntrada ? 'text-green-600' : 'text-red-600'}">R$ ${parseFloat(item.valor).toFixed(2)}</td>
                        <td class="px-6 py-4">${tipoBadge}</td>
                        <td class="px-6 py-4">${item.motivo}</td>
                        <td class="px-6 py-4 text-gray-500">${dataFormatada}</td>
                    </tr>
                `;
            }

            tbody.insertAdjacentHTML("beforeend", rowHTML);
        });

        // Sub-função de filtragem genérica
        function filterDataset(dataset, type) {
            return dataset.filter(item => {
                // Filtro de Cooperativa
                if (filtroCoop !== "todas" && String(item.cooperativa_id) !== filtroCoop) {
                    return false;
                }

                // Filtro de Data
                const dataCriacaoStr = item.data_do_recebimento || item.data_recebimento || item.data_triagem || item.data_prensa || item.bazar_data || item.data_criacao || item.data_bazar;
                if (dataCriacaoStr) {
                    const itemData = new Date(dataCriacaoStr.split(" ")[0] || dataCriacaoStr); // Pega apenas a parte yyyy-mm-dd
                    
                    if (filtroDataInicio) {
                        const inicio = new Date(filtroDataInicio);
                        // Zerar horas para comparar apenas datas
                        inicio.setUTCHours(0,0,0,0);
                        itemData.setUTCHours(0,0,0,0);
                        if (itemData < inicio) return false;
                    }
                    if (filtroDataFim) {
                        const fim = new Date(filtroDataFim);
                        fim.setUTCHours(23,59,59,999);
                        itemData.setUTCHours(0,0,0,0);
                        if (itemData > fim) return false;
                    }
                }

                // Filtro de Texto
                if (buscaTexto) {
                    const matchesText = 
                        (item.material_tipo && item.material_tipo.toLowerCase().includes(buscaTexto)) ||
                        (item.procedencia && item.procedencia.toLowerCase().includes(buscaTexto)) ||
                        (item.recebido_por && item.recebido_por.toLowerCase().includes(buscaTexto)) ||
                        (item.placa_caminhao && item.placa_caminhao.toLowerCase().includes(buscaTexto)) ||
                        (item.motivo && item.motivo.toLowerCase().includes(buscaTexto)) ||
                        (getCoopName(item.cooperativa_id).toLowerCase().includes(buscaTexto));

                    if (!matchesText) return false;
                }

                return true;
            });
        }
    }

    // 7. Eventos de Escuta para Filtros
    document.getElementById("filtro-cooperativa").addEventListener("change", renderData);
    document.getElementById("filtro-data-inicio").addEventListener("input", renderData);
    document.getElementById("filtro-data-fim").addEventListener("input", renderData);
    document.getElementById("busca-texto").addEventListener("input", renderData);

    // 8. Lógicas de Exportação

    // Excel Export via SheetJS (XLSX)
    document.getElementById("btn-export-excel").addEventListener("click", () => {
        const activeTableId = `table-${activeTab}-el`;
        const table = document.getElementById(activeTableId);
        
        if (!table || table.classList.contains("hidden")) {
            alert("Não há dados visíveis para exportar.");
            return;
        }

        const wb = XLSX.utils.table_to_book(table, { sheet: activeTab });
        XLSX.writeFile(wb, `relatorio_${activeTab}_itapeva_recicla.xlsx`);
    });

    // PDF Export via jsPDF & jsPDF AutoTable
    document.getElementById("btn-export-pdf").addEventListener("click", () => {
        const activeTableId = `table-${activeTab}-el`;
        const table = document.getElementById(activeTableId);
        
        if (!table || table.classList.contains("hidden")) {
            alert("Não há dados visíveis para exportar.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4'); // Paisagem para caber mais colunas

        // Título e cabeçalho do PDF
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(29, 78, 216); // Azul idêntico ao sistema
        doc.text("Itapeva Recicla - Relatório Consolidado", 14, 15);
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(107, 114, 128);
        doc.text(`Tabela: ${activeTab.toUpperCase()} · Gerado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`, 14, 22);

        // Gerar tabela automaticamente a partir do elemento HTML
        doc.autoTable({
            html: `#${activeTableId}`,
            startY: 28,
            theme: 'striped',
            headStyles: {
                fillColor: [29, 78, 216],
                textColor: [255, 255, 255],
                fontSize: 9,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 8
            },
            margin: { top: 30, right: 14, bottom: 15, left: 14 }
        });

        doc.save(`relatorio_${activeTab}_itapeva_recicla.pdf`);
    });

    // Iniciar carregando os dados
    fetchData();
});
