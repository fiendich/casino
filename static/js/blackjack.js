document.getElementById("test-btn").addEventListener("click", async () => {
    console.log("Button clicked!");

    // Example: add +50 to balance
    const newBalance = await updateBalance(50);

    console.log("New balance:", newBalance);
});

console.log("Blackjack loaded");

// Example usage:
async function win10() {
    await updateBalance(10);
}

async function lose10() {
    await updateBalance(-10);
}
