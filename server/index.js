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
const DIST_DIR = path.resolve(__dirname, '../dist')

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

const addonSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['available','soldout'], default: 'available' }
}, { timestamps: true })

const addonSnapshotSchema = new mongoose.Schema({
  addonId: String,
  name: String,
  quantity: Number,
  priceAtPurchase: Number,
  costPriceAtPurchase: Number,
  subtotal: Number,
  costSubtotal: Number
}, { _id: false })

const orderItemSchema = new mongoose.Schema({
  productId: String,
  name: String,
  quantity: Number,
  priceAtPurchase: Number,
  costPriceAtPurchase: Number,
  addons: { type: [addonSnapshotSchema], default: [] },
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

const reviewSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true, index: true },
  orderCode: { type: String, required: true, index: true },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '', maxlength: 500 }
}, { timestamps: true })

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema)
const Product = mongoose.models.Product || mongoose.model('Product', productSchema)
const Addon = mongoose.models.Addon || mongoose.model('Addon', addonSchema)
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema)
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema)
const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema)

let mode = 'file'
let store = { categories: [], products: [], addons: [], orders: [], admins: [], reviews: [] }

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

const addonsSeed = [
  { name: 'Mì thêm (1 gói)', price: 7000 },
  { name: 'Tôm viên (3 viên)', price: 5000 },
  { name: 'Bò viên (3 viên)', price: 5000 },
  { name: 'Mực xoắn (2 viên)', price: 5000 },
  { name: 'Tôm con (2 viên)', price: 5000 },
  { name: 'Sò điệp (2 viên)', price: 5000 },
  { name: 'Hải sản phô mai (2 viên)', price: 5000 },
  { name: 'Xúc xích (1 cái)', price: 7000 },
  { name: 'Trứng ốp (1 quả)', price: 7000 },
  { name: 'Đậu hũ phô mai (1 viên)', price: 5000 },
  { name: 'Viên thả lẩu cam (2 viên)', price: 5000 }
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
      addons: Array.isArray(parsed.addons) ? parsed.addons : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      admins: Array.isArray(parsed.admins) ? parsed.admins : [],
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : []
    }
  } catch {
    store = { categories: [], products: [], addons: [], orders: [], admins: [], reviews: [] }
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

  if (!store.addons.length) {
    store.addons = addonsSeed.map(a => ({
      _id: id(),
      name: a.name,
      price: a.price,
      costPrice: 0,
      status: 'available',
      createdAt: now(),
      updatedAt: now()
    }))
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
    await Category.insertMany(catsSeed)
  }

  if (await Product.countDocuments() === 0) {
    const cats = await Category.find().lean()
    for (const p of productsSeed) {
      const c = cats.find(x => x.name === p.cat)
      if (!c) continue
      await Product.create({
        name: p.name,
        description: p.description,
        price: p.price,
        costPrice: p.costPrice,
        categoryId: c._id,
        status: 'available'
      })
    }
  }

  if (await Addon.countDocuments() === 0) {
    await Addon.insertMany(addonsSeed.map(a => ({ ...a, costPrice: 0, status: 'available' })))
  }

  if (await Admin.countDocuments() === 0) {
    await Admin.create({
      username: ADMIN_USERNAME,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10)
    })
  }
}

async function connectDataSource() {
  // Nếu chưa có .env, vẫn tự thử MongoDB local trước; thất bại thì fallback JSON.
  const uri = clean(process.env.MONGO_URI === undefined
    ? 'mongodb://127.0.0.1:27017/restaurant_ordering'
    : process.env.MONGO_URI)
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

function normalizeAddonBody(body) {
  return {
    name: clean(body.name || ''),
    price: Number(body.price),
    costPrice: Number(body.costPrice || 0),
    status: body.status === 'soldout' ? 'soldout' : 'available'
  }
}

function validateAddon(data) {
  if (!data.name) return 'Tên đồ thêm không được để trống'
  if (!Number.isFinite(data.price) || data.price < 0) return 'Giá bán đồ thêm không hợp lệ'
  if (!Number.isFinite(data.costPrice) || data.costPrice < 0) return 'Giá vốn đồ thêm không hợp lệ'
  return ''
}

function normalizePhone(value) {
  return String(value || '').replace(/\s/g, '')
}

function publicReview(row) {
  return {
    _id: String(row._id),
    customerName: row.customerName || 'Khách hàng',
    rating: Number(row.rating || 0),
    comment: row.comment || '',
    createdAt: row.createdAt
  }
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

app.get('/api/addons', asyncRoute(async (req, res) => {
  const rows = mode === 'mongo'
    ? await Addon.find().sort({ createdAt: 1 }).lean()
    : [...store.addons].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
  res.json(rows)
}))

app.post('/api/addons', auth, asyncRoute(async (req, res) => {
  const data = normalizeAddonBody(req.body)
  const error = validateAddon(data)
  if (error) return res.status(400).json({ message: error })

  if (mode === 'mongo') return res.status(201).json(await Addon.create(data))

  const row = { _id: id(), ...data, createdAt: now(), updatedAt: now() }
  store.addons.push(row)
  await persistFile()
  res.status(201).json(row)
}))

app.put('/api/addons/:id', auth, asyncRoute(async (req, res) => {
  const data = normalizeAddonBody(req.body)
  const error = validateAddon(data)
  if (error) return res.status(400).json({ message: error })

  if (mode === 'mongo') {
    const row = await Addon.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
    if (!row) return res.status(404).json({ message: 'Không tìm thấy đồ thêm' })
    return res.json(row)
  }

  const row = store.addons.find(a => a._id === req.params.id)
  if (!row) return res.status(404).json({ message: 'Không tìm thấy đồ thêm' })
  Object.assign(row, data, { updatedAt: now() })
  await persistFile()
  res.json(row)
}))

app.delete('/api/addons/:id', auth, asyncRoute(async (req, res) => {
  if (mode === 'mongo') {
    const row = await Addon.findByIdAndDelete(req.params.id)
    if (!row) return res.status(404).json({ message: 'Không tìm thấy đồ thêm' })
  } else {
    const before = store.addons.length
    store.addons = store.addons.filter(a => a._id !== req.params.id)
    if (store.addons.length === before) return res.status(404).json({ message: 'Không tìm thấy đồ thêm' })
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
    const inputAddons = Array.isArray(it.addons) ? it.addons : []
    const addonSnapshots = []
    for (const selected of inputAddons) {
      const addon = mode === 'mongo'
        ? await Addon.findById(selected.addonId).lean()
        : store.addons.find(a => a._id === selected.addonId)
      if (!addon || addon.status === 'soldout') return res.status(400).json({ message: 'Có đồ thêm đã hết hoặc không còn tồn tại. Vui lòng kiểm tra lại giỏ hàng.' })
      const perProduct = Math.min(10, Math.max(1, Number(selected.quantity || 1)))
      const addonQuantity = perProduct * quantity
      addonSnapshots.push({
        addonId: String(addon._id),
        name: addon.name,
        quantity: addonQuantity,
        priceAtPurchase: Number(addon.price || 0),
        costPriceAtPurchase: Number(addon.costPrice || 0),
        subtotal: Number(addon.price || 0) * addonQuantity,
        costSubtotal: Number(addon.costPrice || 0) * addonQuantity
      })
    }
    const addonPrice = addonSnapshots.reduce((sum, addon) => sum + addon.subtotal, 0)
    const addonCost = addonSnapshots.reduce((sum, addon) => sum + addon.costSubtotal, 0)
    items.push({
      productId: String(product._id),
      name: product.name,
      quantity,
      priceAtPurchase: Number(product.price),
      costPriceAtPurchase: Number(product.costPrice || 0),
      addons: addonSnapshots,
      subtotal: Number(product.price) * quantity + addonPrice,
      costSubtotal: Number(product.costPrice || 0) * quantity + addonCost
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

app.get('/api/reviews', asyncRoute(async (req, res) => {
  const rows = mode === 'mongo'
    ? await Review.find().sort({ createdAt: -1 }).limit(12).lean()
    : [...store.reviews].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 12)
  res.json(rows.map(publicReview))
}))

app.post('/api/reviews', asyncRoute(async (req, res) => {
  const orderCode = clean(req.body.orderCode || '')
  const phone = normalizePhone(req.body.phone)
  const rating = Number(req.body.rating)
  const comment = clean(req.body.comment || '')
  if (!orderCode || !phone) return res.status(400).json({ message: 'Vui lòng nhập mã đơn và số điện thoại.' })
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ message: 'Vui lòng chọn mức đánh giá từ 1 đến 5 sao.' })
  if (comment.length > 500) return res.status(400).json({ message: 'Nhận xét tối đa 500 ký tự.' })

  const order = mode === 'mongo'
    ? await Order.findOne({ orderCode }).lean()
    : store.orders.find(o => o.orderCode === orderCode)
  if (!order || normalizePhone(order.phone) !== phone) return res.status(404).json({ message: 'Không tìm thấy đơn hàng phù hợp với mã đơn và số điện thoại.' })
  if (order.orderStatus !== 'Hoàn thành') return res.status(400).json({ message: 'Chỉ có thể đánh giá sau khi đơn hàng đã hoàn thành.' })

  if (mode === 'mongo') {
    const exists = await Review.exists({ orderId: order._id })
    if (exists) return res.status(409).json({ message: 'Đơn hàng này đã được đánh giá.' })
    const row = await Review.create({ orderId: order._id, orderCode, customerName: order.customerName, phone, rating, comment })
    return res.status(201).json(publicReview(row))
  }

  if (store.reviews.some(r => r.orderId === order._id)) return res.status(409).json({ message: 'Đơn hàng này đã được đánh giá.' })
  const row = { _id: id(), orderId: order._id, orderCode, customerName: order.customerName, phone, rating, comment, createdAt: now(), updatedAt: now() }
  store.reviews.unshift(row)
  await persistFile()
  res.status(201).json(publicReview(row))
}))

app.get('/api/admin/reviews', auth, asyncRoute(async (req, res) => {
  const rows = mode === 'mongo'
    ? await Review.find().sort({ createdAt: -1 }).lean()
    : [...store.reviews].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  res.json(rows)
}))

app.delete('/api/reviews/:id', auth, asyncRoute(async (req, res) => {
  if (mode === 'mongo') {
    const row = await Review.findByIdAndDelete(req.params.id)
    if (!row) return res.status(404).json({ message: 'Không tìm thấy đánh giá' })
  } else {
    const before = store.reviews.length
    store.reviews = store.reviews.filter(r => r._id !== req.params.id)
    if (store.reviews.length === before) return res.status(404).json({ message: 'Không tìm thấy đánh giá' })
    await persistFile()
  }
  res.json({ ok: true })
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

  const reviews = mode === 'mongo' ? await Review.find().lean() : store.reviews
  const reviewCount = reviews.length
  const averageRating = reviewCount ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewCount : 0

  res.json({
    totalOrders: rows.length,
    completedOrders: completed.length,
    pendingOrders: rows.filter(o => !['Hoàn thành','Đã hủy'].includes(o.orderStatus)).length,
    revenue,
    cost,
    profit: revenue - cost,
    reviewCount,
    averageRating,
    byDay,
    bestSellers
  })
}))

// Chỉ trả JSON 404 cho đường dẫn API. Các đường dẫn còn lại được giao cho SPA.
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API không tồn tại' })
})

// Chế độ chạy ổn định: Express phục vụ luôn bản Frontend đã build.
// Nhờ vậy npm run dev chỉ cần một tiến trình và một cổng 3001.
let frontendReady = false
try {
  await fs.access(path.join(DIST_DIR, 'index.html'))
  frontendReady = true
  app.use(express.static(DIST_DIR))
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  })
} catch {
  app.get('/', (req, res) => {
    res.status(503).send('Frontend chưa được build. Hãy chạy: npm run build')
  })
}

app.use((err, req, res, next) => {
  console.error('API ERROR:', err)
  if (res.headersSent) return next(err)
  res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại.', detail: process.env.NODE_ENV === 'development' ? String(err?.message || err) : undefined })
})

await connectDataSource()
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ API:      http://127.0.0.1:${PORT}/api/health | mode=${mode}`)
  if (frontendReady) console.log(`🌐 Website:  http://127.0.0.1:${PORT}`)
  else console.log('⚠️ Frontend chưa build. Chạy npm run build rồi khởi động lại.')
})

server.on('error', (err) => {
  if (err?.code === 'EADDRINUSE') {
    console.error(`❌ Cổng ${PORT} đang được một chương trình khác sử dụng.`)
    console.error('   Hãy đóng cửa sổ project cũ hoặc chạy STOP_PROJECT.bat rồi thử lại.')
    process.exit(1)
  }
  throw err
})
