const http = require('http');

function post(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 9000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'x-publishable-api-key': 'pk_e03efb8523c1542172c95fe34dc90955a3389f3ee3592faa16171966d4699096',
          ...headers,
        },
      },
      (res) => {
        let respData = '';
        res.on('data', (chunk) => (respData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(respData) });
          } catch (e) {
            resolve({ status: res.statusCode, body: respData });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 9000,
        path,
        method: 'GET',
        headers: {
          'x-publishable-api-key': 'pk_e03efb8523c1542172c95fe34dc90955a3389f3ee3592faa16171966d4699096',
        },
      },
      (res) => {
        let respData = '';
        res.on('data', (chunk) => (respData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(respData) });
          } catch (e) {
            resolve({ status: res.statusCode, body: respData });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('1. Creating a cart...');
  const createRes = await post('/store/carts', { region_id: 'reg_01M5P357HTK2C9VK295D0K8BZ0' });
  const cartId = createRes.body.cart.id;
  console.log('Cart created:', cartId);

  console.log('2. Adding priced variant item...');
  const variantId = 'variant_01M5RH8DJ0YP65605EAAB5M339';
  console.log('Using BDT Panjabi variant:', variantId);

  const addRes = await post(`/store/carts/${cartId}/line-items`, { variant_id: variantId, quantity: 1 });
  console.log('Item added status:', addRes.status, 'subtotal:', addRes.body?.cart?.subtotal);

  console.log('3. Updating shipping address to Dhaka (BD-DHK-DHA)...');
  const addrRes = await post(`/store/carts/${cartId}`, {
    shipping_address: {
      first_name: 'Test',
      last_name: 'Customer',
      phone: '+8801712345678',
      address_1: 'House 1, Road 2',
      city: 'Dhaka',
      province: 'BD-DHK-DHA',
      postal_code: '1216',
      country_code: 'bd',
    },
    metadata: {
      division_code: 'BD-DHK',
      district_code: 'BD-DHK-DHA',
      thana_code: 'BD-DHK-DHA-MIR',
      delivery_zone_code: 'inside_dhaka',
    }
  });
  console.log('Address updated. Status:', addrRes.status);

  console.log('4. Adding shipping method: Delivery - Inside Dhaka (so_01M5QBPCQEQ4CF0TE556VPBHSG)...');
  const shipRes1 = await post(`/store/carts/${cartId}/shipping-methods`, {
    option_id: 'so_01M5QBPCQEQ4CF0TE556VPBHSG',
  });
  console.log('ShipRes 1 status:', shipRes1.status, 'body:', shipRes1.body);
  console.log('Cart 1 totals -> subtotal:', shipRes1.body?.cart?.subtotal, 'shipping_total:', shipRes1.body?.cart?.shipping_total, 'total:', shipRes1.body?.cart?.total);

  console.log('5. Updating address to Outside Dhaka (Chittagong BD-CTG-CTG)...');
  await post(`/store/carts/${cartId}`, {
    shipping_address: {
      first_name: 'Test',
      last_name: 'Customer',
      phone: '+8801712345678',
      address_1: 'GEC Circle',
      city: 'Chittagong',
      province: 'BD-CTG-CTG',
      postal_code: '4000',
      country_code: 'bd',
    },
    metadata: {
      division_code: 'BD-CTG',
      district_code: 'BD-CTG-CTG',
      thana_code: 'BD-CTG-CTG-KOT',
      delivery_zone_code: 'outside_dhaka',
    }
  });

  console.log('6. Switching shipping method to: Delivery - Outside Dhaka (so_01M5QBPCQFDC74GKH19D6YSYG6)...');
  const shipRes2 = await post(`/store/carts/${cartId}/shipping-methods`, {
    option_id: 'so_01M5QBPCQFDC74GKH19D6YSYG6',
  });
  console.log('ShipRes 2 status:', shipRes2.status, 'body:', shipRes2.body);
  console.log('Cart 2 totals -> subtotal:', shipRes2.body?.cart?.subtotal, 'shipping_total:', shipRes2.body?.cart?.shipping_total, 'total:', shipRes2.body?.cart?.total);
}

main().catch(console.error);
