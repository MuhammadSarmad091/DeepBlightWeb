# AWS S3 & Docker Deployment Guide for DeepBlight Backend

## Table of Contents
1. [AWS S3 Setup](#aws-s3-setup)
2. [Docker Setup & Deployment](#docker-setup--deployment)
3. [Configuration](#configuration)
4. [Troubleshooting](#troubleshooting)

---

## AWS S3 Setup

### Step 1: Create AWS Account and Access Console
1. Go to [AWS Console](https://aws.amazon.com/console/)
2. Sign in or create a new account
3. Navigate to **S3** service

### Step 2: Create S3 Bucket
1. Click **"Create bucket"** button
2. Enter bucket name: `deepblight-leafscans` (or your preferred name)
   - Bucket names must be globally unique
   - Use lowercase letters, numbers, and hyphens only
3. Select your region (e.g., `us-east-1`)
4. **Block Public Access Settings**: Keep all checked (don't make it public)
5. Click **"Create bucket"**

### Step 3: Configure Bucket Policy (Optional - for secure access)
1. Select your bucket
2. Go to **Permissions** tab
3. Click **Bucket Policy**
4. Add this policy (replace `YOUR-BUCKET-NAME`):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::YOUR-ACCOUNT-ID:user/YOUR-IAM-USER"
            },
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::deepblight-leafscans",
                "arn:aws:s3:::deepblight-leafscans/*"
            ]
        }
    ]
}
```

### Step 4: Enable Versioning (Optional but recommended)
1. Go to **Versioning** section
2. Click **Enable** to keep previous versions of files

### Step 5: Enable CORS (Cross-Origin Resource Sharing)
1. Go to **Permissions** → **CORS**
2. Add the following CORS configuration:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

### Step 6: Create IAM User for API Access
1. Go to **IAM** service
2. Click **Users** → **Create user**
3. Enter username: `deepblight-backend`
4. Click **Next**
5. Attach policy:
   - Click **Attach policies directly**
   - Search for `AmazonS3FullAccess` (or create custom policy)
   - Select and click **Next**
6. Review and **Create user**

### Step 7: Generate Access Keys
1. Select the user you created
2. Go to **Security credentials** tab
3. Click **Create access key**
4. Choose **Application running outside AWS**
5. Click **Next** → **Create access key**
6. **Save the Access Key ID and Secret Access Key** (you'll need these)

### Step 8: Update Environment Variables
Add these to your `.env` file:

```env
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_BUCKET_NAME=deepblight-leafscans
AWS_REGION=us-east-1
```

---

## Docker Setup & Deployment

### Step 1: Install Docker
- **Linux**: `curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh`
- **Windows/Mac**: Download [Docker Desktop](https://www.docker.com/products/docker-desktop/)

Verify installation:
```bash
docker --version
docker run hello-world
```

### Step 2: Create Dockerfile
The Dockerfile is provided in the project root. It includes:
- Python 3.10 slim base image
- All dependencies installation
- Model files setup
- Port exposure

### Step 3: Create docker-compose.yml
The docker-compose configuration is provided to run the app with environment variables.

### Step 4: Build Docker Image
```bash
cd /path/to/FYP-backend
docker build -t deepblight-backend:latest .
```

### Step 5: Push to AWS ECR (Elastic Container Registry)
```bash
# Create ECR repository
aws ecr create-repository --repository-name deepblight-backend --region eu-north-1

<Skip the above 1 command and Do alternative>

Alternative: Use the AWS Console - If CLI still fails, create the ECR repository manually:

Go to ECR service in AWS Console
Click Create repository
Name: deepblight-backend
Region: eu-north-1
Click Create

# Login to ECR
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 705934872956.dkr.ecr.eu-north-1.amazonaws.com


# Tag image
docker tag deepblight-backend:latest 705934872956.dkr.ecr.eu-north-1.amazonaws.com/deepblight-backend:latest

# Push image
docker push 705934872956.dkr.ecr.eu-north-1.amazonaws.com/deepblight-backend:latest
```

### Step 6: Run Docker Container Locally
```bash
docker-compose up
```

The app will be available at `http://localhost:5000`

### Step 7: Deploy to AWS (Using ECS/Fargate)

#### Option A: Using ECS Fargate (Recommended)

**Step 1: Create Cluster** (Already done)
1. Go to **ECS** service in AWS Console
2. Click **Create cluster**
3. Name it `deepblight-cluster`
4. Choose **Fargate** launch type
5. Click **Create**

**Step 2: Create Task Definition**
1. In ECS, go to **Task Definitions** (left sidebar)
2. Click **Create new task definition**
3. Choose **Fargate** and click **Next step**
4. Fill in the details:
   - **Task Definition Name**: `deepblight-task`
   - **Task Role**: Leave default (ecsTaskExecutionRole)
   - **Task Execution Role**: Select `ecsTaskExecutionRole` (create if doesn't exist)
   - **Task size**:
     - CPU: `0.5 GB` (256)
     - Memory: `1 GB` (1024)

5. Click **Add container** and fill:
   - **Container name**: `deepblight-backend`
   - **Image**: `705934872956.dkr.ecr.eu-north-1.amazonaws.com/deepblight-backend:latest`
   - **Port mappings**: 
     - Container port: `5000`
     - Protocol: `tcp`
   
6. **Environment variables**: Click **Environment** section and add:
   ```
   MONGO_URI = mongodb+srv://admin:password@cluster.mongodb.net/
   AWS_ACCESS_KEY_ID = your_access_key
   AWS_SECRET_ACCESS_KEY = your_secret_key
   AWS_S3_BUCKET_NAME = deepblight-leafscans
   AWS_REGION = eu-north-1
   FLASK_HOST = 0.0.0.0
   FLASK_PORT = 5000
   FLASK_DEBUG = False
   SECRET_KEY = your_secret_key
   MAIL_SERVER = smtp.gmail.com
   MAIL_PORT = 587
   MAIL_USE_TLS = True
   MAIL_USERNAME = your_email@gmail.com
   MAIL_PASSWORD = your_app_password
   TREFLE_API_TOKEN = your_trefle_token
   DATABASE_NAME = deepblight
   USE_S3 = True
   ```

7. **Log configuration** (Optional but recommended):
   - Log driver: `awslogs`
   - Log group: Create new `/ecs/deepblight-backend`
   - Log stream prefix: `ecs`
   - Region: `eu-north-1`

8. Click **Create task definition**

**Step 3: Create Service**
1. Go back to **Clusters** and select `deepblight-cluster`
2. Click **Create service** (or **Services** tab → **Create**)
3. Fill in the details:
   - **Launch type**: Fargate
   - **Task definition**: Select `deepblight-task` (latest version)
   - **Cluster**: `deepblight-cluster`
   - **Service name**: `deepblight-service`
   - **Number of tasks**: 1 (start with 1, can scale later)
   - **Platform version**: LATEST

4. **Network configuration**:
   - **VPC**: Select default or your VPC
   - **Subnets**: Select at least 2 subnets
   - **Security groups**: Create new or select existing
     - Inbound rules: Allow TCP on port 5000 from anywhere (0.0.0.0/0) for now

5. **Load balancer** (Optional but recommended):
   - Type: **Application Load Balancer**
   - Create new or select existing ALB
   - Container: `deepblight-backend:5000`
   - Target group: Create new (name: `deepblight-tg`)
   - Health check path: `/` (or your health endpoint)

6. Click **Create service**

**Step 4: Verify Deployment**
1. Go to **Clusters** → **deepblight-cluster** → **Services**
2. Click your service name
3. Go to **Tasks** tab
4. Wait for task to reach `RUNNING` status
5. Click the task to see details and logs
6. If using ALB, go to **EC2** → **Load Balancers** → Find your ALB
7. Copy the DNS name and test: `http://your-alb-dns:5000/`

**Troubleshooting Task Deployment**:
- Task stuck in `PROVISIONING`: Check CloudWatch logs → `/ecs/deepblight-backend`
- Task exits immediately: Check container logs for errors
- Can't connect to service: Verify security group allows port 5000
- Image not found: Verify ECR image URI is correct and image exists

#### Option B: Using EC2 Instance
1. Launch EC2 instance (Ubuntu 22.04 recommended)
2. SSH into instance
3. Install Docker
4. Pull ECR image:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
   docker pull YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/deepblight-backend:latest
   ```
5. Run container:
   ```bash
   docker run -d --name deepblight \
     -p 5000:5000 \
     -e MONGO_URI=your_mongo_uri \
     -e AWS_ACCESS_KEY_ID=your_key \
     -e AWS_SECRET_ACCESS_KEY=your_secret \
     -e AWS_S3_BUCKET_NAME=deepblight-leafscans \
     YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/deepblight-backend:latest
   ```

---

## Configuration

### Environment Variables Required
```env
# MongoDB
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_BUCKET_NAME=deepblight-leafscans
AWS_REGION=us-east-1

# Flask
FLASK_HOST=0.0.0.0
FLASK_PORT=5000
FLASK_DEBUG=False

# Email
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password

# Authentication
SECRET_KEY=your_secret_key

# Trefle API
TREFLE_API_TOKEN=your_trefle_token

# Database
DATABASE_NAME=deepblight
```

---

## Troubleshooting

### Docker Issues
1. **Port already in use**
   ```bash
   docker ps  # Find container
   docker stop <container_id>
   ```

2. **Model files not found**
   - Ensure model files are in root directory
   - Check Dockerfile COPY commands

3. **Memory issues**
   - Increase Docker memory: `docker run -m 4g ...`

### S3 Issues
1. **Access Denied**
   - Verify IAM user permissions
   - Check Access Key ID and Secret
   - Ensure bucket name is correct

2. **Slow uploads**
   - Consider multipart upload (handled by boto3)
   - Use CloudFront CDN for faster downloads

3. **File not found**
   - Check S3 path format in database
   - Verify bucket name in environment variables

### AWS Deployment Issues
1. **ECS task keeps stopping**
   - Check CloudWatch logs
   - Verify memory and CPU allocation
   - Check security group inbound rules (port 5000)

2. **Cannot connect to service**
   - Verify security group allows traffic on port 5000
   - Check load balancer configuration
   - Verify DNS/IP is correct

---

## Cost Estimation (Approximate)
- **S3 Storage**: $0.023/GB/month (first 50TB)
- **S3 Data Transfer**: $0.09/GB out
- **ECS Fargate**: ~$30-50/month for 0.5 CPU + 1GB RAM
- **Data Transfer (EC2)**: $0.09/GB out
- **MongoDB Atlas**: $9-50+/month (varies by usage)

---

## Monitoring & Maintenance

### CloudWatch Logs
1. Go to **CloudWatch** → **Log Groups**
2. Find your service logs
3. Set up alarms for errors

### S3 Lifecycle Policies
1. Bucket → **Lifecycle** → **Create rule**
2. Archive old scans to Glacier after 30 days (saves costs)

### Auto-scaling (Fargate)
1. Service → **Auto Scaling** → **Create scaling policy**
2. Scale based on CPU/Memory utilization

---

## Summary of Code Changes

The modified code now:
1. Uses `boto3` to interact with S3
2. Stores image paths as S3 URLs instead of local paths
3. Retrieves images directly from S3
4. Supports generating pre-signed URLs for temporary access
5. Handles S3 errors gracefully

See modified `leafscan/routes.py` for implementation details.
