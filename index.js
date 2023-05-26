const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config()
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const userModel = require('./Models/userModel')
const productModel = require('./Models/productModel')
const cartModel = require('./Models/cartModel')
const invoiceModel = require('./Models/invoiceModel')
const dns = require('dns');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '10mb' }));

// Middleware kiểm tra tên miền
const allowOnlyFromDomain = (allowedDomain) => {
    return (req, res, next) => {
        const clientDomain = req.headers.referer;
        if (clientDomain !== allowedDomain) {
            res.status(403).send('Forbidden'); // Trả về lỗi 403 nếu tên miền không được phép
        } else {
            next(); // Cho phép tiếp tục xử lý
        }
    };
};


// Middleware kiểm tra tên miền
app.use(allowOnlyFromDomain(process.env.URL_REACT));

//Connect database
mongoose.connect(process.env.MONGODB_URL)
    .then(() => console.log('Connect database is sucessfully!'))
    .catch((err) => console.log(err))


// USER MODEL ......................................................

// Phần đăng kí
app.post('/signup', (req, res) => {
    const { email } = req.body.data
    const { confirmPassword, ...data } = req.body.data
    userModel.findOne({ email: email })
        .then(result => {
            if (result) {
                res.send({ message: 'Email is already register' })
            }
            else {
                const newUser = new userModel(data)
                newUser.save()
                    .then(() => res.send({ message: 'success' }))
                    .catch()
            }
        })
        .catch()
})

// Hàm xác thực danh tính
function authenticateToken(req, res, next) {
    // Lấy header Authorization từ yêu cầu
    const authHeader = req.body.headers.Authorization;
    // Tách token từ header Authorization
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401); // Không có token, trả về lỗi xác thực
    }

    // Xác thực token
    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) {
            return res.sendStatus(403); // Token không hợp lệ, trả về lỗi xác thực
        }

        // Token hợp lệ, lưu thông tin người dùng vào req.user
        req.user = user;
        next(); // Tiếp tục xử lý
    });
}

// Phần update user
app.put('/updateuser', authenticateToken, (req, res) => {
    const { email, password, ...rest } = req.body.data
    userModel.findOne({ email: email, password: password })
        .then((result) => {
            if (result) {
                userModel.updateOne({ email: email, password: password }, { firstName: res.firstName, lastName: rest.lastName, image: rest.image })
                    .then(() => res.send({ message: "Update information successfully" }))
                    .catch()
            }
            else res.status(401).send({ message: "Incorrect password" })
        })
        .catch()
})

// Phần lấy user
app.get('/getuser', (req, res) => {
    userModel.find({})
        .then(users => res.send(users))
        .catch()
})

// Phần xóa user
app.put('/removeuser', authenticateToken, (req, res) => {
    userModel.deleteOne({ _id: req.body.data.id })
        .then(() => res.send({ message: "Delete user successfully" }))
        .catch()
})

// Phần đăng nhập
app.post('/login', (req, res) => {
    const { email, password } = req.body.data
    userModel.findOne({ email: email, password: password })
        .then(result => {
            if (result) {
                const token = jwt.sign(req.body, process.env.SECRET_KEY);
                res.json({
                    token: token,
                    _id: result._id,
                    firstName: result.firstName,
                    lastName: result.lastName,
                    email: result.email,
                    image: result.image
                })
            }
            else {
                res.send({ message: 'Email or password is invalid' })
            }
        })
        .catch()
})

// PRODUCT MODEL.......................................................

// Phần upload product
app.post("/uploadProduct", (req, res) => {
    const newProduct = new productModel(req.body.data)
    newProduct.save()
        .then(() => res.send({ message: "Upload successfully" }))
        .catch()
})

// Phần lấy sản phẩm
app.get('/products', (req, res) => {
    productModel.find({})
        .then(products => {
            res.send(products)
        })
        .catch()

})

// Phần xóa sản phẩm
app.put("/removeProduct", (req, res) => {
    productModel.deleteOne({ _id: req.body.data.id })
        .then(() => {
            cartModel.deleteMany({ idProduct: req.body.id })
                .then(() => {
                    res.send({ message: "Remove product successfully" })
                })
                .catch()
        })
        .catch()
})

// CART MODEL.......................................................

//Phần lấy sản phẩm trong cart của người dùng
app.get('/carts', (req, res) => {
    cartModel.find({})
        .then(products => {
            res.send(products)
        })
        .catch()
})

// Phần add to cart
app.post("/addToCart", (req, res) => {
    const newCart = new cartModel(req.body.data)
    newCart.save()
        .then(() => res.send({ message: "Add to cart successfully" }))
        .catch()
})

//Xóa product ra khỏi cart
app.put("/removeToCart", (req, res) => {
    cartModel.deleteOne({ email: req.body.data.email, idProduct: req.body.data.idProduct })
        .then(() => res.send({ message: "Remove to cart successfully" }))
        .catch()
})

// INVOICE MODEL..........................................

// Thêm hóa đơn
app.post('/addInvoice', (req, res) => {
    const newInvoice = new invoiceModel(req.body.data)
    newInvoice.save()
        .then(() => res.send({ message: 'Successfully completed' }))
        .catch()
})

// Phần lấy invoice
app.get('/getInvoice', (req, res) => {
    invoiceModel.find({})
        .then(invoices => res.send(invoices))
        .catch()
})

// Phần xóa invoice
app.put('/removeInvoice', authenticateToken, (req, res) => {
    invoiceModel.deleteOne({ _id: req.body.data.id })
        .then(() => res.send({ message: "Delete invoice successfully" }))
        .catch()
})

app.get('/', (req, res) => {
    res.send('Hello world!')
})

// Khởi động server
app.listen(8080, () => {
    console.log('Server đang chạy trên cổng 8080');
});
