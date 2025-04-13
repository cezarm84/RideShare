# Production Deployment Guide

This guide outlines the steps to deploy the RideShare API to a production environment.

## Prerequisites

- Docker and Docker Compose installed on the production server
- Access to a PostgreSQL database server
- AWS S3 bucket for file storage (optional)
- Domain name with SSL certificate

## Deployment Steps

### 1. Prepare the Environment

1. Clone the repository on your production server:
   ```bash
   git clone https://github.com/yourusername/rideshare.git
   cd rideshare
   ```

2. Create a `.env` file based on the `.env.example` template:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file with your production settings:
   - Set `ENVIRONMENT=production`
   - Configure `DATABASE_URL` with your PostgreSQL connection string
   - Generate a secure `SECRET_KEY` using `openssl rand -hex 32`
   - Set `CORS_ORIGINS` to your frontend domain(s)
   - Configure S3 settings if using S3 for file storage

### 2. Database Setup

1. Ensure your PostgreSQL database is running and accessible.

2. Apply database migrations:
   ```bash
   python scripts/apply_migrations.py
   ```

### 3. Build and Run the Docker Container

1. Build the Docker image:
   ```bash
   docker build -t rideshare-api:latest .
   ```

2. Run the container:
   ```bash
   docker run -d \
     --name rideshare-api \
     -p 8000:8000 \
     --env-file .env \
     --restart unless-stopped \
     rideshare-api:latest
   ```

### 4. Set Up Reverse Proxy with Nginx

1. Install Nginx:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. Create an Nginx configuration file:
   ```bash
   sudo nano /etc/nginx/sites-available/rideshare-api
   ```

3. Add the following configuration:
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. Enable the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/rideshare-api /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### 5. Set Up SSL with Let's Encrypt

1. Install Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. Obtain and configure SSL certificate:
   ```bash
   sudo certbot --nginx -d api.yourdomain.com
   ```

3. Follow the prompts to complete the SSL setup.

### 6. Monitoring and Logging

1. Check the application logs:
   ```bash
   docker logs rideshare-api
   ```

2. Set up monitoring with Prometheus and Grafana (optional):
   - The API exposes metrics at `/metrics` endpoint
   - Configure Prometheus to scrape this endpoint
   - Set up Grafana dashboards to visualize the metrics

### 7. Backup Strategy

1. Set up regular database backups:
   ```bash
   # Example PostgreSQL backup script
   pg_dump -U username -h hostname -d rideshare > rideshare_backup_$(date +%Y%m%d).sql
   ```

2. Configure automated backups using cron:
   ```bash
   # Add to crontab (crontab -e)
   0 2 * * * /path/to/backup_script.sh
   ```

## Scaling the Application

### Horizontal Scaling

1. Run multiple instances of the API behind a load balancer:
   ```bash
   # Example with Docker Compose
   docker-compose up -d --scale api=3
   ```

2. Configure Nginx as a load balancer:
   ```nginx
   upstream rideshare_api {
       server localhost:8001;
       server localhost:8002;
       server localhost:8003;
   }

   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://rideshare_api;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Database Scaling

1. Consider using a managed PostgreSQL service like AWS RDS or Azure Database for PostgreSQL.
2. Implement read replicas for read-heavy workloads.
3. Use connection pooling with PgBouncer for efficient database connections.

## Maintenance

### Updates and Deployments

1. Set up a CI/CD pipeline for automated deployments.
2. Use a blue-green deployment strategy to minimize downtime.
3. Always back up the database before major updates.

### Monitoring

1. Set up alerts for the `/health` endpoint.
2. Monitor database performance and connection pool usage.
3. Set up log aggregation with tools like ELK stack or Graylog.

## Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Check the database connection string in `.env`
   - Verify network connectivity to the database server
   - Check database user permissions

2. **API Not Responding**:
   - Check Docker container logs: `docker logs rideshare-api`
   - Verify the container is running: `docker ps`
   - Check Nginx configuration and logs

3. **SSL Certificate Issues**:
   - Renew certificates if expired: `sudo certbot renew`
   - Check Nginx SSL configuration

## Security Considerations

1. Regularly update dependencies to patch security vulnerabilities.
2. Implement rate limiting to prevent abuse.
3. Use a Web Application Firewall (WAF) for additional protection.
4. Regularly audit database access and API usage.
5. Implement proper authentication and authorization checks.
