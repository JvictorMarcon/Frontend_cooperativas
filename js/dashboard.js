document.addEventListener("DOMContentLoaded", () => {
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
        bazar: []
    };

    let activeTab = "recebimento";

    // 4. Tabulação (Alternância de abas)
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

        // Bags na Triagem
        const totalBags = filteredData.triagem.reduce((sum, item) => sum + (parseInt(item.qntd_bags) || 0), 0);
        document.getElementById("stat-bags").textContent = totalBags;

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
            bazar: filterDataset(rawData.bazar)
        };

        renderStats(filtered);

        // Renderizar a aba ativa
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
            const dataFormatada = formatarData(item.data_do_recebimento || item.data_recebimento || item.data_triagem || item.data_prensa || item.bazar_data || item.data_criacao || item.data_bazar);

            if (activeTab === "recebimento") {
                rowHTML = `
                    <tr class="hover:bg-gray-50 transition border-b border-gray-100">
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
                        <td class="px-6 py-4 font-bold ${isEntrada ? 'text-green-600' : 'text-red-600'}">R$ ${parseFloat(item.valor).toFixed(2)}</td>
                        <td class="px-6 py-4">${tipoBadge}</td>
                        <td class="px-6 py-4">${item.motivo}</td>
                        <td class="px-6 py-4 text-gray-500">${dataFormatada}</td>
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

                // Filtro de Texto
                if (buscaTexto) {
                    const matchesText = 
                        (item.material_tipo && item.material_tipo.toLowerCase().includes(buscaTexto)) ||
                        (item.procedencia && item.procedencia.toLowerCase().includes(buscaTexto)) ||
                        (item.recebido_por && item.recebido_por.toLowerCase().includes(buscaTexto)) ||
                        (item.placa_caminhao && item.placa_caminhao.toLowerCase().includes(buscaTexto)) ||
                        (item.motivo && item.motivo.toLowerCase().includes(buscaTexto));

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

    // Iniciar
    fetchData();
});
