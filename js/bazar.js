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

    if (btnEntrada && btnSaida && inputTipo) {
        btnEntrada.addEventListener("click", () => {
            inputTipo.value = "true";
            btnEntrada.classList.add("active-entrada");
            btnSaida.classList.remove("active-saida");
        });

        btnSaida.addEventListener("click", () => {
            inputTipo.value = "false";
            btnSaida.classList.add("active-saida");
            btnEntrada.classList.remove("active-entrada");
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

            if (isNaN(valor) || valor <= 0 || !motivo) {
                alert("Por favor, preencha todos os campos corretamente.");
                return;
            }

            const submitBtn = e.target.querySelector("button[type='submit']");
            const originalHTML = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = "Salvando...";

            try {
                const response = await fetch("https://backendcooperativas.vercel.app/bazar", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        valor,
                        entrada,
                        motivo,
                        cooperativa: currentCoop
                    })
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
