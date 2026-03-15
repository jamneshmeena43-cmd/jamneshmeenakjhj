// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW Registration Failed', err));
}

// MOCK DATABASE (localStorage)
const DB = {
  get: (key) => JSON.parse(localStorage.getItem(key)) ||[],
  set: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
};

// Utilities
const generateId = () => 'NGS-' + Math.floor(1000 + Math.random() * 9000);

// --- ORDER PAGE LOGIC ---
if (document.getElementById('orderForm')) {
  const shapeSelect = document.getElementById('shape');
  const sizeInputs = document.getElementById('sizeInputs');
  const priceDisplay = document.getElementById('estimatedPrice');

  // Rates in ₹ per sq ft
  const baseRates = { 'Clear': 60, 'Toughened': 120, 'Mirror': 90, 'Frosted': 85 };
  
  const updateCalculator = () => {
    const shape = shapeSelect.value;
    const type = document.getElementById('glassType').value;
    const qty = document.getElementById('qty').value || 1;
    let w = document.getElementById('width')?.value || 0;
    let h = document.getElementById('height')?.value || 0;
    
    // Auto convert mm to sq ft formula: (W * H) / 92903.04
    let areaSqFt = 0;
    if (shape === 'Rectangle' || shape === 'Square') {
      areaSqFt = (w * h) / 92903.04;
    } else if (shape === 'Round') {
      const r = w / 2;
      areaSqFt = (3.1415 * r * r) / 92903.04;
    }

    const rate = baseRates[type] || 60;
    const total = areaSqFt * rate * qty;
    priceDisplay.innerText = `₹${total.toFixed(2)}`;
  };

  document.getElementById('orderForm').addEventListener('input', updateCalculator);

  shapeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'Round') {
      sizeInputs.innerHTML = `<label>Diameter (mm)</label><input type="number" id="width" class="form-control" required>`;
    } else {
      sizeInputs.innerHTML = `
        <div class="grid-2">
          <div><label>Width (mm)</label><input type="number" id="width" class="form-control" required></div>
          <div><label>Height (mm)</label><input type="number" id="height" class="form-control" required></div>
        </div>`;
    }
  });

  document.getElementById('orderForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const order = {
      id: generateId(),
      name: document.getElementById('custName').value,
      phone: document.getElementById('custPhone').value,
      type: document.getElementById('glassType').value,
      price: priceDisplay.innerText,
      status: 'Order Received',
      date: new Date().toLocaleString()
    };
    
    const orders = DB.get('orders');
    orders.push(order);
    DB.set('orders', orders);
    
    alert(`Order Placed Successfully! Your Order ID is ${order.id}`);
    window.location.href = 'track-order.html';
  });
}

// --- TRACKING PAGE LOGIC ---
if (document.getElementById('trackForm')) {
  document.getElementById('trackForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('trackId').value;
    const orders = DB.get('orders');
    const order = orders.find(o => o.id === id);
    
    const resultDiv = document.getElementById('trackResult');
    if (order) {
      resultDiv.innerHTML = `
        <div class="card" style="border-left: 5px solid var(--secondary);">
          <h3>Order: ${order.id}</h3>
          <p><strong>Status:</strong> <span style="color:var(--secondary); font-weight:bold;">${order.status}</span></p>
          <p><strong>Glass Type:</strong> ${order.type}</p>
          <p><strong>Total Price:</strong> ${order.price}</p>
          <p><strong>Date:</strong> ${order.date}</p>
        </div>`;
    } else {
      resultDiv.innerHTML = `<p style="color:red;">Order not found. Please check your ID.</p>`;
    }
  });
}

// --- ADMIN / SHOPKEEPER DASHBOARD LOGIC ---
if (document.getElementById('orderTableBody')) {
  const orders = DB.get('orders');
  const tbody = document.getElementById('orderTableBody');
  
  if(orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No orders found.</td></tr>`;
  } else {
    orders.forEach(o => {
      tbody.innerHTML += `
        <tr>
          <td>${o.id}</td>
          <td>${o.name}</td>
          <td>${o.type}</td>
          <td>${o.price}</td>
          <td><span class="btn btn-outline" style="padding: 5px 10px;">${o.status}</span></td>
        </tr>`;
    });
  }
}