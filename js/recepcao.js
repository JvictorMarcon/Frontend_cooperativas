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
            const placa_caminhao = document.getElementById("placa_caminhao").value;
            const tipo_de_material = document.getElementById("tipo_de_material").value;
            const peso = parseFloat(document.getElementById("peso").value);
            const recebedor = document.getElementById("recebedor").value;

            const submitBtn = e.target.querySelector("button[type='submit']");
            const originalHTML = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = "Enviando...";

            try {
                const response = await fetch("https://backendcooperativas.vercel.app/recebimento", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        procedencia,
                        placa_caminhao,
                        peso_total: peso,
                        material_tipo: tipo_de_material,
                        recebido_por: recebedor,
                        cooperativa: currentCoop
                      })
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || err.message || "Erro ao registrar recebimento");
                }

                alert("Recebimento registrado com sucesso!");
                e.target.reset();
            } catch (error) {
                alert("Erro: " + error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalHTML;
            }
        });
    }
});
