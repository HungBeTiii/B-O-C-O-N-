import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_FILE = path.resolve(__dirname, '../data/demo-db.json')

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

const PORT = Number(process.env.PORT || 3001)
const JWT_SECRET = process.env.JWT_SECRET || 'mi_chotxoo_change_this_secret'
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456'

const ORDER_STATUSES = ['Chờ xác nhận','Đã xác nhận','Đang chuẩn bị','Đang giao hàng','Hoàn thành','Đã hủy']

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' }
}, { timestamps: true })

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, default: 0, min: 0 },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  status: { type: String, enum: ['available','soldout'], default: 'available' }
}, { timestamps: true })

const orderItemSchema = new mongoose.Schema({
  productId: String,
  name: String,
  quantity: Number,
  priceAtPurchase: Number,
  costPriceAtPurchase: Number,
  subtotal: Number,
  costSubtotal: Number
}, { _id: false })

const orderSchema = new mongoose.Schema({
  orderCode: { type: String, unique: true, index: true },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  latitude: Number,
  longitude: Number,
  note: { type: String, default: '' },
  products: [orderItemSchema],
  totalPrice: Number,
  totalCost: Number,
  paymentMethod: { type: String, default: 'cash' },
  paymentStatus: { type: String, default: 'Chưa thanh toán' },
  orderStatus: { type: String, enum: ORDER_STATUSES, default: 'Chờ xác nhận' }
}, { timestamps: true })

const adminSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  passwordHash: String
}, { timestamps: true })

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema)
const Product = mongoose.models.Product || mongoose.model('Product', productSchema)
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema)
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema)

let mode = 'file'
let store = { categories: [], products: [], orders: [], admins: [] }

const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
const id = () => crypto.randomUUID()
const now = () => new Date().toISOString()
const clean = v => typeof v === 'string' ? v.trim() : v

const catsSeed = [
  { name: 'Mì trộn', description: 'Các món mì trộn Indomie' },
  { name: 'Ăn vặt', description: 'Các món viên chiên và đồ ăn vặt' },
  { name: 'Đồ uống', description: 'Các loại nước uống' },
  { name: 'Combo', description: 'Combo món ăn kèm nước' }
]

const productsSeed = [
  { name: 'Mì trộn Indomie 1 gói', description: 'Mì trộn đậm vị kèm topping', price: 30000, costPrice: 11140, cat: 'Mì trộn' },
  { name: 'Mì trộn Indomie 2 gói', description: 'Phần 2 gói dành cho người ăn khỏe', price: 35000, costPrice: 14540, cat: 'Mì trộn' },
  { name: 'Viên chiên xào mắm tỏi', description: 'Viên chiên xào sốt mắm tỏi thơm đậm', price: 35000, costPrice: 17940, cat: 'Ăn vặt' },
  { name: 'Trà tắc', description: 'Trà tắc chua ngọt mát lạnh', price: 15000, costPrice: 6000, cat: 'Đồ uống' },
  { name: 'Combo Mì + Trà tắc', description: 'Mì trộn 1 gói kèm trà tắc', price: 42000, costPrice: 17140, cat: 'Combo' },
  { name: 'Combo Viên + Trà tắc', description: 'Viên chiên mắm tỏi kèm trà tắc', price: 47000, costPrice: 23940, cat: 'Combo' }
]

async function persistFile() {
  if (mode !== 'file') return
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), 'utf8')
}

async function seedFileStore() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    store = {
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      products: Array.isArray(parsed.products) ? parsed.products : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      admins: Array.isArray(parsed.admins) ? parsed.admins : []
    }
  } catch {
    store = { categories: [], products: [], orders: [], admins: [] }
  }

  if (!store.categories.length) {
    store.categories = catsSeed.map(c => ({ _id: id(), ...c, createdAt: now(), updatedAt: now() }))
  }

  if (!store.products.length) {
    store.products = productsSeed.map(p => {
      const c = store.categories.find(x => x.name === p.cat)
      return {
        _id: id(),
        name: p.name,
        description: p.description,
        image: '',
        price: p.price,
        costPrice: p.costPrice,
        categoryId: c?._id || '',
        status: 'available',
        createdAt: now(),
        updatedAt: now()
      }
    })
  }

  if (!store.admins.length) {
    store.admins.push({
      _id: id(),
      username: ADMIN_USERNAME,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      createdAt: now(),
      updatedAt: now()
    })
  }

  if (!store.orders.length) {
    const p1 = store.products[0]
    const p2 = store.products[3]
    const completedAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    store.orders.push({
      _id: id(),
      orderCode: 'MCX-DEMO-0001',
      customerName: 'Khách demo',
      phone: '0900000000',
      address: 'Đường Láng, Đống Đa, Hà Nội',
      latitude: 21.0235,
      longitude: 105.8156,
      note: 'Đơn mẫu để trình diễn',
      products: [
        { productId: p1._id, name: p1.name, quantity: 1, priceAtPurchase: p1.price, costPriceAtPurchase: p1.costPrice, subtotal: p1.price, costSubtotal: p1.costPrice },
        { productId: p2._id, name: p2.name, quantity: 1, priceAtPurchase: p2.price, costPriceAtPurchase: p2.costPrice, subtotal: p2.price, costSubtotal: p2.costPrice }
      ],
      totalPrice: p1.price + p2.price,
      totalCost: p1.costPrice + p2.costPrice,
      paymentMethod: 'cash',
      paymentStatus: 'Đã thanh toán',
      orderStatus: 'Hoàn thành',
      createdAt: completedAt,
      updatedAt: completedAt
    })
  }

  await persistFile()
}

async function seedMongo() {
  if (await Category.countDocuments() === 0) {
    const cats = await Category.insertMany(catsSeed)
    for (const p of productsSeed) {
      const c = cats.find(x => x.name === p.cat)
      await Product.create({
        name: p.name,
        description: p.description,
        price: p.price,
        costPrice: p.costPrice,
        categoryId: c?._id,
        status: 'available'
      })
    }
  }

  if (await Admin.countDocuments() === 0) {
    await Admin.create({
      username: ADMIN_USERNAME,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10)
    })
  }
}

async function connectDataSource() {
  const uri = clean(process.env.MONGO_URI || '')
  if (uri) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 })
      mode = 'mongo'
      await seedMongo()
      console.log('✅ MongoDB connected')
      return
    } catch (err) {
      console.warn('⚠️ Không kết nối được MongoDB, chuyển sang chế độ file demo.')
      try { await mongoose.disconnect() } catch {}
    }
  }

  mode = 'file'
  await seedFileStore()
  console.log(`✅ File demo mode ready: ${DATA_FILE}`)
}

function auth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return res.status(401).json({ message: 'Chưa đăng nhập Admin' })
  try {
    req.admin = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' })
  }
}

function withCategoryFile(product) {
  if (!product) return null
  const category = store.categories.find(c => c._id === String(product.categoryId))
  return { ...product, categoryId: category || product.categoryId }
}

function makeOrderCode() {
  const d = new Date()
  const date = String(d.getFullYear()).slice(-2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0')
  return `MCX-${date}-${Math.floor(1000 + Math.random() * 9000)}`
}

function normalizeProductBody(body) {
  return {
    name: clean(body.name || ''),
    description: clean(body.description || ''),
    image: clean(body.image || ''),
    price: Number(body.price),
    costPrice: Number(body.costPrice || 0),
    categoryId: clean(body.categoryId || ''),
    status: body.status === 'soldout' ? 'soldout' : 'available'
  }
}

function validateProduct(data) {
  if (!data.name) return 'Tên món không được để trống'
  if (!Number.isFinite(data.price) || data.price < 0) return 'Giá bán không hợp lệ'
  if (!Number.isFinite(data.costPrice) || data.costPrice < 0) return 'Giá vốn không hợp lệ'
  if (!data.categoryId) return 'Vui lòng chọn danh mục'
  return ''
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, mode, database: mode === 'mongo' ? 'MongoDB' : 'Local JSON file' })
})

app.get('/api/categories', asyncRoute(async (req, res) => {
  const rows = mode === 'mongo'
    ? await Category.find().sort({ createdAt: 1 }).lean()
    : [...store.categories].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
  res.json(rows)
}))

app.post('/api/categories', auth, asyncRoute(async (req, res) => {
  const name = clean(req.body.name || '')
  const description = clean(req.body.description || '')
  if (!name) return res.status(400).json({ message: 'Tên danh mục không được để trống' })

  if (mode === 'mongo') {
    const exists = await Category.findOne({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') })
    if (exists) return res.status(409).json({ message: 'Danh mục đã tồn tại' })
    return res.status(201).json(await Category.create({ name, description }))
  }

  if (store.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    return res.status(409).json({ message: 'Danh mục đã tồn tại' })
  }
  const row = { _id: id(), name, description, createdAt: now(), updatedAt: now() }
  store.categories.push(row)
  await persistFile()
  res.status(201).json(row)
}))

app.put('/api/categories/:id', auth, asyncRoute(async (req, res) => {
  const name = clean(req.body.name || '')
  const description = clean(req.body.description || '')
  if (!name) return res.status(400).json({ message: 'Tên danh mục không được để trống' })

  if (mode === 'mongo') {
    const row = await Category.findByIdAndUpdate(req.params.id, { name, description }, { new: true, runValidators: true })
    if (!row) return res.status(404).json({ message: 'Không tìm thấy danh mục' })
    return res.json(row)
  }

  const row = store.categories.find(c => c._id === req.params.id)
  if (!row) return res.status(404).json({ message: 'Không tìm thấy danh mục' })
  Object.assign(row, { name, description, updatedAt: now() })
  await persistFile()
  res.json(row)
}))

app.delete('/api/categories/:id', auth, asyncRoute(async (req, res) => {
  const used = mode === 'mongo'
    ? await Product.exists({ categoryId: req.params.id })
    : store.products.some(p => String(p.categoryId) === req.params.id)
  if (used) return res.status(400).json({ message: 'Không thể xóa danh mục vì vẫn còn món ăn thuộc danh mục này.' })

  if (mode === 'mongo') {
    const row = await Category.findByIdAndDelete(req.params.id)
    if (!row) return res.status(404).json({ message: 'Không tìm thấy danh mục' })
  } else {
    const before = store.categories.length
    store.categories = store.categories.filter(c => c._id !== req.params.id)
    if (store.categories.length === before) return res.status(404).json({ message: 'Không tìm thấy danh mục' })
    await persistFile()
  }
  res.json({ ok: true })
}))

app.get('/api/products', asyncRoute(async (req, res) => {
  const rows = mode === 'mongo'
    ? await Product.find().populate('categoryId').sort({ createdAt: 1 }).lean()
    : store.products.map(withCategoryFile)
  res.json(rows)
}))

app.get('/api/products/:id', asyncRoute(async (req, res) => {
  const row = mode === 'mongo'
    ? await Product.findById(req.params.id).populate('categoryId').lean()
    : withCategoryFile(store.products.find(p => p._id === req.params.id))
  if (!row) return res.status(404).json({ message: 'Không tìm thấy món ăn' })
  res.json(row)
}))

app.post('/api/products', auth, asyncRoute(async (req, res) => {
  const data = normalizeProductBody(req.body)
  const error = validateProduct(data)
  if (error) return res.status(400).json({ message: error })

  const categoryExists = mode === 'mongo'
    ? await Category.exists({ _id: data.categoryId })
    : store.categories.some(c => c._id === data.categoryId)
  if (!categoryExists) return res.status(400).json({ message: 'Danh mục không tồn tại' })

  if (mode === 'mongo') return res.status(201).json(await Product.create(data))

  const row = { _id: id(), ...data, createdAt: now(), updatedAt: now() }
  store.products.push(row)
  await persistFile()
  res.status(201).json(row)
}))

app.put('/api/products/:id', auth, asyncRoute(async (req, res) => {
  const data = normalizeProductBody(req.body)
  const error = validateProduct(data)
  if (error) return res.status(400).json({ message: error })

  if (mode === 'mongo') {
    const row = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
    if (!row) return res.status(404).json({ message: 'Không tìm thấy món ăn' })
    return res.json(row)
  }

  const row = store.products.find(p => p._id === req.params.id)
  if (!row) return res.status(404).json({ message: 'Không tìm thấy món ăn' })
  Object.assign(row, data, { updatedAt: now() })
  await persistFile()
  res.json(row)
}))

app.delete('/api/products/:id', auth, asyncRoute(async (req, res) => {
  if (mode === 'mongo') {
    const row = await Product.findByIdAndDelete(req.params.id)
    if (!row) return res.status(404).json({ message: 'Không tìm thấy món ăn' })
  } else {
    const before = store.products.length
    store.products = store.products.filter(p => p._id !== req.params.id)
    if (store.products.length === before) return res.status(404).json({ message: 'Không tìm thấy món ăn' })
    await persistFile()
  }
  res.json({ ok: true })
}))

app.post('/api/orders', asyncRoute(async (req, res) => {
  const customerName = clean(req.body.customerName || '')
  const phone = clean(req.body.phone || '')
  const address = clean(req.body.address || '')
  const latitude = Number(req.body.latitude)
  const longitude = Number(req.body.longitude)
  const inputItems = Array.isArray(req.body.products) ? req.body.products : []

  if (!customerName || !phone || !address) return res.status(400).json({ message: 'Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ.' })
  if (!/^0\d{9}$/.test(phone.replace(/\s/g, ''))) return res.status(400).json({ message: 'Số điện thoại cần gồm 10 chữ số và bắt đầu bằng 0.' })
  if (!inputItems.length) return res.status(400).json({ message: 'Giỏ hàng đang trống.' })
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return res.status(400).json({ message: 'Vị trí giao hàng không hợp lệ.' })

  const items = []
  for (const it of inputItems) {
    const product = mode === 'mongo'
      ? await Product.findById(it.productId).lean()
      : store.products.find(p => p._id === it.productId)
    if (!product || product.status === 'soldout') return res.status(400).json({ message: 'Có món đã hết hoặc không còn tồn tại. Vui lòng kiểm tra lại giỏ hàng.' })
    const quantity = Math.min(99, Math.max(1, Number(it.quantity || 1)))
    items.push({
      productId: String(product._id),
      name: product.name,
      quantity,
      priceAtPurchase: Number(product.price),
      costPriceAtPurchase: Number(product.costPrice || 0),
      subtotal: Number(product.price) * quantity,
      costSubtotal: Number(product.costPrice || 0) * quantity
    })
  }

  const totalPrice = items.reduce((sum, item) => sum + item.subtotal, 0)
  const totalCost = items.reduce((sum, item) => sum + item.costSubtotal, 0)
  let code = makeOrderCode()

  if (mode === 'mongo') {
    while (await Order.exists({ orderCode: code })) code = makeOrderCode()
    const row = await Order.create({
      orderCode: code,
      customerName,
      phone,
      address,
      latitude,
      longitude,
      note: clean(req.body.note || ''),
      products: items,
      totalPrice,
      totalCost,
      paymentMethod: req.body.paymentMethod === 'bank' ? 'bank' : 'cash',
      paymentStatus: 'Chưa thanh toán',
      orderStatus: 'Chờ xác nhận'
    })
    return res.status(201).json(row)
  }

  while (store.orders.some(o => o.orderCode === code)) code = makeOrderCode()
  const row = {
    _id: id(),
    orderCode: code,
    customerName,
    phone,
    address,
    latitude,
    longitude,
    note: clean(req.body.note || ''),
    products: items,
    totalPrice,
    totalCost,
    paymentMethod: req.body.paymentMethod === 'bank' ? 'bank' : 'cash',
    paymentStatus: 'Chưa thanh toán',
    orderStatus: 'Chờ xác nhận',
    createdAt: now(),
    updatedAt: now()
  }
  store.orders.unshift(row)
  await persistFile()
  res.status(201).json(row)
}))

app.get('/api/orders/track/:id', asyncRoute(async (req, res) => {
  const q = clean(req.params.id || '')
  let row
  if (mode === 'mongo') {
    const query = [{ orderCode: q }]
    if (mongoose.isValidObjectId(q)) query.push({ _id: q })
    row = await Order.findOne({ $or: query }).lean()
  } else {
    row = store.orders.find(o => o.orderCode === q || o._id === q)
  }
  if (!row) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' })
  res.json({
    _id: String(row._id),
    orderCode: row.orderCode,
    customerName: row.customerName,
    phone: row.phone,
    address: row.address,
    products: row.products,
    totalPrice: row.totalPrice,
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    orderStatus: row.orderStatus,
    createdAt: row.createdAt
  })
}))

app.get('/api/orders', auth, asyncRoute(async (req, res) => {
  const rows = mode === 'mongo'
    ? await Order.find().sort({ createdAt: -1 }).lean()
    : [...store.orders].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  res.json(rows)
}))

app.get('/api/orders/:id', auth, asyncRoute(async (req, res) => {
  const row = mode === 'mongo'
    ? await Order.findById(req.params.id).lean()
    : store.orders.find(o => o._id === req.params.id)
  if (!row) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' })
  res.json(row)
}))

app.put('/api/orders/:id/status', auth, asyncRoute(async (req, res) => {
  const orderStatus = clean(req.body.orderStatus || '')
  if (!ORDER_STATUSES.includes(orderStatus)) return res.status(400).json({ message: 'Trạng thái đơn hàng không hợp lệ' })
  const patch = { orderStatus }
  if (orderStatus === 'Hoàn thành') patch.paymentStatus = 'Đã thanh toán'

  if (mode === 'mongo') {
    const row = await Order.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true })
    if (!row) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' })
    return res.json(row)
  }

  const row = store.orders.find(o => o._id === req.params.id)
  if (!row) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' })
  Object.assign(row, patch, { updatedAt: now() })
  await persistFile()
  res.json(row)
}))

app.post('/api/admin/login', asyncRoute(async (req, res) => {
  const username = clean(req.body.username || '')
  const password = req.body.password || ''
  const admin = mode === 'mongo'
    ? await Admin.findOne({ username }).lean()
    : store.admins.find(a => a.username === username)
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' })
  }
  const token = jwt.sign({ id: String(admin._id), username: admin.username }, JWT_SECRET, { expiresIn: '12h' })
  res.json({ token, admin: { username: admin.username } })
}))

app.get('/api/statistics', auth, asyncRoute(async (req, res) => {
  const rows = mode === 'mongo' ? await Order.find().lean() : store.orders
  const completed = rows.filter(o => o.orderStatus === 'Hoàn thành')
  const revenue = completed.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0)
  const cost = completed.reduce((sum, o) => sum + Number(o.totalCost || 0), 0)

  const days = [...Array(7)].map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })

  const byDay = days.map(date => {
    const os = completed.filter(o => new Date(o.createdAt).toISOString().slice(0, 10) === date)
    const r = os.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0)
    const c = os.reduce((sum, o) => sum + Number(o.totalCost || 0), 0)
    return { date, revenue: r, profit: r - c }
  })

  const seller = {}
  completed.forEach(o => {
    ;(o.products || []).forEach(item => {
      seller[item.name] = (seller[item.name] || 0) + Number(item.quantity || 0)
    })
  })
  const bestSellers = Object.entries(seller)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => Number(b.quantity) - Number(a.quantity))
    .slice(0, 5)

  res.json({
    totalOrders: rows.length,
    completedOrders: completed.length,
    pendingOrders: rows.filter(o => !['Hoàn thành','Đã hủy'].includes(o.orderStatus)).length,
    revenue,
    cost,
    profit: revenue - cost,
    byDay,
    bestSellers
  })
}))

app.use((req, res) => {
  res.status(404).json({ message: 'API không tồn tại' })
})

app.use((err, req, res, next) => {
  console.error('API ERROR:', err)
  if (res.headersSent) return next(err)
  res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại.', detail: process.env.NODE_ENV === 'development' ? String(err?.message || err) : undefined })
})

await connectDataSource()
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 API: http://127.0.0.1:${PORT} | mode=${mode}`)
})
