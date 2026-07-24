document.addEventListener("DOMContentLoaded", () => {
    const user = sessionStorage.getItem("user");
    const cargo = sessionStorage.getItem("cargo");
    const cooperativa = sessionStorage.getItem("cooperativa");

    const pathDecoded = decodeURIComponent(window.location.pathname).toLowerCase();
    const isSantaMaria = pathDecoded.includes("santa maria");
    const currentCoop = isSantaMaria ? "santa maria" : "coopersel";

    // Proteção de rota
    if (!user || (cargo !== "bazar" && cargo !== "adm" && cargo !== "tesoureira") || (cargo !== "adm" && cooperativa.toLowerCase() !== currentCoop)) {
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

    // Alternância de botões Entrada/Saída
    const btnEntrada = document.getElementById("btn-entrada");
    const btnSaida = document.getElementById("btn-saida");
    const inputTipo = document.getElementById("tipo");
    const containerMetodo = document.getElementById("container-metodo-pagamento");
    const selectMetodo = document.getElementById("metodo_pagamento");

    if (btnEntrada && btnSaida && inputTipo) {
        btnEntrada.addEventListener("click", () => {
            inputTipo.value = "true";
            btnEntrada.classList.add("active-entrada");
            btnSaida.classList.remove("active-saida");
            if (containerMetodo && selectMetodo) {
                containerMetodo.classList.remove("hidden");
                selectMetodo.required = true;
            }
        });

        btnSaida.addEventListener("click", () => {
            inputTipo.value = "false";
            btnSaida.classList.add("active-saida");
            btnEntrada.classList.remove("active-entrada");
            if (containerMetodo && selectMetodo) {
                containerMetodo.classList.add("hidden");
                selectMetodo.required = false;
                selectMetodo.value = "";
            }
        });
    }

    // Submissão do formulário de bazar
    const form = document.getElementById("bazar-form");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const valor = parseFloat(document.getElementById("valor").value);
            const entrada = inputTipo.value === "true"; // Envia como boolean
            const motivo = document.getElementById("motivo").value.trim();
            const metodo_pagamento = entrada && selectMetodo ? selectMetodo.value : null;

            if (isNaN(valor) || valor <= 0 || !motivo || (entrada && !metodo_pagamento)) {
                alert("Por favor, preencha todos os campos corretamente.");
                return;
            }

            const submitBtn = e.target.querySelector("button[type='submit']");
            const originalHTML = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = "Salvando...";

            try {
                const payload = {
                    valor,
                    entrada,
                    motivo,
                    cooperativa: currentCoop
                };

                if (entrada && metodo_pagamento) {
                    payload.metodo_pagamento = metodo_pagamento;
                }

                const response = await fetch("https://backendcooperativas.vercel.app/bazar", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || err.message || "Erro ao registrar bazar");
                }

                alert("Movimentação de bazar registrada com sucesso!");
                e.target.reset();
                // Resetar botões para padrão (Entrada ativo)
                if (inputTipo && btnEntrada && btnSaida) {
                    inputTipo.value = "true";
                    btnEntrada.classList.add("active-entrada");
                    btnSaida.classList.remove("active-saida");
                    if (containerMetodo && selectMetodo) {
                        containerMetodo.classList.remove("hidden");
                        selectMetodo.required = true;
                    }
                }
            } catch (error) {
                alert("Erro: " + error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalHTML;
            }
        });
    }
});
