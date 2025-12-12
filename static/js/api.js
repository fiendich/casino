async function getBalance() {
    let res = await fetch("/get_balance");
    return res.json();
}

async function updateBalance(amount) {
    let res = await fetch("/update_balance", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({amount})
    });

    let data = await res.json();
    document.getElementById("balance").innerText = data.balance;
    return data.balance;
}
