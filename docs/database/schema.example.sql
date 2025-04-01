-- TechStartup Database Schema
-- A fictional SaaS company database for the Sqlito hackathon project

-- Drop tables if they exist to avoid conflicts
DROP TABLE IF EXISTS user_subscription_events;
DROP TABLE IF EXISTS support_tickets;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS product_usage;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS plans;
DROP TABLE IF EXISTS regions;

-- Create regions table
CREATE TABLE regions (
    region_id SERIAL PRIMARY KEY,
    region_name VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL
);

-- Create plans table
CREATE TABLE plans (
    plan_id SERIAL PRIMARY KEY,
    plan_name VARCHAR(50) NOT NULL,
    monthly_price DECIMAL(10, 2) NOT NULL,
    features JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    company_name VARCHAR(100),
    region_id INTEGER REFERENCES regions(region_id),
    signup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    user_type VARCHAR(20) CHECK (user_type IN ('individual', 'business', 'enterprise')),
    referral_source VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create subscriptions table
CREATE TABLE subscriptions (
    subscription_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    plan_id INTEGER REFERENCES plans(plan_id),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) CHECK (status IN ('active', 'canceled', 'expired', 'trial')),
    billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'annual', 'quarterly')),
    discount_percentage DECIMAL(5, 2) DEFAULT 0
);

-- Create payments table
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    subscription_id INTEGER REFERENCES subscriptions(subscription_id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('successful', 'failed', 'refunded', 'pending')),
    invoice_number VARCHAR(50) UNIQUE
);

-- Create product_usage table to track how users are using the product
CREATE TABLE product_usage (
    usage_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    feature_name VARCHAR(50) NOT NULL,
    usage_count INTEGER NOT NULL,
    usage_date DATE NOT NULL
);

-- Create feedback table for user feedback
CREATE TABLE feedback (
    feedback_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    feedback_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    category VARCHAR(50)
);

-- Create support_tickets table
CREATE TABLE support_tickets (
    ticket_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    subject VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    category VARCHAR(50)
);

-- Create user_subscription_events to track lifecycle events
CREATE TABLE user_subscription_events (
    event_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    subscription_id INTEGER REFERENCES subscriptions(subscription_id),
    event_type VARCHAR(50) CHECK (event_type IN ('trial_started', 'trial_ended', 'subscription_started', 
                                              'subscription_renewed', 'downgraded', 'upgraded', 
                                              'canceled', 'payment_failed')),
    event_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB
);

-- Create indexes for better performance
CREATE INDEX idx_users_signup_date ON users(signup_date);
CREATE INDEX idx_users_last_login ON users(last_login);
CREATE INDEX idx_users_region_id ON users(region_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_product_usage_user_id ON product_usage(user_id);
CREATE INDEX idx_product_usage_feature_date ON product_usage(feature_name, usage_date);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX idx_feedback_rating ON feedback(rating);