const express = require("express")
const { v4: uuid } = require("uuid")

const customers = []

function verificaContaValida(request, response, next) {
    const { cpf } = request.headers
    const customer = customers.find(customer => customer.cpf === cpf)

    if (!customer) {
        return response.status(404).json({
            erro: "Cliente não encontrado."
        })
    }

    request.customer = customer

    return next()
}

function obterSaldo(statement) {
    const saldo = statement.reduce((acumulador, operacao) => {
        if (operacao.type === "credit") {
            return acumulador + operacao.amount
        } else {
            return acumulador - operacao.amount
        }
    }, 0)

    return saldo
}

const app = express()

app.use(express.json())

app.post("/account", (request, response) => {
    const { cpf, name } = request.body

    const isExistent = customers.some(customer => customer.cpf === cpf)

    if (isExistent) {
        return response.status(400).json({
            erro: "Cliente já existe."
        })
    }

    const customer = {
        cpf,
        name,
        id: uuid(),
        statement: []
    }

    customers.push(customer)

    return response.status(201).json(customer)
})

app.get("/account", verificaContaValida, (request, response) => {
    const { customer } = request
    return response.status(200).json(customer)
})

app.put("/account", verificaContaValida, (request, response) => {
    const { name } = request.body
    const { customer } = request

    customer.name = name

    return response.status(200).json(customer)
})

app.delete("/account", verificaContaValida, (request, response) => {
    const { customer } = request

    const customerIndex = customers.findIndex(_customer => _customer === customer)

    customers.splice(customerIndex, 1)

    return response.status(200).json(customers)
})

app.get("/statement", verificaContaValida, (request, response) => {
    const { customer } = request
    return response.json(customer.statement)
})

app.post("/credit", verificaContaValida, (request, response) => {
    const { description, amount } = request.body
    const { customer } = request

    const statement = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statement)

    return response.status(201).json(statement)
})

app.post("/debit", verificaContaValida, (request, response) => {
    const { amount } = request.body
    const { customer } = request

    const saldo = obterSaldo(customer.statement)

    if (saldo < amount) {
        return response.status(400).json({
            erro: "Saldo insuficiente."
        })
    }

    const statement = {
        amount,
        created_at: new Date(),
        type: "debit"
    }

    customer.statement.push(statement)

    return response.status(201).json(statement)
})

app.listen(3333)