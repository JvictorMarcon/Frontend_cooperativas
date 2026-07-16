document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    if (!loginForm) return;

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const usuarioInput = document.getElementById("usuario");
        const senhaInput = document.getElementById("senha");

        if (!usuarioInput || !senhaInput) return;

        const user = usuarioInput.value.trim();
        const senha = senhaInput.value;

        if (!user || !senha) {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        // Feedback visual do botão
        const submitBtn = loginForm.querySelector("button[type='submit']");
        const originalBtnHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Autenticando...</span>
        `;

        try {
            const response = await fetch("https://backendcooperativas.vercel.app/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ user, senha })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Credenciais inválidas.");
            }

            const data = await response.json();

            // Salvar informações na sessão (sessionStorage)
            sessionStorage.setItem("user", user);
            sessionStorage.setItem("senha", senha);
            sessionStorage.setItem("cargo", data.cargo);
            sessionStorage.setItem("cooperativa", data.cooperativa || "");

            // Redirecionamento com base no cargo e cooperativa
            const cargo = data.cargo ? data.cargo.toLowerCase() : "";
            const cooperativa = data.cooperativa ? data.cooperativa.toLowerCase() : "";

            if (cargo === "adm") {
                if (!cooperativa || cooperativa === "todas" || user === "flavia") {
                    window.location.href = "dashboard_adm.html";
                } else if (cooperativa === "santa maria") {
                    window.location.href = "Santa Maria/dashboard.html";
                } else if (cooperativa === "coopersel") {
                    window.location.href = "Coopersel/dashboard.html";
                } else {
                    window.location.href = "dashboard_adm.html";
                }
            } else if (cargo === "tesoureira") {
                if (cooperativa === "santa maria") {
                    window.location.href = "Santa Maria/dashboard.html";
                } else if (cooperativa === "coopersel") {
                    window.location.href = "Coopersel/dashboard.html";
                } else {
                    alert("Usuário tesoureiro sem cooperativa associada.");
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnHTML;
                }
            } else if (["recepcao", "triagem", "prensa", "bazar"].includes(cargo)) {
                let folder = "";
                if (cooperativa === "santa maria") {
                    folder = "Santa Maria";
                } else if (cooperativa === "coopersel") {
                    folder = "Coopersel";
                } else {
                    alert("Funcionário sem cooperativa associada.");
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnHTML;
                    return;
                }

                // Redireciona para o arquivo respectivo
                // recepcao -> recepcao.html
                // triagem -> triagem.html
                // prensa -> prensa.html
                // bazar -> bazar.html
                window.location.href = `${folder}/${cargo}.html`;
            } else {
                alert("Cargo não reconhecido no sistema.");
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHTML;
            }

        } catch (error) {
            alert(error.message || "Erro ao tentar realizar login. Verifique sua conexão.");
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHTML;
        }
    });
});
