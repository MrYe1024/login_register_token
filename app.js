// -------------------- 加载模块 ------------------------
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const path = require('path');
const { User } = require('./db');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// -------------------- 密钥生成 -----------------------
const SECRET = randomString(32); // 密钥是不应该出现在代码里的，这里是为了方便

function randomString(len) {
　　len = len || 32;
　　var $chars = 'ABCDEFGHIJKMNPQRSTWXYZabcdefhijkmnprstwxyz012345678';
　　var maxPos = $chars.length;
　　var pwd = '';
　　for (i = 0; i < len; i++) {
　　　　pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
　　}
　　return pwd;
}

// -------------------- 创建服务 -----------------------
const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser(SECRET));

// ----------- 加载首页时，如果token有效则自动登录，否则显示登录按钮 ------------
app.get('/', async(req, res) => {
  const raw = String(req.signedCookies.token_value);
  if(!req.signedCookies.token_value) {
    return res.render('index', {login: '登录'});
  }
  try {
    const { id } = jwt.verify(raw, SECRET);
    const user = await User.findById(id);
    res.render('index', {login: user.username});
  }catch {
    return res.render('index', {login: '登录'});
  }
})

// -------------- 显示登录页面 ---------------------
app.get('/user_login', (req, res) => {
  res.render('login');
})

// -------------- 显示注册页面 ---------------------
app.get('/user_register', (req, res) => {
  res.render('register');
})

// --------------  个人页面登录验证 ---------------------
app.get('/profile', async(req, res) => { 
  if(!req.signedCookies.token_value) {
    return res.redirect('/user_login');
  }
  // 也可以通过这种方式传输token => req.headers['authorization'] = token
  const raw = String(req.signedCookies.token_value);
  try {
    const { id } = jwt.verify(raw, SECRET);
    const user = await User.findById(id);
    res.send(user);
  }catch {
    return res.redirect('/user_login');
  }
})

// ------------------ 注册逻辑 --------------------------
app.post('/register', async(req, res) => {
  const user = await User.create({
    username: req.body.username,
    password: req.body.password
  })
  res.redirect('/user_login');
})

// ------------------ 登录逻辑 --------------------------
app.post('/login', async(req, res) => {
  const user = await User.findOne({
    username: req.body.username
  })
  if(!user) {
    return res.status(422).send({
      message: '用户名不存在'
    })
  }
  const isPasswordValid = require('bcryptjs').compareSync(
    req.body.password,
    user.password
  )
  if(!isPasswordValid) {
    return res.status(422).send({
      message: '密码无效'
    })
  }

  const token = jwt.sign({
    id: String(user._id),
  }, SECRET, { expiresIn: 60 * 2 }) // expiresIn 单位为秒
  res.cookie('token_value', token, { maxAge: 43200000, httpOnly: true, signed: true}) // maxAge单位为毫秒
  res.redirect('/');
})

app.listen('3001', () => {
  console.log('http://localhost:3001')
})