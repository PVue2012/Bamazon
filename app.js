var mysql = require("mysql");
var inquirer = require("inquirer");
// MAKE SURE TO ADD DASH TO CLI TABLE TO INSTALL CORRECT ONE
var Table = require("cli-table");

var connection = mysql.createConnection({
    host: "localhost",
    // Your port; if not 3306
    port: 3306,
    // Your username
    user: "",
    // Your password
    password: "",
    database: "bamazon"
});

// Checks to make sure I am connected to the database
connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    storeItems();
    setTimeout(askQuestion, 2000);
});

// Function to display items in store
var storeItems = function () {
    connection.query("SELECT * FROM bamazon.products;", function (err, res) {
        if (err) throw err;
        console.log("Welcome to Bamazon!");
        console.log("Please select from one of our products!")
        var table = new Table({
            head: ['ID', 'Product', 'Department', 'Price', 'Quantity']
            , colWidths: [5, 20, 20, 8, 10]
        });
        // table is an Array, so you can `push`, `unshift`, `splice` and friends
        for (var i = 0; i < res.length; i++) {
            table.push(
                [res[i].id, res[i].product_name, res[i].department_name, res[i].price, res[i].stock_quantity]
            )
        }
        console.log(table.toString());
    })
};

// function to ask for input from user
function askQuestion() {
    inquirer.prompt({
        name: "id",
        type: "input",
        message: "What is the ID of the product you would like to buy?",
        validate: function (value) {
            if (Number.isInteger(parseInt(value))) {
                return true;
            } else {
                return 'Please enter a number(s)';
            }
        }
    }).then(function (idAnswer) {
        // id question is stored in var
        var idSelection = idAnswer.id;
        connection.query("SELECT * FROM products WHERE id=?", idSelection, function (err, res) {
            if (err) throw err;
            if (res.length === 0) {
                console.log("Please select an id from the table.");
                askQuestion();
            }
            else {
                inquirer.prompt({
                    name: "quantity",
                    type: "input",
                    message: "How many would you like to buy?",
                    validate: function (value) {
                        if (Number.isInteger(parseInt(value))) {
                            return true;
                        } else {
                            return 'Please enter a number(s)';
                        }
                    }
                    // checks if store has enough to fulfill order
                }).then(function (quantityAnswer) {
                    var quantitySelection = quantityAnswer.quantity;
                    if (quantitySelection > res[0].stock_quantity) {
                        console.log("Sorry we don't have that many!");
                        askQuestion();
                    } else {
                        console.log("Order processed");
                        var updatedStock = res[0].stock_quantity - quantitySelection;
                        var total = res[0].price * quantitySelection;
                        connection.query("UPDATE products SET ? WHERE ?", [{
                            stock_quantity: updatedStock
                        },
                        {
                            id: res[0].id
                        }],
                            function (err) {
                                if (err) throw err;
                                console.log("You ordered " + quantitySelection + " of " + res[0].product_name + "!");
                                console.log("Your total is: $" + total);
                                connection.end();
                            }
                        )
                    }
                })
            }
        })
    })
};