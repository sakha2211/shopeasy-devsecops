const express = require('express');
const app = express();
app.disable('x-powered-by');
app.use(express.json());

const products = [
  { id: 1, name: 'Laptop', price: 999 },
  { id: 2, name: 'Headphones', price: 199 }
];

app.get('/health', (req, res) => res.status(200).json({ status: 'UP' }));

app.get('/api/products', (req, res) => res.status(200).json(products));

app.post('/api/orders', (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid productId or quantity' });
  }
  res.status(201).json({ message: 'Order created', orderId: Date.now(), productId, quantity });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ShopEasy API running on port ${PORT}`));