export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { customer_details, order_amount, order_id, order_meta } = req.body;

  try {
    const response = await fetch('https://api.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-environment': process.env.CASHFREE_ENVIRONMENT || 'PRODUCTION'
      },
      body: JSON.stringify({
        order_amount: order_amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: customer_details.customer_id,
          customer_phone: customer_details.customer_phone,
          customer_email: customer_details.customer_email,
          customer_name: customer_details.customer_name
        },
        order_meta: order_meta
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Cashfree Error:', data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
