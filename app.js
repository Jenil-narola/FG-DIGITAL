var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    multipartParser = require('express-fileupload'),
    cookieParser = require('cookie-parser'),
    swaggerUI = require('swagger-ui-express')

//--------------------------- CONFIGURATION ---------------------------

// Set Static Assets
app.use(express.static('./public/static'))

// Syntax Error Handling [ex. JSON]
app.use(bodyParser.json(), (error, req, res, next) => {
    if (error instanceof SyntaxError) {
        return res.status(400).json({ status: 400, response: 'badContent', message: 'SyntaxError: Incorrect Body' })
    }
    if (error instanceof ReferenceError) {
        return res.status(400).json({ status: 400, response: 'badContent', message: 'ReferenceError: Incorrect Reference. [REPORT TO DEVELOPER]' })
    }
    next();
});

// URI Error Handling
app.use((req, res, next) => {
    try {
        decodeURIComponent(req.path);
        next();
    } catch {
        return res.status(400).json({ status: 400, response: 'badContent', message: 'URIError: Incorrect URI/ URL. URI/ URL may contain invalid character.' })
    }
})

// Multipart Body Parsing [JSON BODY, FILE(s)]
app.use(multipartParser())

// Basic Directory Generate
const directory_gen = require('./config/directory');
directory_gen('admin')
directory_gen('employee')

//----------------------------- DATABASE ------------------------------
var firebase = require('./config/database')
var obj_firebase = new firebase()
obj_firebase.initialization()

// console.log(obj_firebase.status());

//------------------------- SESSION & COOKIE ---------------------------

// Cookie Parser
app.use(cookieParser())

// Portal [SESSION]
app.use(session({ secret: 'MY-SECRET', resave: true, saveUninitialized: true, cookie: { secure: false, sameSite: true } }))

//-------------------- API DOCUMENTATION [SWAGGER] ---------------------

let SwaggerOptions = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }'
}

// v1
if (process.env.NODE_ENV == 'development' || process.env.NODE_ENV == 'dev') {
    if (process.env.PORT && process.env.PORT != 80) {
        console.log('\x1b[36m%s\x1b[0m', '[SWAGGER] API DOCUMENTATION REQUIRED PORT 80');
    } else {
        app.use('/api/admin', swaggerUI.serve, swaggerUI.setup(require('./routes/admin/v1/admin.swagger.json'), SwaggerOptions));
    }
}

//------------------------- API & VIEW ROUTES --------------------------

// APIs

// v1
app.use('/admin/v1', require('./routes/admin/api.admin'))
app.use('/employee/v1', (req, res) => { return res.status(400).send('UNKNOWN-APIS') })
app.use('/client/v1', (req, res) => { return res.status(400).send('UNKNOWN-APIS') })

// Views
app.get('/', (req, res) => { res.sendFile(process.cwd() + '/views/static/index.html') })
app.use('/admin', require('./routes/admin/view.route'))
app.use('/employee', require('./routes/employee/view.route.js'))
app.use('/client', require('./routes/client/view.route.js'))

app.use('*', (req, res) => { return res.redirect('/') })

module.exports = app;