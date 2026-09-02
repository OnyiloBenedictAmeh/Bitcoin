const form =
    document.getElementById("adminLoginForm");

const emailInput =
    document.getElementById("adminEmail");

const passwordInput =
    document.getElementById("adminPassword");

const button =
    document.getElementById("adminLoginButton");

const buttonText =
    document.getElementById("adminLoginButtonText");

const message =
    document.getElementById("adminMessage");


function showMessage(text, type) {

    message.textContent = text;

    message.className =
        `admin-message ${type}`;

}


function setLoading(loading) {

    button.disabled = loading;

    buttonText.textContent =
        loading
            ? "Signing in..."
            : "Sign In";

}


form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        showMessage("", "");

        setLoading(true);


        try {

            const response =
                await fetch(
                    "/api/auth/login",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        credentials: "include",

                        body: JSON.stringify({

                            email:
                                emailInput.value,

                            password:
                                passwordInput.value

                        })

                    }
                );


            const data =
                await response.json();


            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Unable to login"
                );

            }


            showMessage(
                "Login successful. Redirecting...",
                "success"
            );


            setTimeout(
                () => {

                    window.location.href =
                        "dashboard.html";

                },
                500
            );


        } catch (error) {

            console.error(
                "Admin login error:",
                error
            );


            showMessage(
                error.message ||
                "Unable to login",
                "error"
            );


            setLoading(false);

        }

    }
);