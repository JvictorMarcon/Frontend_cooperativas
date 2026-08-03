document.addEventListener("DOMContentLoaded", () => {
    // Instâncias Globais de Gráficos
    let chartPrensaInstance = null;
    let chartRecebimentoInstance = null;
    let chartEtapasInstance = null;
    let chartBazarInstance = null;
    let chartMetodosInstance = null;
    let chartSexoInstance = null;

    // 1. Identificar a cooperativa com base na URL
    const pathDecoded = decodeURIComponent(window.location.pathname).toLowerCase();
    const isSantaMaria = pathDecoded.includes("santa maria");
    const currentCoop = isSantaMaria ? "santa maria" : "coopersel";
    const currentCoopId = isSantaMaria ? 1 : 2;

    // 2. Proteção de rota
    const user = sessionStorage.getItem("user");
    const senha = sessionStorage.getItem("senha");
    const cargo = sessionStorage.getItem("cargo");
    const cooperativa = sessionStorage.getItem("cooperativa") || "";

    if (!user || !senha || (cargo !== "tesoureira" && cargo !== "adm")) {
        sessionStorage.clear();
        window.location.href = "../index.html";
        return;
    }

    // Se for tesoureira, verificar se pertence a esta cooperativa
    if (cargo === "tesoureira" && cooperativa.toLowerCase() !== currentCoop) {
        alert("Acesso negado: Você não tem permissão para visualizar o painel desta cooperativa.");
        window.location.href = "../index.html";
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
        window.location.href = "../index.html";
    });

    // 3. Estado Global do Dashboard
    let rawData = {
        recebimento: [],
        triagem: [],
        prensa: [],
        bazar: [],
        cooperados: []
    };

    let activeTab = "recebimento";

    // 4. Tabulação (Alternância de abas)
    const tabButtons = {
        recebimento: document.getElementById("tab-recebimento"),
        triagem: document.getElementById("tab-triagem"),
        prensa: document.getElementById("tab-prensa"),
        bazar: document.getElementById("tab-bazar"),
        cooperados: document.getElementById("tab-cooperados"),
        graficos: document.getElementById("tab-graficos")
    };

    const tabTables = {
        recebimento: document.getElementById("table-recebimento-el"),
        triagem: document.getElementById("table-triagem-el"),
        prensa: document.getElementById("table-prensa-el"),
        bazar: document.getElementById("table-bazar-el"),
        cooperados: document.getElementById("table-cooperados-el"),
        graficos: document.getElementById("container-graficos")
    };

    Object.keys(tabButtons).forEach(tabKey => {
        const btn = tabButtons[tabKey];
        if (btn) {
            btn.addEventListener("click", () => {
                switchTab(tabKey);
            });
        }
    });

    function switchTab(selectedTab) {
        activeTab = selectedTab;
        
        // Atualizar estilos dos botões
        Object.keys(tabButtons).forEach(tabKey => {
            const btn = tabButtons[tabKey];
            if (btn) {
                if (tabKey === selectedTab) {
                    btn.classList.add("text-blue-700", "border-blue-700");
                    btn.classList.remove("text-gray-500", "border-transparent");
                } else {
                    btn.classList.remove("text-blue-700", "border-blue-700");
                    btn.classList.add("text-gray-500", "border-transparent");
                }
            }
        });

        // Atualizar visibilidade das tabelas
        Object.keys(tabTables).forEach(tabKey => {
            const tbl = tabTables[tabKey];
            if (tbl) {
                if (tabKey === selectedTab) {
                    tbl.classList.remove("hidden");
                } else {
                    tbl.classList.add("hidden");
                }
            }
        });

        const exportsContainer = document.getElementById("exports-container");
        if (exportsContainer) {
            if (selectedTab === "graficos") {
                exportsContainer.classList.add("hidden");
            } else {
                exportsContainer.classList.remove("hidden");
            }
        }

        renderData();
    }

    // 5. Buscar dados da API
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
            
            // Filtra os dados no client-side para garantir que exibimos apenas os desta cooperativa
            // (Isso protege no caso de login de um administrador geral abrindo este painel específico)
            rawData.recebimento = (data.recebimento || []).filter(item => parseInt(item.cooperativa_id) === currentCoopId);
            rawData.triagem = (data.triagem || []).filter(item => parseInt(item.cooperativa_id) === currentCoopId);
            rawData.prensa = (data.prensa || []).filter(item => parseInt(item.cooperativa_id) === currentCoopId);
            rawData.bazar = (data.bazar || []).filter(item => parseInt(item.cooperativa_id) === currentCoopId);
            rawData.cooperados = (data.cooperados || []).filter(item => parseInt(item.cooperativa_id) === currentCoopId);

            // Renderiza as estatísticas e as tabelas
            renderStats();
            renderData();

        } catch (error) {
            alert("Erro ao buscar dados: " + error.message);
        } finally {
            if (loadingEl) loadingEl.classList.add("hidden");
        }
    }

    // 6. Cálculo e exibição de estatísticas
    function renderStats(filteredData = rawData) {
        // Peso Total Recebido
        const totalPeso = filteredData.recebimento.reduce((sum, item) => sum + (parseFloat(item.peso_total) || 0), 0);
        document.getElementById("stat-peso-total").textContent = `${totalPeso.toFixed(2)} Kg`;

        // Rejeito na Triagem
        const totalRejeito = filteredData.triagem.reduce((sum, item) => sum + (parseFloat(item.peso_rejeito) || 0), 0);
        const statRejeitoEl = document.getElementById("stat-rejeito");
        if (statRejeitoEl) {
            statRejeitoEl.textContent = `${totalRejeito.toFixed(2)} Kg`;
        }

        // Fardos Produzidos
        const totalFardos = filteredData.prensa.reduce((sum, item) => sum + (parseInt(item.qtd_fardos_prensa) || 0), 0);
        document.getElementById("stat-fardos").textContent = totalFardos;

        // Saldo Bazar (Entradas - Saídas)
        const saldoBazar = filteredData.bazar.reduce((sum, item) => {
            const valor = parseFloat(item.valor) || 0;
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

    // Helper para formatar data ISO
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

    // 7. Filtragem e Renderização das tabelas
    function renderData() {
        const filtroDataInicio = document.getElementById("filtro-data-inicio").value;
        const filtroDataFim = document.getElementById("filtro-data-fim").value;
        const buscaTexto = document.getElementById("busca-texto").value.toLowerCase().trim();

        // Filtrar todos para atualizar os cards
        const filtered = {
            recebimento: filterDataset(rawData.recebimento),
            triagem: filterDataset(rawData.triagem),
            prensa: filterDataset(rawData.prensa),
            bazar: filterDataset(rawData.bazar),
            cooperados: filterDataset(rawData.cooperados)
        };

        renderStats(filtered);

        const emptyEl = document.getElementById("table-empty");

        // Renderizar aba gráficos
        if (activeTab === "graficos") {
            emptyEl.classList.add("hidden");
            Object.keys(tabTables).forEach(tabKey => {
                if (tabKey !== "graficos" && tabTables[tabKey]) {
                    tabTables[tabKey].classList.add("hidden");
                }
            });
            document.getElementById("container-graficos").classList.remove("hidden");
            updateCharts(filtered);
            return;
        }

        const activeList = filtered[activeTab];
        const tbody = document.getElementById(`tbody-${activeTab}`);
        const tableEl = document.getElementById(`table-${activeTab}-el`);

        tbody.innerHTML = "";

        if (activeList.length === 0) {
            if (tableEl) tableEl.classList.add("hidden");
            emptyEl.classList.remove("hidden");
            return;
        }

        emptyEl.classList.add("hidden");
        if (tableEl) tableEl.classList.remove("hidden");

        activeList.forEach(item => {
            let rowHTML = "";
            const dataFormatada = formatarData(item.data_do_recebimento || item.data_recebimento || item.data_triagem || item.data_prensa || item.bazar_data || item.data_criacao || item.data_bazar);

            if (activeTab === "recebimento") {
                if (isSantaMaria) {
                    const origemLabel = item.procedencia === "mercado" && item.nome_mercado 
                        ? item.nome_mercado 
                        : (item.placa_caminhao || "-");

                    rowHTML = `
                        <tr class="hover:bg-gray-50 transition border-b border-gray-100">
                            <td class="px-6 py-4 capitalize font-semibold">${item.procedencia}</td>
                            <td class="px-6 py-4">${origemLabel}</td>
                            <td class="px-6 py-4 font-semibold">${parseFloat(item.peso_total).toFixed(2)} Kg</td>
                            <td class="px-6 py-4 capitalize">${item.material_tipo}</td>
                            <td class="px-6 py-4">${item.recebido_por}</td>
                            <td class="px-6 py-4 text-gray-500">${dataFormatada}</td>
                            <td class="px-6 py-4 text-center">
                                <button onclick="window.excluirRegistroGeral('excluir_recebimento', ${item.id})" title="Excluir" class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"><span class="material-symbols-outlined text-lg">delete</span></button>
                            </td>
                        </tr>
                    `;
                } else {
                    // Coopersel (Regina)
                    const filtroCidadeEl = document.getElementById("filtro-cidade");
                    const isNovaCampina = filtroCidadeEl && filtroCidadeEl.value === "nova campina";
                    
                    const thRejeito = document.getElementById("th-rejeito");
                    if (thRejeito) {
                        if (isNovaCampina) thRejeito.classList.remove("hidden");
                        else thRejeito.classList.add("hidden");
                    }

                    const thPagarCatador = document.getElementById("th-pagar-catador");
                    if (thPagarCatador) {
                        if (isNovaCampina) thPagarCatador.classList.add("hidden");
                        else thPagarCatador.classList.remove("hidden");
                    }

                    const cidadeNome = (item.cidade || "itapeva").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                    
                    let tipoBadge = `<span class="px-2 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-semibold">Caminhão</span>`;
                    if (item.procedencia === "doacao") {
                        tipoBadge = `<span class="px-2 py-1 bg-purple-50 text-purple-800 rounded-full text-xs font-semibold">Doação / PEV</span>`;
                    } else if (item.procedencia === "catador") {
                        tipoBadge = `<span class="px-2 py-1 bg-green-50 text-green-800 rounded-full text-xs font-semibold">Catador</span>`;
                    }

                    let origemInfo = item.placa_caminhao || "-";
                    if (item.procedencia === "catador" && item.nome_catador) {
                        origemInfo = `<span class="font-semibold text-gray-800">${item.nome_catador}</span>`;
                    } else if ((item.procedencia === "mercado" || item.procedencia === "doacao") && item.nome_mercado) {
                        origemInfo = `<span class="capitalize">${item.nome_mercado}</span>`;
                    }

                    const rejeitoText = parseFloat(item.peso_rejeito || 0) > 0 
                        ? `<span class="text-red-600 font-semibold">${parseFloat(item.peso_rejeito).toFixed(2)} Kg</span>` 
                        : `<span class="text-gray-400">-</span>`;

                    const valorPagoText = item.procedencia === "catador" && item.valor_pago !== undefined && item.valor_pago !== null
                        ? `<span class="text-green-700 font-bold bg-green-50 px-2 py-1 rounded-lg">R$ ${parseFloat(item.valor_pago).toFixed(2)}</span>`
                        : `<span class="text-gray-400">-</span>`;

                    rowHTML = `
                        <tr class="hover:bg-gray-50 transition border-b border-gray-100">
                            <td class="px-4 py-4 font-medium text-gray-700">${cidadeNome}</td>
                            <td class="px-4 py-4">${tipoBadge}</td>
                            <td class="px-4 py-4">${origemInfo}</td>
                            <td class="px-4 py-4 font-semibold">${parseFloat(item.peso_total).toFixed(2)} Kg</td>
                            ${isNovaCampina ? `<td class="px-4 py-4">${rejeitoText}</td>` : ''}
                            ${!isNovaCampina ? `<td class="px-4 py-4">${valorPagoText}</td>` : ''}
                            <td class="px-4 py-4 capitalize">${item.material_tipo}</td>
                            <td class="px-4 py-4">${item.recebido_por}</td>
                            <td class="px-4 py-4 text-gray-500 text-xs">${dataFormatada}</td>
                            <td class="px-4 py-4 text-center">
                                <button onclick="window.excluirRegistroGeral('excluir_recebimento', ${item.id})" title="Excluir" class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"><span class="material-symbols-outlined text-lg">delete</span></button>
                            </td>
                        </tr>
                    `;
                }
            } else if (activeTab === "triagem") {
                rowHTML = `
                    <tr class="hover:bg-gray-50 transition border-b border-gray-100">
                        <td class="px-6 py-4 font-semibold">Mesa ${item.mesa_id}</td>
                        <td class="px-6 py-4 capitalize">${item.material_tipo}</td>
                        <td class="px-6 py-4 text-red-600 font-semibold">${parseFloat(item.peso_rejeito).toFixed(2)} Kg</td>
                        <td class="px-6 py-4 text-gray-500">${dataFormatada}</td>
                        <td class="px-6 py-4 text-center">
                            <button onclick="window.excluirRegistroGeral('excluir_triagem', ${item.id})" title="Excluir" class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"><span class="material-symbols-outlined text-lg">delete</span></button>
                        </td>
                    </tr>
                `;
            } else if (activeTab === "prensa") {
                rowHTML = `
                    <tr class="hover:bg-gray-50 transition border-b border-gray-100">
                        <td class="px-6 py-4 capitalize">${item.material_tipo}</td>
                        <td class="px-6 py-4 font-semibold">${item.qtd_fardos_prensa} fardos</td>
                        <td class="px-6 py-4 text-green-700 font-semibold">${parseFloat(item.qnt_material_final).toFixed(2)} Kg</td>
                        <td class="px-6 py-4 text-gray-500">${dataFormatada}</td>
                        <td class="px-6 py-4 text-center">
                            <button onclick="window.excluirRegistroGeral('excluir_prensa', ${item.id})" title="Excluir" class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"><span class="material-symbols-outlined text-lg">delete</span></button>
                        </td>
                    </tr>
                `;
            } else if (activeTab === "bazar") {
                const isEntrada = item.entrada === true || String(item.entrada).toLowerCase() === "true" || String(item.entrada).toLowerCase() === "entrada";
                const tipoBadge = isEntrada 
                    ? `<span class="px-2 py-1 bg-green-50 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><span class="material-symbols-outlined text-xs">arrow_upward</span>Entrada</span>`
                    : `<span class="px-2 py-1 bg-red-50 text-red-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><span class="material-symbols-outlined text-xs">arrow_downward</span>Saída</span>`;

                const metodoBadge = isEntrada && item.metodo_pagamento
                    ? `<span class="px-2 py-0.5 bg-blue-50 text-blue-800 rounded text-xs font-semibold uppercase">${item.metodo_pagamento}</span>`
                    : `<span class="text-gray-400">-</span>`;

                rowHTML = `
                    <tr class="hover:bg-gray-50 transition border-b border-gray-100">
                        <td class="px-6 py-4 font-bold ${isEntrada ? 'text-green-600' : 'text-red-600'}">R$ ${parseFloat(item.valor).toFixed(2)}</td>
                        <td class="px-6 py-4">${tipoBadge}</td>
                        <td class="px-6 py-4">${metodoBadge}</td>
                        <td class="px-6 py-4">${item.motivo}</td>
                        <td class="px-6 py-4 text-gray-500">${dataFormatada}</td>
                        <td class="px-6 py-4 text-center">
                            <button onclick="window.excluirRegistroGeral('excluir_bazar', ${item.id})" title="Excluir" class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"><span class="material-symbols-outlined text-lg">delete</span></button>
                        </td>
                    </tr>
                `;
            } else if (activeTab === "cooperados") {
                const isAtivo = item.ativo === true || item.ativo === "true";
                const coopNome = currentCoop === "santa maria" ? "Santa Maria" : "Coopersel";
                const statusBadge = isAtivo
                    ? `<span class="px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold inline-flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-green-600"></span>Ativo</span>`
                    : `<span class="px-2.5 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold inline-flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-red-600"></span>Inativo</span>`;

                rowHTML = `
                    <tr class="hover:bg-gray-50 transition border-b border-gray-100">
                        <td class="px-6 py-4"><span class="px-2 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-semibold">${coopNome}</span></td>
                        <td class="px-6 py-4 font-bold text-gray-800">${item.nome || '-'}</td>
                        <td class="px-6 py-4 font-mono text-xs text-gray-600">${item.cpf || '-'}</td>
                        <td class="px-6 py-4 capitalize">${item.funcao || '-'}</td>
                        <td class="px-6 py-4">${item.telefone || '-'}</td>
                        <td class="px-6 py-4">${item.sexo || '-'}</td>
                        <td class="px-6 py-4">${statusBadge}</td>
                        <td class="px-6 py-4 text-center">
                            <div class="flex items-center justify-center gap-1">
                                <button onclick="window.abrirModalEditarCooperado('${item.cpf}', '${coopNome}')" title="Editar Cooperado" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                    <span class="material-symbols-outlined text-lg">edit</span>
                                </button>
                                <button onclick="window.trocarStatusCooperado('${item.cpf}', '${coopNome}')" title="Alternar Status (Ativo/Inativo)" class="p-1.5 ${isAtivo ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'} rounded-lg transition">
                                    <span class="material-symbols-outlined text-lg">${isAtivo ? 'block' : 'check_circle'}</span>
                                </button>
                                <button onclick="window.excluirCooperado('${item.cpf}', '${coopNome}')" title="Excluir Cooperado" class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition">
                                    <span class="material-symbols-outlined text-lg">delete</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }

            tbody.insertAdjacentHTML("beforeend", rowHTML);
        });

        // Sub-função de filtragem
        function filterDataset(dataset) {
            return dataset.filter(item => {
                // Filtro de Data
                const dataCriacaoStr = item.data_do_recebimento || item.data_recebimento || item.data_triagem || item.data_prensa || item.bazar_data || item.data_criacao || item.data_bazar;
                if (dataCriacaoStr) {
                    const itemData = new Date(dataCriacaoStr.split(" ")[0] || dataCriacaoStr);
                    
                    if (filtroDataInicio) {
                        const inicio = new Date(filtroDataInicio);
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

                // Filtro de Cidade (Coopersel)
                const filtroCidadeEl = document.getElementById("filtro-cidade");
                if (filtroCidadeEl && filtroCidadeEl.value) {
                    const itemCidade = (item.cidade || "itapeva").toLowerCase();
                    if (itemCidade !== filtroCidadeEl.value.toLowerCase()) {
                        return false;
                    }
                }

                // Filtro de Procedência / Tipo
                const filtroProcedenciaEl = document.getElementById("filtro-procedencia");
                if (filtroProcedenciaEl && filtroProcedenciaEl.value && filtroProcedenciaEl.value !== "todos") {
                    const itemProc = (item.procedencia || "").toLowerCase();
                    if (itemProc !== filtroProcedenciaEl.value.toLowerCase()) {
                        return false;
                    }
                }

                // Filtro de Texto
                if (buscaTexto) {
                    const matchesText = 
                        (item.material_tipo && item.material_tipo.toLowerCase().includes(buscaTexto)) ||
                        (item.procedencia && item.procedencia.toLowerCase().includes(buscaTexto)) ||
                        (item.recebido_por && item.recebido_por.toLowerCase().includes(buscaTexto)) ||
                        (item.placa_caminhao && item.placa_caminhao.toLowerCase().includes(buscaTexto)) ||
                        (item.nome_mercado && item.nome_mercado.toLowerCase().includes(buscaTexto)) ||
                        (item.nome_catador && item.nome_catador.toLowerCase().includes(buscaTexto)) ||
                        (item.cidade && item.cidade.toLowerCase().includes(buscaTexto)) ||
                        (item.motivo && item.motivo.toLowerCase().includes(buscaTexto)) ||
                        (item.nome && item.nome.toLowerCase().includes(buscaTexto)) ||
                        (item.cpf && String(item.cpf).includes(buscaTexto)) ||
                        (item.funcao && item.funcao.toLowerCase().includes(buscaTexto)) ||
                        (item.telefone && String(item.telefone).includes(buscaTexto)) ||
                        (item.rg && String(item.rg).includes(buscaTexto)) ||
                        (item.endereco && item.endereco.toLowerCase().includes(buscaTexto));

                    if (!matchesText) return false;
                }

                return true;
            });
        }
    }

    // 8. Eventos de Filtros
    document.getElementById("filtro-data-inicio").addEventListener("input", renderData);
    document.getElementById("filtro-data-fim").addEventListener("input", renderData);
    document.getElementById("busca-texto").addEventListener("input", renderData);

    const fcidade = document.getElementById("filtro-cidade");
    if (fcidade) fcidade.addEventListener("change", renderData);

    const fprocedencia = document.getElementById("filtro-procedencia");
    if (fprocedencia) fprocedencia.addEventListener("change", renderData);


    // 9. Exportações

    // Excel Export via SheetJS
    document.getElementById("btn-export-excel").addEventListener("click", () => {
        const activeTableId = `table-${activeTab}-el`;
        const table = document.getElementById(activeTableId);
        
        if (!table || table.classList.contains("hidden")) {
            alert("Não há dados visíveis para exportar.");
            return;
        }

        const wb = XLSX.utils.table_to_book(table, { sheet: activeTab });
        XLSX.writeFile(wb, `relatorio_${activeTab}_${currentCoop.replace(" ", "_")}.xlsx`);
    });

    // PDF Export via jsPDF
    document.getElementById("btn-export-pdf").addEventListener("click", () => {
        const activeTableId = `table-${activeTab}-el`;
        const table = document.getElementById(activeTableId);
        
        if (!table || table.classList.contains("hidden")) {
            alert("Não há dados visíveis para exportar.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4'); // Paisagem

        const coopFormatado = currentCoop.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(29, 78, 216);
        doc.text(`Itapeva Recicla - Cooperativa ${coopFormatado}`, 14, 15);
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(107, 114, 128);
        doc.text(`Relatório: ${activeTab.toUpperCase()} · Gerado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`, 14, 22);

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

        doc.save(`relatorio_${activeTab}_${currentCoop.replace(" ", "_")}.pdf`);
    });

    // Função para desenhar e atualizar os gráficos
    function updateCharts(filtered) {
        if (chartPrensaInstance) chartPrensaInstance.destroy();
        if (chartRecebimentoInstance) chartRecebimentoInstance.destroy();
        if (chartEtapasInstance) chartEtapasInstance.destroy();
        if (chartBazarInstance) chartBazarInstance.destroy();

        // --- CHART 1: Prensa (Rosca) ---
        const prensaCanvas = document.getElementById("chart-materiais-prensa");
        if (prensaCanvas) {
            const matPrensa = {};
            filtered.prensa.forEach(item => {
                const tipo = (item.material_tipo || "Outros").toLowerCase();
                const peso = parseFloat(item.qnt_material_final) || 0;
                matPrensa[tipo] = (matPrensa[tipo] || 0) + peso;
            });

            const labels = Object.keys(matPrensa).map(l => l.charAt(0).toUpperCase() + l.slice(1));
            const data = Object.values(matPrensa);

            chartPrensaInstance = new Chart(prensaCanvas, {
                type: 'doughnut',
                data: {
                    labels: labels.length > 0 ? labels : ["Sem dados"],
                    datasets: [{
                        data: data.length > 0 ? data : [0],
                        backgroundColor: ['#3b82f6', '#f97316', '#10b981', '#a855f7', '#64748b'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }

        // --- CHART 2: Recebimento (Barras) ---
        const recCanvas = document.getElementById("chart-materiais-recebimento");
        if (recCanvas) {
            const matRec = {};
            filtered.recebimento.forEach(item => {
                const tipo = (item.material_tipo || "Outros").toLowerCase();
                const peso = parseFloat(item.peso_total) || 0;
                matRec[tipo] = (matRec[tipo] || 0) + peso;
            });

            const labels = Object.keys(matRec).map(l => l.charAt(0).toUpperCase() + l.slice(1));
            const data = Object.values(matRec);

            chartRecebimentoInstance = new Chart(recCanvas, {
                type: 'bar',
                data: {
                    labels: labels.length > 0 ? labels : ["Sem dados"],
                    datasets: [{
                        label: 'Peso Recebido (Kg)',
                        data: data.length > 0 ? data : [0],
                        backgroundColor: '#3b82f6',
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }

        // --- CHART 3: Registros por Etapa (Colunas) ---
        const etapasCanvas = document.getElementById("chart-registros-etapa");
        if (etapasCanvas) {
            const etapasData = [
                filtered.recebimento.length,
                filtered.triagem.length,
                filtered.prensa.length,
                filtered.bazar.length
            ];

            chartEtapasInstance = new Chart(etapasCanvas, {
                type: 'bar',
                data: {
                    labels: ['Recebimento', 'Triagem', 'Prensa', 'Bazar'],
                    datasets: [{
                        label: 'Número de Registros',
                        data: etapasData,
                        backgroundColor: ['#2563eb', '#f97316', '#16a34a', '#7c3aed'],
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true, ticks: { precision: 0 } }
                    }
                }
            });
        }

        // --- CHART 4: Balanço Bazar (Pizza) ---
        const bazarCanvas = document.getElementById("chart-bazar-balanco");
        if (bazarCanvas) {
            let entradas = 0;
            let saidas = 0;
            filtered.bazar.forEach(item => {
                const valor = parseFloat(item.valor) || 0;
                const isEntrada = item.entrada === true || String(item.entrada).toLowerCase() === "true" || String(item.entrada).toLowerCase() === "entrada";
                if (isEntrada) entradas += valor;
                else saidas += valor;
            });

            chartBazarInstance = new Chart(bazarCanvas, {
                type: 'pie',
                data: {
                    labels: ['Entradas', 'Saídas'],
                    datasets: [{
                        data: [entradas, saidas],
                        backgroundColor: ['#10b981', '#ef4444'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }

        // --- CHART 5: Métodos de Pagamento (Rosca) ---
        const metodosCanvas = document.getElementById("chart-metodos-pagamento");
        if (metodosCanvas) {
            if (chartMetodosInstance) chartMetodosInstance.destroy();
            const metodos = {};
            filtered.bazar.forEach(item => {
                const isEntrada = item.entrada === true || String(item.entrada).toLowerCase() === "true" || String(item.entrada).toLowerCase() === "entrada";
                if (isEntrada && item.metodo_pagamento) {
                    const m = item.metodo_pagamento.toLowerCase();
                    metodos[m] = (metodos[m] || 0) + 1;
                }
            });

            const labels = Object.keys(metodos).map(l => l.charAt(0).toUpperCase() + l.slice(1));
            const data = Object.values(metodos);

            chartMetodosInstance = new Chart(metodosCanvas, {
                type: 'doughnut',
                data: {
                    labels: labels.length > 0 ? labels : ["Sem dados"],
                    datasets: [{
                        data: data.length > 0 ? data : [0],
                        backgroundColor: ['#3b82f6', '#10b981', '#f97316', '#a855f7', '#f43f5e', '#64748b'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => ` ${ctx.label}: ${ctx.parsed} uso(s)`
                            }
                        }
                    }
                }
            });
        }

        // --- CHART 6: Cooperados por Sexo (Rosca) ---
        const sexoCanvas = document.getElementById("chart-cooperados-sexo");
        if (sexoCanvas) {
            if (chartSexoInstance) chartSexoInstance.destroy();
            const contagem = {};
            filtered.cooperados.forEach(c => {
                const sexo = (c.sexo || "Não informado").trim();
                contagem[sexo] = (contagem[sexo] || 0) + 1;
            });

            const sexoLabels = Object.keys(contagem);
            const sexoData = Object.values(contagem);

            const coresSexo = {
                "Masculino": "#3b82f6",
                "Feminino": "#ec4899",
                "Outro": "#a855f7",
                "Não informado": "#94a3b8"
            };
            const cores = sexoLabels.map(l => coresSexo[l] || "#64748b");

            chartSexoInstance = new Chart(sexoCanvas, {
                type: 'doughnut',
                data: {
                    labels: sexoLabels.length > 0 ? sexoLabels : ["Sem dados"],
                    datasets: [{
                        data: sexoData.length > 0 ? sexoData : [0],
                        backgroundColor: sexoLabels.length > 0 ? cores : ["#e2e8f0"],
                        borderWidth: 2,
                        borderColor: "#fff"
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => {
                                    const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                    const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                                    return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // --- LÓGICA DE GERENCIAMENTO DE COOPERADOS (Status, Excluir, Editar) ---

    window.trocarStatusCooperado = async function(cpf, cooperativa) {
        if (!confirm(`Deseja alterar o status do cooperado (CPF: ${cpf})?`)) return;
        try {
            const res = await fetch("https://backendcooperativas.vercel.app/trocar_status_cooperado", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cpf: String(cpf), cooperativa: cooperativa })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || data.details || "Erro ao alterar status.");
            alert(data.message || "Status alterado com sucesso!");
            fetchData();
        } catch (err) {
            alert("Erro: " + err.message);
        }
    };

    window.excluirCooperado = async function(cpf, cooperativa) {
        if (!confirm(`Tem certeza que deseja EXCLUIR o cooperado (CPF: ${cpf})? Esta ação não pode ser desfeita.`)) return;
        try {
            const res = await fetch("https://backendcooperativas.vercel.app/excluir_cooperado", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cpf: String(cpf), cooperativa: cooperativa })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || data.details || "Erro ao excluir cooperado.");
            alert(data.message || "Cooperado excluído com sucesso!");
            fetchData();
        } catch (err) {
            alert("Erro: " + err.message);
        }
    };

    window.excluirRegistroGeral = async function(endpoint, id) {
        if (!confirm(`Tem certeza que deseja EXCLUIR este registro? Esta ação não pode ser desfeita.`)) return;
        try {
            const res = await fetch(`https://backendcooperativas.vercel.app/${endpoint}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: id, cooperativa: currentCoop })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || data.details || "Erro ao excluir registro.");
            alert(data.message || "Registro excluído com sucesso!");
            fetchData();
        } catch (err) {
            alert("Erro: " + err.message);
        }
    };

    window.abrirModalEditarCooperado = function(cpf, cooperativa) {
        const cooperado = rawData.cooperados.find(c => String(c.cpf) === String(cpf));
        if (!cooperado) {
            alert("Cooperado não encontrado.");
            return;
        }
        document.getElementById("edit-cpf").value = cooperado.cpf || "";
        document.getElementById("edit-cooperativa").value = cooperativa;
        document.getElementById("edit-nome").value = cooperado.nome || "";
        document.getElementById("edit-funcao").value = cooperado.funcao || "";
        document.getElementById("edit-telefone").value = cooperado.telefone || "";
        document.getElementById("edit-rg").value = cooperado.rg || "";
        document.getElementById("edit-idade").value = cooperado.idade || "";
        document.getElementById("edit-dt-nascimento").value = cooperado.data_de_nascimento || "";
        document.getElementById("edit-sexo").value = cooperado.sexo || "Masculino";
        document.getElementById("edit-endereco").value = cooperado.endereco || "";

        const modal = document.getElementById("modal-editar-cooperado");
        if (modal) modal.classList.remove("hidden");
    };

    const modalEditar = document.getElementById("modal-editar-cooperado");
    const btnFecharModal = document.getElementById("btn-fechar-modal-editar");
    const btnCancelarModal = document.getElementById("btn-cancelar-modal-editar");
    const formEditar = document.getElementById("form-editar-cooperado");

    function fecharModalEditar() {
        if (modalEditar) modalEditar.classList.add("hidden");
    }

    if (btnFecharModal) btnFecharModal.addEventListener("click", fecharModalEditar);
    if (btnCancelarModal) btnCancelarModal.addEventListener("click", fecharModalEditar);

    if (formEditar) {
        formEditar.addEventListener("submit", async (e) => {
            e.preventDefault();
            const cpf = document.getElementById("edit-cpf").value;
            const cooperativa = document.getElementById("edit-cooperativa").value;

            const payload = {
                cpf: String(cpf),
                cooperativa: cooperativa,
                nome: document.getElementById("edit-nome").value.trim(),
                funcao: document.getElementById("edit-funcao").value.trim(),
                telefone: document.getElementById("edit-telefone").value.trim(),
                rg: document.getElementById("edit-rg").value.trim(),
                idade: parseInt(document.getElementById("edit-idade").value),
                data_de_nascimento: document.getElementById("edit-dt-nascimento").value,
                sexo: document.getElementById("edit-sexo").value,
                endereco: document.getElementById("edit-endereco").value.trim()
            };

            try {
                const res = await fetch("https://backendcooperativas.vercel.app/editar_cooperado", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || data.details || "Erro ao editar cooperado.");
                alert(data.message || "Cooperado editado com sucesso!");
                fecharModalEditar();
                fetchData();
            } catch (err) {
                alert("Erro: " + err.message);
            }
        });
    }

    // Iniciar
    fetchData();
});
