-- Sample Data for TechStartup Database
-- Insert data into regions with explicit IDs
INSERT INTO regions (region_id, region_name, country) VALUES
(1, 'North America', 'United States'),
(2, 'North America', 'Canada'),
(3, 'Europe', 'United Kingdom'),
(4, 'Europe', 'Germany'),
(5, 'Europe', 'France'),
(6, 'Asia Pacific', 'Australia'),
(7, 'Asia Pacific', 'Japan'),
(8, 'Asia Pacific', 'Singapore'),
(9, 'Latin America', 'Brazil'),
(10, 'Latin America', 'Mexico');

-- Reset the sequence to continue after our manually set IDs
SELECT setval('regions_region_id_seq', (SELECT MAX(region_id) FROM regions));

-- Insert data into plans
INSERT INTO plans (plan_name, monthly_price, features, is_active) VALUES
('Free', 0.00, '{"storage": "5GB", "users": 1, "support": "email", "api_calls": 1000}', true),
('Starter', 19.99, '{"storage": "20GB", "users": 5, "support": "email", "api_calls": 10000, "custom_domains": 1}', true),
('Pro', 49.99, '{"storage": "100GB", "users": 10, "support": "priority", "api_calls": 50000, "custom_domains": 3, "analytics": true}', true),
('Business', 99.99, '{"storage": "500GB", "users": 20, "support": "dedicated", "api_calls": 100000, "custom_domains": 10, "analytics": true, "white_label": true}', true),
('Enterprise', 299.99, '{"storage": "2TB", "users": "unlimited", "support": "24/7", "api_calls": "unlimited", "custom_domains": "unlimited", "analytics": true, "white_label": true, "sla": true}', true),
('Legacy Basic', 9.99, '{"storage": "10GB", "users": 2, "support": "email", "api_calls": 5000}', false);

-- Function to generate random timestamps within a range
CREATE OR REPLACE FUNCTION random_timestamp(min_date TIMESTAMP WITH TIME ZONE, max_date TIMESTAMP WITH TIME ZONE) 
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    RETURN min_date + random() * (max_date - min_date);
END;
$$ LANGUAGE plpgsql;

-- Generate users (200 users)
DO $$
DECLARE
    user_types VARCHAR[] := ARRAY['individual', 'business', 'enterprise'];
    referral_sources VARCHAR[] := ARRAY['google', 'friend', 'social_media', 'blog', 'conference', 'partner', 'advertisement'];
    i INTEGER;
    rand_signup TIMESTAMP;
    rand_last_login TIMESTAMP;
    user_type_val VARCHAR;
    is_active_val BOOLEAN;
    region_id_val INTEGER;
BEGIN
    FOR i IN 1..200 LOOP
        -- Generate random dates
        rand_signup := random_timestamp('2022-01-01'::TIMESTAMP, '2024-03-01'::TIMESTAMP);
        
        -- 80% chance of user being active
        is_active_val := random() < 0.8;
        
        -- Set last login (null for some users who signed up but never logged in)
        IF random() < 0.95 THEN
            rand_last_login := random_timestamp(rand_signup, '2024-04-01'::TIMESTAMP);
        ELSE
            rand_last_login := NULL;
        END IF;
        
        -- Distribution of user types
        IF random() < 0.6 THEN
            user_type_val := 'individual';
        ELSIF random() < 0.85 THEN
            user_type_val := 'business';
        ELSE
            user_type_val := 'enterprise';
        END IF;
        
        -- Random region (weighted)
        IF random() < 0.4 THEN
            region_id_val := 1; -- United States
        ELSIF random() < 0.6 THEN
            region_id_val := floor(random() * 2) + 3; -- European countries
        ELSE
            region_id_val := floor(random() * 8) + 2; -- Any region
        END IF;
        
        -- Insert user
        INSERT INTO users (
            email, 
            full_name, 
            company_name,
            region_id, 
            signup_date, 
            last_login, 
            user_type, 
            referral_source, 
            is_active
        ) VALUES (
            'user' || i || '@example' || floor(random() * 5 + 1) || '.com',
            'User ' || i || ' ' || chr(floor(random() * 26 + 65)::int) || '.',
            CASE WHEN user_type_val IN ('business', 'enterprise') THEN 'Company ' || chr(floor(random() * 26 + 65)::int) || ' ' || floor(random() * 100) ELSE NULL END,
            region_id_val,
            rand_signup,
            rand_last_login,
            user_type_val,
            referral_sources[floor(random() * array_length(referral_sources, 1) + 1)],
            is_active_val
        );
    END LOOP;
END $$;

-- Generate subscriptions
DO $$
DECLARE
    subscription_statuses VARCHAR[] := ARRAY['active', 'canceled', 'expired', 'trial'];
    billing_cycles VARCHAR[] := ARRAY['monthly', 'annual', 'quarterly'];
    i INTEGER;
    user_count INTEGER;
    plan_id_val INTEGER;
    start_date_val TIMESTAMP;
    end_date_val TIMESTAMP;
    status_val VARCHAR;
    discount_val DECIMAL;
    user_exists BOOLEAN;
    user_type_val VARCHAR;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    
    FOR i IN 1..user_count LOOP
        -- Skip ~15% of users (free tier users with no subscription)
        IF random() < 0.85 THEN
            -- Check if user exists and get their signup date
            SELECT EXISTS(SELECT 1 FROM users WHERE user_id = i) INTO user_exists;
            
            IF user_exists THEN
                -- Get user data in separate queries
                SELECT user_type INTO user_type_val FROM users WHERE user_id = i;
                SELECT signup_date INTO start_date_val FROM users WHERE user_id = i;
                
                -- Determine plan_id based on user_type
                IF user_type_val = 'individual' THEN
                    IF random() < 0.7 THEN 
                        plan_id_val := 2; -- Starter
                    ELSE 
                        plan_id_val := 3; -- Pro
                    END IF;
                ELSIF user_type_val = 'business' THEN
                    IF random() < 0.4 THEN 
                        plan_id_val := 3; -- Pro
                    ELSE 
                        plan_id_val := 4; -- Business
                    END IF;
                ELSE -- enterprise
                    IF random() < 0.3 THEN 
                        plan_id_val := 4; -- Business
                    ELSE 
                        plan_id_val := 5; -- Enterprise
                    END IF;
                END IF;
                
                -- Only proceed if we have a valid start date
                IF start_date_val IS NOT NULL THEN
                    -- Status distribution
                    IF random() < 0.7 THEN
                        status_val := 'active';
                        end_date_val := start_date_val + interval '1 year';
                    ELSIF random() < 0.85 THEN
                        status_val := 'canceled';
                        end_date_val := start_date_val + (random() * 300)::integer * interval '1 day';
                    ELSIF random() < 0.95 THEN
                        status_val := 'expired';
                        end_date_val := start_date_val + interval '1 year';
                    ELSE
                        status_val := 'trial';
                        end_date_val := start_date_val + interval '14 days';
                    END IF;
                    
                    -- Discount (more likely for annual and larger plans)
                    discount_val := CASE 
                        WHEN random() < 0.3 THEN round((random() * 20)::numeric, 2)
                        ELSE 0
                    END;
                    
                    INSERT INTO subscriptions (
                        user_id,
                        plan_id,
                        start_date,
                        end_date,
                        status,
                        billing_cycle,
                        discount_percentage
                    ) VALUES (
                        i,
                        plan_id_val,
                        start_date_val,
                        end_date_val,
                        status_val,
                        billing_cycles[floor(random() * array_length(billing_cycles, 1) + 1)],
                        discount_val
                    );
                END IF;
            END IF;
        END IF;
    END LOOP;
END $$;

-- Generate payments
DO $$
DECLARE
    payment_methods VARCHAR[] := ARRAY['credit_card', 'paypal', 'bank_transfer', 'crypto'];
    payment_statuses VARCHAR[] := ARRAY['successful', 'failed', 'refunded', 'pending'];
    rec RECORD;
    payment_count INTEGER;
    payment_date_val TIMESTAMP;
    amount_val DECIMAL;
    months_active INTEGER;
    current_date_val TIMESTAMP := '2024-04-01'::TIMESTAMP;
BEGIN
    FOR rec IN SELECT 
                  s.subscription_id, 
                  s.user_id, 
                  s.start_date, 
                  s.end_date, 
                  s.status, 
                  s.billing_cycle,
                  s.discount_percentage,
                  p.monthly_price
               FROM subscriptions s
               JOIN plans p ON s.plan_id = p.plan_id
               WHERE s.status != 'trial' LOOP
        
        -- Calculate number of payments based on billing cycle and duration
        CASE rec.billing_cycle
            WHEN 'monthly' THEN 
                months_active := EXTRACT(YEAR FROM AGE(LEAST(rec.end_date, current_date_val), rec.start_date)) * 12 +
                                EXTRACT(MONTH FROM AGE(LEAST(rec.end_date, current_date_val), rec.start_date));
            WHEN 'quarterly' THEN 
                months_active := FLOOR(EXTRACT(YEAR FROM AGE(LEAST(rec.end_date, current_date_val), rec.start_date)) * 12 +
                                EXTRACT(MONTH FROM AGE(LEAST(rec.end_date, current_date_val), rec.start_date)))/3;
            WHEN 'annual' THEN 
                months_active := FLOOR(EXTRACT(YEAR FROM AGE(LEAST(rec.end_date, current_date_val), rec.start_date)));
        END CASE;
        
        -- Ensure at least one payment
        months_active := GREATEST(months_active, 1);
        
        -- Calculate payment amount based on billing cycle
        CASE rec.billing_cycle
            WHEN 'monthly' THEN amount_val := rec.monthly_price;
            WHEN 'quarterly' THEN amount_val := rec.monthly_price * 3 * 0.95; -- 5% discount for quarterly
            WHEN 'annual' THEN amount_val := rec.monthly_price * 12 * 0.8; -- 20% discount for annual
        END CASE;
        
        -- Apply subscription discount
        amount_val := amount_val * (1 - rec.discount_percentage / 100);
        
        -- Generate payments
        FOR i IN 1..months_active LOOP
            -- Calculate payment date
            CASE rec.billing_cycle
                WHEN 'monthly' THEN payment_date_val := rec.start_date + ((i-1) || ' months')::interval;
                WHEN 'quarterly' THEN payment_date_val := rec.start_date + ((i-1)*3 || ' months')::interval;
                WHEN 'annual' THEN payment_date_val := rec.start_date + ((i-1) || ' years')::interval;
            END CASE;
            
            -- Skip if payment date is in the future
            CONTINUE WHEN payment_date_val > current_date_val;
            
            -- Determine payment status (mostly successful)
            IF random() < 0.95 THEN
                INSERT INTO payments (
                    subscription_id,
                    amount,
                    payment_date,
                    payment_method,
                    status,
                    invoice_number
                ) VALUES (
                    rec.subscription_id,
                    amount_val,
                    payment_date_val,
                    payment_methods[floor(random() * array_length(payment_methods, 1) + 1)],
                    'successful',
                    'INV-' || rec.user_id || '-' || to_char(payment_date_val, 'YYYYMMDD') || '-' || floor(random() * 1000)
                );
            ELSE
                -- Add a failed payment with a ~50% chance of retry success
                INSERT INTO payments (
                    subscription_id,
                    amount,
                    payment_date,
                    payment_method,
                    status,
                    invoice_number
                ) VALUES (
                    rec.subscription_id,
                    amount_val,
                    payment_date_val,
                    payment_methods[floor(random() * array_length(payment_methods, 1) + 1)],
                    'failed',
                    'INV-' || rec.user_id || '-' || to_char(payment_date_val, 'YYYYMMDD') || '-' || floor(random() * 1000)
                );
                
                -- Add successful retry for about half of the failed payments
                IF random() < 0.5 THEN
                    INSERT INTO payments (
                        subscription_id,
                        amount,
                        payment_date,
                        payment_method,
                        status,
                        invoice_number
                    ) VALUES (
                        rec.subscription_id,
                        amount_val,
                        payment_date_val + interval '3 days',
                        payment_methods[floor(random() * array_length(payment_methods, 1) + 1)],
                        'successful',
                        'INV-' || rec.user_id || '-' || to_char(payment_date_val + interval '3 days', 'YYYYMMDD') || '-' || floor(random() * 1000)
                    );
                END IF;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Generate product usage data
DO $$
DECLARE
    features VARCHAR[] := ARRAY['dashboard', 'reports', 'api', 'data_export', 'integrations', 'user_management', 'analytics'];
    rec RECORD;
    usage_days INTEGER;
    current_date_val DATE := '2024-04-01'::DATE;
    usage_date_val DATE;
    feature_index INTEGER;
    usage_count_val INTEGER;
BEGIN
    FOR rec IN SELECT 
                  u.user_id, 
                  u.signup_date,
                  u.is_active,
                  s.status AS subscription_status
               FROM users u
               LEFT JOIN subscriptions s ON u.user_id = s.user_id LOOP
        
        -- Skip if user is not active
        CONTINUE WHEN NOT rec.is_active;
        
        -- Calculate number of days to generate usage for (more for active subscriptions)
        IF rec.subscription_status = 'active' THEN
            usage_days := floor(random() * 60) + 30; -- 30-90 days for active users
        ELSE
            usage_days := floor(random() * 20) + 5; -- 5-25 days for others
        END IF;
        
        -- Generate usage records
        FOR i IN 1..usage_days LOOP
            -- Random date within the last 90 days
            usage_date_val := current_date_val - (floor(random() * 90) || ' days')::interval;
            
            -- Skip if usage date is before signup
            CONTINUE WHEN usage_date_val::timestamp < rec.signup_date;
            
            -- Generate 1-4 feature usages per day
            FOR j IN 1..floor(random() * 4) + 1 LOOP
                feature_index := floor(random() * array_length(features, 1) + 1);
                
                -- More usage for common features
                IF features[feature_index] IN ('dashboard', 'reports') THEN
                    usage_count_val := floor(random() * 20) + 1;
                ELSE
                    usage_count_val := floor(random() * 10) + 1;
                END IF;
                
                INSERT INTO product_usage (
                    user_id,
                    feature_name,
                    usage_count,
                    usage_date
                ) VALUES (
                    rec.user_id,
                    features[feature_index],
                    usage_count_val,
                    usage_date_val
                );
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- Generate feedback
DO $$
DECLARE
    categories VARCHAR[] := ARRAY['ui', 'performance', 'features', 'pricing', 'support', 'general'];
    feedback_texts TEXT[] := ARRAY[
        'Love the new dashboard interface!',
        'The app is too slow when generating large reports.',
        'Would love to see integration with more third-party services.',
        'Your pricing is too high compared to competitors.',
        'Customer support team was very helpful.',
        'The new feature is exactly what we needed.',
        'App crashes when exporting large datasets.',
        'Very intuitive and easy to use.',
        'Missing key features that your competitors have.',
        'Excellent value for money.',
        'Response time from support could be better.',
        'Very satisfied with the service overall.'
    ];
    rec RECORD;
    feedback_count INTEGER;
    rating_val INTEGER;
    feedback_text_val TEXT;
    feedback_date_val TIMESTAMP;
BEGIN
    FOR rec IN SELECT 
                  u.user_id, 
                  u.signup_date,
                  u.last_login,
                  u.is_active
               FROM users u
               WHERE u.last_login IS NOT NULL LOOP
        
        -- 40% chance of user giving feedback
        IF random() < 0.4 THEN
            -- Number of feedback (1-3)
            feedback_count := floor(random() * 3) + 1;
            
            FOR i IN 1..feedback_count LOOP
                -- Rating distribution (skewed positive)
                IF random() < 0.6 THEN
                    rating_val := floor(random() * 2) + 4; -- 4-5
                ELSIF random() < 0.8 THEN
                    rating_val := 3; -- 3
                ELSE
                    rating_val := floor(random() * 2) + 1; -- 1-2
                END IF;
                
                -- Feedback text
                feedback_text_val := feedback_texts[floor(random() * array_length(feedback_texts, 1) + 1)];
                
                -- Generate random feedback date between signup and now
                feedback_date_val := random_timestamp(
                    rec.signup_date + interval '7 days',
                    COALESCE(rec.last_login, '2024-04-01'::TIMESTAMP)
                );
                
                INSERT INTO feedback (
                    user_id,
                    rating,
                    feedback_text,
                    feedback_date,
                    category
                ) VALUES (
                    rec.user_id,
                    rating_val,
                    feedback_text_val,
                    feedback_date_val,
                    categories[floor(random() * array_length(categories, 1) + 1)]
                );
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- Generate support tickets
DO $$
DECLARE
    subjects VARCHAR[] := ARRAY[
        'Cannot access dashboard',
        'Payment failed but was charged',
        'How to export data in CSV format',
        'Need help with API integration',
        'Account login issues',
        'Feature request',
        'Billing question',
        'Performance issues',
        'Error when generating reports',
        'Need to upgrade my plan'
    ];
    descriptions TEXT[] := ARRAY[
        'I''m trying to access my dashboard but keep getting an error message.',
        'My payment was declined but I was still charged on my credit card.',
        'I need to export my data in CSV format but can''t find the option.',
        'I need help integrating your API with our custom software.',
        'I can''t log in to my account. I keep getting ''incorrect password'' error.',
        'Would it be possible to add a feature that allows us to...', 
        'I have a question about my latest invoice.',
        'The application is running very slowly when I try to...',
        'I get an error every time I try to generate a report.',
        'I need to upgrade my plan. What are the steps?'
    ];
    categories VARCHAR[] := ARRAY['technical', 'billing', 'feature_request', 'account', 'general'];
    statuses VARCHAR[] := ARRAY['open', 'in_progress', 'resolved', 'closed'];
    priorities VARCHAR[] := ARRAY['low', 'medium', 'high', 'urgent'];
    rec RECORD;
    ticket_count INTEGER;
    subject_index INTEGER;
    status_val VARCHAR;
    priority_val VARCHAR;
    created_at_val TIMESTAMP;
    resolved_at_val TIMESTAMP;
BEGIN
    FOR rec IN SELECT 
                  u.user_id, 
                  u.signup_date,
                  u.last_login,
                  u.is_active,
                  s.status AS subscription_status
               FROM users u
               LEFT JOIN subscriptions s ON u.user_id = s.user_id
               WHERE u.last_login IS NOT NULL LOOP
        
        -- 30% chance of user creating a ticket (higher for active users)
        IF random() < (CASE WHEN rec.is_active AND rec.subscription_status = 'active' THEN 0.4 ELSE 0.2 END) THEN
            -- Number of tickets (1-3)
            ticket_count := floor(random() * 3) + 1;
            
            FOR i IN 1..ticket_count LOOP
                -- Subject and description
                subject_index := floor(random() * array_length(subjects, 1) + 1);
                
                -- Status distribution
                IF random() < 0.3 THEN
                    status_val := 'open';
                    resolved_at_val := NULL;
                ELSIF random() < 0.5 THEN
                    status_val := 'in_progress';
                    resolved_at_val := NULL;
                ELSIF random() < 0.8 THEN
                    status_val := 'resolved';
                    -- Resolved tickets have resolution date
                    created_at_val := random_timestamp(
                        rec.signup_date,
                        CURRENT_TIMESTAMP - interval '5 days'
                    );
                    resolved_at_val := created_at_val + (floor(random() * 5) + 1) * interval '1 day';
                ELSE
                    status_val := 'closed';
                    -- Closed tickets have resolution date
                    created_at_val := random_timestamp(
                        rec.signup_date,
                        CURRENT_TIMESTAMP - interval '5 days'
                    );
                    resolved_at_val := created_at_val + (floor(random() * 5) + 1) * interval '1 day';
                END IF;
                
                -- Priority (weighting toward medium)
                IF random() < 0.15 THEN
                    priority_val := 'urgent';
                ELSIF random() < 0.35 THEN
                    priority_val := 'high';
                ELSIF random() < 0.75 THEN
                    priority_val := 'medium';
                ELSE
                    priority_val := 'low';
                END IF;
                
                -- Created date (if not set already)
                IF created_at_val IS NULL THEN
                    created_at_val := random_timestamp(
                        rec.signup_date,
                        CURRENT_TIMESTAMP
                    );
                END IF;
                
                INSERT INTO support_tickets (
                    user_id,
                    subject,
                    description,
                    status,
                    priority,
                    created_at,
                    resolved_at,
                    category
                ) VALUES (
                    rec.user_id,
                    subjects[subject_index],
                    descriptions[subject_index],
                    status_val,
                    priority_val,
                    created_at_val,
                    resolved_at_val,
                    categories[floor(random() * array_length(categories, 1) + 1)]
                );
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- Generate subscription events
DO $$
DECLARE
    event_types VARCHAR[] := ARRAY['trial_started', 'trial_ended', 'subscription_started', 
                                 'subscription_renewed', 'downgraded', 'upgraded', 
                                 'canceled', 'payment_failed'];
    rec RECORD;
    event_count INTEGER;
    event_type_val VARCHAR;
    event_date_val TIMESTAMP;
    details_val JSONB;
BEGIN
    FOR rec IN SELECT 
                  s.subscription_id,
                  s.user_id,
                  s.start_date,
                  s.end_date,
                  s.status,
                  s.plan_id,
                  p.plan_name
               FROM subscriptions s
               JOIN plans p ON s.plan_id = p.plan_id LOOP
        
        -- Generate basic events for all subscriptions
        
        -- Start event
        IF rec.status = 'trial' THEN
            INSERT INTO user_subscription_events (
                user_id,
                subscription_id,
                event_type,
                event_date,
                details
            ) VALUES (
                rec.user_id,
                rec.subscription_id,
                'trial_started',
                rec.start_date,
                jsonb_build_object('plan_name', rec.plan_name)
            );
        ELSE
            INSERT INTO user_subscription_events (
                user_id,
                subscription_id,
                event_type,
                event_date,
                details
            ) VALUES (
                rec.user_id,
                rec.subscription_id,
                'subscription_started',
                rec.start_date,
                jsonb_build_object('plan_name', rec.plan_name)
            );
        END IF;
        
        -- Add additional events based on subscription status
        CASE 
            WHEN rec.status = 'canceled' THEN
                INSERT INTO user_subscription_events (
                    user_id,
                    subscription_id,
                    event_type,
                    event_date,
                    details
                ) VALUES (
                    rec.user_id,
                    rec.subscription_id,
                    'canceled',
                    rec.end_date - interval '1 day',
                    jsonb_build_object('reason', 'user_initiated')
                );
            
            WHEN rec.status = 'expired' THEN
                INSERT INTO user_subscription_events (
                    user_id,
                    subscription_id,
                    event_type,
                    event_date,
                    details
                ) VALUES (
                    rec.user_id,
                    rec.subscription_id,
                    'subscription_ended',
                    rec.end_date,
                    jsonb_build_object('reason', 'expired')
                );
                
            WHEN rec.status = 'trial' THEN
                INSERT INTO user_subscription_events (
                    user_id,
                    subscription_id,
                    event_type,
                    event_date,
                    details
                ) VALUES (
                    rec.user_id,
                    rec.subscription_id,
                    'trial_ended',
                    rec.end_date,
                    jsonb_build_object('converted', false)
                );
        END CASE;
        
        -- Add random renewal events for active subscriptions with some history
        IF rec.status = 'active' AND rec.start_date < '2023-06-01'::TIMESTAMP THEN
            FOR i IN 1..floor(random() * 3) + 1 LOOP
                event_date_val := rec.start_date + (i * interval '1 year');
                
                -- Skip if the event date is in the future
                CONTINUE WHEN event_date_val > CURRENT_TIMESTAMP;
                
                INSERT INTO user_subscription_events (
                    user_id,
                    subscription_id,
                    event_type,
                    event_date,
                    details
                ) VALUES (
                    rec.user_id,
                    rec.subscription_id,
                    'subscription_renewed',
                    event_date_val,
                    jsonb_build_object('plan_name', rec.plan_name)
                );
            END LOOP;
        END IF;
    END LOOP;
END $$;