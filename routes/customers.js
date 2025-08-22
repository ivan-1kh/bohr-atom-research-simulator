import validator from 'validator';
import Companies from '../models/Companies.js';
import Customers from '../models/Customers.js';
import Packages from '../models/Packages.js';


/**
 * Get all customers
 * GET /api/customers
 */
export async function getCustomers(req, res) {

  try {

    const customers = await Customers.find().sort({ customer_name: 1 });
    res.json(customers);

  } catch (error) {

    console.error('Error getting customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


/**
 * Create a new customer
 * POST /api/customers
 */
export async function createCustomer(req, res) {
  
  try {

    const { customer_name, customer_email, customer_address } = req.body;

    // Validate input
    if (!customer_name || !validator.isLength(customer_name.trim(), { min: 1, max: 200 })) {
      return res.status(400).json({ error: 'Customer name is required and must be between 1-200 characters' });
    }

    if (!customer_email || !validator.isEmail(customer_email)) {
      return res.status(400).json({ error: 'Customer email is required and must be a valid email address' });
    }

    if (!customer_address || !validator.isLength(customer_address.trim(), { min: 1, max: 200 })) {
      return res.status(400).json({ error: 'Customer address is required and must be between 1-200 characters' });
    }

    // Creates a new customer in MongoDB
    const customer = new Customers({
      customer_name: customer_name.trim(),
      customer_email: customer_email.trim(),
      customer_address: customer_address.trim()
    });

    await customer.save();

    res.status(201).json({
      message: 'Customer created successfully',
      customer: customer
    });

  } catch (error) {

    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}