# SELECT 
#     received_at, 
#     event_type, 
#     email, 
#     active, 
#     stripe_event_id 
# FROM stripe_webhook_logs 
# ORDER BY received_at DESC 
# LIMIT 10;