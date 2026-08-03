document.addEventListener("DOMContentLoaded", () => {
    const user = sessionStorage.getItem("user");
    const cargo = sessionStorage.getItem("cargo");
    const cooperativa = sessionStorage.getItem("cooperativa");

    const pathDecoded = decodeURIComponent(window.location.pathname).toLowerCase();
    const isSantaMaria = pathDecoded.includes("santa maria");
    const currentCoop = isSantaMaria ? "santa maria" : "coopersel";

    // Proteção de rota
    if (!user || (cargo !== "recepcao" && cargo !== "adm" && cargo !== "tesoureira") || (cargo !== "adm" && cooperativa.toLowerCase() !== currentCoop)) {
        window.location.href = "../index.html";
        return;
    }

    // Lógica de logout
    const btnSair = document.getElementById("btn-sair");
    if (btnSair) {
        btnSair.addEventListener("click", () => {
            sessionStorage.clear();
            window.location.href = "../index.html";
        });
    }

    // Submissão do formulário de recebimento
    const form = document.getElementById("materiais-form");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const procedencia = document.getElementById("procedencia").value;
            const tipo_de_material = document.getElementById("tipo_de_material").value;
            const peso = parseFloat(document.getElementById("peso").value);
            const recebedor = document.getElementById("recebedor").value;

            // Placa ou mercado (Santa Maria)
            let placa_caminhao = "";
            const placaEl = document.getElementById("placa_caminhao");
            if (placaEl) placa_caminhao = placaEl.value;

            // Nome do mercado (Santa Maria) ou Origem da Doação (Coopersel)
            let nome_mercado = "";
            const nomeEl = document.getElementById("nome_mercado");
            const doacaoEl = document.getElementById("origem_doacao");
            if (nomeEl && procedencia === "mercado") {
                nome_mercado = nomeEl.value.toLowerCase().trim();
            } else if (doacaoEl && procedencia === "doacao") {
                nome_mercado = doacaoEl.value.toLowerCase().trim();
            }

            // Cidade (Coopersel)
            let cidade = "";
            const cidadeEl = document.getElementById("cidade");
            if (cidadeEl) cidade = cidadeEl.value;

            // Rejeito (Coopersel - Nova Campina)
            let peso_rejeito = 0;
            const rejeitoEl = document.getElementById("peso_rejeito");
            if (rejeitoEl && cidade === "nova campina") {
                peso_rejeito = parseFloat(rejeitoEl.value) || 0;
            }

            const submitBtn = e.target.querySelector("button[type='submit']");
            const originalHTML = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = "Enviando...";

            try {
                const payload = {
                    procedencia,
                    placa_caminhao: procedencia === "mercado" || procedencia === "doacao" ? "" : placa_caminhao,
                    peso_total: peso,
                    material_tipo: tipo_de_material,
                    recebido_por: recebedor,
                    cooperativa: currentCoop
                };

                // Campos extras conforme cooperativa/procedência
                if (nome_mercado) payload.nome_mercado = nome_mercado;
                if (cidade) payload.cidade = cidade;
                if (peso_rejeito > 0) payload.peso_rejeito = peso_rejeito;

                const response = await fetch("https://backendcooperativas.vercel.app/recebimento", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || err.message || "Erro ao registrar recebimento");
                }

                alert("Recebimento registrado com sucesso!");
                e.target.reset();

                // Resetar visibilidade dos campos extras
                const divMercado = document.getElementById("div-mercado");
                const divDoacao = document.getElementById("div-doacao");
                const divPlaca = document.getElementById("div-placa");
                const divRejeito = document.getElementById("div-rejeito");

                if (divMercado) divMercado.classList.add("hidden");
                if (divDoacao) divDoacao.classList.add("hidden");
                if (divPlaca) divPlaca.classList.remove("hidden");
                if (divRejeito) divRejeito.classList.add("hidden");

            } catch (error) {
                alert("Erro: " + error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalHTML;
            }
        });
    }
});
