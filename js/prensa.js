document.addEventListener("DOMContentLoaded", () => {
    const user = sessionStorage.getItem("user");
    const cargo = sessionStorage.getItem("cargo");
    const cooperativa = sessionStorage.getItem("cooperativa");

    const pathDecoded = decodeURIComponent(window.location.pathname).toLowerCase();
    const isSantaMaria = pathDecoded.includes("santa maria");
    const currentCoop = isSantaMaria ? "santa maria" : "coopersel";

    // Proteção de rota
    if (!user || (cargo !== "prensa" && cargo !== "adm" && cargo !== "tesoureira") || (cargo !== "adm" && cooperativa.toLowerCase() !== currentCoop)) {
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

    // Submissão do formulário de prensa
    const form = document.getElementById("materiais-form");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const tipo_de_material = document.getElementById("tipo_de_material").value;
            const fardos = parseInt(document.getElementById("fardos").value);
            const material_usado = parseFloat(document.getElementById("material_usado").value);

            const submitBtn = e.target.querySelector("button[type='submit']");
            const originalHTML = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = "Enviando...";

            try {
                const response = await fetch("https://backendcooperativas.vercel.app/prensa", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        material_tipo: tipo_de_material,
                        qtd_fardos_prensa: fardos,
                        qnt_material_final: material_usado,
                        cooperativa: currentCoop
                    })
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || err.message || "Erro ao registrar prensa");
                }

                alert("Prensa registrada com sucesso!");
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
