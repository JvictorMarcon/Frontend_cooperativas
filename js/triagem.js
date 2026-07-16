document.addEventListener("DOMContentLoaded", () => {
    const user = sessionStorage.getItem("user");
    const cargo = sessionStorage.getItem("cargo");
    const cooperativa = sessionStorage.getItem("cooperativa");

    const pathDecoded = decodeURIComponent(window.location.pathname).toLowerCase();
    const isSantaMaria = pathDecoded.includes("santa maria");
    const currentCoop = isSantaMaria ? "santa maria" : "coopersel";

    // Proteção de rota
    if (!user || (cargo !== "triagem" && cargo !== "adm" && cargo !== "tesoureira") || (cargo !== "adm" && cooperativa.toLowerCase() !== currentCoop)) {
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

    // Submissão do formulário de triagem
    const form = document.getElementById("materiais-form");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const procedencia = document.getElementById("procedencia").value; // "mesa_1", "mesa_2", "mesa_3"
            const tipo_de_material = document.getElementById("tipo_de_material").value;
            const bags = parseInt(document.getElementById("bags").value);
            const rejeito = parseFloat(document.getElementById("rejeito").value);

            // Obter o id numérico da mesa
            const mesa_id = parseInt(procedencia.replace("mesa_", ""));

            const submitBtn = e.target.querySelector("button[type='submit']");
            const originalHTML = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = "Enviando...";

            try {
                const response = await fetch("https://backendcooperativas.vercel.app/triagem", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        mesa_id,
                        material_tipo: tipo_de_material,
                        qntd_bags: bags,
                        peso_rejeito: rejeito,
                        cooperativa: currentCoop
                    })
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || err.message || "Erro ao registrar triagem");
                }

                alert("Triagem registrada com sucesso!");
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
