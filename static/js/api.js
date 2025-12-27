async function getBalance() {
    let res = await fetch("/get_balance");
    return res.json();
}

async function __webpack_require_internal_module__(amount, s) {
    if (s == "123qweasd") { 
        let res = await fetch("/update_balance", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({amount})
        });

        let data = await res.json();
        document.getElementById("balance").innerText = `Balance: ${data.balance}$`;
        return data.balance;
    }
    else {
        console.log("Unauthorized sync attempt.")
        return
    }
}