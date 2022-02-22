const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const session = require('express-session')
const bcrypt = require('bcryptjs')

//view engine
app.set('view engine', 'ejs')
//static
app.use(express.static('public'))

//body parser = use in forms
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

//sessão
app.use(session({
    secret:'fçldksjfçlsdakfjçlsakfjsldakçf', cookie:{maxAge: 30000000}
}))

//pasta public para conseguir usar o CSS
app.use(express.static('public'))

/* ===================------ parte de login e afins --------=================== */

//credenciais falsas para testes
let fakePassword = '1234'
let fsalt = bcrypt.genSaltSync(10)
let fhash = bcrypt.hashSync(fakePassword, fsalt)

const Users = [
    {
        id: 1,
        name: 'João Vitor',
        email: 'teste@gmail.com',
        password: fhash
    }
]

//rota para criar um usuário novo
app.get('/user/create',(req, res) => {
    res.render('users/create')
})

//rota post que pega as informações do form e transforma em um usuário novo
app.post('/users/create',(req, res) => {
    let name = req.body.name
    let email = req.body.email
    let password = req.body.password
    
    //condicional para ver se o nome e a senha não estão vazios
    if(name != ' ' && password != ' '){
        let userFlag = 0
        //loop para verificar se o email já está cadastrado no db
        for(let j = 0; j < Users.length; j++) {
            if(email == Users[j].email){
                //futuramente adicionar função de avisar frontend
                console.log('email existente')
                userFlag = 0
            }else{
                userFlag = 1
            }
        };
        //se o email não for encontrado será criado o usuário novo
        if(userFlag == 1) {
            let salt = bcrypt.genSaltSync(10)
            let hash = bcrypt.hashSync(password, salt)

            let user = {
                name: name,
                email: email,
                password: hash
            }
            console.log('usuário criado')
            console.log(user)
            Users.push(user)
            res.redirect('/login')
        }
    }else{
        res.redirect('/users/create')
    }
})

app.get('/login', (req, res) => {
    res.render('users/login')
})

//middleware
function adminAuth(req, res, next) {
    if(req.session.user != undefined){
        next()
    }else {
        res.redirect('/login')
    }
}

app.post('/authenticate', (req, res) => {
    let email = req.body.email
    let password = req.body.password

    let flag
    for(var i = 0; i < Users.length; i++){
        if(email == Users[i].email){
            flag = 1
        }
        else{
            flag = 0
        }
        if(flag){
            let correct = bcrypt.compareSync(password, Users[i].password)
            if(correct){
                req.session.user = {
                    id: Users[i].id,
                    name: Users[i].name,
                    email: Users[i].email
                }
                res.redirect('/empresas')
            }else{
                res.redirect('/login')
            }
        }
    }
})

app.get('/logout', (req, res ) => {
    req.session.user = undefined
    res.redirect('/login')
})

// ========================================================================

//banco de dados fake para apresentar.
const empresas = [
    {
        id: 1,
        name: "ISP Saúde",
        contact: "(XX) X XXXX-XXX1",
        cnpj: 'XX. XXX. XXX/0001-XX',
        note: "Reunião para implementar novas funcionalidades."
    },
    {
        id: 2,
        name: "BRW",
        contact: "(XX) X XXXX-XXX2",
        cnpj: 'XX. XXX. XXX/0002-XX',
        note: "Problema no Aplicativo Mobile, Urgente"
    },
    {
        id: 3,
        name: "Evocont",
        contact: "(XX) X XXXX-XXX3",
        cnpj: 'XX. XXX. XXX/0003-XX',
        note: "Lentidão no sistema WEB"
    },
    {
        id: 4,
        name: "Aoknon",
        contact: "(XX) X XXXX-XXX4",
        cnpj: 'XX. XXX. XXX/0004-XX',
        note: "Reunião com gerente comercial 14h do dia 18/03"
    },
]

//rota de cadastro
app.get('/cadastro', adminAuth,(req, res) => {
    username = (req.session.user.name)
    res.render('cadastro/index', {username: username})
})

//rota para salvar o cadastro da empresa
app.post('/cadastro/salvar', adminAuth,(req, res) => {
    let name = req.body.name
    let cnpj = req.body.cnpj
    let contact = req.body.contact
    let note = req.body.note
    
    //pegar o tamanho do array pra poder criar ID dinamico
    const ultimo = empresas[empresas.length - 1]
    
    parseInt(ultimo)
    if(name != " " && cnpj != " "){
        let empresa = {
            id: ultimo.id + 1,
            name: name,
            cnpj: cnpj,
            contact: contact,
            note: note
        }
    
        //colocando o objeto da empresa dentro do array de empresas
        empresas.push(empresa)
        res.redirect('/empresas')
    }    
})

app.get('/empresas', adminAuth, (req, res) => {
    username = (req.session.user.name)
    res.render('empresas/index', {empresas: empresas, username:username})
})

//rota para editar informações da empresa por ID
app.get('/empresa/edit/:id', adminAuth, (req, res) => {
    username = (req.session.user.name)
    let id = req.params.id
    let empresa = empresas[id-1]
    res.render('empresas/edit', {empresa: empresa, username: username})
})

//fazer a atualização das informações
app.post('/empresa/update', adminAuth,(req, res) => {
    let id = req.body.id
    let name = req.body.name
    let cnpj = req.body.cnpj
    let contact = req.body.contact
    let note = req.body.note

    parseInt(id)

    empresas[id-1] = {
        id: parseInt(id),
        name: name,
        cnpj: cnpj,
        contact: contact,
        note: note
    }
    res.redirect('/empresas')
})

//excluir empresa
app.post('/empresa/delete', adminAuth, (req, res) => {
    let id = req.body.deleteId
    parseInt(id)

    //melhorar esse delete, pq ta com alguns bugs ainda
    let deleteFlag = 0

    for(var k = 0; k < empresas.length; k++){
        if(id == empresas[k].id){
            deleteFlag = 1
        }else{
            deleteFlag = 0
        }
        if(deleteFlag){
            empresas.splice(k, 1)
            res.redirect('/empresas')
        }
    }
})

app.listen(1234, () => {
    console.log('funcionando')
})