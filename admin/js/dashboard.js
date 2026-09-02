console.log("DASHBOARD JS LOADED");


async function checkAdminSession() {

    const loading =
        document.getElementById("dashboardLoading");

    const dashboard =
        document.getElementById("adminDashboard");

    const userName =
        document.getElementById("adminUserName");

    const userRole =
        document.getElementById("adminUserRole");


    console.log("Checking administrator session...");


    try {

        const response = await fetch(
            "/api/auth/me",
            {
                method: "GET",
                credentials: "include",
                cache: "no-store"
            }
        );


        console.log(
            "AUTH RESPONSE:",
            response.status
        );


        const data =
            await response.json();


        console.log(
            "AUTH DATA:",
            data
        );


        if (
            !response.ok ||
            !data.success ||
            !data.authenticated
        ) {

            console.log(
                "Administrator is not authenticated."
            );

            window.location.href =
                "/admin/";

            return;

        }


        /*
        ============================
        AUTHENTICATED
        ============================
        */


        console.log(
            "Administrator authenticated:",
            data.user
        );


        userName.textContent =
            data.user.name;


        userRole.textContent =
            data.user.role.toUpperCase();


        loading.style.display =
            "none";


        dashboard.hidden =
            false;


        console.log(
            "Dashboard displayed successfully."
        );

    } catch (error) {

        console.error(
            "Dashboard authentication error:",
            error
        );

        window.location.href =
            "/admin/";

    }

}


/*
============================
LOGOUT
============================
*/

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


if (logoutButton) {

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

}


/*
============================
START DASHBOARD
============================
*/

checkAdminSession();