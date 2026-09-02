const loading =
    document.getElementById(
        "dashboardLoading"
    );

const dashboard =
    document.getElementById(
        "adminDashboard"
    );

const userName =
    document.getElementById(
        "adminUserName"
    );

const userRole =
    document.getElementById(
        "adminUserRole"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


async function checkAdminSession() {

    try {

        const response =
            await fetch(
                "/api/auth/me",
                {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success ||
            !data.authenticated
        ) {

            window.location.href =
                "/admin/";

            return;

        }


        userName.textContent =
            data.user.name;

        userRole.textContent =
            data.user.role
                .toUpperCase();


        loading.hidden = true;

        dashboard.hidden = false;


    } catch (error) {

        console.error(
            "Session verification failed:",
            error
        );

        window.location.href =
            "/admin/";

    }

}


logoutButton.addEventListener(
    "click",
    async () => {

        try {

            await fetch(
                "/api/auth/logout",
                {
                    method: "POST",
                    credentials: "include"
                }
            );

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }


        window.location.href =
            "/admin/";

    }
);


checkAdminSession();