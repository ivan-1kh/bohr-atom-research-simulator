# Delivery Tracking System

A delivery tracking system for Supply Chains built with Node.js, Express, and jQuery.

The system allows admins to create Supply Chain users (Companies) and Customer users, and allows Supply Chain users to fully manage packages that they've shipped out to customers.

The application uses MongoDB for storage. It validates user input on the front-end using JQuery Validate, and Validator on the back-end for the best data integrity.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
```bash
MONGODB_URI=your_mongodb_database_url
GEOAPIFY_API_KEY=your_geoapify_api_key
LOCATIONIQ_API_KEY=your_locationiq_api_key
PORT=3001
```

### 3. Run the Server
```bash
npm start
```
